# Deployment Guide

## Virtual Environments Setup

### GUI App Backend
```bash
cd gui-app/backend
.\activate.bat
pip install -r requirements.txt
python main.py
```

### Sales Forecasting Backend
```bash
cd sales-forecasting/backend
.\activate.bat
pip install -r requirements.txt
python main.py
```

## Vercel Deployment

### Option 1: Deploy as Separate Apps (Recommended)

#### GUI App Deployment
1. **Backend Deployment:**
   ```bash
   cd gui-app/backend
   vercel --name gui-app-backend
   ```

2. **Frontend Deployment:**
   ```bash
   cd gui-app/frontend
   vercel --name gui-app-frontend
   ```
   Update `vite.config.js` proxy to use deployed backend URL

#### Sales Forecasting Deployment
1. **Backend Deployment:**
   ```bash
   cd sales-forecasting/backend
   vercel --name sales-backend
   ```

2. **Frontend Deployment:**
   ```bash
   cd sales-forecasting/frontend
   vercel --name sales-frontend
   ```
   Update `vite.config.js` proxy to use deployed backend URL

### Option 2: Deploy as Combined Apps

#### GUI App (Combined)
```bash
cd gui-app
vercel --name gui-app-full
```

#### Sales Forecasting (Combined)
```bash
cd sales-forecasting
vercel --name sales-app-full
```

## Required Updates Before Deployment

### Frontend Proxy Updates
After deploying backends, update each frontend's `vite.config.js`:

```javascript
// gui-app/frontend/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://your-gui-backend.vercel.app",
        changeOrigin: true,
      },
    },
  },
})
```

```javascript
// sales-forecasting/frontend/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://your-sales-backend.vercel.app",
        changeOrigin: true,
      },
    },
  },
})
```

## Environment Variables
Set these in Vercel dashboard:
- `PYTHON_VERSION`: 3.13

## Final URLs Structure
- GUI App Frontend: `https://gui-app-frontend.vercel.app`
- GUI App Backend: `https://gui-app-backend.vercel.app`
- Sales Frontend: `https://sales-frontend.vercel.app`
- Sales Backend: `https://sales-backend.vercel.app`

## Testing
After deployment:
1. Test each backend API endpoint directly
2. Test each frontend with its respective backend
3. Verify CORS is working correctly
