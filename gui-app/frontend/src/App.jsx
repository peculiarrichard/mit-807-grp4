import { useState, useEffect, useRef } from 'react'
import './App.css'

const SVG_W = 560
const SVG_H = 400
const CIRCLE_R = 160
const NODE_R = 22
const CX = SVG_W / 2
const CY = SVG_H / 2

function nodePos(index, total) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  return { x: CX + CIRCLE_R * Math.cos(angle), y: CY + CIRCLE_R * Math.sin(angle) }
}

function edgeKey(a, b) { return `${Math.min(a, b)}-${Math.max(a, b)}` }

function nodeFill(id, step, startNode, selectedForEdge) {
  if (step) {
    if (id === step.current) return '#f59e0b'
    if (step.visited.includes(id)) return '#22c55e'
    if (step.frontier.includes(id)) return '#00c8d4'
    return '#0c2030'
  }
  if (id === selectedForEdge) return '#7c3aed'
  if (id === startNode) return '#1d4ed8'
  return '#0c2030'
}

function nodeStroke(id, step, startNode, selectedForEdge) {
  if (step) {
    if (id === step.current) return '#fbbf24'
    if (step.visited.includes(id)) return '#4ade80'
    if (step.frontier.includes(id)) return '#00f0ff'
    return '#0e3a52'
  }
  if (id === selectedForEdge) return '#a855f7'
  if (id === startNode) return '#60a5fa'
  return '#0e3a52'
}

function nodeFilterClass(id, step, startNode) {
  if (!step) return id === startNode ? 'node-start' : ''
  if (id === step.current) return 'node-current'
  if (step.visited.includes(id)) return 'node-visited'
  if (step.frontier.includes(id)) return 'node-frontier'
  return ''
}

export default function App() {
  const [numNodes, setNumNodes] = useState(7)
  const [edges, setEdges] = useState(new Set(['0-1', '0-2', '1-3', '1-4', '2-5', '2-6']))
  const [startNode, setStartNode] = useState(0)
  const [algorithm, setAlgorithm] = useState('dfs')
  const [mode, setMode] = useState('edge')
  const [selectedForEdge, setSelectedForEdge] = useState(null)
  const [steps, setSteps] = useState([])
  const [stepIdx, setStepIdx] = useState(-1)
  const [animating, setAnimating] = useState(false)
  const [speed, setSpeed] = useState(700)
  const [log, setLog] = useState([])
  const [status, setStatus] = useState('ready')
  const timerRef = useRef(null)
  const logRef = useRef(null)

  useEffect(() => { 
    if (!animating) {
      stopAnimation(); 
      setSteps([]); 
      setStepIdx(-1); 
      setLog([]) 
    }
  }, [numNodes, edges])

  useEffect(() => {
    if (startNode >= numNodes) setStartNode(0)
    setEdges(prev => {
      const next = new Set()
      for (const e of prev) {
        const [a, b] = e.split('-').map(Number)
        if (a < numNodes && b < numNodes) next.add(e)
      }
      return next
    })
  }, [numNodes])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  function stopAnimation() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setAnimating(false)
  }

  function handleNodeClick(id) {
    if (animating) return
    if (mode === 'start') { setStartNode(id); return }
    if (selectedForEdge === null) { setSelectedForEdge(id); return }
    if (selectedForEdge === id) { setSelectedForEdge(null); return }
    const key = edgeKey(selectedForEdge, id)
    setEdges(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
    setSelectedForEdge(null)
  }

  async function runAlgorithm() {
    if (animating) return
    stopAnimation(); setSteps([]); setStepIdx(-1); setLog([]); setStatus('running')
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_nodes: numNodes, edges: Array.from(edges), start: startNode, algorithm })
      })
      const data = await res.json()
      if (!data.steps?.length) { setStatus('error'); return }
      setSteps(data.steps); setStatus('animating')
      playSteps(data.steps)
    } catch { setStatus('error') }
  }

  function playSteps(stepsArr) {
    console.log('playSteps called with:', stepsArr)
    if (!stepsArr?.length) { 
      console.error('No steps array provided')
      setStatus('error'); 
      return 
    }
    setAnimating(true)
    let i = 0
    const tick = () => {
      console.log('tick: i=', i, 'stepsArr.length=', stepsArr.length)
      if (i >= stepsArr.length) {
        setAnimating(false); 
        setStatus('done')
        return
      }
      const step = stepsArr[i]
      console.log('processing step:', step)
      if (step?.description) {
        setStepIdx(i)
        setLog(prev => [...prev, step.description])
        i++
        if (i < stepsArr.length) timerRef.current = setTimeout(tick, speed)
        else { setAnimating(false); setStatus('done') }
      } else {
        console.error('Invalid step at index', i, ':', step)
        setStatus('error')
        setAnimating(false)
      }
    }
    timerRef.current = setTimeout(tick, 200)
  }

  function reset() { stopAnimation(); setSteps([]); setStepIdx(-1); setLog([]); setStatus('ready') }

  const currentStep = stepIdx >= 0 ? steps[stepIdx] : null
  const nodeList = Array.from({ length: numNodes }, (_, i) => ({ id: i, ...nodePos(i, numNodes) }))
  const edgeList = Array.from(edges).map(e => { const [a, b] = e.split('-').map(Number); return { a, b } })

  const STATUS = {
    ready:     { color: '#00f0ff', label: 'IDLE',    text: 'Build graph then click Run' },
    running:   { color: '#f59e0b', label: 'FETCH',   text: 'Contacting backend…' },
    animating: { color: '#f59e0b', label: 'LIVE',    text: `Step ${stepIdx + 1} / ${steps.length}` },
    done:      { color: '#22c55e', label: 'DONE',    text: 'Traversal complete' },
    error:     { color: '#ef4444', label: 'ERROR',   text: 'Backend unreachable. Is Flask running?' },
  }[status]

  return (
    <div className="min-h-screen bg-grid flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'rgba(3,13,18,0.97)', borderBottom: '1px solid var(--border)' }}
        className="flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }}/>
          <span className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--cyan)', fontFamily: 'JetBrains Mono' }}>MIT807</span>
          <span style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }} className="text-xs">/ Group 4 /</span>
          <span style={{ color: 'var(--text)', fontFamily: 'JetBrains Mono' }} className="text-xs tracking-widest uppercase">Search Visualizer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS.color, boxShadow: `0 0 6px ${STATUS.color}` }}/>
          <span className="text-xs tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{STATUS.label}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
          style={{ borderRight: '1px solid var(--border)', background: 'rgba(7,21,32,0.7)' }}>

          <div>
            <p className="section-label">Algorithm</p>
            <div className="flex gap-2">
              {['dfs','bfs'].map(a => (
                <button key={a} className={`algo-pill flex-1 justify-center ${algorithm === a ? 'active' : ''}`}
                  onClick={() => { setAlgorithm(a); reset() }}>{a.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="section-label">
              Nodes&nbsp;
              <span style={{ color: 'var(--cyan)' }}>[ {numNodes} ]</span>
            </p>
            <input type="range" min="4" max="10" value={numNodes}
              onChange={e => setNumNodes(+e.target.value)} />
          </div>

          <div>
            <p className="section-label">Mode</p>
            {[['edge','⬡  Toggle Edges'],['start','◎  Set Start']].map(([m, label]) => (
              <button key={m}
                className={`algo-pill w-full text-left mb-2 ${mode === m ? 'active' : ''}`}
                onClick={() => { setMode(m); setSelectedForEdge(null) }}>{label}</button>
            ))}
            <p className="text-xs mt-1" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
              start → <span style={{ color: 'var(--cyan)' }}>node_{startNode}</span>
            </p>
          </div>

          <div>
            <p className="section-label">
              Speed&nbsp;
              <span style={{ color: 'var(--cyan)' }}>[ {speed}ms ]</span>
            </p>
            <input type="range" min="150" max="1500" step="50" value={speed}
              onChange={e => setSpeed(+e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <button className="btn-run" onClick={runAlgorithm} disabled={animating}>
              {animating ? '■ RUNNING…' : `▶ RUN ${algorithm.toUpperCase()}`}
            </button>
            <button className="btn-ghost" onClick={reset}>↺ RESET</button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <p className="section-label">Legend</p>
            {[
              ['#0c2030','#0e3a52','Unvisited'],
              ['#1d4ed8','#60a5fa','Start Node'],
              ['#00c8d4','#00f0ff','Frontier'],
              ['#f59e0b','#fbbf24','Current'],
              ['#22c55e','#4ade80','Visited'],
            ].map(([fill,stroke,label]) => (
              <div key={label} className="flex items-center gap-2 mb-2">
                <svg width="16" height="16">
                  <circle cx="8" cy="8" r="6" fill={fill} stroke={stroke} strokeWidth="1.5"/>
                </svg>
                <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main canvas */}
        <main className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">

          {/* Status */}
          <div className="glass rounded-lg px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: STATUS.color, boxShadow: `0 0 6px ${STATUS.color}` }}/>
            <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{STATUS.text}</span>
            {currentStep && (
              <div className="ml-auto flex gap-5 text-xs" style={{ fontFamily: 'JetBrains Mono' }}>
                <span style={{ color: 'var(--muted)' }}>
                  visited: <span style={{ color: '#4ade80' }}>[{currentStep.visited.join(', ')}]</span>
                </span>
                <span style={{ color: 'var(--muted)' }}>
                  frontier: <span style={{ color: '#00f0ff' }}>[{currentStep.frontier.join(', ')}]</span>
                </span>
              </div>
            )}
          </div>

          {/* SVG */}
          <div className="glass rounded-xl flex-shrink-0" style={{ lineHeight: 0 }}>
            <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block', borderRadius: '0.75rem' }}>
              <defs>
                <radialGradient id="bg_g" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#0e2a3a" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#030d12" stopOpacity="0"/>
                </radialGradient>
                <filter id="glow_y">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="glow_g">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="glow_c">
                  <feGaussianBlur stdDeviation="2.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <rect width={SVG_W} height={SVG_H} fill="url(#bg_g)" rx="12"/>

              {edgeList.map(({ a, b }, i) => {
                const pa = nodeList[a], pb = nodeList[b]
                const lit = currentStep && (currentStep.visited.includes(a) && currentStep.visited.includes(b))
                return (
                  <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke={lit ? 'rgba(0,240,255,0.3)' : '#0e3a52'}
                    strokeWidth={lit ? 2 : 1.5}/>
                )
              })}

              {nodeList.map(({ id, x, y }) => {
                const fill = nodeFill(id, currentStep, startNode, selectedForEdge)
                const stroke = nodeStroke(id, currentStep, startNode, selectedForEdge)
                const isCurrent = currentStep && id === currentStep.current
                const filterId = isCurrent ? 'glow_y'
                  : (currentStep?.visited.includes(id) ? 'glow_g'
                  : (currentStep?.frontier.includes(id) ? 'glow_c' : null))
                return (
                  <g key={id} onClick={() => handleNodeClick(id)} style={{ cursor: 'pointer' }} filter={filterId ? `url(#${filterId})` : undefined}>
                    {isCurrent && (
                      <circle cx={x} cy={y} r={NODE_R + 10} fill="none" stroke="#f59e0b"
                        strokeWidth="1" opacity="0.25"/>
                    )}
                    <circle cx={x} cy={y} r={NODE_R} fill={fill} stroke={stroke} strokeWidth="2"/>
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                      fill="#e2e8f0" fontSize="12" fontWeight="700"
                      fontFamily="'JetBrains Mono', monospace">{id}</text>
                  </g>
                )
              })}

              <text x="12" y={SVG_H - 10} fontSize="9" fill="#0e3a52"
                fontFamily="'JetBrains Mono', monospace">
                {mode === 'edge' ? '// click two nodes to toggle edge' : '// click a node to set start'}
              </text>
            </svg>
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="glass rounded-xl p-4 flex-1">
              <p className="section-label">Traversal Log</p>
              <div ref={logRef} className="space-y-0.5 overflow-y-auto" style={{ maxHeight: '160px' }}>
                {log.map((entry, i) => (
                  <div key={i} className={`log-entry ${i === log.length - 1 ? 'active' : ''}`}>
                    <span style={{ color: '#1e4a5e', marginRight: '8px' }}>{String(i + 1).padStart(2, '0')}.</span>
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}