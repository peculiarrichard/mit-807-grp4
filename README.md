# MIT807 Group 4 — AI Project Deliverables

Two fully separate web applications deployed on Vercel:

| App                  | Description                              | Live URLs                                                                                                |
| -------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `gui-app/`           | Search Algorithm Visualizer (DFS + BFS)  | [Frontend](https://gui-app-fe.vercel.app) • [Backend](https://gui-app-be.vercel.app)                     |
| `sales-forecasting/` | AI Sales Forecasting (Linear Regression) | [Frontend](https://sales-forecasting-fe.vercel.app) • [Backend](https://sales-forecasting-be.vercel.app) |

---

## Project Structure

```
.
├── gui-app/
│   ├── backend/
│   │   ├── main.py            # Flask backend — DFS & BFS algorithms
│   │   ├── requirements.txt   # Python dependencies
│   │   ├── venv/              # Virtual environment
│   │   ├── activate.bat       # Windows activation script
│   │   └── api/index.py       # Vercel entry point
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.jsx        # React frontend — SVG graph visualizer
│   │   │   └── App.css
│   │   ├── package.json        # Node.js dependencies
│   │   ├── vite.config.js     # Proxies /api to backend
│   │   └── index.html
│   └── vercel.json            # Vercel deployment config
│
├── sales-forecasting/
│   ├── backend/
│   │   ├── main.py            # Flask backend — Linear Regression pipeline
│   │   ├── requirements.txt   # Python dependencies (numpy, pandas, scikit-learn)
│   │   ├── venv/              # Virtual environment
│   │   ├── activate.bat       # Windows activation script
│   │   └── api/index.py       # Vercel entry point
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.jsx        # React frontend — chart + metrics (Recharts)
│   │   │   └── App.css
│   │   ├── package.json        # Node.js dependencies
│   │   ├── vite.config.js     # Proxies /api to backend
│   │   └── index.html
│   └── vercel.json            # Vercel deployment config
│
├── DEPLOYMENT_GUIDE.md        # Complete deployment instructions
└── sales sample.csv           # Sample sales data for testing
```

---

## Prerequisites

| Tool    | Version | Install            |
| ------- | ------- | ------------------ |
| Python  | 3.13+   | https://python.org |
| Node.js | 18+     | https://nodejs.org |
| npm     | 9+      | Comes with Node.js |

---

## Local Development

### GUI App (Search Visualizer)

#### Backend Setup

```bash
cd gui-app/backend
.\activate.bat
pip install -r requirements.txt
python main.py
```

Backend runs on **http://localhost:5000**

#### Frontend Setup

```bash
cd gui-app/frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

### Sales Forecasting App

#### Backend Setup

```bash
cd sales-forecasting/backend
.\activate.bat
pip install -r requirements.txt
python main.py
```

Backend runs on **http://localhost:5001**

#### Frontend Setup

```bash
cd sales-forecasting/frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5174**

---

## App Usage

### GUI App - Search Visualizer

1. Use **Nodes** slider (4-10 nodes)
2. **Edge Mode**: Click two nodes to toggle edges
3. **Start Mode**: Click node to set starting point
4. Select **DFS** or **BFS** algorithm
5. Click **▶ Run** to animate traversal
6. **↺ Reset** to clear animation

### Sales Forecasting App

1. Upload CSV with `date` and `sales` columns
2. Set **Forecast Periods** (default: 30 days)
3. Click **▶ Generate Forecast**
4. View interactive chart with metrics
5. **⬇ Download CSV** to export results

#### CSV Format

```csv
date,sales
2022-01-01,1623.21
2022-01-02,1626.78
```

The backend also accepts these column name aliases:

| Column | Accepted names                                          |
| ------ | ------------------------------------------------------- |
| date   | `date`, `ds`, `day`, `datetime`                         |
| sales  | `sales`, `y`, `revenue`, `amount`, `quantity`, `demand` |

---

## Vercel Deployment

Each app component is deployed **separately** from the same repository using Vercel's Root Directory setting.

### Dashboard Deployment Steps

1. **GUI App Backend**
   - Import repository → Root Directory: `gui-app/backend`
   - Framework: Python (auto-detected)
   - Environment Variables: `PYTHON_VERSION=3.13`

2. **GUI App Frontend**
   - Import repository → Root Directory: `gui-app/frontend`
   - Framework: React (auto-detected)
   - Build Command: `npm run build`

3. **Sales Forecasting Backend**
   - Import repository → Root Directory: `sales-forecasting/backend`
   - Framework: Python (auto-detected)
   - Environment Variables: `PYTHON_VERSION=3.13`

4. **Sales Forecasting Frontend**
   - Import repository → Root Directory: `sales-forecasting/frontend`
   - Framework: React (auto-detected)
   - Build Command: `npm run build`

### Post-Deployment

After deploying backends, update frontend proxy URLs in `vite.config.js`:

- GUI App: `target: "https://gui-app-be.vercel.app"`
- Sales App: `target: "https://sales-forecasting-be.vercel.app"`

Then redeploy frontends to apply changes.

### Final URLs

- GUI App: Frontend + Backend deployed separately
- Sales App: Frontend + Backend deployed separately
- All components scale independently

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

| Feature  | Description                       |
| -------- | --------------------------------- |
| `_t`     | Integer time index (global trend) |
| `_dow`   | Day of week (0–6)                 |
| `_month` | Month (1–12)                      |
| `_doy`   | Day of year (1–365)               |
| `_year`  | Year                              |
| `_lag1`  | Sales one period ago              |
| `_lag7`  | Sales seven periods ago           |
| `_roll7` | 7-period rolling mean             |

Train/test split: 80% / 20%. Metrics are computed on the held-out 20%.
Future periods are predicted iteratively; each prediction is appended to the sales window before the next step.

**Accuracy on the sample dataset (730 days):**

| MAE   | RMSE  | MAPE  |
| ----- | ----- | ----- |
| 71.74 | 90.53 | 3.60% |

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'flask'`**

```bash
cd [app]/backend
.\activate.bat
pip install -r requirements.txt
```

**`EADDRINUSE: address already in use`**
Another process is using the port. Stop it or change port in `main.py` and update `vite.config.js` proxy.

**CORS error in browser console**
Start Flask backend before starting Vite frontend.

**`CSV must contain a 'date' column`**
Ensure CSV has `date` and `sales` columns (case-sensitive).

**Vercel build fails with Python errors**

- Check `PYTHON_VERSION=3.13` in environment variables
- Verify `requirements.txt` is in backend root directory
- Ensure all dependencies are Python 3.13 compatible

**Frontend can't reach backend on Vercel**

- Verify proxy URLs in `vite.config.js` match deployed backend URLs
- Redeploy frontend after updating proxy configuration
