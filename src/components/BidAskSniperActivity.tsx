import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Target, CheckCircle2, XCircle, TrendingUp, TrendingDown, Flame } from 'lucide-react'
import { haptic } from '../lib/haptics'

interface BidAskSniperActivityProps {
  onBack: () => void
  onComplete: (xp: number) => void
  onAnswer?: (correct: boolean) => void
}

interface Round {
  symbol: string
  company: string
  bid: number
  ask: number
  question: 'buy' | 'sell'
  correct: 'bid' | 'ask'
}

interface SYMBOL_ITEM {
  symbol: string
  company: string
}

const SYMBOLS: SYMBOL_ITEM[] = [
  { symbol: 'AAPL', company: 'Apple Inc.' },
  { symbol: 'MSFT', company: 'Microsoft Corp.' },
  { symbol: 'GOOGL', company: 'Alphabet Inc.' },
  { symbol: 'TSLA', company: 'Tesla Inc.' },
  { symbol: 'NVDA', company: 'NVIDIA Corp.' },
  { symbol: 'META', company: 'Meta Platforms' },
  { symbol: 'AMZN', company: 'Amazon.com Inc.' },
  { symbol: 'JPM', company: 'JPMorgan Chase' },
  { symbol: 'NFLX', company: 'Netflix Inc.' },
  { symbol: 'BRK', company: 'Berkshire Hathaway' },
]

function generateRound(index: number): Round {
  const basePrice = 50 + Math.random() * 450
  // Spread widens with later rounds: $0.01 to $0.50
  const spreadTiers = [0.01, 0.02, 0.03, 0.05, 0.08, 0.12, 0.20, 0.30, 0.40, 0.50]
  const spread = spreadTiers[Math.min(index, spreadTiers.length - 1)]
  const bid = parseFloat(basePrice.toFixed(2))
  const ask = parseFloat((basePrice + spread).toFixed(2))
  const question: 'buy' | 'sell' = Math.random() < 0.5 ? 'buy' : 'sell'
  const correct: 'bid' | 'ask' = question === 'buy' ? 'ask' : 'bid'
  const stock = SYMBOLS[index % SYMBOLS.length]

  return { symbol: stock.symbol, company: stock.company, bid, ask, question, correct }
}

const TOTAL_ROUNDS = 10
const ROUND_SEC = 6
const XP_PER_CORRECT = 5

type Phase = 'ready' | 'playing' | 'result' | 'done'

export function BidAskSniperActivity({ onBack, onComplete, onAnswer }: BidAskSniperActivityProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [rounds, setRounds] = useState<Round[]>([])
  const [current, setCurrent] = useState(0)
  const [seconds, setSeconds] = useState(ROUND_SEC)
  const [selected, setSelected] = useState<'bid' | 'ask' | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)

  function startGame() {
    const newRounds = Array.from({ length: TOTAL_ROUNDS }, (_, i) => generateRound(i))
    setRounds(newRounds)
    setCurrent(0)
    setSeconds(ROUND_SEC)
    setSelected(null)
    setCorrectCount(0)
    setResults([])
    setStreak(0)
    setBestStreak(0)
    setPhase('playing')
    startRef.current = Date.now()
  }

  function advanceRound(wasCorrect: boolean) {
    haptic(wasCorrect ? 'success' : 'alert')
    if (onAnswer) {
      onAnswer(wasCorrect)
    }
    const next = current + 1
    const newResults = [...results, wasCorrect]
    const newCorrect = correctCount + (wasCorrect ? 1 : 0)
    const newStreak = wasCorrect ? streak + 1 : 0
    const newBest = Math.max(bestStreak, newStreak)

    setResults(newResults)
    setCorrectCount(newCorrect)
    setStreak(newStreak)
    setBestStreak(newBest)

    if (next >= TOTAL_ROUNDS) {
      setPhase('done')
      onComplete(newCorrect * XP_PER_CORRECT)
    } else {
      setTimeout(() => {
        setCurrent(next)
        setSeconds(ROUND_SEC)
        setSelected(null)
        setPhase('playing')
        startRef.current = Date.now()
      }, 1800)
    }
    setPhase('result')
  }

  function handlePick(choice: 'bid' | 'ask') {
    if (selected !== null) return
    setSelected(choice)
    if (timerRef.current) clearInterval(timerRef.current)
    const round = rounds[current]
    advanceRound(choice === round.correct)
  }

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const left = Math.max(0, ROUND_SEC - elapsed)
      setSeconds(left)
      if (left <= 0) {
        clearInterval(timerRef.current!)
        setSelected(null)
        advanceRound(false) // timeout = wrong
      }
    }, 100)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, current])

  const round = rounds[current]
  const xpEarned = correctCount * XP_PER_CORRECT
  const timerPct = (seconds / ROUND_SEC) * 100

  const spreadCost = round ? parseFloat((round.ask - round.bid).toFixed(2)) : 0
  const spreadPctOf1000 = round ? parseFloat(((spreadCost / round.bid) * 1000).toFixed(2)) : 0

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
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-900/60 border border-violet-500/25 mx-auto">
              <Target className="h-7 w-7 text-violet-400" strokeWidth={1.5} />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-4">Bid-Ask Sniper</h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-medium">Spread Mastery · 10 Rounds</p>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-surface-900/60 p-4 space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              Every stock has two prices: the <span className="text-emerald-400 font-semibold">Bid</span> (what buyers pay) and the <span className="text-red-400 font-semibold">Ask</span> (what sellers receive). The difference is the <span className="text-white font-semibold">spread</span> — a hidden transaction cost.
            </p>
            <p className="text-thriv-300 font-medium">
              Each round asks you to pick the correct price for the action. Spreads widen as rounds progress — making it trickier!
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-2.5 text-center">
                <p className="text-emerald-400 font-bold text-sm">BID</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Price you RECEIVE when selling</p>
              </div>
              <div className="rounded-lg bg-red-950/30 border border-red-500/20 p-2.5 text-center">
                <p className="text-red-400 font-bold text-sm">ASK</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Price you PAY when buying</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-surface-900/40 rounded-lg px-4 py-2.5 border border-white/[0.04]">
            <span>10 rounds · 6 sec each</span>
            <span className="text-thriv-400 font-semibold">Up to 50 XP</span>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white hover:bg-violet-500 active:bg-violet-700 touch-manipulation min-h-[48px]"
          >
            Start Sniping
          </button>
        </div>
      )}

      {/* PLAYING / RESULT */}
      {(phase === 'playing' || phase === 'result') && round && (
        <div className="glass rounded-xl border border-white/[0.06] bg-surface-800/80 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4">
            {/* Round header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Round {current + 1} / {TOTAL_ROUNDS}
              </span>
              <div className="flex items-center gap-2">
                {/* Round dots */}
                <div className="flex gap-1">
                  {results.map((r, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${r ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  ))}
                  {Array.from({ length: TOTAL_ROUNDS - results.length }).map((_, i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/10" />
                  ))}
                </div>
              </div>
            </div>

            {/* Timer bar */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-100 ${timerPct > 50 ? 'bg-violet-500' : timerPct > 25 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>

            {/* Stock card */}
            <div className="rounded-xl bg-surface-900/80 border border-white/[0.06] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-white text-lg">{round.symbol}</p>
                  <p className="text-xs text-slate-500">{round.company}</p>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">Spread</div>
                  <div className="font-mono text-sm font-bold text-amber-400">${spreadCost.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-3 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-emerald-600 font-semibold mb-1">Bid</p>
                  <p className="font-mono text-lg font-bold text-emerald-300">${round.bid.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-red-950/30 border border-red-500/20 p-3 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-red-600 font-semibold mb-1">Ask</p>
                  <p className="font-mono text-lg font-bold text-red-300">${round.ask.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="rounded-xl bg-violet-950/30 border border-violet-500/20 p-3 text-center">
              <p className="text-sm font-semibold text-white">
                {round.question === 'buy' ? (
                  <span className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    You want to <span className="text-emerald-300 mx-1">BUY</span> this stock. Which price do you pay?
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    You want to <span className="text-red-300 mx-1">SELL</span> this stock. Which price do you receive?
                  </span>
                )}
              </p>
            </div>

            {/* Answer buttons */}
            <div className="grid grid-cols-2 gap-3">
              {(['bid', 'ask'] as const).map((choice) => {
                const isCorrect = round.correct === choice
                const wasSelected = selected === choice
                let btnClass = 'border-white/10 bg-surface-900/60 text-slate-300 hover:border-violet-500/40 hover:bg-violet-950/20'

                if (selected !== null) {
                  if (wasSelected && isCorrect) btnClass = 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200'
                  else if (wasSelected && !isCorrect) btnClass = 'border-red-500/60 bg-red-950/30 text-red-200'
                  else if (!wasSelected && isCorrect) btnClass = 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                  else btnClass = 'border-white/5 bg-surface-900/30 text-slate-600'
                }

                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handlePick(choice)}
                    disabled={selected !== null}
                    className={`rounded-xl border py-3.5 font-bold text-sm transition-all touch-manipulation min-h-[48px] flex items-center justify-center gap-2 ${btnClass}`}
                  >
                    {selected !== null && wasSelected && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    {selected !== null && wasSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-400" />}
                    {choice === 'bid' ? 'BID' : 'ASK'}
                    <span className="text-xs font-normal opacity-70">
                      ${choice === 'bid' ? round.bid.toFixed(2) : round.ask.toFixed(2)}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Post-answer explainer */}
            {phase === 'result' && (
              <div className={`rounded-lg border p-3 text-xs leading-relaxed ${selected === round.correct ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200' : 'border-red-500/20 bg-red-950/20 text-red-200'}`}>
                {selected === round.correct ? (
                  <p className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-px" /><span><span className="font-semibold">Correct!</span> To {round.question}, you {round.question === 'buy' ? 'pay the Ask' : 'receive the Bid'}. The ${spreadCost.toFixed(2)} spread costs ${spreadPctOf1000.toFixed(2)} per $1,000 traded.</span></p>
                ) : (
                  <p className="flex items-start gap-1.5"><XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-px" /><span><span className="font-semibold">Wrong.</span> To {round.question}, you {round.question === 'buy' ? 'pay the Ask ($' + round.ask.toFixed(2) + ')' : 'receive the Bid ($' + round.bid.toFixed(2) + ')'}. Spread = ${spreadCost.toFixed(2)} hidden cost.</span></p>
                )}
              </div>
            )}

            {/* Score footer */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Score: <span className="text-white font-semibold">{correctCount}/{results.length}</span></span>
              {streak >= 2 && <span className="text-amber-400 font-semibold flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{streak} streak!</span>}
              <span className="text-thriv-400 font-semibold">{xpEarned} XP</span>
            </div>
          </div>
        </div>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="glass rounded-xl p-5 sm:p-6 border border-violet-500/20 bg-violet-950/20 text-center space-y-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-900/60 border border-violet-500/25 mx-auto">
            <Target className="h-7 w-7 text-violet-400" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-violet-200">Sniper Complete!</h1>
            <p className="text-xs uppercase tracking-widest text-violet-400 font-medium mt-1">
              {correctCount}/{TOTAL_ROUNDS} Correct · +{xpEarned} XP
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Correct', value: correctCount, color: 'text-emerald-300' },
              { label: 'Best Streak', value: bestStreak, color: 'text-amber-300' },
              { label: 'XP Earned', value: xpEarned, color: 'text-violet-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-surface-900/60 border border-white/[0.04] p-2.5">
                <p className={`font-mono font-bold text-sm ${color}`}>{value}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Round breakdown */}
          <div className="flex justify-center gap-1.5 flex-wrap">
            {results.map((r, i) => (
              <span key={i} className={`h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold ${r ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30' : 'bg-red-900/60 text-red-300 border border-red-500/30'}`}>
                {i + 1}
              </span>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-surface-900/80 p-4 text-xs text-slate-300 text-left space-y-2">
            <p className="font-semibold text-violet-300">Key Lesson:</p>
            <p>The bid-ask spread is a real cost paid on every trade. Wide spreads (illiquid stocks) can cost 0.5–2% per trade — eroding returns significantly over time. Always check spread before trading.</p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={startGame} className="flex-1 rounded-xl border border-white/[0.08] bg-surface-800/60 py-3 text-sm font-medium text-slate-300 hover:text-white touch-manipulation min-h-[48px]">
              Play Again
            </button>
            <button type="button" onClick={onBack} className="flex-1 rounded-xl bg-violet-600 py-3.5 text-sm font-semibold text-white hover:bg-violet-500 touch-manipulation min-h-[48px]">
              Back to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
