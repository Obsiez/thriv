import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Crosshair, TrendingDown } from 'lucide-react'
import { formatCurrency } from '../lib/marketEngine'
import type { Stock } from '../types'
import { haptic } from '../lib/haptics'

interface PredictorActivityProps {
  stock: Stock
  stocks: Stock[]
  onBack: () => void
  onResult: (won: boolean) => void
}

const ROUND_SEC = 15

export function PredictorActivity({ stock, stocks, onBack, onResult }: PredictorActivityProps) {
  const [symbol, setSymbol] = useState(stock.symbol)
  const [phase, setPhase] = useState<'ready' | 'live' | 'result'>('ready')
  const [startPrice, setStartPrice] = useState(0)
  const [endPrice, setEndPrice] = useState(0)
  const [guess, setGuess] = useState<'up' | 'down' | null>(null)
  const [seconds, setSeconds] = useState(ROUND_SEC)
  const startRef = useRef(0)

  const current = stocks.find((s) => s.symbol === symbol) ?? stock

  useEffect(() => {
    if (phase !== 'live') return
    const t = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000
      const left = Math.max(0, ROUND_SEC - elapsed)
      setSeconds(Math.ceil(left))
      if (left <= 0) {
        const s = stocks.find((x) => x.symbol === symbol)
        if (s) {
          setEndPrice(s.price)
          setPhase('result')
          if (guess) {
            const up = s.price > startPrice
            const won = (guess === 'up' && up) || (guess === 'down' && !up)
            haptic(won ? 'success' : 'alert')
            onResult(won)
          }
        }
        clearInterval(t)
      }
    }, 200)
    return () => clearInterval(t)
  }, [phase, guess, symbol, stocks, startPrice, onResult])

  function start(g: 'up' | 'down') {
    setGuess(g)
    setStartPrice(current.price)
    startRef.current = Date.now()
    setPhase('live')
    setSeconds(ROUND_SEC)
  }

  const won =
    guess &&
    phase === 'result' &&
    ((guess === 'up' && endPrice > startPrice) || (guess === 'down' && endPrice < startPrice))

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="glass rounded-xl p-4 sm:p-6 text-center">
        <select
          value={symbol}
          onChange={(e) => {
            setSymbol(e.target.value)
            setPhase('ready')
            setGuess(null)
          }}
          className="mb-4 rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm font-mono w-full max-w-[200px]"
          disabled={phase === 'live'}
        >
          {stocks.slice(0, 10).map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol}
            </option>
          ))}
        </select>

        <p className="font-mono text-3xl font-bold">{formatCurrency(current.price)}</p>

        {phase === 'ready' && (
          <>
            <p className="mt-2 text-sm text-slate-400">
              Will {symbol} be higher or lower in {ROUND_SEC} seconds?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => start('up')}
                className="flex flex-col items-center gap-2 rounded-xl bg-emerald-900/40 border border-emerald-600/40 py-6 touch-manipulation min-h-[80px]"
              >
                <ArrowUp className="h-8 w-8 text-emerald-400" />
                <span className="font-bold">Up</span>
              </button>
              <button
                type="button"
                onClick={() => start('down')}
                className="flex flex-col items-center gap-2 rounded-xl bg-red-900/40 border border-red-600/40 py-6 touch-manipulation min-h-[80px]"
              >
                <ArrowDown className="h-8 w-8 text-red-400" />
                <span className="font-bold">Down</span>
              </button>
            </div>
          </>
        )}

        {phase === 'live' && (
          <div className="mt-6">
            <p className="text-4xl font-display font-bold text-thriv-300">{seconds}s</p>
            <p className="text-sm text-slate-500 mt-2">Start: {formatCurrency(startPrice)}</p>
            <p className="text-xs mt-4 animate-pulse">Watching live simulation…</p>
          </div>
        )}

        {phase === 'result' && (
          <div className="mt-6">
            <span className={`inline-flex h-14 w-14 items-center justify-center rounded-xl border mt-2 ${won ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400' : 'border-white/10 bg-surface-900 text-slate-400'}`}>
              {won ? <Crosshair className="h-7 w-7" strokeWidth={1.5} /> : <TrendingDown className="h-7 w-7" strokeWidth={1.5} />}
            </span>
            <p className="font-display text-lg font-semibold mt-3">{won ? 'Correct call' : 'Missed move'}</p>
            <p className="text-sm text-slate-400 mt-2">
              {formatCurrency(startPrice)} → {formatCurrency(endPrice)}
            </p>
            <button
              type="button"
              onClick={() => {
                setPhase('ready')
                setGuess(null)
              }}
              className="mt-4 w-full rounded-lg bg-thriv-600 py-3 font-semibold touch-manipulation"
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
