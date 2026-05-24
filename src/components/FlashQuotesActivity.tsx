import { useMemo, useState } from 'react'
import { ArrowLeft, Gauge, Zap } from 'lucide-react'
import { formatCurrency } from '../lib/marketEngine'
import type { Stock } from '../types'

interface FlashQuotesActivityProps {
  stocks: Stock[]
  onBack: () => void
  onComplete: (correct: number, total: number) => void
}

const ROUNDS = 8

function pickPair(stocks: Stock[], round: number): [Stock, Stock] {
  const a = stocks[(round * 3) % stocks.length]
  let b = stocks[(round * 5 + 2) % stocks.length]
  if (b.symbol === a.symbol) b = stocks[(round + 1) % stocks.length]
  return [a, b]
}

export function FlashQuotesActivity({ stocks, onBack, onComplete }: FlashQuotesActivityProps) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const pair = useMemo(() => pickPair(stocks, round), [stocks, round])
  const [left, right] = pair
  const higher = left.price >= right.price ? left.symbol : right.symbol

  function choose(symbol: string) {
    if (picked || done) return
    setPicked(symbol)
    const wasCorrect = symbol === higher
    setTimeout(() => {
      setScore((prev) => {
        const nextScore = prev + (wasCorrect ? 1 : 0)
        if (round + 1 >= ROUNDS) {
          setDone(true)
          onComplete(nextScore, ROUNDS)
          return nextScore
        }
        setRound((r) => r + 1)
        setPicked(null)
        return nextScore
      })
    }, 650)
  }

  if (done) {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="glass rounded-xl p-6 text-center border border-thriv-600/20">
          <Gauge className="h-10 w-10 text-thriv-400 mx-auto mb-3" strokeWidth={1.5} />
          <p className="font-display text-xl font-semibold">Session complete</p>
          <p className="font-mono text-3xl font-bold text-thriv-300 mt-2 tabular-nums">
            {score}/{ROUNDS}
          </p>
          <p className="text-sm text-slate-500 mt-2">Higher-price calls in under a second each.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          Flash Quotes
        </span>
        <span>
          Round {round + 1}/{ROUNDS} · Score {score}
        </span>
      </div>

      <p className="text-center text-sm text-slate-300">Which symbol is trading higher right now?</p>

      <div className="grid grid-cols-2 gap-3">
        {[left, right].map((s) => {
          const isPick = picked === s.symbol
          const showResult = !!picked
          const isHigher = s.symbol === higher
          let ring = 'border-white/[0.08] hover:border-thriv-600/40'
          if (showResult && isPick) {
            ring = isHigher ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10'
          } else if (showResult && isHigher) {
            ring = 'border-emerald-500/40'
          }
          return (
            <button
              key={s.symbol}
              type="button"
              disabled={!!picked}
              onClick={() => choose(s.symbol)}
              className={`glass rounded-xl border p-4 text-left transition-colors touch-manipulation min-h-[120px] ${ring}`}
            >
              <p className="font-mono text-lg font-bold text-thriv-300">{s.symbol}</p>
              <p className="text-[10px] text-slate-500 truncate">{s.name}</p>
              <p className="font-mono text-2xl font-semibold mt-3 tabular-nums">{formatCurrency(s.price)}</p>
              <p className="text-[10px] text-slate-600 mt-1">{s.sector}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
