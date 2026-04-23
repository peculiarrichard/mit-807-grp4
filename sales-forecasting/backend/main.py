import io
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error

app = Flask(__name__)
CORS(app)


# ── Helpers ──────────────────────────────────────────────────────────────────

def detect_freq(dates):
    """Infer data frequency from date gaps."""
    if len(dates) < 2:
        return "D"
    gaps = [(dates[i + 1] - dates[i]).days for i in range(min(10, len(dates) - 1))]
    avg = sum(gaps) / len(gaps)
    if avg <= 2:
        return "D"
    if avg <= 10:
        return "W"
    return "M"


FEATURE_COLS = ["_t", "_dow", "_month", "_doy", "_year", "_lag1", "_lag7", "_roll7"]


def add_features(df, date_col, sales_col):
    df = df.copy().reset_index(drop=True)
    df["_t"] = range(len(df))
    df["_dow"] = df[date_col].dt.dayofweek
    df["_month"] = df[date_col].dt.month
    df["_doy"] = df[date_col].dt.dayofyear
    df["_year"] = df[date_col].dt.year
    df["_lag1"] = df[sales_col].shift(1)
    df["_lag7"] = df[sales_col].shift(min(7, len(df) - 1))
    df["_roll7"] = df[sales_col].shift(1).rolling(min(7, len(df) - 1), min_periods=1).mean()
    return df.dropna().reset_index(drop=True)


def next_date(last, step, freq):
    if freq == "D":
        return last + pd.Timedelta(days=step)
    if freq == "W":
        return last + pd.Timedelta(weeks=step)
    return last + pd.DateOffset(months=step)


# ── Endpoint ──────────────────────────────────────────────────────────────────

@app.route("/api/forecast", methods=["POST", "OPTIONS"])
@app.route("/", methods=["POST", "OPTIONS"])
def forecast():
    if request.method == "OPTIONS":
        return "", 204

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send a CSV as form-data field 'file'."}), 400

    periods = int(request.form.get("periods", 30))
    if periods < 1 or periods > 365:
        return jsonify({"error": "periods must be between 1 and 365"}), 400

    raw = request.files["file"].read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as e:
        return jsonify({"error": f"Cannot parse CSV: {e}"}), 400

    # Identify columns
    date_col = next((c for c in df.columns if c.lower() in ["date", "ds", "day", "datetime"]), None)
    sales_col = next(
        (c for c in df.columns if c.lower() in ["sales", "y", "revenue", "amount", "quantity", "demand"]),
        None,
    )

    if not date_col:
        return jsonify({"error": "CSV must contain a 'date' column."}), 400
    if not sales_col:
        return jsonify({"error": "CSV must contain a 'sales' column."}), 400

    try:
        df[date_col] = pd.to_datetime(df[date_col])
    except Exception:
        return jsonify({"error": "Cannot parse dates. Use YYYY-MM-DD format."}), 400

    df = df[[date_col, sales_col]].dropna().copy()
    df[sales_col] = pd.to_numeric(df[sales_col], errors="coerce").fillna(0)
    df = df.sort_values(date_col).reset_index(drop=True)

    if len(df) < 14:
        return jsonify({"error": "Need at least 14 data points for meaningful forecasting."}), 400

    freq = detect_freq(list(df[date_col]))

    featured = add_features(df, date_col, sales_col)
    X = featured[FEATURE_COLS].values
    y = featured[sales_col].values

    split = max(1, int(len(X) * 0.8))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    model = LinearRegression()
    model.fit(X_train, y_train)

    # Metrics on held-out test set
    if len(X_test) > 0:
        y_pred_test = model.predict(X_test)
    else:
        y_pred_test = model.predict(X_train)
        y_test = y_train

    mae = float(mean_absolute_error(y_test, y_pred_test))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_test)))
    denom = np.abs(y_test) + 1e-9
    mape = float(np.mean(np.abs((y_test - y_pred_test) / denom)) * 100)

    # Historical for chart
    historical = [
        {"date": row[date_col].strftime("%Y-%m-%d"), "sales": float(row[sales_col])}
        for _, row in df.iterrows()
    ]

    # Iterative forecast
    last_date = df[date_col].iloc[-1]
    last_t = len(df) - 1
    sales_window = list(df[sales_col].values)
    forecast_out = []

    for i in range(1, periods + 1):
        nd = next_date(last_date, i, freq)
        lag1 = sales_window[-1]
        lag7 = sales_window[-7] if len(sales_window) >= 7 else sales_window[0]
        roll7 = float(np.mean(sales_window[-7:])) if len(sales_window) >= 7 else float(np.mean(sales_window))

        features = np.array([[
            last_t + i,
            nd.dayofweek,
            nd.month,
            nd.dayofyear,
            nd.year,
            lag1,
            lag7,
            roll7
        ]])
        pred = max(0.0, float(model.predict(features)[0]))
        forecast_out.append({"date": nd.strftime("%Y-%m-%d"), "sales": round(pred, 2)})
        sales_window.append(pred)

    return jsonify({
        "historical": historical,
        "forecast": forecast_out,
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2)
        },
        "model": "Linear Regression",
        "frequency": freq,
        "train_size": split,
        "test_size": len(X_test)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5001)