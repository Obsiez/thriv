import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Shield, Wallet, ShieldAlert, Award, AlertTriangle, TrendingDown, Zap } from 'lucide-react'
import { formatCurrency } from '../lib/marketEngine'
import { haptic } from '../lib/haptics'

interface OrderBookCombatActivityProps {
  onBack: () => void
  onComplete: (xp: number) => void
}

interface BidLevel {
  price: number
  retailDepth: number
  playerLimit: number
}

interface AskLevel {
  price: number
  retailDepth: number
}

interface TradeEntry {
  id: number
  volume: number
  price: number
}

type Phase = 'ready' | 'live' | 'wave-transition' | 'victory' | 'defeat'

const WAVE_SEC = 15
const SUPPORT_PRICE = 99.10

const WAVE_CONFIGS = [
  {
    label: 'Wave 1',
    subtitle: 'Opening Salvo',
    difficulty: 'EASY',
    sellMin: 150,
    sellMax: 450,
    interval: 900,
    megaSpike: false,
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-950/20',
    barClass: 'bg-emerald-500',
    tip: 'Lay your first buy walls early — stacking depth on several levels spreads risk and absorbs more sell pressure.',
  },
  {
    label: 'Wave 2',
    subtitle: 'Escalating Pressure',
    difficulty: 'MEDIUM',
    sellMin: 300,
    sellMax: 700,
    interval: 650,
    megaSpike: false,
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-950/20',
    barClass: 'bg-amber-400',
    tip: 'Sellers are hitting harder. Prioritize levels near the top bid to prevent rapid price collapse.',
  },
  {
    label: 'Wave 3',
    subtitle: 'Final Assault',
    difficulty: 'HARD',
    sellMin: 500,
    sellMax: 1000,
    interval: 450,
    megaSpike: true,
    colorClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    bgClass: 'bg-red-950/20',
    barClass: 'bg-red-500',
    tip: 'Watch for MEGA SPIKE warnings — a 3× sell burst is about to hit. Keep reserves to respond quickly!',
  },
]

function makeBids(): BidLevel[] {
  return [
    { price: 99.90, retailDepth: 400, playerLimit: 0 },
    { price: 99.80, retailDepth: 600, playerLimit: 0 },
    { price: 99.70, retailDepth: 800, playerLimit: 0 },
    { price: 99.60, retailDepth: 1200, playerLimit: 0 },
    { price: 99.50, retailDepth: 1500, playerLimit: 0 },
    { price: 99.40, retailDepth: 2000, playerLimit: 0 },
    { price: 99.30, retailDepth: 2500, playerLimit: 0 },
    { price: 99.20, retailDepth: 3000, playerLimit: 0 },
    { price: 99.10, retailDepth: 3500, playerLimit: 0 },
  ]
}

function makeAsks(): AskLevel[] {
  return [
    { price: 100.50, retailDepth: 1200 },
    { price: 100.40, retailDepth: 800 },
    { price: 100.30, retailDepth: 1500 },
    { price: 100.20, retailDepth: 600 },
    { price: 100.10, retailDepth: 400 },
  ]
}

export function OrderBookCombatActivity({ onBack, onComplete }: OrderBookCombatActivityProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [wave, setWave] = useState(0)
  const [seconds, setSeconds] = useState(WAVE_SEC)
  const [cash, setCash] = useState(50000)
  const [bids, setBids] = useState<BidLevel[]>(makeBids())
  const asks = makeAsks()
  const [tradeFeed, setTradeFeed] = useState<TradeEntry[]>([])
  const [pressureLevel, setPressureLevel] = useState(0)
  const [lastMsg, setLastMsg] = useState<string | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [megaSpikeWarning, setMegaSpikeWarning] = useState(false)
  const [wallsPlaced, setWallsPlaced] = useState(0)
  const [cashSpent, setCashSpent] = useState(0)
  const [wavesCompleted, setWavesCompleted] = useState(0)
  const [defenseCount, setDefenseCount] = useState(0)
  const [transitionCountdown, setTransitionCountdown] = useState(3)

  const tradeIdRef = useRef(0)
  const startRef = useRef(0)
  const recentPressureRef = useRef<number[]>([])
  const phaseRef = useRef<Phase>('ready')
  const megaSpikeActiveRef = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { megaSpikeActiveRef.current = megaSpikeWarning }, [megaSpikeWarning])

  // Core game loop
  useEffect(() => {
    if (phase !== 'live') return
    const config = WAVE_CONFIGS[wave]
    startRef.current = Date.now()

    const timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const left = Math.max(0, WAVE_SEC - elapsed)
      setSeconds(left)
      if (left <= 0) {
        haptic('success')
        clearInterval(timerInterval)
        clearInterval(sellerInterval)
        if (megaSpikeTimerRef) clearTimeout(megaSpikeTimerRef)
        const completed = wave + 1
        setWavesCompleted(completed)
        if (completed >= 3) {
          setPhase('victory')
          onComplete(80)
        } else {
          setPhase('wave-transition')
          setTransitionCountdown(3)
        }
      }
    }, 100)

    // Mega-spike scheduler (wave 3 only)
    let megaSpikeTimerRef: ReturnType<typeof setTimeout> | null = null
    if (config.megaSpike) {
      const scheduleSpike = () => {
        const delay = 3500 + Math.random() * 4000
        megaSpikeTimerRef = setTimeout(() => {
          if (phaseRef.current !== 'live') return
          haptic('alert')
          setMegaSpikeWarning(true)
          setTimeout(() => setMegaSpikeWarning(false), 2000)
          scheduleSpike()
        }, delay)
      }
      scheduleSpike()
    }

    const sellerInterval = setInterval(() => {
      let sellVolume = Math.floor(Math.random() * (config.sellMax - config.sellMin)) + config.sellMin
      if (config.megaSpike && megaSpikeActiveRef.current && Math.random() < 0.4) {
        sellVolume = Math.floor(sellVolume * 3)
      }

      // Update pressure gauge
      recentPressureRef.current = [...recentPressureRef.current.slice(-4), sellVolume]
      const avg = recentPressureRef.current.reduce((a, b) => a + b, 0) / recentPressureRef.current.length
      setPressureLevel(Math.min(100, Math.round((avg / config.sellMax) * 100)))

      setBids((prevBids) => {
        let remaining = sellVolume
        const nextBids = prevBids.map((b) => ({ ...b }))

        // Add to live trade feed using top-bid price
        const topBid = nextBids.find((b) => b.retailDepth + b.playerLimit > 0)
        if (topBid) {
          const entry: TradeEntry = { id: ++tradeIdRef.current, volume: sellVolume, price: topBid.price }
          setTradeFeed((prev) => [entry, ...prev].slice(0, 5))
        }

        for (let i = 0; i < nextBids.length; i++) {
          if (remaining <= 0) break
          const level = nextBids[i]
          const totalVol = level.retailDepth + level.playerLimit
          if (totalVol <= 0) continue

          const hitSize = Math.min(remaining, totalVol)
          remaining -= hitSize

          // Player orders absorb first
          if (level.playerLimit > 0) {
            const playerHit = Math.min(hitSize, level.playerLimit)
            level.playerLimit -= playerHit
            if (playerHit > 0) {
              setDefenseCount((c) => c + 1)
              setLastMsg(`DEFENDED — ${playerHit} shares absorbed @ $${level.price.toFixed(2)}`)
              setTimeout(() => setLastMsg((m) => (m?.startsWith('DEFENDED') ? null : m)), 1500)
            }
          }

          // Retail depth absorbs the rest
          const afterPlayer = hitSize - Math.max(0, Math.min(hitSize, prevBids[i].playerLimit))
          level.retailDepth = Math.max(0, level.retailDepth - afterPlayer)

          // Shake when a level collapses
          if (prevBids[i].retailDepth + prevBids[i].playerLimit > 0 && level.retailDepth + level.playerLimit <= 0) {
            haptic('alert')
            setIsShaking(true)
            setTimeout(() => setIsShaking(false), 420)
          }
        }

        // Defeat check
        const highestActive = nextBids.find((b) => b.retailDepth + b.playerLimit > 0)
        if (!highestActive || highestActive.price <= SUPPORT_PRICE) {
          haptic('alert')
          clearInterval(timerInterval)
          clearInterval(sellerInterval)
          if (megaSpikeTimerRef) clearTimeout(megaSpikeTimerRef)
          setPhase('defeat')
        }

        return nextBids
      })
    }, config.interval)

    return () => {
      clearInterval(timerInterval)
      clearInterval(sellerInterval)
      if (megaSpikeTimerRef) clearTimeout(megaSpikeTimerRef)
    }
  }, [phase, wave, onComplete])

  // Auto-advance transition countdown
  useEffect(() => {
    if (phase !== 'wave-transition') return
    const t = setInterval(() => {
      setTransitionCountdown((c) => {
        if (c <= 1) {
          clearInterval(t)
          setWave((w) => w + 1)
          setBids(makeBids())
          setCash((prev) => Math.max(prev, 10000)) // partial refund as bonus for surviving
          setSeconds(WAVE_SEC)
          recentPressureRef.current = []
          setPressureLevel(0)
          setTradeFeed([])
          setLastMsg(null)
          setMegaSpikeWarning(false)
          setPhase('live')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase])

  function startCombat() {
    setWave(0)
    setSeconds(WAVE_SEC)
    setCash(50000)
    setWallsPlaced(0)
    setCashSpent(0)
    setWavesCompleted(0)
    setDefenseCount(0)
    setBids(makeBids())
    setTradeFeed([])
    setLastMsg(null)
    setPressureLevel(0)
    setMegaSpikeWarning(false)
    recentPressureRef.current = []
    setPhase('live')
  }

  function placeLimitBuy(price: number, idx: number) {
    if (phase !== 'live') return
    const orderCost = Math.round(price * 150)
    if (cash < orderCost) {
      haptic('alert')
      setLastMsg('OUT OF CASH — deploy more carefully!')
      setTimeout(() => setLastMsg((m) => (m?.startsWith('OUT OF CASH') ? null : m)), 1800)
      return
    }
    haptic('success')
    setCash((c) => c - orderCost)
    setCashSpent((s) => s + orderCost)
    setWallsPlaced((w) => w + 1)
    setBids((prev) => prev.map((b, i) => (i === idx ? { ...b, playerLimit: b.playerLimit + 150 } : b)))
  }

  const activeBid = bids.find((b) => b.retailDepth + b.playerLimit > 0)
  const currentPrice = activeBid ? activeBid.price : 99.0
  const totalAskDepth = asks.reduce((acc, a) => acc + a.retailDepth, 0)
  const totalBidDepth = bids.reduce((acc, b) => acc + b.retailDepth + b.playerLimit, 0)
  const bidDominance = Math.min(90, Math.max(10, Math.round((totalBidDepth / (totalAskDepth + totalBidDepth)) * 100)))
  const timerPct = (seconds / WAVE_SEC) * 100
  const timerColor = timerPct > 60 ? 'text-emerald-400' : timerPct > 30 ? 'text-amber-400' : 'text-red-400 animate-pulse'
  const config = WAVE_CONFIGS[wave] ?? WAVE_CONFIGS[0]

  const pressureColor =
    pressureLevel < 40 ? 'bg-emerald-500' : pressureLevel < 70 ? 'bg-amber-400' : 'bg-red-500'
  const spread = (asks[asks.length - 1].price - (activeBid?.price ?? 99.9)).toFixed(2)

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px] transition-colors hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* ── READY ─────────────────────────────────────── */}
      {phase === 'ready' && (
        <div className="glass rounded-xl p-5 sm:p-6 border border-white/[0.06] bg-surface-800/80 space-y-6">
          <div className="text-center space-y-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-thriv-900/60 border border-thriv-500/25 mx-auto">
              <Shield className="h-7 w-7 text-thriv-400" strokeWidth={1.5} />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-4">Order Book Combat</h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Microstructure Training · 3 Waves</p>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-surface-900/60 p-4 space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              An algorithmic institutional seller is dumping massive blocks of <span className="text-white font-semibold">AAPL</span>. If the bid stack collapses below <span className="text-red-400 font-semibold">$99.10</span>, a market-wide cascade begins.
            </p>
            <p>
              You have <span className="text-emerald-400 font-semibold">$50,000</span> in virtual dry powder and must survive <span className="text-thriv-300 font-semibold">3 escalating waves</span> of sell pressure.
            </p>
            <p className="font-medium text-thriv-300">
              Tap any green BID level to deploy a 150-share limit buy wall. Defend the $99.10 support for all 3 waves!
            </p>
          </div>

          {/* Wave preview */}
          <div className="grid grid-cols-3 gap-2">
            {WAVE_CONFIGS.map((w, i) => (
              <div key={i} className={`rounded-lg border ${w.borderClass} ${w.bgClass} p-2.5 text-center`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${w.colorClass}`}>{w.label}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{w.difficulty}</p>
                <p className="text-[9px] text-slate-600 mt-1">{w.subtitle}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startCombat}
            className="w-full rounded-xl bg-thriv-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-thriv-500 active:bg-thriv-700 touch-manipulation min-h-[48px]"
          >
            Begin Defense
          </button>
        </div>
      )}

      {/* ── LIVE ─────────────────────────────────────── */}
      {phase === 'live' && (
        <div className={`glass rounded-xl border border-white/[0.06] bg-surface-800/80 overflow-hidden relative ${isShaking ? 'loss-shake' : ''}`}>
          {/* Mega-spike overlay */}
          {megaSpikeWarning && (
            <div className="absolute inset-0 z-20 pointer-events-none rounded-xl border-2 border-red-500/60 flex items-start justify-center pt-3">
              <div className="bg-red-950/95 border border-red-500/50 rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-bounce" />
                <span className="text-[11px] font-bold text-red-300 uppercase tracking-widest">MEGA SPIKE INCOMING</span>
                <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-bounce" />
              </div>
            </div>
          )}

          <div className="p-4 sm:p-5 space-y-3">
            {/* Wave badge + timer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.borderClass} ${config.bgClass} ${config.colorClass}`}>
                  {config.label} · {config.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${timerPct > 60 ? 'bg-emerald-500' : timerPct > 30 ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
                <span className={`font-mono text-sm font-bold ${timerColor} tabular-nums`}>{seconds.toFixed(1)}s</span>
              </div>
            </div>

            {/* Price / Cash / Pressure row */}
            <div className="grid grid-cols-3 gap-2 bg-surface-900/60 rounded-xl p-3 border border-white/[0.04]">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold block">Price</span>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-mono text-sm font-bold text-white">${currentPrice.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold block">Cash</span>
                <div className="flex items-center gap-1 text-emerald-400">
                  <Wallet className="h-3 w-3 shrink-0" />
                  <span className="font-mono text-sm font-bold">{formatCurrency(cash)}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold block">Pressure</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.04]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pressureColor}`}
                      style={{ width: `${pressureLevel}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold font-mono tabular-nums ${pressureLevel > 70 ? 'text-red-400' : pressureLevel > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {pressureLevel}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bid dominance bar */}
            <div>
              <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                <span>Ask {100 - bidDominance}%</span>
                <span>Bid {bidDominance}%</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden flex">
                <div className="bg-red-500/40 h-full transition-all duration-300" style={{ width: `${100 - bidDominance}%` }} />
                <div className="bg-emerald-500/40 h-full transition-all duration-300" style={{ width: `${bidDominance}%` }} />
              </div>
            </div>

            {/* Live trade feed + defense message row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Trade feed */}
              <div className="bg-surface-900/80 rounded-lg border border-white/[0.04] p-2 h-[88px] overflow-hidden">
                <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-600 mb-1.5 flex items-center gap-1">
                  <TrendingDown className="h-2.5 w-2.5 text-red-500" /> Live Sell Feed
                </p>
                <div className="space-y-0.5">
                  {tradeFeed.map((t, i) => (
                    <div
                      key={t.id}
                      className="flex justify-between text-[9px] font-mono"
                      style={{ opacity: 1 - i * 0.18 }}
                    >
                      <span className="text-red-400">SELL {t.volume}</span>
                      <span className="text-slate-500">@ ${t.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {tradeFeed.length === 0 && (
                    <p className="text-[9px] text-slate-700 font-mono">Waiting...</p>
                  )}
                </div>
              </div>

              {/* Status / defense alert */}
              <div className="bg-surface-900/80 rounded-lg border border-white/[0.04] p-2 h-[88px] flex flex-col justify-between">
                <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-600 flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5 text-thriv-500" /> Defense Status
                </p>
                <div>
                  {lastMsg ? (
                    <p className={`text-[10px] font-semibold leading-snug flex items-center gap-1 ${lastMsg.startsWith('DEFENDED') ? 'text-thriv-300' : 'text-red-300'}`}>
                      {lastMsg.startsWith('DEFENDED') ? <Shield className="h-3 w-3 shrink-0" /> : <Wallet className="h-3 w-3 shrink-0" />}
                      {lastMsg}
                    </p>
                  ) : (
                    <p className="text-[9px] text-slate-600 font-mono">Monitoring...</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-slate-500">
                  <span>Walls: <span className="text-thriv-400 font-bold">{wallsPlaced}</span></span>
                  <span>Spread: <span className="text-slate-400">${spread}</span></span>
                </div>
              </div>
            </div>

            {/* Order book */}
            <div className="space-y-0.5">
              <div className="grid grid-cols-3 text-[9px] font-semibold uppercase tracking-wider text-slate-600 px-3 pb-1 border-b border-white/[0.04]">
                <span>Side</span>
                <span className="text-right">Price</span>
                <span className="text-right">Depth (shares)</span>
              </div>

              {/* Asks */}
              <div className="space-y-0.5 opacity-55">
                {asks.slice().reverse().map((ask) => (
                  <div key={ask.price} className="grid grid-cols-3 text-xs font-mono py-1 px-3 bg-red-950/5 border border-red-500/5 rounded">
                    <span className="text-red-400 font-semibold">ASK</span>
                    <span className="text-right text-slate-400">${ask.price.toFixed(2)}</span>
                    <span className="text-right text-slate-500">{ask.retailDepth}</span>
                  </div>
                ))}
              </div>

              {/* Spread divider */}
              <div className="text-center py-0.5 bg-surface-900/60 rounded border border-white/[0.04] text-[9px] font-semibold text-slate-600 uppercase tracking-widest">
                Spread ${spread}
              </div>

              {/* Bids */}
              <div className="space-y-0.5">
                {bids.map((bid, i) => {
                  const isSupportLevel = bid.price <= SUPPORT_PRICE
                  const isDefended = bid.playerLimit > 0
                  const totalVolume = bid.retailDepth + bid.playerLimit
                  const depthPct = Math.min(100, (totalVolume / 4000) * 100)
                  const isLow = totalVolume > 0 && totalVolume < 300

                  const borderCls = isDefended
                    ? 'border-thriv-500/50 bg-thriv-950/20'
                    : isSupportLevel
                    ? 'border-red-500/20 bg-red-950/10'
                    : isLow
                    ? 'border-amber-500/20 bg-amber-950/5'
                    : 'border-emerald-500/5 bg-emerald-950/5'
                  const textCls = isDefended ? 'text-thriv-300' : isSupportLevel ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'

                  return (
                    <button
                      key={bid.price}
                      type="button"
                      onClick={() => placeLimitBuy(bid.price, i)}
                      disabled={totalVolume <= 0}
                      className={`w-full grid grid-cols-3 text-xs font-mono py-1.5 px-3 border rounded text-left transition-all relative overflow-hidden touch-manipulation hover:border-thriv-500/40 hover:bg-thriv-950/10 active:scale-[0.99] disabled:opacity-15 disabled:pointer-events-none ${borderCls}`}
                    >
                      {/* Depth fill */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-500 ${isDefended ? 'bg-thriv-500/10' : 'bg-emerald-500/5'}`}
                        style={{ width: `${depthPct}%` }}
                      />
                      <span className={`font-semibold z-10 flex items-center gap-1 ${textCls}`}>
                        BID {isDefended && <Shield className="h-2.5 w-2.5 animate-pulse" />}
                        {isLow && !isDefended && <span className="text-amber-500 text-[8px]">!</span>}
                      </span>
                      <span className="text-right z-10 text-slate-300">${bid.price.toFixed(2)}</span>
                      <span className="text-right z-10 font-bold text-slate-300">
                        {totalVolume}
                        {isDefended && <span className="text-thriv-400 font-medium ml-1">+{bid.playerLimit}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="text-[10px] text-slate-600 text-center font-mono">
              TAP BID LEVEL TO BUY 150-SHARE WALL · HOLD $99.10 SUPPORT
            </div>
          </div>
        </div>
      )}

      {/* ── WAVE TRANSITION ──────────────────────────── */}
      {phase === 'wave-transition' && (
        <div className={`glass rounded-xl p-6 border ${WAVE_CONFIGS[wave].borderClass} ${WAVE_CONFIGS[wave].bgClass} text-center space-y-5`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900/60 border border-emerald-500/25 mx-auto">
            <Zap className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-emerald-200">Wave {wave + 1} Survived!</h2>
            <p className={`text-xs uppercase tracking-widest font-medium mt-1 ${WAVE_CONFIGS[wave + 1]?.colorClass ?? 'text-slate-400'}`}>
              {WAVE_CONFIGS[wave + 1]?.label ?? 'Final Wave'} starts in {transitionCountdown}s
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.04] bg-surface-900/60 p-3 text-xs text-slate-300 text-left">
            <p className="font-semibold text-emerald-300 mb-1">Tip for {WAVE_CONFIGS[wave + 1]?.label}:</p>
            <p className="leading-relaxed">{WAVE_CONFIGS[wave + 1]?.tip}</p>
          </div>
          <div className="flex gap-2">
            {/* Countdown progress bar */}
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden self-center">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${((3 - transitionCountdown) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── VICTORY ─────────────────────────────────── */}
      {phase === 'victory' && (
        <div className="glass rounded-xl p-5 sm:p-6 border border-emerald-500/20 bg-emerald-950/20 text-center space-y-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-900/60 border border-emerald-500/25 mx-auto">
            <Award className="h-7 w-7 text-emerald-400" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-emerald-200">All Waves Defended!</h1>
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-medium mt-1">Victory · +80 XP Awarded</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Walls Placed', value: wallsPlaced, color: 'text-thriv-300' },
              { label: 'Cash Deployed', value: formatCurrency(cashSpent), color: 'text-amber-300' },
              { label: 'Defenses', value: defenseCount, color: 'text-emerald-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-surface-900/60 border border-white/[0.04] p-2.5">
                <p className={`font-mono font-bold text-sm ${color}`}>{value}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-emerald-500/10 bg-surface-900/80 p-4 space-y-2 text-xs leading-relaxed text-slate-300 text-left">
            <p className="font-semibold text-emerald-300">Microstructure Takeaway:</p>
            <p>
              You learned how <span className="text-white font-semibold">limit buy orders create "buy walls"</span> — committed buyers at fixed prices that force sellers to exhaust your depth before pushing the price lower.
            </p>
            <p>
              Real market makers and institutional desks use this exact strategy to defend key support levels and maintain price stability. Your walls provided the liquidity the book needed.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={startCombat}
              className="flex-1 rounded-xl border border-white/[0.08] bg-surface-800/60 py-3 text-sm font-medium text-slate-300 hover:text-white touch-manipulation min-h-[48px]"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-xl bg-thriv-600 py-3.5 text-sm font-semibold text-white hover:bg-thriv-500 touch-manipulation min-h-[48px]"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* ── DEFEAT ─────────────────────────────────── */}
      {phase === 'defeat' && (
        <div className="glass rounded-xl p-5 sm:p-6 border border-red-500/20 bg-red-950/20 text-center space-y-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-900/60 border border-red-500/25 mx-auto">
            <ShieldAlert className="h-7 w-7 text-red-400" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-red-200">Support Collapsed</h1>
            <p className="text-xs uppercase tracking-widest text-red-400 font-medium mt-1">
              Bids fell below $99.10 in {config.label}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Waves Done', value: `${wavesCompleted}/3`, color: 'text-amber-300' },
              { label: 'Walls Placed', value: wallsPlaced, color: 'text-thriv-300' },
              { label: 'Defenses', value: defenseCount, color: 'text-slate-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-surface-900/60 border border-white/[0.04] p-2.5">
                <p className={`font-mono font-bold text-sm ${color}`}>{value}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-red-500/10 bg-surface-900/80 p-4 space-y-2 text-xs leading-relaxed text-slate-300 text-left">
            <p className="font-semibold text-red-300">Why did support break?</p>
            <p>
              The total sell volume exceeded available bid depth. In real microstructure, when sellers exhaust all bids at a price level, the market's best bid instantly drops to the next available level — triggering cascading stops.
            </p>
            <p className="text-thriv-300 font-medium">
              Pro Tip: {WAVE_CONFIGS[Math.min(wavesCompleted, 2)].tip}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={startCombat}
              className="flex-1 rounded-xl bg-thriv-600 py-3.5 text-sm font-semibold text-white hover:bg-thriv-500 touch-manipulation min-h-[48px]"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-xl border border-white/[0.08] bg-surface-800/60 py-3 text-sm font-medium text-slate-300 hover:text-white touch-manipulation min-h-[48px]"
            >
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
