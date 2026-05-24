import { useState } from 'react'
import { ArrowDownUp } from 'lucide-react'
import { buyingPower, maxBorrowAllowed } from '../lib/margin'
import { formatCurrency } from '../lib/marketEngine'
import { parseLimitPrice } from '../lib/trading'
import type { Holding, OrderSide, OrderType, Stock } from '../types'

type BuyMode = 'market' | 'limit' | 'loan'

interface TradePanelProps {
  stock: Stock | undefined
  cash: number
  marginLoan: number
  holdings: Holding[]
  stocks: Stock[]
  holdingQty: number
  onTrade: (
    side: OrderSide,
    type: OrderType,
    qty: number,
    limit?: number,
    useMargin?: boolean
  ) => { ok: boolean; message: string }
}

export function TradePanel({
  stock,
  cash,
  marginLoan,
  holdings,
  stocks,
  holdingQty,
  onTrade,
}: TradePanelProps) {
  const [side, setSide] = useState<OrderSide>('buy')
  const [buyMode, setBuyMode] = useState<BuyMode>('market')
  const [sellType, setSellType] = useState<OrderType>('market')
  const [qty, setQty] = useState(1)
  const [limit, setLimit] = useState('')
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  if (!stock) {
    return (
      <div className="glass rounded-xl p-6 text-center text-slate-500">
        Select a stock from the market to trade.
      </div>
    )
  }

  const price = stock.price
  const limitParsed = parseLimitPrice(limit)
  const useLoan = side === 'buy' && buyMode === 'loan'
  const orderType: OrderType =
    side === 'buy' ? (buyMode === 'limit' ? 'limit' : 'market') : sellType
  const showLimitInput = orderType === 'limit'
  const estPrice = showLimitInput && limitParsed != null ? limitParsed : price
  const total = estPrice * qty
  const maxCashBuy = Math.floor(cash / price)
  const marginCredit = maxBorrowAllowed(cash, holdings, stocks, marginLoan)
  const maxLoanBuy = Math.floor(buyingPower(cash, holdings, stocks, marginLoan) / price)
  const maxBuy = useLoan ? maxLoanBuy : maxCashBuy

  function submit() {
    if (showLimitInput && limitParsed == null) {
      setFeedback({ ok: false, message: 'Enter a valid limit price greater than $0.' })
      setTimeout(() => setFeedback(null), 4000)
      return
    }
    const result = onTrade(
      side,
      orderType,
      qty,
      showLimitInput ? limitParsed! : undefined,
      useLoan
    )
    setFeedback(result)
    setTimeout(() => setFeedback(null), 4000)
  }

  const modeBtn =
    'flex-1 rounded-md py-1.5 text-xs font-medium capitalize touch-manipulation min-h-[36px] transition-colors'

  return (
    <div className="glass rounded-xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <ArrowDownUp className="h-5 w-5 text-thriv-400" />
        <h3 className="font-display text-base sm:text-lg font-semibold">Place Order</h3>
      </div>

      <div className="mb-3 flex rounded-lg bg-surface-900 p-1">
        {(['buy', 'sell'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`flex-1 rounded-md py-2 text-sm font-semibold capitalize transition-colors touch-manipulation min-h-[40px] ${
              side === s
                ? s === 'buy'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-1 rounded-lg bg-surface-900/80 p-1">
        {side === 'buy' ? (
          (['market', 'limit', 'loan'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setBuyMode(m)}
              className={`${modeBtn} ${
                buyMode === m
                  ? m === 'loan'
                    ? 'bg-amber-700/90 text-white'
                    : 'bg-thriv-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))
        ) : (
          (['market', 'limit'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSellType(t)}
              className={`${modeBtn} ${
                sellType === t ? 'bg-thriv-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))
        )}
      </div>

      {useLoan && (
        <p className="mb-2 text-[10px] text-amber-400/90">
          Margin loan · {formatCurrency(marginCredit)} credit available
        </p>
      )}

      <label className="mb-1.5 block text-xs text-slate-500">Quantity</label>
      <div className="mb-3 flex gap-2">
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 font-mono text-sm focus:border-thriv-500 focus:outline-none"
        />
        {side === 'buy' && (
          <button
            type="button"
            onClick={() => setQty(Math.max(1, maxBuy))}
            className="shrink-0 rounded-lg bg-surface-700 px-3 text-xs text-thriv-300 hover:bg-surface-600 touch-manipulation"
          >
            Max
          </button>
        )}
        {side === 'sell' && holdingQty > 0 && (
          <button
            type="button"
            onClick={() => setQty(holdingQty)}
            className="shrink-0 rounded-lg bg-surface-700 px-3 text-xs text-thriv-300 hover:bg-surface-600 touch-manipulation"
          >
            All
          </button>
        )}
      </div>

      {showLimitInput && (
        <>
          <label className="mb-1.5 block text-xs text-slate-500">Limit price ($)</label>
          <input
            type="number"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder={price.toFixed(2)}
            className="mb-3 w-full rounded-lg border border-white/10 bg-surface-900 px-3 py-2 font-mono text-sm focus:border-thriv-500 focus:outline-none"
          />
        </>
      )}

      <div className="mb-4 space-y-1 rounded-lg bg-surface-900/80 p-3 text-xs">
        <Row label="Price" value={formatCurrency(price)} />
        <Row label="Order total" value={formatCurrency(total)} />
        <Row
          label="Funding"
          value={useLoan ? 'Margin loan' : 'Cash'}
        />
        <Row
          label={useLoan ? 'Buying power' : 'Cash available'}
          value={formatCurrency(useLoan ? buyingPower(cash, holdings, stocks, marginLoan) : cash)}
        />
        {side === 'sell' && <Row label="Shares held" value={String(holdingQty)} />}
      </div>

      <button
        type="button"
        onClick={submit}
        className={`w-full rounded-lg py-3 font-semibold transition-opacity hover:opacity-90 touch-manipulation min-h-[44px] ${
          side === 'buy'
            ? useLoan
              ? 'bg-amber-700 hover:bg-amber-600'
              : 'bg-emerald-600'
            : 'bg-red-600'
        }`}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
        {useLoan ? ' (loan)' : ''}
      </button>

      {feedback && (
        <p
          className={`mt-3 text-center text-xs ${
            feedback.ok ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-500">
      <span>{label}</span>
      <span className="font-mono text-slate-300">{value}</span>
    </div>
  )
}
