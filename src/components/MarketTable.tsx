import { Star } from 'lucide-react'
import {
  changePercent,
  formatCurrency,
  formatPercent,
  formatVolume,
} from '../lib/marketEngine'
import type { Stock } from '../types'

interface MarketTableProps {
  stocks: Stock[]
  watchlist: string[]
  selected: string
  onSelect: (symbol: string) => void
  onToggleWatch: (symbol: string) => void
  filter?: string
}

export function MarketTable({
  stocks,
  watchlist,
  selected,
  onSelect,
  onToggleWatch,
  filter = '',
}: MarketTableProps) {
  const q = filter.toLowerCase()
  const filtered = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
  )

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {filtered.map((s) => {
          const ch = changePercent(s)
          const up = ch >= 0
          const watched = watchlist.includes(s.symbol)
          const isSelected = s.symbol === selected
          return (
            <button
              key={s.symbol}
              type="button"
              onClick={() => onSelect(s.symbol)}
              className={`glass w-full rounded-xl p-3 text-left touch-manipulation ${
                isSelected ? 'border-thriv-600/50 ring-1 ring-thriv-600/30' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleWatch(s.symbol)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && onToggleWatch(s.symbol)}
                    className="shrink-0 p-1"
                  >
                    <Star
                      className={`h-4 w-4 ${watched ? 'fill-thriv-400 text-thriv-400' : 'text-slate-600'}`}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-thriv-300">{s.symbol}</p>
                    <p className="text-[10px] text-slate-500 truncate">{s.name}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-sm">{formatCurrency(s.price)}</p>
                  <p className={`font-mono text-xs ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercent(ch)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-3 text-[10px] text-slate-500">
                <span>{s.sector}</span>
                <span>Vol {formatVolume(s.volume)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="glass hidden overflow-hidden rounded-xl md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Change</th>
                <th className="px-4 py-3 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const ch = changePercent(s)
                const up = ch >= 0
                const isSelected = s.symbol === selected
                const watched = watchlist.includes(s.symbol)
                return (
                  <tr
                    key={s.symbol}
                    onClick={() => onSelect(s.symbol)}
                    className={`cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5 ${
                      isSelected ? 'bg-thriv-900/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleWatch(s.symbol)
                        }}
                        className="text-slate-500 hover:text-thriv-400 p-1"
                        aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        <Star
                          className={`h-4 w-4 ${watched ? 'fill-thriv-400 text-thriv-400' : ''}`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-thriv-300">
                      {s.symbol}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500">{s.sector}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(s.price)}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono ${
                        up ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {formatPercent(ch)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      {formatVolume(s.volume)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
