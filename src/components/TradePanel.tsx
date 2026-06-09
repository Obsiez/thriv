import { useEffect, useState, useRef } from 'react'
import { ArrowDownUp } from 'lucide-react'
import { buyingPower, maxBorrowAllowed } from '../lib/margin'
import { formatCurrency } from '../lib/marketEngine'
import { parseLimitPrice } from '../lib/trading'
import { type ProfilePrefs } from '../lib/profileTheme'
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
  portfolioPeak?: number
  profile?: ProfilePrefs
}

export function TradePanel({
  stock,
  cash,
  marginLoan,
  holdings,
  stocks,
  holdingQty,
  onTrade,
  portfolioPeak,
  profile,
}: TradePanelProps) {
  const [side, setSide] = useState<OrderSide>('buy')
  const [buyMode, setBuyMode] = useState<BuyMode>(profile?.defaultOrderType === 'limit' ? 'limit' : 'market')
  const [sellType, setSellType] = useState<OrderType>(profile?.defaultOrderType ?? 'market')
  const [qty, setQty] = useState<number | ''>(1)
  const [limit, setLimit] = useState('')
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  const [showRiskCalc, setShowRiskCalc] = useState(false)
  const [riskPct, setRiskPct] = useState('2')
  const [stopLossPrice, setStopLossPrice] = useState('')

  const lastSymbolRef = useRef('')

  useEffect(() => {
    if (stock) {
      setStopLossPrice('')
      if (stock.symbol !== lastSymbolRef.current) {
        lastSymbolRef.current = stock.symbol
        setQty(1)
      }
    }
  }, [stock])

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
  const total = estPrice * (typeof qty === 'number' ? qty : 0)
  const maxCashBuy = Math.floor(cash / price)
  const marginCredit = maxBorrowAllowed(cash, holdings, stocks, marginLoan, portfolioPeak, profile?.deactivatedCards)
  const maxLoanBuy = Math.floor(buyingPower(cash, holdings, stocks, marginLoan, portfolioPeak, profile?.deactivatedCards) / price)
  const maxBuy = useLoan ? maxLoanBuy : maxCashBuy

  // Risk Calculator logic
  const parsedRiskPct = parseFloat(riskPct) || 0
  const parsedStopLoss = parseFloat(stopLossPrice) || 0
  const holdingsValue = holdings.reduce((sum, h) => {
    const s = stocks.find((x) => x.symbol === h.symbol)
    return sum + h.quantity * (s?.price ?? 0)
  }, 0)
  const totalPortfolioValue = cash + holdingsValue - marginLoan
  const riskAmount = totalPortfolioValue * (parsedRiskPct / 100)
  const stopDistance = price - parsedStopLoss
  const suggestedShares = stopDistance > 0 ? Math.floor(riskAmount / stopDistance) : 0
  const positionCost = suggestedShares * price
  const pctOfPortfolio = totalPortfolioValue > 0 ? (positionCost / totalPortfolioValue) * 100 : 0

  function submit() {
    if (qty === '' || qty <= 0) {
      setFeedback({ ok: false, message: 'Enter a valid quantity of 1 or more.' })
      setTimeout(() => setFeedback(null), 4000)
      return
    }
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
          onChange={(e) => {
            const valStr = e.target.value
            if (valStr === '') {
              setQty('')
              return
            }
            const parsed = parseInt(valStr, 10)
            if (isNaN(parsed)) {
              setQty('')
            } else {
              setQty(Math.min(1000000, Math.max(1, parsed)))
            }
          }}
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

      {side === 'buy' && (
        <div className="mb-3 rounded-lg border border-white/[0.04] bg-surface-900/40 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Risk Calculator</span>
            <button
              type="button"
              onClick={() => {
                setShowRiskCalc(!showRiskCalc)
                if (!showRiskCalc && !stopLossPrice) {
                  setStopLossPrice((price * 0.95).toFixed(2))
                }
              }}
              className="text-[10px] font-semibold uppercase tracking-wider text-thriv-400 hover:text-thriv-300 transition-colors"
            >
              {showRiskCalc ? 'Hide' : 'Show'}
            </button>
          </div>

          {showRiskCalc && (
            <div className="space-y-2 pt-2 border-t border-white/[0.04] animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">
                    Risk (% of equity)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    value={riskPct}
                    onChange={(e) => setRiskPct(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-surface-900 px-2 py-1.5 font-mono text-xs focus:border-thriv-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">
                    Stop Loss Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    placeholder={(price * 0.95).toFixed(2)}
                    className="w-full rounded-md border border-white/10 bg-surface-900 px-2 py-1.5 font-mono text-xs focus:border-thriv-500 focus:outline-none"
                  />
                </div>
              </div>

              {stopDistance > 0 ? (
                <div className="rounded-lg bg-surface-950/60 p-2.5 space-y-1 text-[11px] font-medium border border-white/[0.02]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Capital</span>
                    <span className="font-mono text-slate-300">{formatCurrency(riskAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Suggested Shares</span>
                    <span className="font-mono text-thriv-400">{suggestedShares}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Position Cost</span>
                    <span className="font-mono text-slate-300">{formatCurrency(positionCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">% of Portfolio</span>
                    <span className="font-mono text-slate-300">{pctOfPortfolio.toFixed(1)}%</span>
                  </div>
                  
                  <div className="pt-2 mt-1 border-t border-white/[0.04] flex justify-end">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, Math.min(suggestedShares, maxBuy)))}
                      disabled={suggestedShares <= 0}
                      className="text-[9px] font-semibold text-thriv-400 hover:text-thriv-300 uppercase tracking-wider transition-colors disabled:opacity-40"
                    >
                      Apply Suggested Quantity
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 text-center pt-1 font-medium">
                  Enter a stop loss price below the current price to calculate risk.
                </p>
              )}
            </div>
          )}
        </div>
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
          value={formatCurrency(useLoan ? buyingPower(cash, holdings, stocks, marginLoan, portfolioPeak, profile?.deactivatedCards) : cash)}
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
