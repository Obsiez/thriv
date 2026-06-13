import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Globe,
  Sliders,
  TrendingUp,
  Info,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react'

interface MacroSandboxViewProps {
  onBack: () => void
  onComplete: (xp: number) => void
}

type ScenarioId = 'free' | 'stagflation' | 'liquidity' | 'bubble'

interface Scenario {
  id: ScenarioId
  title: string
  desc: string
  initialRate: number
  initialCpi: number
  initialGdp: number
  initialUnemp: number
  targets: string[]
  checkSuccess: (rate: number, cpi: number, gdp: number, unemp: number) => boolean
}

export function MacroSandboxView({ onBack, onComplete }: MacroSandboxViewProps) {
  const [scenario, setScenario] = useState<ScenarioId>('free')
  const [rate, setRate] = useState(5.25)
  
  const [freeCpi, setFreeCpi] = useState(2.5)
  const [freeGdp, setFreeGdp] = useState(2.0)
  const [freeUnemp, setFreeUnemp] = useState(4.0)

  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'fail'>('idle')
  const [feedback, setFeedback] = useState('')
  const [solvedScenarios, setSolvedScenarios] = useState<ScenarioId[]>([])

  const scenarios: Scenario[] = useMemo(() => [
    {
      id: 'free',
      title: 'Free Play Mode',
      desc: 'Simulate policy rates and see sector reactions.',
      initialRate: 5.25,
      initialCpi: 2.5,
      initialGdp: 2.0,
      initialUnemp: 4.0,
      targets: [],
      checkSuccess: () => false,
    },
    {
      id: 'stagflation',
      title: 'Stagflation Crisis',
      desc: 'Fight high inflation without triggering a deep recession.',
      initialRate: 5.0,
      initialCpi: 8.5,
      initialGdp: -1.5,
      initialUnemp: 6.0,
      targets: ['CPI Inflation < 3.0%', 'GDP Growth > -2.5%'],
      checkSuccess: (r) => {
        const c = 8.5 - 1.5 * (r - 5.0)
        const g = -1.5 - 0.2 * (r - 5.0)
        return c < 3.0 && g > -2.5
      },
    },
    {
      id: 'liquidity',
      title: 'Liquidity Trap',
      desc: 'Escape deflation and lower high unemployment levels.',
      initialRate: 5.0,
      initialCpi: -1.5,
      initialGdp: -3.0,
      initialUnemp: 8.5,
      targets: ['CPI Inflation > 1.5%', 'Unemployment < 5.0%'],
      checkSuccess: (r) => {
        const c = -1.5 - 1.0 * (r - 5.0)
        const u = 8.5 + 1.0 * (r - 5.0)
        return c > 1.5 && u < 5.0
      },
    },
    {
      id: 'bubble',
      title: 'Asset Bubble & Overheating',
      desc: 'Cool down hot inflation without causing a negative GDP print.',
      initialRate: 5.0,
      initialCpi: 6.0,
      initialGdp: 6.5,
      initialUnemp: 2.5,
      targets: ['CPI Inflation < 4.0%', 'GDP Growth > 0.0%'],
      checkSuccess: (r) => {
        const c = 6.0 - 1.2 * (r - 5.0)
        const g = 6.5 - 0.8 * (r - 5.0)
        return c < 4.0 && g > 0.0
      },
    },
  ], [])

  const currentScenario = scenarios.find((s) => s.id === scenario) || scenarios[0]

  useEffect(() => {
    setRate(currentScenario.initialRate)
    setVerifyStatus('idle')
    setFeedback('')
  }, [scenario, currentScenario])

  const { cpi, gdp, unemp } = useMemo(() => {
    if (scenario === 'free') {
      const rateDiff = rate - 5.25
      return {
        cpi: Math.max(-3, Math.min(20, freeCpi - 0.6 * rateDiff)),
        gdp: Math.max(-8, Math.min(10, freeGdp - 0.4 * rateDiff)),
        unemp: Math.max(1, Math.min(15, freeUnemp + 0.3 * rateDiff)),
      }
    }
    
    const rateDiff = rate - 5.0
    if (scenario === 'stagflation') {
      return {
        cpi: Math.max(-2, 8.5 - 1.5 * rateDiff),
        gdp: Math.max(-6, -1.5 - 0.2 * rateDiff),
        unemp: Math.max(2, 6.0 + 0.3 * rateDiff),
      }
    } else if (scenario === 'liquidity') {
      return {
        cpi: Math.max(-5, -1.5 - 1.0 * rateDiff),
        gdp: Math.max(-8, -3.0 - 0.8 * rateDiff),
        unemp: Math.max(1, 8.5 + 1.0 * rateDiff),
      }
    } else {
      return {
        cpi: Math.max(0, 6.0 - 1.2 * rateDiff),
        gdp: Math.max(-4, 6.5 - 0.8 * rateDiff),
        unemp: Math.max(1, 2.5 + 0.3 * rateDiff),
      }
    }
  }, [scenario, rate, freeCpi, freeGdp, freeUnemp])

  const handleVerify = () => {
    const passed = currentScenario.checkSuccess(rate, cpi, gdp, unemp)
    if (passed) {
      setVerifyStatus('success')
      setFeedback('Economic metrics stabilized. Central bank crisis resolved! +40 XP')
      if (!solvedScenarios.includes(scenario)) {
        setSolvedScenarios((prev) => [...prev, scenario])
        onComplete(40)
      }
    } else {
      setVerifyStatus('fail')
      if (scenario === 'stagflation') {
        if (cpi >= 3.0) setFeedback('Policy failed: Inflation remains high. Raise rates to cool demand.')
        else setFeedback('Policy failed: Deep recession triggered! GDP fell below -2.5%. Lower rates.')
      } else if (scenario === 'liquidity') {
        if (cpi <= 1.5) setFeedback('Policy failed: Deflation continues. Drop rates to stimulate spending.')
        else setFeedback('Policy failed: Unemployment remains high. Lower rates to stimulate hiring.')
      } else if (scenario === 'bubble') {
        if (cpi >= 4.0) setFeedback('Policy failed: Inflation is hot. Raise rates to cool the economy.')
        else setFeedback('Policy failed: hard landing! GDP growth fell below 0%. Lower rates.')
      }
    }
  }

  const sectors = useMemo(() => {
    const techVal = -3.0 * (rate - 5.0) + 2.0 * (gdp - 2.0) - 1.0 * (cpi - 2.5) - 1.5 * (unemp - 4.0)
    const finVal = +2.5 * (rate - 5.0) + 1.5 * (gdp - 2.0) - 3.0 * (unemp - 4.0)
    const utilVal = -4.0 * (rate - 5.0) - 1.5 * (cpi - 2.5) + 0.5 * (gdp - 2.0)
    const reVal = -5.0 * (rate - 5.0) + 1.0 * (gdp - 2.0) - 1.0 * (cpi - 2.5)
    const nrgVal = +2.0 * (cpi - 2.5) + 2.5 * (gdp - 2.0) - 1.0 * (rate - 5.0)
    const hcVal = -0.5 * (rate - 5.0) + 0.5 * (gdp - 2.0) - 0.5 * (cpi - 2.5)
    const consVal = -4.0 * (unemp - 4.0) - 2.0 * (cpi - 2.5) + 3.0 * (gdp - 2.0) - 1.5 * (rate - 5.0)
    const indVal = +3.5 * (gdp - 2.0) - 1.5 * (rate - 5.0) - 1.5 * (unemp - 4.0)

    return [
      { name: 'Technology', value: techVal, desc: 'Rate hikes reduce future earnings valuation. Helped by GDP.' },
      { name: 'Finance & Banks', value: finVal, desc: 'Yield expansion increases profit margins. Helped by rate hikes.' },
      { name: 'Energy', value: nrgVal, desc: 'Commodities benefit from inflation and industrial activity.' },
      { name: 'Consumer Disc.', value: consVal, desc: 'Sensitive to purchasing power. Hurt by inflation and unemployment.' },
      { name: 'Utilities', value: utilVal, desc: 'Capital-intensive debt-proxy. Sensitive to rate increases.' },
      { name: 'Real Estate', value: reVal, desc: 'Directly impacted by mortgage and financing capital costs.' },
      { name: 'Healthcare', value: hcVal, desc: 'Defensive. Insulated from high interest rates and growth changes.' },
      { name: 'Industrials', value: indVal, desc: 'Cyclical. Strong correlation with global GDP growth.' },
    ]
  }, [rate, gdp, cpi, unemp])

  // Higher density points (60) for a smoother line
  const chartData = useMemo(() => {
    const marketBias = sectors.reduce((sum, s) => sum + s.value, 0) / 10 + (gdp * 1.5) - (cpi * 0.5)
    const points = []
    let price = 100
    for (let i = 0; i <= 60; i++) {
      const step = (i / 60) * marketBias
      const wave = Math.sin(i * 0.2) * 2.0 + Math.cos(i * 0.35) * 1.0
      const currentPrice = Math.max(40, price + step + wave)
      points.push({ day: i, price: currentPrice })
    }
    return points
  }, [sectors, gdp, cpi])

  // Calculate coordinates in SVG space
  const chartMetrics = useMemo(() => {
    const minPrice = Math.min(...chartData.map((d) => d.price))
    const maxPrice = Math.max(...chartData.map((d) => d.price))
    const priceRange = maxPrice - minPrice || 1
    const widthVal = 1000
    const heightVal = 192

    const coords = chartData.map((d) => {
      const x = (d.day / 60) * widthVal
      const y = heightVal - ((d.price - minPrice) / priceRange) * (heightVal * 0.75) - (heightVal * 0.125)
      return { x, y }
    })

    const linePath = `M ${coords.map((c) => `${c.x} ${c.y}`).join(' L ')}`
    const areaPath = `${linePath} L ${widthVal} ${heightVal} L 0 ${heightVal} Z`

    return {
      linePath,
      areaPath,
      startVal: chartData[0].price,
      endVal: chartData[chartData.length - 1].price,
      // Calculate CSS percentage positions for label overlays to avoid SVG text warping
      yStartPct: ((coords[0].y) / heightVal) * 100,
      yEndPct: ((coords[coords.length - 1].y) / heightVal) * 100,
    }
  }, [chartData])

  return (
    <div className="flex flex-col gap-4 lg:gap-5 animate-in fade-in duration-200">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.06] pb-3 gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-surface-900 hover:bg-surface-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-thriv-400" />
              Macroeconomic Sandbox
            </h1>
            <p className="text-[10px] text-slate-500">Simulate monetary policies and study sector ripple effects</p>
          </div>
        </div>
        
        {/* Scenario Tabs */}
        <div className="grid grid-cols-2 sm:flex gap-1 bg-surface-950/40 p-1 rounded-xl border border-white/[0.04] text-xs w-full sm:w-auto">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer text-center flex items-center justify-center ${
                scenario === s.id
                  ? 'bg-thriv-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5 justify-center">
                {s.title.split(' ')[0]}
                {solvedScenarios.includes(s.id) && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Sandbox Workspace */}
      <div className="grid gap-5 md:grid-cols-12 items-start order-3 lg:order-1">
        {/* Column 1: Variables controls */}
        <div className="md:col-span-5 space-y-4">
          <div className="glass rounded-xl p-4 space-y-3.5">
            <h2 className="font-display font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="h-4 w-4 text-slate-400" />
              Monetary Policy Controls
            </h2>

            {/* Federal Funds Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-350 font-medium">Federal Funds Rate</span>
                <span className="font-mono text-thriv-400 font-semibold">{rate.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="10.00"
                step="0.25"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-thriv-500 bg-surface-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {scenario === 'free' ? (
              <div className="space-y-3 border-t border-white/[0.04] pt-3">
                {/* CPI Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-355 font-medium">CPI Inflation Rate</span>
                    <span className="font-mono text-white">{cpi.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="15.0"
                    step="0.1"
                    value={freeCpi}
                    onChange={(e) => setFreeCpi(parseFloat(e.target.value))}
                    className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                {/* GDP Slider */}
                <div className="space-y-1.5 border-t border-white/[0.02] pt-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-355 font-medium">GDP Growth Rate</span>
                    <span className="font-mono text-white">{gdp.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="-5.0"
                    max="8.0"
                    step="0.1"
                    value={freeGdp}
                    onChange={(e) => setFreeGdp(parseFloat(e.target.value))}
                    className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>

                {/* Unemployment Slider */}
                <div className="space-y-1.5 border-t border-white/[0.02] pt-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-355 font-medium">Unemployment Rate</span>
                    <span className="font-mono text-white">{unemp.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="12.0"
                    step="0.1"
                    value={freeUnemp}
                    onChange={(e) => setFreeUnemp(parseFloat(e.target.value))}
                    className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>
            ) : (
              // Locked variables displays for Scenarios
              <div className="space-y-3 border-t border-white/[0.04] pt-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-950/30 p-2 rounded-lg border border-white/[0.02] text-center">
                    <p className="text-[10px] text-slate-500 font-sans">CPI (Inflation)</p>
                    <p className="text-xs font-mono font-semibold text-white mt-0.5">{cpi.toFixed(1)}%</p>
                  </div>
                  <div className="bg-surface-950/30 p-2 rounded-lg border border-white/[0.02] text-center">
                    <p className="text-[10px] text-slate-500 font-sans">GDP Growth</p>
                    <p className="text-xs font-mono font-semibold text-white mt-0.5">{gdp.toFixed(1)}%</p>
                  </div>
                  <div className="bg-surface-950/30 p-2 rounded-lg border border-white/[0.02] text-center">
                    <p className="text-[10px] text-slate-500 font-sans">Unemployment</p>
                    <p className="text-xs font-mono font-semibold text-white mt-0.5">{unemp.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Small educational card below parameters explaining what they are for */}
            <div className="p-2.5 bg-surface-950/40 rounded-lg text-[10px] text-slate-500 leading-normal border border-white/[0.02]">
              Adjusting the central bank funds rate shifts aggregate demand: higher rates suppress inflation (CPI) but decelerate growth (GDP).
            </div>
          </div>
        </div>

        {/* Column 2: Scenario description */}
        <div className="md:col-span-7 space-y-4">
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-display font-semibold text-xs text-white uppercase tracking-wider">
                  {currentScenario.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  {currentScenario.desc}
                </p>
              </div>
              {solvedScenarios.includes(scenario) && (
                <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  <CheckCircle2 className="h-3 w-3" /> Solved
                </span>
              )}
            </div>

            {scenario !== 'free' && (
              <div className="bg-surface-950/40 p-3 rounded-xl border border-white/[0.04] space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentScenario.targets.map((t, idx) => {
                    const isCpiTarget = t.includes('CPI')
                    const isGdpTarget = t.includes('GDP')
                    const isUnempTarget = t.includes('Unemployment')
                    
                    let achieved = false
                    if (isCpiTarget) {
                      achieved = t.includes('<') ? cpi < 3.0 || cpi < 4.0 : cpi > 1.5
                    } else if (isGdpTarget) {
                      achieved = gdp > -2.5 || gdp > 0.0
                    } else if (isUnempTarget) {
                      achieved = unemp < 5.0
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono ${
                          achieved
                            ? 'border-emerald-500/25 bg-emerald-950/10 text-emerald-400'
                            : 'border-white/[0.04] bg-surface-900/40 text-slate-400'
                        }`}
                      >
                        <span>{t}</span>
                        <span>{achieved ? 'MET' : 'FAIL'}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleVerify}
                    className="flex-1 rounded-xl bg-thriv-600 border border-thriv-500/30 py-2 text-xs font-semibold text-white hover:bg-thriv-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Apply Policy Action
                  </button>
                  <button
                    type="button"
                    onClick={() => setRate(currentScenario.initialRate)}
                    className="px-3 rounded-xl bg-surface-800 border border-white/[0.06] hover:bg-surface-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    title="Reset defaults"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {verifyStatus !== 'idle' && (
                  <div
                    className={`p-3 rounded-lg border text-xs leading-normal animate-in fade-in duration-200 ${
                      verifyStatus === 'success'
                        ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400 font-medium'
                        : 'border-rose-500/20 bg-rose-950/20 text-rose-400'
                    }`}
                  >
                    {feedback}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Sector Impact Heatmap (grid-cols-2 on mobile for compact port) */}
      <div className="space-y-2.5 order-2 lg:order-2">
        <h2 className="font-display font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400" />
          Sector Impact Heatmap
        </h2>
        <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
          {sectors.map((s) => {
            const val = s.value
            let borderClass = 'border-white/[0.06]'
            let textClass = 'text-slate-400'
            let bgOverlay = 'bg-slate-500/[0.02]'
            if (val > 1.5) {
              borderClass = 'border-emerald-500/25'
              textClass = 'text-emerald-400'
              bgOverlay = 'bg-emerald-500/[0.06]'
            } else if (val < -1.5) {
              borderClass = 'border-rose-500/25'
              textClass = 'text-rose-400'
              bgOverlay = 'bg-rose-500/[0.06]'
            }

            return (
              <div
                key={s.name}
                className={`glass rounded-xl p-3 sm:p-4 relative overflow-hidden transition-all duration-200 hover:border-white/10 ${borderClass} ${textClass}`}
              >
                <div className={`absolute inset-0 ${bgOverlay}`} />
                <div className="relative">
                  <div className="flex justify-between items-start">
                    <span className="font-display font-semibold text-[11px] sm:text-xs text-white truncate max-w-[70%]">{s.name}</span>
                    <span className="font-mono text-xs font-bold shrink-0">
                      {val >= 0 ? '+' : ''}
                      {val.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight mt-1.5 line-clamp-3 sm:line-clamp-2">
                     {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Row: Market Index Simulation Chart */}
      <div className="glass rounded-xl p-4 space-y-3 order-1 lg:order-3">
        <div>
          <h2 className="font-display font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
            Simulated Index Trend (Thriv Macro Index)
          </h2>
        </div>

        {/* SVG Projection Chart Wrapper with Absolute Overlay for Text (Unwarped) */}
        <div className="h-36 sm:h-44 w-full relative">
          {/* Unwarped HTML Text Overlay */}
          <div
            className="absolute left-3 font-mono text-[9px] sm:text-xs text-slate-400 bg-surface-900/80 px-1.5 py-0.5 rounded border border-white/[0.04] transition-all duration-300 pointer-events-none z-10"
            style={{ top: `${Math.min(85, Math.max(10, chartMetrics.yStartPct))}%`, transform: 'translateY(-50%)' }}
          >
            Start: ${chartMetrics.startVal.toFixed(1)}
          </div>
          <div
            className="absolute right-3 font-mono text-[9px] sm:text-xs font-bold text-white bg-surface-900/90 px-1.5 py-0.5 rounded border border-thriv-500/20 shadow-md transition-all duration-300 pointer-events-none z-10"
            style={{ top: `${Math.min(85, Math.max(10, chartMetrics.yEndPct))}%`, transform: 'translateY(-50%)' }}
          >
            End: ${chartMetrics.endVal.toFixed(1)}
          </div>

          {/* SVG Vector Path */}
          <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14b896" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#14b896" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0.25, 0.5, 0.75].map((yPct, idx) => (
              <line
                key={idx}
                x1="0"
                y1={`${yPct * 100}%`}
                x2="100%"
                y2={`${yPct * 100}%`}
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}

            {/* Price Line (viewBox matches dimensions: 1000 x 192) */}
            {(() => {
              return (
                <svg viewBox="0 0 1000 192" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <path d={chartMetrics.areaPath} fill="url(#chart-grad)" />
                  <path
                    d={chartMetrics.linePath}
                    fill="none"
                    stroke="#14b896"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    className="transition-all duration-300"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )
            })()}
          </svg>
        </div>
      </div>
    </div>
  )
}
