import { useState, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import './App.css'

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'DM Mono, monospace', marginBottom: '6px' }}>{label}</p>
      {payload.map(p => p.value !== null && (
        <p key={p.dataKey} style={{ color: p.color, fontFamily: 'DM Mono, monospace', fontSize: '0.82rem' }}>
          {p.name}: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </p>
      ))}
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, delay = 0 }) {
  return (
    <div className="metric-card p-5" style={{ animationDelay: `${delay}ms` }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '10px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '6px' }}>{sub}</p>}
    </div>
  )
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ file, onFile, disabled }) {
  const ref = useRef(null)
  return (
    <div className={`upload-zone flex flex-col items-center justify-center gap-3 py-10 px-6 ${file ? 'has-file' : ''}`}
      onClick={() => !disabled && ref.current?.click()}>
      <input type="file" accept=".csv" ref={ref} style={{ display: 'none' }}
        onChange={e => onFile(e.target.files[0])} />
      <div style={{ width: 48, height: 48, borderRadius: '12px', background: file ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
        {file ? '✓' : '⬆'}
      </div>
      <div className="text-center">
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: file ? '#f59e0b' : 'var(--muted2)', fontWeight: 500 }}>
          {file ? file.name : 'Click to upload CSV'}
        </p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
          Required columns: <code style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 5px', borderRadius: '4px' }}>date</code>
          {' '}&amp;{' '}
          <code style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 5px', borderRadius: '4px' }}>sales</code>
        </p>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [file, setFile] = useState(null)
  const [periods, setPeriods] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  async function handleSubmit() {
    if (!file) { setError('Please select a CSV file first.'); return }
    setLoading(true); setError(''); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('periods', String(periods))
    try {
      const res = await fetch('/api/forecast', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Server error'); return }
      setResult(data)
    } catch (e) {
      setError('Network error — is the Flask backend running?')
    } finally {
      setLoading(false)
    }
  }

  function downloadCSV() {
    if (!result) return
    const rows = ['date,type,sales',
      ...result.historical.map(p => `${p.date},historical,${p.sales}`),
      ...result.forecast.map(p => `${p.date},forecast,${p.sales}`)
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'forecast_results.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const chartData = result ? [
    ...result.historical.map(p => ({ date: p.date, Historical: p.sales, Forecast: null })),
    ...result.forecast.map(p => ({ date: p.date, Historical: null, Forecast: p.sales }))
  ] : []

  const splitDate = result?.historical?.at(-1)?.date
  const tickStep = chartData.length ? Math.max(1, Math.floor(chartData.length / 7)) : 1
  const freq = { D: 'Daily', W: 'Weekly', M: 'Monthly' }[result?.frequency] ?? ''

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(11,14,20,0.97)' }}
        className="flex items-center justify-between px-8 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#d97706,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: '#000' }}>
            AI
          </div>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Sales Forecasting</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>MIT807 · Group 4 · Linear Regression</p>
          </div>
        </div>
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '999px', padding: '5px 14px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}/>
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Forecast Ready</span>
          </div>
        )}
      </header>

      <div className="flex-1 flex" style={{ minHeight: 0 }}>

        {/* ── Left panel ── */}
        <aside style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'rgba(17,22,32,0.6)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

          <UploadZone file={file} onFile={f => { setFile(f); setResult(null); setError('') }} disabled={loading} />

          {/* Periods */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '10px' }}>
              Forecast Horizon
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="number" className="num-input" min="7" max="365" value={periods}
                onChange={e => setPeriods(Number(e.target.value))}
                style={{ width: '90px' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>days ahead</span>
            </div>
          </div>

          <button className="btn-primary w-full" onClick={handleSubmit} disabled={loading || !file}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.3)" strokeWidth="3" fill="none"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round"/>
                </svg>
                Forecasting…
              </span>
            ) : '▶  Generate Forecast'}
          </button>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 14px', fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          {/* Info */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '8px' }}>About</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Linear Regression model with 8 engineered features: time index, day-of-week, month, day-of-year, year, lag₁, lag₇, and rolling₇.
            </p>
            {result && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  ['Frequency', freq],
                  ['Training samples', result.train_size],
                  ['Test samples', result.test_size],
                  ['Forecast periods', result.forecast.length],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--muted2)' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>

          {!result && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ fontSize: '3rem', opacity: 0.15 }}>📈</div>
              <p style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 500 }}>Upload a CSV and run the forecast</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', opacity: 0.7 }}>
                Try <code style={{ fontFamily: 'DM Mono, monospace', color: '#f59e0b' }}>sample_data/sample_sales.csv</code>
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                <MetricCard label="MAE" value={result.metrics.mae.toLocaleString()} sub="Mean Absolute Error" delay={0} />
                <MetricCard label="RMSE" value={result.metrics.rmse.toLocaleString()} sub="Root Mean Square Error" delay={60} />
                <MetricCard label="MAPE" value={`${result.metrics.mape.toFixed(1)}%`} sub="Mean Abs. % Error" delay={120} />
                <MetricCard label="Model" value="Linear" sub="Regression (OLS)" delay={180} />
              </div>

              {/* Chart */}
              <div className="card card-glow flex-1" style={{ padding: '24px', minHeight: '360px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Sales Forecast</h2>
                    <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px' }}>{freq} granularity · {result.historical.length} historical + {result.forecast.length} forecast points</p>
                  </div>
                  <button className="btn-ghost" onClick={downloadCSV}>⬇ Download CSV</button>
                </div>

                <div style={{ flex: 1 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
                      <XAxis dataKey="date"
                        tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                        tickFormatter={(v, i) => i % tickStep === 0 ? v : ''}
                        axisLine={{ stroke: '#1e2a3a' }} tickLine={false} />
                      <YAxis
                        tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                        axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: 'var(--muted)' }} />
                      {splitDate && (
                        <ReferenceLine x={splitDate} stroke="#334155" strokeDasharray="4 4"
                          label={{ value: 'Forecast →', fill: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace', position: 'insideTopRight' }} />
                      )}
                      <Line type="monotone" dataKey="Historical"
                        stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls={false}
                        activeDot={{ r: 4, fill: '#3b82f6', stroke: '#0b0e14', strokeWidth: 2 }} />
                      <Line type="monotone" dataKey="Forecast"
                        stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false}
                        activeDot={{ r: 4, fill: '#f59e0b', stroke: '#0b0e14', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}