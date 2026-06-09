import { useState, useEffect, useRef, useMemo } from 'react'
import { ArrowLeft, AlertTriangle, TrendingDown, TrendingUp, DollarSign, Award, ShieldAlert, Pause } from 'lucide-react'
import { ActivityLiveChart, pricesToSeries } from './ActivityLiveChart'
import { formatCurrency } from '../lib/marketEngine'
import { haptic } from '../lib/haptics'
import type { PricePoint } from '../types'

interface MarginCallSurvivorActivityProps {
  onBack: () => void
  onComplete: (xp: number) => void
}

const GAME_SEC = 30
const INITIAL_CASH = 10_000
const LEVERAGE = 2
const INITIAL_POSITION_VALUE = INITIAL_CASH * LEVERAGE // $20,000
const BORROWED = INITIAL_CASH // always $10,000
const MARGIN_CALL_THRESHOLD = 0.25 // 25% maintenance margin
const ADD_MARGIN_AMOUNT = 2_000
const START_PRICE = 100

type Phase = 'ready' | 'live' | 'victory' | 'defeat'
type Action = 'hold' | 'add-margin' | 'close'

const MAX_CHART_POINTS = 45

function appendPricePoint(series: PricePoint[], price: number): PricePoint[] {
  return [...series.slice(-(MAX_CHART_POINTS - 1)), { time: Date.now(), price }]
}

export function MarginCallSurvivorActivity({ onBack, onComplete }: MarginCallSurvivorActivityProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [price, setPrice] = useState(START_PRICE)
  const [reserves, setReserves] = useState(0) // extra cash player can add as margin
  const [extraMargin, setExtraMargin] = useState(0) // total margin added
  const [shares, setShares] = useState(INITIAL_POSITION_VALUE / START_PRICE) // 200 shares
  const [seconds, setSeconds] = useState(GAME_SEC)
  const [priceSeries, setPriceSeries] = useState<PricePoint[]>([])
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [marginCallFlash, setMarginCallFlash] = useState(false)
  const [finalEquity, setFinalEquity] = useState(0)
  const [closedEarly, setClosedEarly] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const hasInteractedRef = useRef(false)
  useEffect(() => { hasInteractedRef.current = hasInteracted }, [hasInteracted])

  const startRef = useRef(0)
  const priceRef = useRef(START_PRICE)
  const sharesRef = useRef(INITIAL_POSITION_VALUE / START_PRICE)
  const extraMarginRef = useRef(0)

  useEffect(() => { priceRef.current = price }, [price])
  useEffect(() => { sharesRef.current = shares }, [shares])
  useEffect(() => { extraMarginRef.current = extraMargin }, [extraMargin])

  // Derived values
  const positionValue = price * shares
  const equity = positionValue - BORROWED + extraMargin
  const marginPct = positionValue > 0 ? equity / positionValue : 0
  const timerPct = (seconds / GAME_SEC) * 100

  const marginColor =
    marginPct > 0.5 ? 'text-emerald-400' : marginPct > 0.35 ? 'text-amber-400' : 'text-red-400'
  const marginBarColor =
    marginPct > 0.5 ? 'bg-emerald-500' : marginPct > 0.35 ? 'bg-amber-400' : 'bg-red-500'

  const pnl = equity - INITIAL_CASH
  const pnlPct = (pnl / INITIAL_CASH) * 100

  function startGame() {
    setPhase('live')
    setPrice(START_PRICE)
    const startShares = INITIAL_POSITION_VALUE / START_PRICE
    setShares(startShares)
    setReserves(6_000)
    setExtraMargin(0)
    setSeconds(GAME_SEC)
    setHasInteracted(false)

    const initialPrices: number[] = []
    let currP = START_PRICE
    let t = 0
    for (let i = 0; i < 40; i++) {
      t += (Math.random() - 0.5) * 0.5
      t = Math.max(-1.5, Math.min(1.5, t))
      const change = t * 0.3 + (Math.random() - 0.5) * 1.2
      currP = Math.max(68, Math.min(152, parseFloat((currP - change).toFixed(2))))
      initialPrices.unshift(currP)
    }
    initialPrices.push(START_PRICE)
    setPriceSeries(pricesToSeries(initialPrices, 500))

    setLastAction(null)
    setMarginCallFlash(false)
    setClosedEarly(false)
    priceRef.current = START_PRICE
    sharesRef.current = startShares
    extraMarginRef.current = 0
    startRef.current = Date.now()
  }

  function handleAction(action: Action) {
    if (phase !== 'live') return

    if (action === 'hold') {
      setHasInteracted(true)
      setLastAction('Position held')
      setTimeout(() => setLastAction(null), 1500)
    }

    if (action === 'add-margin') {
      setHasInteracted(true)
      if (reserves < ADD_MARGIN_AMOUNT) {
        haptic('alert')
        setLastAction('No reserves left!')
        setTimeout(() => setLastAction(null), 1500)
        return
      }
      haptic('success')
      setReserves((r) => r - ADD_MARGIN_AMOUNT)
      setExtraMargin((m) => m + ADD_MARGIN_AMOUNT)
      extraMarginRef.current += ADD_MARGIN_AMOUNT
      setLastAction(`+ Added $${ADD_MARGIN_AMOUNT.toLocaleString()} margin`)
      setTimeout(() => setLastAction(null), 1500)
    }

    if (action === 'close') {
      haptic('success')
      // Calculate final equity at current price
      const posVal = priceRef.current * sharesRef.current
      const eq = posVal - BORROWED + extraMarginRef.current
      setFinalEquity(eq)
      setClosedEarly(true)
      setPhase('victory')
      onComplete(0) // No XP for closing position early!
    }
  }

  // Price ticker + timer
  useEffect(() => {
    if (phase !== 'live') return

    const timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const left = Math.max(0, GAME_SEC - elapsed)
      setSeconds(left)

      if (left <= 0) {
        haptic('success')
        clearInterval(timerInterval)
        clearInterval(priceInterval)
        const posVal = priceRef.current * sharesRef.current
        const eq = posVal - BORROWED + extraMarginRef.current
        setFinalEquity(eq)
        setPhase('victory')
        const earnedXp = hasInteractedRef.current ? (eq >= INITIAL_CASH ? 50 : 20) : 0
        onComplete(earnedXp)
      }
    }, 100)

    // Price ticks every 500ms with random walk + occasional trend
    let trend = 0
    const priceInterval = setInterval(() => {
      // Gradual drift + noise. Bias slightly bearish to stress test.
      trend += (Math.random() - 0.55) * 0.5
      trend = Math.max(-2, Math.min(2, trend)) // clamp trend
      const change = trend * 0.3 + (Math.random() - 0.5) * 1.2

      setPrice((p) => {
        const next = Math.max(64, Math.min(156, parseFloat((p + change).toFixed(2))))
        priceRef.current = next

        const posVal = next * sharesRef.current
        const eq = posVal - BORROWED + extraMarginRef.current
        const mPct = posVal > 0 ? eq / posVal : 0

        setPriceSeries((s) => appendPricePoint(s, next))

        // Margin call check
        if (mPct <= MARGIN_CALL_THRESHOLD) {
          haptic('alert')
          clearInterval(timerInterval)
          clearInterval(priceInterval)
          setFinalEquity(eq)
          setMarginCallFlash(true)
          setTimeout(() => {
            setMarginCallFlash(false)
            setPhase('defeat')
          }, 1000)
        } else if (mPct < 0.35) {
          haptic('alert')
          setMarginCallFlash(true)
          setTimeout(() => setMarginCallFlash(false), 300)
        }

        return next
      })
    }, 500)

    return () => {
      clearInterval(timerInterval)
      clearInterval(priceInterval)
    }
  }, [phase, onComplete])

  const chartUp = useMemo(() => {
    if (priceSeries.length < 2) return true
    return priceSeries[priceSeries.length - 1].price >= priceSeries[0].price
  }, [priceSeries])

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px] hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* READY */}
      {phase === 'ready' && (
        <div className="glass rounded-xl p-5 sm:p-6 border border-white/[0.06] bg-surface-800/80 space-y-6">
          <div className="text-center space-y-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-900/60 border border-orange-500/25 mx-auto">
              <AlertTriangle className="h-7 w-7 text-orange-400" strokeWidth={1.5} />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-4">Margin Call Survivor</h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Leverage & Risk · 30 Seconds</p>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-surface-900/60 p-4 space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              You hold a <span className="text-white font-semibold">2× leveraged long position</span> — $20,000 of stock bought with only $10,000 of your own money (the rest is borrowed).
            </p>
            <p>
              If your <span className="text-red-400 font-semibold">equity falls below 25% of position value</span> (maintenance margin), the broker forcibly liquidates your position. That's a <span className="text-red-400 font-semibold">margin call</span>.
            </p>
            <p className="text-thriv-300 font-medium">
              Survive 30 seconds by choosing when to add margin, hold through volatility, or close your position while you're still ahead.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {[
              { label: 'HOLD', desc: 'Stay in position, ride it out', color: 'border-slate-500/30 bg-slate-900/20 text-slate-300' },
              { label: 'ADD MARGIN', desc: 'Inject $2,000 from reserves', color: 'border-amber-500/30 bg-amber-950/20 text-amber-300' },
              { label: 'CLOSE', desc: 'Exit and lock in profit/loss', color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' },
            ].map(({ label, desc, color }) => (
              <div key={label} className={`rounded-lg border p-2.5 ${color}`}>
                <p className="font-bold text-[10px] mb-1">{label}</p>
                <p className="text-[9px] text-slate-500 leading-tight">{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-surface-900/40 rounded-lg px-4 py-2.5 border border-white/[0.04]">
            <span>Starting equity: $10,000 · 2× leverage</span>
            <span className="text-thriv-400 font-semibold">Up to 50 XP</span>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white hover:bg-orange-500 active:bg-orange-700 touch-manipulation min-h-[48px]"
          >
            Enter Leveraged Position
          </button>
        </div>
      )}

      {/* LIVE */}
      {phase === 'live' && (
        <div className={`glass rounded-xl border overflow-hidden relative transition-colors ${marginCallFlash ? 'border-red-500/60' : 'border-white/[0.06]'} bg-surface-800/80`}>
          {marginCallFlash && (
            <div className="absolute inset-0 bg-red-500/5 pointer-events-none z-10 rounded-xl" />
          )}

          <div className="p-4 sm:p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Live Position · 2× Leverage</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-100" style={{ width: `${timerPct}%` }} />
                </div>
                <span className="font-mono text-sm font-bold text-orange-400 tabular-nums">{seconds.toFixed(1)}s</span>
              </div>
            </div>

            <div className="rounded-xl bg-surface-900/80 border border-white/[0.06] p-3 space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-600 font-semibold mb-1">Stock Price</p>
                  <p className="font-mono text-xl font-bold text-white">${price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-slate-600 font-semibold mb-1">Your Equity</p>
                  <p className={`font-mono text-lg font-bold ${equity >= INITIAL_CASH ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(Math.max(0, equity))}
                  </p>
                  <p className={`text-xs font-semibold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                  </p>
                </div>
              </div>
              <ActivityLiveChart
                data={priceSeries}
                up={chartUp}
                referencePrice={START_PRICE}
                className="border border-white/[0.04]"
              />
            </div>

            {/* Margin meter */}
            <div className="rounded-xl bg-surface-900/80 border border-white/[0.06] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest text-slate-600 font-semibold">Margin Level</p>
                <p className={`font-mono text-sm font-bold ${marginColor}`}>{(marginPct * 100).toFixed(1)}%</p>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${marginBarColor}`}
                  style={{ width: `${Math.min(100, marginPct * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-600">
                <span className="text-red-500 font-semibold">CALL ← 25%</span>
                <span className="text-amber-500">CAUTION 35%</span>
                <span className="text-emerald-500">SAFE 50%+</span>
              </div>
            </div>

            {/* Position details */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              {[
                { label: 'Pos. Value', value: formatCurrency(positionValue), color: 'text-slate-300' },
                { label: 'Borrowed', value: formatCurrency(BORROWED), color: 'text-red-400' },
                { label: 'Reserves', value: formatCurrency(reserves), color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg bg-surface-900/40 border border-white/[0.04] p-2">
                  <p className={`font-mono font-bold text-xs ${color}`}>{value}</p>
                  <p className="text-slate-600 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Status message */}
            {lastAction && (
              <div className="h-6 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-amber-300 font-mono">{lastAction}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAction('hold')}
                className="rounded-xl border border-slate-600/40 bg-slate-800/60 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700/60 touch-manipulation min-h-[48px] flex flex-col items-center gap-1"
              >
                <span className="text-base"><Pause className="h-4 w-4" /></span>
                HOLD
              </button>
              <button
                type="button"
                onClick={() => handleAction('add-margin')}
                disabled={reserves < ADD_MARGIN_AMOUNT}
                className="rounded-xl border border-amber-500/30 bg-amber-950/20 py-3 text-xs font-semibold text-amber-300 hover:bg-amber-950/40 touch-manipulation min-h-[48px] flex flex-col items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
              >
                <DollarSign className="h-4 w-4" />
                +MARGIN
              </button>
              <button
                type="button"
                onClick={() => handleAction('close')}
                className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 py-3 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 touch-manipulation min-h-[48px] flex flex-col items-center gap-1"
              >
                {equity >= INITIAL_CASH
                  ? <TrendingUp className="h-4 w-4" />
                  : <TrendingDown className="h-4 w-4" />}
                CLOSE
              </button>
            </div>

            {marginPct < 0.35 && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-2.5 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 animate-pulse" />
                <p className="text-[10px] text-red-300 font-semibold">
                  {marginPct <= 0.28 ? 'DANGER: Margin call imminent! Add margin or close now!' : 'WARNING: Margin level approaching call threshold!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VICTORY */}
      {phase === 'victory' && (
        <div className="glass rounded-xl p-5 sm:p-6 border border-emerald-500/20 bg-emerald-950/20 text-center space-y-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900/60 border border-emerald-500/25 mx-auto">
            <Award className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-emerald-200">
              {closedEarly ? 'Position Closed!' : 'Survived!'}
            </h1>
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-medium mt-1">
              Final Equity: {formatCurrency(finalEquity)} · +{closedEarly ? '0 XP (Closed Early)' : (!hasInteracted ? '0 XP (AFK)' : `${finalEquity >= INITIAL_CASH ? 50 : 20} XP`)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Starting Equity', value: formatCurrency(INITIAL_CASH), color: 'text-slate-300' },
              { label: 'Final Equity', value: formatCurrency(Math.max(0, finalEquity)), color: finalEquity >= INITIAL_CASH ? 'text-emerald-300' : 'text-red-300' },
              { label: 'P&L', value: `${finalEquity - INITIAL_CASH >= 0 ? '+' : ''}${formatCurrency(finalEquity - INITIAL_CASH)}`, color: finalEquity >= INITIAL_CASH ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Margin Added', value: formatCurrency(extraMargin), color: 'text-amber-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-surface-900/60 border border-white/[0.04] p-3">
                <p className={`font-mono font-bold text-sm ${color}`}>{value}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-surface-900/80 p-4 text-xs text-slate-300 text-left space-y-2">
            <p className="font-semibold text-emerald-300">Leverage Lesson:</p>
            <p>Leverage amplifies both gains and losses. A 10% move against a 2× position wipes 20% of your equity. Real traders monitor margin closely and set hard stop-loss levels to avoid forced liquidation.</p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={startGame} className="flex-1 rounded-xl border border-white/[0.08] bg-surface-800/60 py-3 text-sm font-medium text-slate-300 hover:text-white touch-manipulation min-h-[48px]">
              Play Again
            </button>
            <button type="button" onClick={onBack} className="flex-1 rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white hover:bg-orange-500 touch-manipulation min-h-[48px]">
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* DEFEAT */}
      {phase === 'defeat' && (
        <div className="glass rounded-xl p-5 sm:p-6 border border-red-500/20 bg-red-950/20 text-center space-y-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-900/60 border border-red-500/25 mx-auto">
            <ShieldAlert className="h-7 w-7 text-red-400" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-red-200">Margin Call!</h1>
            <p className="text-xs uppercase tracking-widest text-red-400 font-medium mt-1">
              Broker liquidated your position
            </p>
          </div>

          <div className="rounded-xl border border-red-500/10 bg-surface-900/80 p-4 text-xs text-slate-300 text-left space-y-2">
            <p className="font-semibold text-red-300">What happened?</p>
            <p>Your equity dropped below the 25% maintenance margin requirement. The broker automatically sold your position to recover the borrowed funds — leaving you with little or nothing.</p>
            <p className="text-thriv-300 font-medium">
              Pro Tip: Add margin early when it drops to 35%, not when it's already at 26%. The market can gap down faster than you can react.
            </p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={startGame} className="flex-1 rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white hover:bg-orange-500 touch-manipulation min-h-[48px]">
              Try Again
            </button>
            <button type="button" onClick={onBack} className="flex-1 rounded-xl border border-white/[0.08] bg-surface-800/60 py-3 text-sm font-medium text-slate-300 hover:text-white touch-manipulation min-h-[48px]">
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
