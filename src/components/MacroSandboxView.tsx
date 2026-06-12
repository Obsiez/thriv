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
  const [rate, setRate] = useState(5.25) // Federal Funds Rate
  
  // Custom user inputs for Free Play mode
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
      desc: 'Manipulate macroeconomic sliders freely to observe the real-time ripple effects on sector valuations and index trends.',
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
      desc: 'The economy is suffering from high inflation (8.5%) and flatlining growth (-1.5%). Stabilize inflation below 3.0% without causing a deep recession (keep GDP growth above -2.5%).',
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
      desc: 'The economy is trapped in a deflationary spiral (CPI at -1.5%) and high unemployment (8.5%). Stimulate economic activity: raise inflation above 1.5% and bring unemployment under 5.0%.',
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
      desc: 'GDP growth is unsustainably high (6.5%) and inflation is climbing rapidly (6.0%). Tighten monetary policy to cool CPI under 4.0%, but avoid a hard landing (GDP growth must remain positive).',
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

  // Reset variables when switching scenarios
  useEffect(() => {
    setRate(currentScenario.initialRate)
    setVerifyStatus('idle')
    setFeedback('')
  }, [scenario, currentScenario])

  // Derive GDP, CPI, and Unemployment based on rate and scenario
  const { cpi, gdp, unemp } = useMemo(() => {
    if (scenario === 'free') {
      // In free play, user can move all sliders, but we show a rate-adjusted response
      // if they move the rate slider. To balance both, we apply rate adjustments starting from baseline 5.25.
      const rateDiff = rate - 5.25
      return {
        cpi: Math.max(-3, Math.min(20, freeCpi - 0.6 * rateDiff)),
        gdp: Math.max(-8, Math.min(10, freeGdp - 0.4 * rateDiff)),
        unemp: Math.max(1, Math.min(15, freeUnemp + 0.3 * rateDiff)),
      }
    }
    
    // Scenario specific response formulas
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
    } else { // bubble
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
      setFeedback('Economic metrics stabilized. Excellent central bank intervention! +40 XP')
      if (!solvedScenarios.includes(scenario)) {
        setSolvedScenarios((prev) => [...prev, scenario])
        onComplete(40)
      }
    } else {
      setVerifyStatus('fail')
      if (scenario === 'stagflation') {
        if (cpi >= 3.0) setFeedback('Policy failed: Inflation remains too high. Raise interest rates to cool the economy.')
        else setFeedback('Policy failed: You triggered a severe recession! GDP fell below -2.5%. Lower interest rates.')
      } else if (scenario === 'liquidity') {
        if (cpi <= 1.5) setFeedback('Policy failed: Deflation continues. Keep cutting interest rates to stimulate spending.')
        else setFeedback('Policy failed: Unemployment is still too high. Drop interest rates further to spark job growth.')
      } else if (scenario === 'bubble') {
        if (cpi >= 4.0) setFeedback('Policy failed: Inflation is still running hot. Raise rates further to cool aggregate demand.')
        else setFeedback('Policy failed: You cooled the economy too fast, triggering a recession. GDP growth went negative.')
      }
    }
  }

  // Sector impact mapping
  const sectors = useMemo(() => {
    // Technology: rate impact -3.0%, GDP +2.0%, CPI -1.0%, unemp -1.5%
    const techVal = -3.0 * (rate - 5.0) + 2.0 * (gdp - 2.0) - 1.0 * (cpi - 2.5) - 1.5 * (unemp - 4.0)
    // Finance/Banks: rate impact +2.5%, GDP +1.5%, unemp -3.0%
    const finVal = +2.5 * (rate - 5.0) + 1.5 * (gdp - 2.0) - 3.0 * (unemp - 4.0)
    // Utilities: rate impact -4.0%, CPI -1.5% (high debt proxy)
    const utilVal = -4.0 * (rate - 5.0) - 1.5 * (cpi - 2.5) + 0.5 * (gdp - 2.0)
    // Real Estate: rate impact -5.0%, GDP +1.0% (mortgages)
    const reVal = -5.0 * (rate - 5.0) + 1.0 * (gdp - 2.0) - 1.0 * (cpi - 2.5)
    // Energy: CPI +2.0%, GDP +2.5% (oil/commodities)
    const nrgVal = +2.0 * (cpi - 2.5) + 2.5 * (gdp - 2.0) - 1.0 * (rate - 5.0)
    // Healthcare: rate -0.5%, GDP +0.5% (defensive)
    const hcVal = -0.5 * (rate - 5.0) + 0.5 * (gdp - 2.0) - 0.5 * (cpi - 2.5)
    // Consumer Discretionary: unemp -4.0%, CPI -2.0%, GDP +3.0%
    const consVal = -4.0 * (unemp - 4.0) - 2.0 * (cpi - 2.5) + 3.0 * (gdp - 2.0) - 1.5 * (rate - 5.0)
    // Industrials: GDP +3.5%, rate -1.5%
    const indVal = +3.5 * (gdp - 2.0) - 1.5 * (rate - 5.0) - 1.5 * (unemp - 4.0)

    return [
      { name: 'Technology', value: techVal, desc: 'Sensitive to discounting on future cash flows. Hurt by high rates, helped by high GDP.' },
      { name: 'Finance & Banks', value: finVal, desc: 'Benefits from net interest margin expansion. Helped by higher rates and low unemployment.' },
      { name: 'Energy', value: nrgVal, desc: 'Driven by commodity prices and industrial demands. Highly positive in high inflation/GDP growth.' },
      { name: 'Consumer Discretionary', value: consVal, desc: 'Highly sensitive to consumer strength. Hurt by high unemployment and high inflation.' },
      { name: 'Utilities', value: utilVal, desc: 'High capital expenditure sector with high debt levels. Acts as a bond proxy; hurt by high rates.' },
      { name: 'Real Estate', value: reVal, desc: 'Directly impacted by mortgage and financing costs. Extremely sensitive to interest rate hikes.' },
      { name: 'Healthcare', value: hcVal, desc: 'Defensive sector. Insulated from interest rates and minor growth slowdowns.' },
      { name: 'Industrials', value: indVal, desc: 'Driven by business investment and manufacturing output. Strong correlation with GDP growth.' },
    ]
  }, [rate, gdp, cpi, unemp])

  // Simulated Macro Stock Index Chart Data
  const chartData = useMemo(() => {
    const marketBias = sectors.reduce((sum, s) => sum + s.value, 0) / 10 + (gdp * 1.5) - (cpi * 0.5)
    const points = []
    let price = 100
    for (let i = 0; i <= 30; i++) {
      const step = (i / 30) * marketBias
      const wave = Math.sin(i * 0.4) * 2.5 + Math.cos(i * 0.7) * 1.2
      const currentPrice = Math.max(40, price + step + wave)
      points.push({ day: i, price: currentPrice })
    }
    return points
  }, [sectors, gdp, cpi])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
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
            <p className="text-xs text-slate-400">Central Bank Policy & Market Simulator</p>
          </div>
        </div>
        
        {/* Scenario Tabs */}
        <div className="flex gap-1 bg-surface-950/40 p-1 rounded-xl border border-white/[0.04] text-xs">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer ${
                scenario === s.id
                  ? 'bg-thriv-600 text-white font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5">
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
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Column 1: Variables controls (5 cols) */}
        <div className="md:col-span-5 space-y-5">
          <div className="rounded-xl border border-white/[0.06] bg-surface-900/60 p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-slate-400" />
              Monetary Policy Controls
            </h2>

            {/* Federal Funds Rate Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Federal Funds Rate</span>
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
              <p className="text-[10px] text-slate-500">
                Primary monetary policy lever. Raise rates to fight inflation; lower rates to stimulate growth.
              </p>
            </div>

            {scenario === 'free' ? (
              <>
                {/* CPI Slider */}
                <div className="space-y-2 border-t border-white/[0.04] pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">CPI Inflation Rate</span>
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
                <div className="space-y-2 border-t border-white/[0.04] pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">GDP Growth Rate</span>
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
                <div className="space-y-2 border-t border-white/[0.04] pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Unemployment Rate</span>
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
              </>
            ) : (
              // Locked variables displays for Scenarios
              <div className="space-y-3 border-t border-white/[0.04] pt-3">
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Derived Economic Indicators</h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-950/30 p-2.5 rounded-lg border border-white/[0.02] text-center">
                    <p className="text-[10px] text-slate-500">CPI (Inflation)</p>
                    <p className="text-sm font-mono font-semibold text-white mt-0.5">{cpi.toFixed(1)}%</p>
                  </div>
                  <div className="bg-surface-950/30 p-2.5 rounded-lg border border-white/[0.02] text-center">
                    <p className="text-[10px] text-slate-500">GDP Growth</p>
                    <p className="text-sm font-mono font-semibold text-white mt-0.5">{gdp.toFixed(1)}%</p>
                  </div>
                  <div className="bg-surface-950/30 p-2.5 rounded-lg border border-white/[0.02] text-center">
                    <p className="text-[10px] text-slate-500">Unemployment</p>
                    <p className="text-sm font-mono font-semibold text-white mt-0.5">{unemp.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Scenario description and chart (7 cols) */}
        <div className="md:col-span-7 space-y-5">
          {/* Scenario challenge card */}
          <div className="rounded-xl border border-white/[0.06] bg-surface-900/60 p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-display font-semibold text-sm text-white">
                  {currentScenario.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {currentScenario.desc}
                </p>
              </div>
              {solvedScenarios.includes(scenario) && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  <CheckCircle2 className="h-3 w-3" /> Solved
                </span>
              )}
            </div>

            {scenario !== 'free' && (
              <div className="bg-surface-950/40 p-4 rounded-xl border border-white/[0.04] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Target Goals:</span>
                  <span className="text-[10px] font-mono text-slate-500">Policy values must settle within ranges</span>
                </div>
                
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
                    className="flex-1 rounded-xl bg-thriv-600 border border-thriv-500/30 py-2.5 text-xs font-semibold text-white hover:bg-thriv-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Verify Policy Implementation
                  </button>
                  <button
                    type="button"
                    onClick={() => setRate(currentScenario.initialRate)}
                    className="px-3 rounded-xl bg-surface-800 border border-white/[0.06] hover:bg-surface-700 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                    title="Reset to default rate"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {verifyStatus !== 'idle' && (
                  <div
                    className={`p-3 rounded-lg border text-xs leading-relaxed animate-in fade-in duration-200 ${
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

      {/* Middle Row: Sector Impact Heatmap */}
      <div className="space-y-3">
        <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400" />
          Sector Impact Heatmap
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sectors.map((s) => {
            const val = s.value
            let colorClass = 'border-white/[0.06] bg-surface-900/30 text-slate-400'
            let bgOverlay = 'bg-slate-500/5'
            if (val > 1.5) {
              colorClass = 'border-emerald-500/20 bg-emerald-950/5 text-emerald-400'
              bgOverlay = 'bg-emerald-500/5'
            } else if (val < -1.5) {
              colorClass = 'border-rose-500/20 bg-rose-950/5 text-rose-400'
              bgOverlay = 'bg-rose-500/5'
            }

            return (
              <div
                key={s.name}
                className={`rounded-xl border p-4 relative overflow-hidden flex flex-col justify-between min-h-[120px] transition-all duration-200 hover:border-white/10 ${colorClass}`}
              >
                <div className={`absolute inset-0 opacity-10 ${bgOverlay}`} />
                <div className="relative">
                  <div className="flex justify-between items-start">
                    <span className="font-display font-semibold text-xs text-white">{s.name}</span>
                    <span className="font-mono text-xs font-bold">
                      {val >= 0 ? '+' : ''}
                      {val.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-2">
                    {s.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Row: Market Index Simulation Chart */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-900/60 p-5 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
            Simulated Index Trend (Thriv Macro Index)
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Dynamic 30-day projection showing index response based on the weighted aggregate impact of all sectors.
          </p>
        </div>

        {/* SVG Projection Chart */}
        <div className="h-48 w-full relative">
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

            {/* Price Line */}
            {(() => {
              const minPrice = Math.min(...chartData.map((d) => d.price))
              const maxPrice = Math.max(...chartData.map((d) => d.price))
              const priceRange = maxPrice - minPrice || 1
              
              const widthVal = 1000
              const heightVal = 192
              const coords = chartData.map((d) => {
                const x = (d.day / 30) * widthVal
                const y = heightVal - ((d.price - minPrice) / priceRange) * (heightVal * 0.75) - (heightVal * 0.125)
                return { x, y }
              })

              const linePath = `M ${coords.map((c) => `${c.x} ${c.y}`).join(' L ')}`
              const areaPath = `${linePath} L ${widthVal} ${heightVal} L 0 ${heightVal} Z`

              return (
                <svg viewBox={`0 0 ${widthVal} ${heightVal}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <path d={areaPath} fill="url(#chart-grad)" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#14b896"
                    strokeWidth={2}
                    className="transition-all duration-300"
                  />
                  <g className="font-mono text-[10px] fill-slate-400">
                    <text x={10} y={coords[0].y - 8} textAnchor="start">
                      Start: ${chartData[0].price.toFixed(1)}
                    </text>
                    <text x={widthVal - 10} y={coords[coords.length - 1].y - 8} textAnchor="end" className="font-semibold fill-white">
                      End: ${chartData[chartData.length - 1].price.toFixed(1)}
                    </text>
                  </g>
                </svg>
              )
            })()}
          </svg>
        </div>
      </div>
    </div>
  )
}
