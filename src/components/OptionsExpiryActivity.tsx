import { useState, useEffect, useRef, useMemo } from 'react'
import { ArrowLeft, Award, XCircle, CheckCircle2, TrendingUp, TrendingDown, Zap, Flame } from 'lucide-react'
import { ActivityLiveChart, pricesToSeries } from './ActivityLiveChart'
import { haptic } from '../lib/haptics'
import type { PricePoint } from '../types'

interface OptionsExpiryActivityProps {
  onBack: () => void
  onComplete: (xp: number) => void
  onAnswer?: (correct: boolean) => void
}

type OptionType = 'call' | 'put'
type Moneyness = 'itm' | 'otm'

interface OptionRound {
  symbol: string
  type: OptionType
  strike: number
  startPrice: number
  priceAtExpiry: number
  correct: Moneyness
  volatility: number // price movement range per tick
}

const SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'META', 'GOOGL', 'AMZN', 'SPY']
const TOTAL_ROUNDS = 8
const ROUND_SEC = 10
const XP_PER_CORRECT = 8 // 8 × 8 = 64 XP max

function generateRound(index: number): OptionRound {
  const symbol = SYMBOLS[index % SYMBOLS.length]
  const type: OptionType = index % 2 === 0 ? 'call' : 'put'
  const basePrice = 80 + Math.random() * 200
  const strike = parseFloat(basePrice.toFixed(0))

  // Early rounds: large margin from strike (easy). Late rounds: tight margin (hard).
  const marginPct = index < 4 ? 0.04 + Math.random() * 0.04 : 0.005 + Math.random() * 0.015
  const volatility = index < 4 ? 0.5 + Math.random() * 0.5 : 1.0 + Math.random() * 1.5

  // Will the stock end ITM or OTM?
  const endsITM = Math.random() < 0.5
  const offset = strike * marginPct * (endsITM ? 1 : -1)
  const priceAtExpiry = parseFloat((strike + (type === 'call' ? offset : -offset)).toFixed(2))

  // Call ITM: price > strike | Call OTM: price < strike
  // Put  ITM: price < strike | Put  OTM: price > strike
  const correct: Moneyness =
    type === 'call'
      ? priceAtExpiry > strike ? 'itm' : 'otm'
      : priceAtExpiry < strike ? 'itm' : 'otm'

  const startOffset = (Math.random() - 0.5) * strike * 0.05
  const startPrice = parseFloat((strike + startOffset).toFixed(2))

  return { symbol, type, strike, startPrice, priceAtExpiry, correct, volatility }
}

type Phase = 'ready' | 'ticking' | 'result' | 'done'

const MAX_CHART_POINTS = 40

function appendPricePoint(series: PricePoint[], price: number): PricePoint[] {
  return [...series.slice(-(MAX_CHART_POINTS - 1)), { time: Date.now(), price }]
}

export function OptionsExpiryActivity({ onBack, onComplete, onAnswer }: OptionsExpiryActivityProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [rounds, setRounds] = useState<OptionRound[]>([])
  const [current, setCurrent] = useState(0)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [seconds, setSeconds] = useState(ROUND_SEC)
  const [selected, setSelected] = useState<Moneyness | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [priceSeries, setPriceSeries] = useState<PricePoint[]>([])

  const startRef = useRef(0)
  const currentPriceRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const priceRef2 = useRef<ReturnType<typeof setInterval> | null>(null)

  function startGame() {
    const newRounds = Array.from({ length: TOTAL_ROUNDS }, (_, i) => generateRound(i))
    setRounds(newRounds)
    setCurrent(0)
    setResults([])
    setCorrectCount(0)
    setStreak(0)
    setBestStreak(0)
    setSelected(null)
    launchRound(newRounds, 0, [], 0, 0, 0)
  }

  function launchRound(
    allRounds: OptionRound[],
    idx: number,
    prevResults: boolean[],
    prevCorrect: number,
    prevStreak: number,
    prevBest: number,
  ) {
    const round = allRounds[idx]
    setCurrentPrice(round.startPrice)
    currentPriceRef.current = round.startPrice

    // Prepopulate 14 historical points ending at round.startPrice
    const initialPrices: number[] = []
    let currP = round.startPrice
    const rangePct = idx < 4 ? 0.06 : 0.025
    const minLimit = round.strike * (1 - rangePct)
    const maxLimit = round.strike * (1 + rangePct)
    for (let i = 0; i < 14; i++) {
      const change = (Math.random() - 0.5) * round.volatility
      currP = Math.max(minLimit + 0.1, Math.min(maxLimit - 0.1, currP - change))
      initialPrices.unshift(parseFloat(currP.toFixed(2)))
    }
    initialPrices.push(round.startPrice)
    setPriceSeries(pricesToSeries(initialPrices, 500))
    setSeconds(ROUND_SEC)
    setSelected(null)
    setPhase('ticking')
    startRef.current = Date.now()

    // Price animation: drift from startPrice toward priceAtExpiry + noise
    let priceNow = round.startPrice
    const priceStep = (round.priceAtExpiry - round.startPrice) / (ROUND_SEC * 2) // per 500ms tick

    priceRef2.current = setInterval(() => {
      const noise = (Math.random() - 0.5) * round.volatility
      const minLimit = round.strike * 0.88
      const maxLimit = round.strike * 1.12
      priceNow = parseFloat(Math.max(minLimit, Math.min(maxLimit, priceNow + priceStep + noise)).toFixed(2))
      // Snap to final in last 0.5s
      currentPriceRef.current = priceNow
      setCurrentPrice(priceNow)
      setPriceSeries((h) => appendPricePoint(h, priceNow))
    }, 500)

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const left = Math.max(0, ROUND_SEC - elapsed)
      setSeconds(left)

      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        if (priceRef2.current) clearInterval(priceRef2.current)
        // Force price to exact expiry value
        const minLimit = round.strike * 0.88
        const maxLimit = round.strike * 1.12
        const finalPrice = Math.max(minLimit, Math.min(maxLimit, round.priceAtExpiry))
        setCurrentPrice(finalPrice)
        setPriceSeries((h) => appendPricePoint(h, finalPrice))
        // Time ran out = wrong
        resolveRound(allRounds, idx, null, prevResults, prevCorrect, prevStreak, prevBest)
      }
    }, 100)
  }

  function handleGuess(guess: Moneyness) {
    if (selected !== null || phase !== 'ticking') return
    if (timerRef.current) clearInterval(timerRef.current)
    if (priceRef2.current) clearInterval(priceRef2.current)
    // Snap to expiry price
    const round = rounds[current]
    setCurrentPrice(round.priceAtExpiry)
    setSelected(guess)
    resolveRound(rounds, current, guess, results, correctCount, streak, bestStreak)
  }

  function resolveRound(
    allRounds: OptionRound[],
    idx: number,
    guess: Moneyness | null,
    prevResults: boolean[],
    prevCorrect: number,
    prevStreak: number,
    prevBest: number,
  ) {
    const round = allRounds[idx]
    const wasCorrect = guess !== null && guess === round.correct
    haptic(wasCorrect ? 'success' : 'alert')

    if (onAnswer) {
      onAnswer(wasCorrect)
    }

    const newResults = [...prevResults, wasCorrect]
    const newCorrect = prevCorrect + (wasCorrect ? 1 : 0)
    const newStreak = wasCorrect ? prevStreak + 1 : 0
    const newBest = Math.max(prevBest, newStreak)

    setResults(newResults)
    setCorrectCount(newCorrect)
    setStreak(newStreak)
    setBestStreak(newBest)
    setPhase('result')

    const next = idx + 1
    if (next >= TOTAL_ROUNDS) {
      setTimeout(() => {
        haptic('success')
        setPhase('done')
        onComplete(newCorrect * XP_PER_CORRECT)
      }, 2200)
    } else {
      setTimeout(() => {
        setCurrent(next)
        launchRound(allRounds, next, newResults, newCorrect, newStreak, newBest)
      }, 2200)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (priceRef2.current) clearInterval(priceRef2.current)
    }
  }, [])

  const round = rounds[current]
  const timerPct = (seconds / ROUND_SEC) * 100
  const xpEarned = correctCount * XP_PER_CORRECT

  const chartUp = useMemo(() => {
    if (priceSeries.length < 2) return true
    return priceSeries[priceSeries.length - 1].price >= priceSeries[0].price
  }, [priceSeries])

  const isITM = round
    ? round.type === 'call'
      ? currentPrice > round.strike
      : currentPrice < round.strike
    : false

  const difficulty = (current: number) => current < 4 ? 'EASY' : 'HARD'

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
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-900/60 border border-indigo-500/25 mx-auto">
              <Zap className="h-7 w-7 text-indigo-400" strokeWidth={1.5} />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-4">Options Expiry</h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Options Basics · 8 Rounds</p>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-surface-900/60 p-4 space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              Watch the stock price tick toward expiry. Predict whether the option will expire <span className="text-emerald-400 font-semibold">In The Money (ITM)</span> or <span className="text-red-400 font-semibold">Out of The Money (OTM)</span>.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-3">
                <p className="text-emerald-400 font-bold text-xs mb-1">CALL option</p>
                <p className="text-[10px] text-slate-400">ITM → Price &gt; Strike<br />OTM → Price &lt; Strike</p>
              </div>
              <div className="rounded-lg bg-red-950/30 border border-red-500/20 p-3">
                <p className="text-red-400 font-bold text-xs mb-1">PUT option</p>
                <p className="text-[10px] text-slate-400">ITM → Price &lt; Strike<br />OTM → Price &gt; Strike</p>
              </div>
            </div>
            <p className="text-thriv-300 font-medium">
              Rounds 1-4 are easy (wide margin). Rounds 5-8 are tight — prices hover near the strike!
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-surface-900/40 rounded-lg px-4 py-2.5 border border-white/[0.04]">
            <span>8 rounds · 10 sec each · ITM/OTM</span>
            <span className="text-thriv-400 font-semibold">Up to 64 XP</span>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 touch-manipulation min-h-[48px]"
          >
            Start Countdown
          </button>
        </div>
      )}

      {/* TICKING / RESULT */}
      {(phase === 'ticking' || phase === 'result') && round && (
        <div className="glass rounded-xl border border-white/[0.06] bg-surface-800/80 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4">
            {/* Round + difficulty */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Round {current + 1} / {TOTAL_ROUNDS}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${current < 4 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' : 'text-red-400 border-red-500/30 bg-red-950/20'}`}>
                  {difficulty(current)}
                </span>
              </div>
              <div className="flex gap-1">
                {results.map((r, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${r ? 'bg-emerald-400' : 'bg-red-400'}`} />
                ))}
                {Array.from({ length: TOTAL_ROUNDS - results.length }).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/10" />
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${timerPct > 50 ? 'bg-indigo-500' : timerPct > 25 ? 'bg-amber-400' : 'bg-red-500'}`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-slate-400 tabular-nums w-10 text-right">{seconds.toFixed(1)}s</span>
            </div>

            {/* Option contract card */}
            <div className="rounded-xl bg-surface-900/80 border border-white/[0.06] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${round.type === 'call' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' : 'text-red-400 border-red-500/30 bg-red-950/20'}`}>
                    {round.symbol} {round.type.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">Strike: <span className="text-white font-mono font-semibold">${round.strike.toFixed(0)}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-600 uppercase tracking-widest">Live Price</p>
                  <p className="font-mono text-xl font-bold text-white">${currentPrice.toFixed(2)}</p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${currentPrice > round.strike ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currentPrice > round.strike
                      ? `+$${(currentPrice - round.strike).toFixed(2)} above strike`
                      : `-$${(round.strike - currentPrice).toFixed(2)} below strike`}
                  </p>
                </div>
              </div>

              <ActivityLiveChart
                data={priceSeries}
                up={chartUp}
                referencePrice={round.strike}
                className="border border-white/[0.04]"
              />

              {/* Current ITM/OTM indicator */}
              <div className={`flex items-center justify-center gap-2 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${isITM ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' : 'border-red-500/30 bg-red-950/20 text-red-300'}`}>
                {isITM ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                Currently {isITM ? 'ITM' : 'OTM'}
                <span className="text-slate-500 text-[10px] font-normal">
                  ({round.type === 'call'
                    ? currentPrice > round.strike ? 'price > strike' : 'price < strike'
                    : currentPrice < round.strike ? 'price < strike' : 'price > strike'})
                </span>
              </div>
            </div>

            {/* Guess buttons */}
            <p className="text-center text-xs text-slate-400 font-medium">At expiry, this {round.type} will expire…</p>
            <div className="grid grid-cols-2 gap-3">
              {(['itm', 'otm'] as Moneyness[]).map((choice) => {
                const isCorrect = round.correct === choice
                const wasSelected = selected === choice
                let btnClass = 'border-white/10 bg-surface-900/60 text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-950/20'

                if (selected !== null || phase === 'result') {
                  if (wasSelected && isCorrect) btnClass = 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200'
                  else if (wasSelected && !isCorrect) btnClass = 'border-red-500/60 bg-red-950/30 text-red-200'
                  else if (!wasSelected && isCorrect) btnClass = 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                  else btnClass = 'border-white/5 bg-surface-900/20 text-slate-600 opacity-50'
                }

                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleGuess(choice)}
                    disabled={selected !== null || phase === 'result'}
                    className={`rounded-xl border py-3.5 font-bold text-sm transition-all touch-manipulation min-h-[56px] flex flex-col items-center justify-center gap-0.5 ${btnClass}`}
                  >
                    {selected !== null && wasSelected && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    {selected !== null && wasSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-400" />}
                    <span>{choice === 'itm' ? 'In The Money' : 'Out of The Money'}</span>
                    <span className="text-[10px] font-normal opacity-60">{choice.toUpperCase()}</span>
                  </button>
                )
              })}
            </div>

            {/* Explainer after answer */}
            {phase === 'result' && (
              <div className={`rounded-lg border p-3 text-xs leading-relaxed ${selected === round.correct ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200' : 'border-red-500/20 bg-red-950/20 text-red-200'}`}>
                {round.type === 'call' ? (
                  <>
                    <span className="inline-flex items-center gap-1 font-semibold mr-1">{selected === round.correct ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}{selected === round.correct ? 'Correct!' : 'Wrong.'}</span>
                    A <strong>CALL</strong> is ITM when price &gt; strike. Price ended at ${round.priceAtExpiry.toFixed(2)} vs strike ${round.strike.toFixed(0)} →{' '}
                    <strong>{round.correct.toUpperCase()}</strong>.
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 font-semibold mr-1">{selected === round.correct ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}{selected === round.correct ? 'Correct!' : 'Wrong.'}</span>
                    A <strong>PUT</strong> is ITM when price &lt; strike. Price ended at ${round.priceAtExpiry.toFixed(2)} vs strike ${round.strike.toFixed(0)} →{' '}
                    <strong>{round.correct.toUpperCase()}</strong>.
                  </>
                )}
              </div>
            )}

            <div className="flex justify-between text-xs text-slate-500">
              <span>Score: <span className="text-white font-semibold">{correctCount}/{results.length}</span></span>
              {streak >= 2 && <span className="text-amber-400 font-semibold flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{streak} streak!</span>}
              <span className="text-thriv-400 font-semibold">{xpEarned} XP</span>
            </div>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="glass rounded-xl p-5 sm:p-6 border border-indigo-500/20 bg-indigo-950/20 text-center space-y-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-900/60 border border-indigo-500/25 mx-auto">
            <Award className="h-7 w-7 text-indigo-400" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-indigo-200">Options Round Complete!</h1>
            <p className="text-xs uppercase tracking-widest text-indigo-400 font-medium mt-1">
              {correctCount}/{TOTAL_ROUNDS} Correct · +{xpEarned} XP
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Correct', value: correctCount, color: 'text-emerald-300' },
              { label: 'Best Streak', value: bestStreak, color: 'text-amber-300' },
              { label: 'XP Earned', value: xpEarned, color: 'text-indigo-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-surface-900/60 border border-white/[0.04] p-2.5">
                <p className={`font-mono font-bold text-sm ${color}`}>{value}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-1.5 flex-wrap">
            {results.map((r, i) => (
              <span key={i} className={`h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold ${r ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30' : 'bg-red-900/60 text-red-300 border border-red-500/30'}`}>
                {i + 1}
              </span>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-surface-900/80 p-4 text-xs text-slate-300 text-left space-y-2">
            <p className="font-semibold text-indigo-300">Options Lesson:</p>
            <p>Calls profit when the stock rises above the strike. Puts profit when it falls below. At expiry, only ITM options have intrinsic value — OTM options expire worthless, and the buyer loses their entire premium.</p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={startGame} className="flex-1 rounded-xl border border-white/[0.08] bg-surface-800/60 py-3 text-sm font-medium text-slate-300 hover:text-white touch-manipulation min-h-[48px]">
              Play Again
            </button>
            <button type="button" onClick={onBack} className="flex-1 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 touch-manipulation min-h-[48px]">
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
