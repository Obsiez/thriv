import { changePercent, formatCurrency, formatPercent } from '../lib/marketEngine'
import type { Stock } from '../types'

interface MarketIndicesProps {
  stocks: Stock[]
}

/** Synthetic indices derived from sector groups. */
export function MarketIndices({ stocks }: MarketIndicesProps) {
  const tech = stocks.filter((s) => s.sector === 'Technology')
  const fin = stocks.filter((s) => s.sector === 'Finance')
  const all = stocks

  const indices = [
    { name: 'THRIV 20', stocks: all, desc: 'Broad market' },
    { name: 'TECH IDX', stocks: tech, desc: 'Technology' },
    { name: 'FIN IDX', stocks: fin, desc: 'Financials' },
  ].map(({ name, stocks: group, desc }) => {
    const avgChange =
      group.reduce((s, st) => s + changePercent(st), 0) / (group.length || 1)
    const avgPrice =
      group.reduce((s, st) => s + st.price, 0) / (group.length || 1)
    return { name, desc, avgChange, avgPrice: avgPrice * (name === 'THRIV 20' ? 2.5 : 8) }
  })

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {indices.map((idx) => {
        const up = idx.avgChange >= 0
        return (
          <div key={idx.name} className="glass rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs font-bold text-thriv-400">{idx.name}</p>
                <p className="text-[10px] text-slate-500">{idx.desc}</p>
              </div>
              <span
                className={`font-mono text-sm font-semibold ${
                  up ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatPercent(idx.avgChange)}
              </span>
            </div>
            <p className="mt-2 font-mono text-lg font-semibold">
              {formatCurrency(idx.avgPrice)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
