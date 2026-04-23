# MIT807 Group 4 — AI Project Deliverables

Two fully separate web applications:

| App | Description | Port |
|-----|-------------|------|
| `gui-app/` | Search Algorithm Visualizer (DFS + BFS) | Flask :5000 / React :5173 |
| `sales-app/` | AI Sales Forecasting (Linear Regression) | Flask :5001 / React :5174 |

---

## Project Structure

```
.
├── gui-app/
│   ├── api/
│   │   └── search.py          # Flask backend — DFS & BFS algorithms
│   ├── src/
│   │   ├── App.jsx            # React frontend — SVG graph visualizer
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js         # Proxies /api to Flask in dev
│   ├── vercel.json            # Vercel deployment config
│   └── requirements.txt
│
├── sales-app/
│   ├── api/
│   │   └── forecast.py        # Flask backend — Linear Regression pipeline
│   ├── src/
│   │   ├── App.jsx            # React frontend — chart + metrics
│   │   ├── App.css
│   │   └── main.jsx
│   ├── sample_data/
│   │   └── sample_sales.csv   # 730-day synthetic sales dataset for testing
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js         # Proxies /api to Flask in dev
│   ├── vercel.json
│   └── requirements.txt
│
└── report/
    └── MIT807_Group4_Sales_Forecasting_Report.docx
```

---

## Prerequisites

Install these once on your machine before anything else.

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.11+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Comes with Node.js |

---

## Local Development — GUI App (Search Visualizer)

### 1. Install Python dependencies

```bash
cd gui-app
pip install -r requirements.txt
```

### 2. Start the Flask backend

```bash
# Still inside gui-app/
python api/search.py
```

Flask starts on **http://localhost:5000**. Leave this terminal open.

### 3. Install frontend dependencies and start Vite

Open a **second terminal**:

```bash
cd gui-app
npm install
npm run dev
```

React dev server starts on **http://localhost:5173**.

Open your browser at `http://localhost:5173`. All `/api/search` calls are automatically proxied to Flask on port 5000.

### How to use the GUI

1. Use the **Nodes** slider to set the number of graph nodes (4–10).
2. In **Add / Remove Edge** mode, click any node to select it, then click a second node to toggle an edge between them.
3. Switch to **Set Start Node** mode and click any node to choose the traversal starting point.
4. Select **DFS** or **BFS**.
5. Click **▶ Run** to animate the traversal. Nodes change colour as they are visited.
6. Click **↺ Reset** to clear the animation without changing the graph.

---

## Local Development — Sales Forecasting App

### 1. Install Python dependencies

```bash
cd sales-app
pip install -r requirements.txt
```

### 2. Start the Flask backend

```bash
# Still inside sales-app/
python api/forecast.py
```

Flask starts on **http://localhost:5001**.

### 3. Install frontend dependencies and start Vite

Open a **second terminal**:

```bash
cd sales-app
npm install
npm run dev
```

React dev server starts on **http://localhost:5174**.

Open your browser at `http://localhost:5174`.

### How to use the Sales App

1. Click the upload zone and select a CSV file.
   - Required columns: `date` (YYYY-MM-DD) and `sales` (numeric).
   - A ready-made test file is at `sales-app/sample_data/sample_sales.csv`.
2. Set the **Forecast Periods** (number of days to forecast, default 30).
3. Click **▶ Generate Forecast**.
4. View the interactive line chart (historical = blue, forecast = amber dashed).
5. Review MAE, RMSE, and MAPE accuracy metrics.
6. Click **⬇ Download CSV** to export results.

### CSV Format

```
date,sales
2022-01-01,1623.21
2022-01-02,1626.78
2022-01-03,1487.72
...
```

The backend also accepts these column name aliases:

| Column | Accepted names |
|--------|---------------|
| date | `date`, `ds`, `day`, `datetime` |
| sales | `sales`, `y`, `revenue`, `amount`, `quantity`, `demand` |

---

## Deploying to Vercel

Each app is deployed **independently** as its own Vercel project. Repeat these steps for each.

### Requirements

- A free Vercel account at https://vercel.com
- Vercel CLI: `npm install -g vercel`

### Deploy gui-app

```bash
cd gui-app
vercel
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → `mit807-gui-app` (or any name)
- **In which directory is your code located?** → `./`

Vercel reads `vercel.json` automatically and configures:
- Build: `npm run build` → `dist/`
- API: `api/search.py` → serverless function at `/api/search`
- All other routes → React SPA

### Deploy sales-app

```bash
cd sales-app
vercel
```

Same prompts. Use a different project name such as `mit807-sales-app`.

The `vercel.json` routes:
- `/api/forecast` → `api/forecast.py` (Python serverless)
- `/*` → React SPA

### Environment Notes

Vercel reads `requirements.txt` automatically for Python serverless functions.
No additional environment variables are required for either app.

---

## Algorithm Details

### GUI App — DFS

Depth-First Search explores as far as possible along each branch before backtracking.
Implementation uses an explicit stack (iterative, not recursive) to avoid call-stack limits on large graphs.

**Traversal order** on the default 7-node tree rooted at 0:
`0 → 1 → 3 → 4 → 2 → 5 → 6`

### GUI App — BFS

Breadth-First Search explores all neighbours at the current depth before moving deeper.
Implementation uses `collections.deque` for O(1) enqueue/dequeue.

**Traversal order** on the same graph:
`0 → 1 → 2 → 3 → 4 → 5 → 6`

### Sales App — Linear Regression

The model is trained with eight engineered features per time step:

| Feature | Description |
|---------|-------------|
| `_t` | Integer time index (global trend) |
| `_dow` | Day of week (0–6) |
| `_month` | Month (1–12) |
| `_doy` | Day of year (1–365) |
| `_year` | Year |
| `_lag1` | Sales one period ago |
| `_lag7` | Sales seven periods ago |
| `_roll7` | 7-period rolling mean |

Train/test split: 80% / 20%. Metrics are computed on the held-out 20%.
Future periods are predicted iteratively; each prediction is appended to the sales window before the next step.

**Accuracy on the sample dataset (730 days):**

| MAE | RMSE | MAPE |
|-----|------|------|
| 71.74 | 90.53 | 3.60% |

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'flask'`**
Run `pip install -r requirements.txt` inside the correct app directory.

**`EADDRINUSE: address already in use`**
Another process is using the port. Either stop it or change the port in `api/search.py` / `api/forecast.py` (last line) and update `vite.config.js` proxy target to match.

**CORS error in the browser console**
This only occurs during local development if Flask is not running. Start Flask before starting Vite.

**`CSV must contain a 'date' column`**
Make sure the CSV header is exactly `date` (lowercase). Rename the column if needed.

**Vercel build fails with `No module named pandas`**
Ensure `requirements.txt` is at the root of the app directory (next to `package.json`), not inside `api/`.
