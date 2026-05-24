import { Activity, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { changePercent } from '../lib/marketEngine'
import type { Stock } from '../types'

interface MarketPulseProps {
  stocks: Stock[]
}

export function MarketPulse({ stocks }: MarketPulseProps) {
  const changes = stocks.map(changePercent)
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length
  const advancing = changes.filter((c) => c > 0).length
  const declining = changes.filter((c) => c < 0).length

  const mood =
    avg > 0.35 ? 'bullish' : avg < -0.35 ? 'bearish' : 'neutral'

  const Icon = mood === 'bullish' ? TrendingUp : mood === 'bearish' ? TrendingDown : Minus
  const label =
    mood === 'bullish' ? 'Risk-on' : mood === 'bearish' ? 'Risk-off' : 'Mixed'
  const color =
    mood === 'bullish'
      ? 'text-emerald-400 border-emerald-500/20'
      : mood === 'bearish'
        ? 'text-red-400 border-red-500/20'
        : 'text-slate-400 border-white/10'

  return (
    <div className={`glass rounded-xl border p-4 ${color}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-surface-900/80">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Market pulse</p>
            <p className="font-display font-semibold">{label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm">{avg >= 0 ? '+' : ''}{avg.toFixed(2)}%</p>
          <p className="text-[10px] text-slate-500">avg day change</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          {advancing} up
        </span>
        <span className="flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-red-500" />
          {declining} down
        </span>
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {stocks.length} names
        </span>
      </div>
    </div>
  )
}
