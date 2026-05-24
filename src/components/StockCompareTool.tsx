import { useState } from 'react'
import { ArrowLeft, GitCompare } from 'lucide-react'
import { changePercent, formatCurrency, formatPercent, formatVolume } from '../lib/marketEngine'
import type { Stock } from '../types'

interface StockCompareToolProps {
  stocks: Stock[]
  defaultA?: string
  defaultB?: string
  onBack: () => void
  onUsed: () => void
}

export function StockCompareTool({
  stocks,
  defaultA = 'AAPL',
  defaultB = 'MSFT',
  onBack,
  onUsed,
}: StockCompareToolProps) {
  const [a, setA] = useState(defaultA)
  const [b, setB] = useState(defaultB)
  const [used, setUsed] = useState(false)

  const sa = stocks.find((s) => s.symbol === a)
  const sb = stocks.find((s) => s.symbol === b)

  function markUsed() {
    if (!used) {
      setUsed(true)
      onUsed()
    }
  }

  if (!sa || !sb) return null

  const rows: { label: string; va: string; vb: string }[] = [
    { label: 'Price', va: formatCurrency(sa.price), vb: formatCurrency(sb.price) },
    {
      label: 'Day change',
      va: formatPercent(changePercent(sa)),
      vb: formatPercent(changePercent(sb)),
    },
    { label: 'Sector', va: sa.sector, vb: sb.sector },
    { label: 'Volume', va: formatVolume(sa.volume), vb: formatVolume(sb.volume) },
    {
      label: 'Market cap',
      va: formatCurrency(sa.marketCap, true),
      vb: formatCurrency(sb.marketCap, true),
    },
    {
      label: 'P/E',
      va: sa.peRatio > 0 ? sa.peRatio.toFixed(1) : 'N/A',
      vb: sb.peRatio > 0 ? sb.peRatio.toFixed(1) : 'N/A',
    },
    {
      label: 'Dividend',
      va: sa.dividendYield > 0 ? `${sa.dividendYield.toFixed(2)}%` : '—',
      vb: sb.dividendYield > 0 ? `${sb.dividendYield.toFixed(2)}%` : '—',
    },
  ]

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center gap-2">
        <GitCompare className="h-5 w-5 text-thriv-400" strokeWidth={1.75} />
        <h2 className="font-display text-lg font-semibold">Stock Compare</h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={a}
          onChange={(e) => {
            setA(e.target.value)
            markUsed()
          }}
          className="rounded-lg border border-white/10 bg-surface-900 px-3 py-2.5 text-sm font-mono min-h-[44px]"
        >
          {stocks.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol}
            </option>
          ))}
        </select>
        <select
          value={b}
          onChange={(e) => {
            setB(e.target.value)
            markUsed()
          }}
          className="rounded-lg border border-white/10 bg-surface-900 px-3 py-2.5 text-sm font-mono min-h-[44px]"
        >
          {stocks.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol}
            </option>
          ))}
        </select>
      </div>
      <div className="glass overflow-hidden rounded-xl border border-white/[0.06]">
        <div className="grid grid-cols-3 border-b border-white/5 bg-surface-900/80 text-[10px] uppercase tracking-wider text-slate-500">
          <div className="p-3">Metric</div>
          <div className="p-3 font-mono text-thriv-400">{sa.symbol}</div>
          <div className="p-3 font-mono text-thriv-400">{sb.symbol}</div>
        </div>
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-3 border-b border-white/5 text-sm">
            <div className="p-3 text-slate-500">{r.label}</div>
            <div className="p-3 font-mono text-slate-200">{r.va}</div>
            <div className="p-3 font-mono text-slate-200">{r.vb}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center">
        Compare valuation and momentum before paper trades.
      </p>
    </div>
  )
}
