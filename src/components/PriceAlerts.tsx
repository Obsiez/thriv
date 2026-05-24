import { Bell, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '../lib/marketEngine'
import type { PriceAlert, Stock } from '../types'

interface PriceAlertsProps {
  stock?: Stock
  alerts: PriceAlert[]
  onAdd: (symbol: string, price: number, direction: 'above' | 'below') => void
  onRemove: (id: string) => void
}

export function PriceAlerts({ stock, alerts, onAdd, onRemove }: PriceAlertsProps) {
  const [price, setPrice] = useState(stock?.price.toFixed(2) ?? '')
  const [dir, setDir] = useState<'above' | 'below'>('above')

  function submit() {
    if (!stock) return
    const p = parseFloat(price)
    if (isNaN(p) || p <= 0) return
    onAdd(stock.symbol, p, dir)
    setPrice(stock.price.toFixed(2))
  }

  const relevant = stock
    ? alerts.filter((a) => a.symbol === stock.symbol)
    : alerts.slice(0, 5)

  return (
    <div className="glass rounded-xl p-3 sm:p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Bell className="h-4 w-4 text-thriv-400" />
        Price alerts
      </h3>
      {stock && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-[10px] text-slate-500">Target ($)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm font-mono min-h-[44px]"
            />
          </div>
          <select
            value={dir}
            onChange={(e) => setDir(e.target.value as 'above' | 'below')}
            className="rounded-lg border border-white/10 bg-surface-900 px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="above">Goes above</option>
            <option value="below">Goes below</option>
          </select>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-thriv-700 px-4 py-2 text-sm font-semibold touch-manipulation min-h-[44px]"
          >
            Set
          </button>
        </div>
      )}
      <ul className="mt-3 space-y-1.5">
        {relevant.length === 0 ? (
          <li className="text-xs text-slate-500">No alerts yet.</li>
        ) : (
          relevant.map((a) => (
            <li
              key={a.id}
              className={`flex items-center justify-between rounded-lg px-2 py-2 text-xs ${
                a.triggered ? 'bg-emerald-950/30 text-emerald-400' : 'bg-surface-900'
              }`}
            >
              <span className="font-mono">
                {a.symbol} {a.direction} {formatCurrency(a.targetPrice)}
                {a.triggered && ' ✓'}
              </span>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                className="p-2 text-slate-500 hover:text-red-400 touch-manipulation"
                aria-label="Remove alert"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
