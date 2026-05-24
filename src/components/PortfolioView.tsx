import { PieChart } from 'lucide-react'
import { changePercent, formatCurrency, formatPercent } from '../lib/marketEngine'
import type { Holding, Stock } from '../types'

interface PortfolioViewProps {
  cash: number
  marginLoan?: number
  holdings: Holding[]
  stocks: Stock[]
  totalValue: number
  startingCash: number
}

export function PortfolioView({
  cash,
  marginLoan = 0,
  holdings,
  stocks,
  totalValue,
  startingCash,
}: PortfolioViewProps) {
  const pnl = totalValue - startingCash
  const pnlPct = (pnl / startingCash) * 100
  const up = pnl >= 0

  const rows = holdings
    .map((h) => {
      const s = stocks.find((x) => x.symbol === h.symbol)
      if (!s) return null
      const value = s.price * h.quantity
      const cost = h.avgCost * h.quantity
      const gain = value - cost
      const gainPct = (gain / cost) * 100
      return { holding: h, stock: s, value, cost, gain, gainPct }
    })
    .filter(Boolean) as {
    holding: Holding
    stock: Stock
    value: number
    cost: number
    gain: number
    gainPct: number
  }[]

  const invested = rows.reduce((s, r) => s + r.value, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Card label="Total value" value={formatCurrency(totalValue)} large />
        </div>
        <Card label="Cash" value={formatCurrency(cash)} />
        <Card
          label="Margin loan"
          value={formatCurrency(marginLoan)}
          accent={marginLoan > 0 ? 'red' : undefined}
        />
        <Card label="Invested" value={formatCurrency(invested)} />
        <Card
          label="Total P/L"
          value={`${up ? '+' : ''}${formatCurrency(pnl)} (${formatPercent(pnlPct)})`}
          accent={up ? 'green' : 'red'}
        />
      </div>

      <div className="glass rounded-xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-thriv-400" />
          <h3 className="font-display text-lg font-semibold">Holdings</h3>
        </div>
        {rows.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No positions yet. Visit the Market tab and place your first paper trade.
          </p>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {rows.map(({ holding, stock, value, gain, gainPct }) => {
                const dayCh = changePercent(stock)
                const dayUp = dayCh >= 0
                const posUp = gain >= 0
                return (
                  <div
                    key={holding.symbol}
                    className="rounded-lg border border-white/5 bg-surface-900/40 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold text-thriv-300">
                        {holding.symbol}
                      </span>
                      <span className="font-mono text-sm text-white">{formatCurrency(value)}</span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
                      <div>
                        <p className="text-slate-500">Qty</p>
                        <p className="font-mono text-slate-300">{holding.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">Avg</p>
                        <p className="font-mono text-slate-300">{formatCurrency(holding.avgCost)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">Price</p>
                        <p className="font-mono text-slate-300">{formatCurrency(stock.price)}</p>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono">
                      <span className={posUp ? 'text-emerald-400' : 'text-red-400'}>
                        {formatCurrency(gain)} ({formatPercent(gainPct)})
                      </span>
                      <span className={dayUp ? 'text-emerald-400/80' : 'text-red-400/80'}>
                        Day {formatPercent(dayCh)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase text-slate-500 border-b border-white/5">
                    <th className="pb-3 text-left">Symbol</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Avg cost</th>
                    <th className="pb-3 text-right">Price</th>
                    <th className="pb-3 text-right">Value</th>
                    <th className="pb-3 text-right">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ holding, stock, value, gain, gainPct }) => {
                    const dayCh = changePercent(stock)
                    return (
                      <tr key={holding.symbol} className="border-b border-white/5">
                        <td className="py-3 font-mono font-semibold text-thriv-300">
                          {holding.symbol}
                        </td>
                        <td className="py-3 text-right font-mono">{holding.quantity}</td>
                        <td className="py-3 text-right font-mono text-slate-400">
                          {formatCurrency(holding.avgCost)}
                        </td>
                        <td className="py-3 text-right font-mono">{formatCurrency(stock.price)}</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(value)}</td>
                        <td
                          className={`py-3 text-right font-mono ${
                            gain >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {formatCurrency(gain)} ({formatPercent(gainPct)})
                          <span className="block text-[10px] text-slate-500">
                            Day {formatPercent(dayCh)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {rows.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-slate-400">
            Allocation (by value)
          </h3>
          <div className="space-y-2">
            {rows.map(({ holding, value }) => {
              const pct = (value / totalValue) * 100
              return (
                <div key={holding.symbol}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-mono text-thriv-300">{holding.symbol}</span>
                    <span className="text-slate-500">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-thriv-600 to-thriv-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-400">Cash</span>
                <span className="text-slate-500">{((cash / totalValue) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-900">
                <div
                  className="h-full rounded-full bg-slate-600"
                  style={{ width: `${(cash / totalValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Card({
  label,
  value,
  large,
  accent,
}: {
  label: string
  value: string
  large?: boolean
  accent?: 'green' | 'red'
}) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-1 font-mono font-semibold ${
          large ? 'text-2xl' : 'text-lg'
        } ${
          accent === 'green'
            ? 'text-emerald-400'
            : accent === 'red'
              ? 'text-red-400'
              : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
