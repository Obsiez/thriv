import { formatCurrency } from '../lib/marketEngine'
import type { Order } from '../types'

interface OrdersViewProps {
  orders: Order[]
}

export function OrdersView({ orders }: OrdersViewProps) {
  if (orders.length === 0) {
    return (
      <div className="glass rounded-xl p-8 sm:p-12 text-center text-slate-500 text-sm">
        No orders yet. Your trade history will appear here.
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2 md:hidden">
        {orders.map((o) => (
          <div key={o.id} className="glass rounded-xl p-3">
            <div className="flex justify-between items-start">
              <span className="font-mono font-bold text-thriv-300">{o.symbol}</span>
              <span
                className={`text-xs font-semibold capitalize ${
                  o.side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {o.side} · {o.type}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{o.quantity} shares</span>
              <span className="font-mono">
                {o.fillPrice != null ? formatCurrency(o.fillPrice) : '—'}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-600">
              {new Date(o.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <div className="glass hidden overflow-hidden rounded-xl md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase text-slate-500">
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Symbol</th>
                <th className="px-4 py-3 text-left">Side</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Fill</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-thriv-300">
                    {o.symbol}
                  </td>
                  <td
                    className={`px-4 py-3 capitalize font-medium ${
                      o.side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {o.side}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-400">{o.type}</td>
                  <td className="px-4 py-3 text-right font-mono">{o.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {o.fillPrice != null ? formatCurrency(o.fillPrice) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-400">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
