import { memo } from 'react'
import { changePercent, formatCurrency, formatPercent } from '../lib/marketEngine'
import type { Stock } from '../types'

interface TickerBarProps {
  stocks: Stock[]
}

const TickerItem = memo(function TickerItem({ stock }: { stock: Stock }) {
  const ch = changePercent(stock)
  const up = ch >= 0
  return (
    <span className="inline-flex items-center gap-2 px-4 text-sm">
      <span className="font-mono font-semibold text-thriv-300">{stock.symbol}</span>
      <span className="font-mono text-slate-300">{formatCurrency(stock.price)}</span>
      <span className={`font-mono text-xs ${up ? 'text-emerald-400' : 'text-red-400'}`}>
        {formatPercent(ch)}
      </span>
    </span>
  )
})

export function TickerBar({ stocks }: TickerBarProps) {
  const duration = Math.max(28, stocks.length * 2.8)

  return (
    <div className="relative overflow-hidden border-b border-white/5 bg-surface-800/60 py-1.5 sm:py-2">
      <div
        className="ticker-track flex w-max"
        style={{ animationDuration: `${duration}s` }}
      >
        {stocks.map((s) => (
          <TickerItem key={`a-${s.symbol}`} stock={s} />
        ))}
        {stocks.map((s) => (
          <TickerItem key={`b-${s.symbol}`} stock={s} />
        ))}
      </div>
    </div>
  )
}
