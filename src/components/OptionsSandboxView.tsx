import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Layers,
  Sliders,
  Clock,
  Percent,
  Calculator,
} from 'lucide-react'

interface OptionsSandboxViewProps {
  onBack: () => void
}

type StrategyId = 'call' | 'put' | 'bull_call' | 'bear_put' | 'straddle' | 'condor'

// Cumulative Standard Normal Distribution (high-precision polynomial approximation)
function cnd(x: number): number {
  const a1 = 0.319381530
  const a2 = -0.356563782
  const a3 = 1.781477937
  const a4 = -1.821255978
  const a5 = 1.330274429
  const L = Math.abs(x)
  const K = 1.0 / (1.0 + 0.2316419 * L)
  let cndVal = 1.0 - 1.0 / Math.sqrt(2.0 * Math.PI) * Math.exp(-L * L / 2.0) * 
    (a1 * K + a2 * Math.pow(K, 2) + a3 * Math.pow(K, 3) + a4 * Math.pow(K, 4) + a5 * Math.pow(K, 5))
  if (x < 0) {
    cndVal = 1.0 - cndVal
  }
  return cndVal
}

// Probability Density Function of standard normal distribution
function pdf(x: number): number {
  return (1.0 / Math.sqrt(2.0 * Math.PI)) * Math.exp(-0.5 * x * x)
}

// Black-Scholes formula implementation
function blackScholes(
  type: 'call' | 'put',
  S: number,
  K: number,
  t: number, // DTE in years (days / 365)
  r: number, // interest rate (e.g. 0.045)
  v: number  // volatility (sigma, e.g. 0.30)
) {
  const tAdj = Math.max(0.0001, t)
  const vAdj = Math.max(0.01, v)
  
  const d1 = (Math.log(S / K) + (r + (vAdj * vAdj) / 2) * tAdj) / (vAdj * Math.sqrt(tAdj))
  const d2 = d1 - vAdj * Math.sqrt(tAdj)
  
  let price = 0
  let delta = 0
  let gamma = 0
  let theta = 0
  let vega = 0
  
  if (type === 'call') {
    price = S * cnd(d1) - K * Math.exp(-r * tAdj) * cnd(d2)
    delta = cnd(d1)
    theta = -((S * pdf(d1) * vAdj) / (2 * Math.sqrt(tAdj))) - r * K * Math.exp(-r * tAdj) * cnd(d2)
  } else {
    price = K * Math.exp(-r * tAdj) * cnd(-d2) - S * cnd(-d1)
    delta = cnd(d1) - 1.0
    theta = -((S * pdf(d1) * vAdj) / (2 * Math.sqrt(tAdj))) + r * K * Math.exp(-r * tAdj) * cnd(-d2)
  }
  
  gamma = pdf(d1) / (S * vAdj * Math.sqrt(tAdj))
  vega = S * Math.sqrt(tAdj) * pdf(d1)
  
  // Annual to daily theta
  theta = theta / 365
  // Decimal to 1% vol change vega
  vega = vega / 100
  
  return { price, delta, gamma, theta, vega }
}

export function OptionsSandboxView({ onBack }: OptionsSandboxViewProps) {
  const [strategy, setStrategy] = useState<StrategyId>('call')
  
  // Options Parameters
  const [stockPrice, setStockPrice] = useState(100.0) // S
  const [dte, setDte] = useState(30) // Days to Expiration
  const [iv, setIv] = useState(30) // Implied Volatility (in %)
  const interestRate = 0.045 // Fixed 4.5% Risk-free rate
  
  // Strike Parameters (linked dynamically based on strategy)
  const [k1, setK1] = useState(90.0)
  const [k2, setK2] = useState(95.0)
  const [k3, setK3] = useState(105.0)
  const [k4, setK4] = useState(110.0)

  const strategies = [
    { id: 'call', name: 'Long Call' },
    { id: 'put', name: 'Long Put' },
    { id: 'bull_call', name: 'Bull Call Spread' },
    { id: 'bear_put', name: 'Bear Put Spread' },
    { id: 'straddle', name: 'Straddle' },
    { id: 'condor', name: 'Iron Condor' },
  ]

  // Calculate entry costs and premium values based on Black-Scholes solver
  const r = interestRate
  const t = dte / 365
  const v = iv / 100

  // BS values for the strategy legs
  const bsCalc = useMemo(() => {
    if (strategy === 'call') {
      const leg = blackScholes('call', stockPrice, k2, t, r, v)
      return {
        entryPrice: leg.price,
        delta: leg.delta,
        gamma: leg.gamma,
        theta: leg.theta,
        vega: leg.vega,
        maxLoss: leg.price * 100,
        maxGain: Infinity,
        breakEvens: [k2 + leg.price],
      }
    } else if (strategy === 'put') {
      const leg = blackScholes('put', stockPrice, k2, t, r, v)
      return {
        entryPrice: leg.price,
        delta: leg.delta,
        gamma: leg.gamma,
        theta: leg.theta,
        vega: leg.vega,
        maxLoss: leg.price * 100,
        maxGain: (k2 - leg.price) * 100,
        breakEvens: [k2 - leg.price],
      }
    } else if (strategy === 'bull_call') {
      const leg1 = blackScholes('call', stockPrice, k2, t, r, v) // Buy Call
      const leg2 = blackScholes('call', stockPrice, k3, t, r, v) // Sell Call
      const entry = Math.max(0.01, leg1.price - leg2.price)
      return {
        entryPrice: entry,
        delta: leg1.delta - leg2.delta,
        gamma: leg1.gamma - leg2.gamma,
        theta: leg1.theta - leg2.theta,
        vega: leg1.vega - leg2.vega,
        maxLoss: entry * 100,
        maxGain: Math.max(0, k3 - k2 - entry) * 100,
        breakEvens: [k2 + entry],
      }
    } else if (strategy === 'bear_put') {
      const leg1 = blackScholes('put', stockPrice, k3, t, r, v) // Buy Put
      const leg2 = blackScholes('put', stockPrice, k2, t, r, v) // Sell Put
      const entry = Math.max(0.01, leg1.price - leg2.price)
      return {
        entryPrice: entry,
        delta: leg1.delta - leg2.delta,
        gamma: leg1.gamma - leg2.gamma,
        theta: leg1.theta - leg2.theta,
        vega: leg1.vega - leg2.vega,
        maxLoss: entry * 100,
        maxGain: Math.max(0, k3 - k2 - entry) * 100,
        breakEvens: [k3 - entry],
      }
    } else if (strategy === 'straddle') {
      const leg1 = blackScholes('call', stockPrice, k2, t, r, v)
      const leg2 = blackScholes('put', stockPrice, k2, t, r, v)
      const entry = leg1.price + leg2.price
      return {
        entryPrice: entry,
        delta: leg1.delta + leg2.delta,
        gamma: leg1.gamma + leg2.gamma,
        theta: leg1.theta + leg2.theta,
        vega: leg1.vega + leg2.vega,
        maxLoss: entry * 100,
        maxGain: Infinity,
        breakEvens: [k2 - entry, k2 + entry],
      }
    } else { // condor
      // Buy Put K1, Sell Put K2, Sell Call K3, Buy Call K4
      const putLong = blackScholes('put', stockPrice, k1, t, r, v)
      const putShort = blackScholes('put', stockPrice, k2, t, r, v)
      const callShort = blackScholes('call', stockPrice, k3, t, r, v)
      const callLong = blackScholes('call', stockPrice, k4, t, r, v)
      
      const credit = (putShort.price - putLong.price) + (callShort.price - callLong.price)
      const maxLoss = Math.max(0, (k2 - k1) - credit)
      
      return {
        entryPrice: credit, // net credit
        delta: (putShort.delta - putLong.delta) + (callShort.delta - callLong.delta),
        gamma: (putShort.gamma - putLong.gamma) + (callShort.gamma - callLong.gamma),
        theta: (putShort.theta - putLong.theta) + (callShort.theta - callLong.theta),
        vega: (putShort.vega - putLong.vega) + (callShort.vega - callLong.vega),
        maxLoss: maxLoss * 100,
        maxGain: Math.max(0, credit) * 100,
        breakEvens: [k2 - credit, k3 + credit],
      }
    }
  }, [strategy, stockPrice, dte, iv, k1, k2, k3, k4, t, v])

  // Get pricing value of strategy at specific stock price S_price and time t_val
  const getStrategyValue = (S_price: number, t_val: number) => {
    if (strategy === 'call') {
      return blackScholes('call', S_price, k2, t_val, r, v).price
    } else if (strategy === 'put') {
      return blackScholes('put', S_price, k2, t_val, r, v).price
    } else if (strategy === 'bull_call') {
      return blackScholes('call', S_price, k2, t_val, r, v).price - blackScholes('call', S_price, k3, t_val, r, v).price
    } else if (strategy === 'bear_put') {
      return blackScholes('put', S_price, k3, t_val, r, v).price - blackScholes('put', S_price, k2, t_val, r, v).price
    } else if (strategy === 'straddle') {
      return blackScholes('call', S_price, k2, t_val, r, v).price + blackScholes('put', S_price, k2, t_val, r, v).price
    } else { // condor
      const putLong = blackScholes('put', S_price, k1, t_val, r, v).price
      const putShort = blackScholes('put', S_price, k2, t_val, r, v).price
      const callShort = blackScholes('call', S_price, k3, t_val, r, v).price
      const callLong = blackScholes('call', S_price, k4, t_val, r, v).price
      return (putShort - putLong) + (callShort - callLong)
    }
  }

  // Get Expiration Piecewise payoff value of strategy at specific stock price S_price
  const getExpirationValue = (S_price: number) => {
    if (strategy === 'call') {
      return Math.max(0, S_price - k2)
    } else if (strategy === 'put') {
      return Math.max(0, k2 - S_price)
    } else if (strategy === 'bull_call') {
      return Math.max(0, S_price - k2) - Math.max(0, S_price - k3)
    } else if (strategy === 'bear_put') {
      return Math.max(0, k3 - S_price) - Math.max(0, k2 - S_price)
    } else if (strategy === 'straddle') {
      return Math.max(0, S_price - k2) + Math.max(0, k2 - S_price)
    } else { // condor
      // Linear piecewise representation
      const putVal = S_price < k1 ? -(k2 - k1) : S_price < k2 ? -(k2 - S_price) : 0
      const callVal = S_price > k4 ? -(k4 - k3) : S_price > k3 ? -(S_price - k3) : 0
      return putVal + callVal
    }
  }

  // Payoff chart generation
  const payoffData = useMemo(() => {
    const data = []
    const entryVal = bsCalc.entryPrice
    // S range: $50 to $150, step 0.5 for a smooth, premium payoff curve (200 data points)
    for (let S_axis = 50; S_axis <= 150; S_axis += 0.5) {
      let expProfit = 0
      let todayProfit = 0
      
      if (strategy === 'condor') {
        // Credit strategy: profit = credit + payoff
        expProfit = (entryVal + getExpirationValue(S_axis)) * 100
        todayProfit = (getStrategyValue(S_axis, t) - entryVal) * 100
      } else {
        // Debit strategies: profit = payoff - premium
        expProfit = (getExpirationValue(S_axis) - entryVal) * 100
        todayProfit = (getStrategyValue(S_axis, t) - entryVal) * 100
      }
      
      data.push({
        stockPrice: S_axis,
        expiration: expProfit,
        today: todayProfit,
      })
    }
    return data
  }, [strategy, stockPrice, dte, iv, k1, k2, k3, k4, t, bsCalc.entryPrice])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
              <Layers className="h-5 w-5 text-thriv-400" />
              Options Sandbox
            </h1>
            <p className="text-xs text-slate-400">Black-Scholes Pricing Engine & Greeks Visualizer</p>
          </div>
        </div>

        {/* Strategy Selector Tabs */}
        <div className="grid grid-cols-3 sm:flex gap-1 bg-surface-950/40 p-1 rounded-xl border border-white/[0.04] text-[11px] font-medium w-full sm:w-auto">
          {strategies.map((s) => (
            <button
              key={s.id}
              onClick={() => setStrategy(s.id as StrategyId)}
              className={`px-3 py-2 sm:py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-center flex items-center justify-center ${
                strategy === s.id
                  ? 'bg-thriv-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-col md:grid md:grid-cols-12 gap-6 items-start">
        {/* Left column: Controls (5 cols) */}
        <div className="md:col-span-5 space-y-5 order-2 md:order-1 w-full">

          {/* Sliders Container */}
          <div className="glass rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-slate-400" />
              Option Parameter Controls
            </h2>

            {/* Stock Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Underlying Stock Price</span>
                <span className="font-mono text-thriv-400 font-semibold">${stockPrice.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                step="1"
                value={stockPrice}
                onChange={(e) => setStockPrice(parseFloat(e.target.value))}
                className="w-full accent-thriv-500 bg-surface-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* DTE Slider */}
            <div className="space-y-2 border-t border-white/[0.04] pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> Days to Expiration (DTE)
                </span>
                <span className="font-mono text-white">{dte} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="90"
                step="1"
                value={dte}
                onChange={(e) => setDte(parseInt(e.target.value))}
                className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Implied Volatility Slider */}
            <div className="space-y-2 border-t border-white/[0.04] pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-slate-500" /> Implied Volatility (IV)
                </span>
                <span className="font-mono text-white">{iv}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={iv}
                onChange={(e) => setIv(parseInt(e.target.value))}
                className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Strike Price Sliders (Depend on Strategy) */}
            <div className="space-y-3 border-t border-white/[0.04] pt-3">
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Strategy Strikes</h3>

              {/* Single strike strategies (Call, Put, Straddle) */}
              {(strategy === 'call' || strategy === 'put' || strategy === 'straddle') && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">Strike Price</span>
                    <span className="font-mono text-white">${k2.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="130"
                    step="1"
                    value={k2}
                    onChange={(e) => setK2(parseFloat(e.target.value))}
                    className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              )}

              {/* Spread strategies (Bull Call, Bear Put) */}
              {(strategy === 'bull_call' || strategy === 'bear_put') && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Long/Buy Strike</span>
                      <span className="font-mono text-white">${strategy === 'bull_call' ? k2.toFixed(1) : k3.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="130"
                      step="1"
                      value={strategy === 'bull_call' ? k2 : k3}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (strategy === 'bull_call') {
                          setK2(val)
                          if (val >= k3) setK3(val + 5)
                        } else {
                          setK3(val)
                          if (val <= k2) setK2(val - 5)
                        }
                      }}
                      className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                  <div className="space-y-2 border-t border-white/[0.02] pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Short/Sell Strike</span>
                      <span className="font-mono text-white">${strategy === 'bull_call' ? k3.toFixed(1) : k2.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="130"
                      step="1"
                      value={strategy === 'bull_call' ? k3 : k2}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (strategy === 'bull_call') {
                          setK3(val)
                          if (val <= k2) setK2(val - 5)
                        } else {
                          setK2(val)
                          if (val >= k3) setK3(val + 5)
                        }
                      }}
                      className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              )}

              {/* Iron Condor 4 Strikes */}
              {strategy === 'condor' && (
                <div className="space-y-3 font-sans">
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div>Put Wing: ${k1.toFixed(1)} / ${k2.toFixed(1)}</div>
                    <div>Call Wing: ${k3.toFixed(1)} / ${k4.toFixed(1)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Short Put Strike</span>
                      <span className="font-mono text-white">${k2.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="98"
                      step="1"
                      value={k2}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        setK2(val)
                        setK1(val - 5) // lock 5 dollar width
                      }}
                      className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                  <div className="space-y-2 border-t border-white/[0.02] pt-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Short Call Strike</span>
                      <span className="font-mono text-white">${k3.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="102"
                      max="125"
                      step="1"
                      value={k3}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        setK3(val)
                        setK4(val + 5) // lock 5 dollar width
                      }}
                      className="w-full accent-slate-400 bg-surface-800 rounded-lg cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Small educational card below options parameter controls */}
            <div className="p-2.5 bg-surface-950/40 rounded-lg text-[10px] text-slate-500 leading-normal border border-white/[0.02]">
              Simulate options payoff and Greeks by adjusting stock price, volatility, and expiration. Higher implied volatility (IV) increases option premiums; decreasing DTE accelerates time decay (Theta).
            </div>
          </div>
        </div>

        {/* Right Column: Payoff Chart & Greeks (7 cols) */}
        <div className="md:col-span-7 space-y-5 order-1 md:order-2 w-full">
          {/* SVG Payoff Chart */}
          <div className="glass rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display font-semibold text-sm text-white">Interactive Payoff Diagram</h2>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="inline-block w-2.5 h-0.5 bg-slate-300" /> Expiration
                </span>
                <span className="flex items-center gap-1.5 text-thriv-400">
                  <span className="inline-block w-2.5 h-0.5 bg-thriv-400" /> Today (T+0)
                </span>
              </div>
            </div>

            {/* SVG Plot */}
            <div className="h-36 sm:h-44 w-full relative">
              {/* Unwarped HTML Text Overlays */}
              <div className="absolute top-1 left-2 font-mono text-[9px] sm:text-xs text-slate-500 z-10 pointer-events-none">+$400</div>
              <div className="absolute bottom-1 left-2 font-mono text-[9px] sm:text-xs text-slate-500 z-10 pointer-events-none">-$400</div>
              <div className="absolute bottom-1 right-2 font-mono text-[9px] sm:text-xs text-slate-500 z-10 pointer-events-none">STOCK RANGE: $50 to $150</div>

              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="payoff-green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="payoff-red" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.0" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                {/* Zero profit baseline */}
                <line
                  x1="0"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                />

                {/* Current Stock Price vertical dotted line */}
                {(() => {
                  const xPct = ((stockPrice - 50) / 100) * 100
                  return (
                    <g>
                      <line
                        x1={`${xPct}%`}
                        y1="0"
                        x2={`${xPct}%`}
                        y2="100%"
                        stroke="rgba(20, 184, 150, 0.45)"
                        strokeWidth={1.2}
                        strokeDasharray="3 3"
                      />
                      <circle cx={`${xPct}%`} cy="50%" r={3.5} fill="#14b896" />
                    </g>
                  )
                })()}

                {/* Payoff paths mapping */}
                {(() => {
                  const widthVal = 1000
                  const heightVal = 224 // viewBox base height
                  const halfH = heightVal / 2

                  // We scale y profits. The max potential profit display range: e.g. -$400 to +$400
                  const maxProfitDisplay = 400
                  
                  const getCoords = (d: typeof payoffData) => {
                    return d.map((pt) => {
                      const x = ((pt.stockPrice - 50) / 100) * widthVal
                      // Limit y to boundaries of chart
                      const yExp = halfH - (pt.expiration / maxProfitDisplay) * halfH
                      const yToday = halfH - (pt.today / maxProfitDisplay) * halfH
                      return {
                        x,
                        yExp: Math.max(5, Math.min(heightVal - 5, yExp)),
                        yToday: Math.max(5, Math.min(heightVal - 5, yToday)),
                      }
                    })
                  }

                  const coords = getCoords(payoffData)
                  const expPath = `M ${coords.map((c) => `${c.x} ${c.yExp}`).join(' L ')}`
                  const todayPath = `M ${coords.map((c) => `${c.x} ${c.yToday}`).join(' L ')}`

                  return (
                    <svg viewBox={`0 0 ${widthVal} ${heightVal}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      {/* Expiration payoff line */}
                      <path
                        d={expPath}
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* T+0 BS curve line */}
                      <path
                        d={todayPath}
                        fill="none"
                        stroke="#14b896"
                        strokeWidth={2.2}
                        className="transition-all duration-150"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )
                })()}
              </svg>
            </div>
          </div>

          {/* Greeks and Risk summary Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Risk profile card */}
            <div className="glass rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-xs text-white uppercase tracking-wider">Risk Profile</h3>
              
              <div className="space-y-2 font-sans text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-slate-400">Net Premium</span>
                  <span className="font-mono text-white font-semibold">
                    {strategy === 'condor' ? 'Credit: ' : 'Cost: '}
                    ${Math.abs(bsCalc.entryPrice * 100).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-slate-400">Max Gain</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {bsCalc.maxGain === Infinity ? 'Unlimited' : `$${bsCalc.maxGain.toFixed(0)}`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.02]">
                  <span className="text-slate-400">Max Loss</span>
                  <span className="font-mono text-rose-400 font-bold">
                    -${bsCalc.maxLoss.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Break-Even(s)</span>
                  <span className="font-mono text-slate-300 font-medium">
                    {bsCalc.breakEvens.map((b) => `$${b.toFixed(2)}`).join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Greeks Panel */}
            <div className="glass rounded-xl p-5 space-y-3">
              <h3 className="font-display font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-slate-500" />
                Leg Options Greeks (Aggregate)
              </h3>
              
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-surface-950/30 p-2 rounded-lg border border-white/[0.02]">
                  <div className="text-[10px] text-slate-500 font-sans">Delta (Δ)</div>
                  <div className="font-semibold text-white mt-0.5">{bsCalc.delta.toFixed(3)}</div>
                </div>
                <div className="bg-surface-950/30 p-2 rounded-lg border border-white/[0.02]">
                  <div className="text-[10px] text-slate-500 font-sans">Gamma (Γ)</div>
                  <div className="font-semibold text-white mt-0.5">{bsCalc.gamma.toFixed(4)}</div>
                </div>
                <div className="bg-surface-950/30 p-2 rounded-lg border border-white/[0.02]">
                  <div className="text-[10px] text-slate-500 font-sans">Theta (Θ)</div>
                  <div className="font-semibold text-rose-400 mt-0.5">{bsCalc.theta.toFixed(3)}/d</div>
                </div>
                <div className="bg-surface-950/30 p-2 rounded-lg border border-white/[0.02]">
                  <div className="text-[10px] text-slate-500 font-sans">Vega (ν)</div>
                  <div className="font-semibold text-emerald-400 mt-0.5">{bsCalc.vega.toFixed(3)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
