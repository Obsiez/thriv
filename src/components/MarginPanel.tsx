import { AlertTriangle, Landmark } from 'lucide-react'
import {
  MARGIN_MAINTENANCE,
  buyingPower,
  estimateLiquidationPrice,
  maxBorrowAllowed,
  getMarginMaxRatio,
  grossEquity,
} from '../lib/margin'
import { formatCurrency } from '../lib/marketEngine'
import type { Holding, Stock } from '../types'

interface MarginPanelProps {
  cash: number
  marginLoan: number
  holdings: Holding[]
  stocks: Stock[]
  symbol?: string
  portfolioPeak?: number
  deactivatedCards?: string[]
}

export function MarginPanel({ cash, marginLoan, holdings, stocks, symbol, portfolioPeak, deactivatedCards = [] }: MarginPanelProps) {
  const loan = marginLoan ?? 0
  const credit = maxBorrowAllowed(cash, holdings, stocks, loan, portfolioPeak, deactivatedCards)
  const power = buyingPower(cash, holdings, stocks, loan, portfolioPeak, deactivatedCards)
  const liq =
    symbol && loan > 0
      ? estimateLiquidationPrice(symbol, cash, holdings, stocks, loan)
      : null

  const net = grossEquity(cash, holdings, stocks) - loan
  const ratio = getMarginMaxRatio(net, portfolioPeak, deactivatedCards)

  return (
    <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/15 p-3 space-y-2">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-300/90">
        <Landmark className="h-3.5 w-3.5" strokeWidth={1.75} />
        Margin (simulated)
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Cash balance" value={formatCurrency(cash)} />
        <Stat label="Loan balance" value={formatCurrency(loan)} highlight={loan > 0} />
        <Stat label="Buying power" value={formatCurrency(power)} />
        <Stat label="Margin credit" value={formatCurrency(credit)} />
      </div>
      <p className="text-[10px] text-slate-600 leading-relaxed">
        Borrow up to {(ratio * 100).toFixed(0)}% of portfolio value. Maintenance margin{' '}
        {(MARGIN_MAINTENANCE * 100).toFixed(0)}% — auto-liquidation if equity falls too low.
      </p>

      {liq != null && symbol && (
        <p className="flex items-start gap-2 text-[10px] text-amber-400/90 rounded-md border border-amber-500/20 bg-amber-950/20 px-2 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={1.75} />
          <span>
            Est. liquidation near <span className="font-mono font-semibold">${liq}</span> on{' '}
            {symbol} if price drops further while loan is open.
          </span>
        </p>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-slate-600">{label}</p>
      <p className={`font-mono font-medium tabular-nums ${highlight ? 'text-amber-400' : 'text-slate-200'}`}>
        {value}
      </p>
    </div>
  )
}
