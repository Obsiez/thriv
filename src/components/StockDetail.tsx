import { formatCurrency, formatVolume } from '../lib/marketEngine'
import type { Stock } from '../types'

interface StockDetailProps {
  stock: Stock
}

export function StockDetail({ stock }: StockDetailProps) {
  return (
    <div className="glass rounded-xl p-4 text-sm">
      <h3 className="mb-3 font-display font-semibold text-slate-300">Company stats</h3>
      <dl className="grid grid-cols-2 gap-3">
        <Item label="Sector" value={stock.sector} />
        <Item label="Market cap" value={formatCurrency(stock.marketCap, true)} />
        <Item label="P/E ratio" value={stock.peRatio > 0 ? stock.peRatio.toFixed(1) : 'N/A'} />
        <Item
          label="Dividend yield"
          value={stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—'}
        />
        <Item label="Volume" value={formatVolume(stock.volume)} />
        <Item label="Day range" value={`${formatCurrency(stock.dayLow)} – ${formatCurrency(stock.dayHigh)}`} />
      </dl>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-mono text-slate-200">{value}</dd>
    </div>
  )
}
