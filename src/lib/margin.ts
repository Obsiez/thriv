import { STARTING_CASH } from '../data/stocks'
import type { Holding, Stock } from '../types'

/** Max borrow = 50% of gross equity (cash + holdings). */
export const MARGIN_MAX_RATIO = 0.5
/** Liquidate when net equity falls below loan × this factor. */
export const MARGIN_MAINTENANCE = 1.25

export function getMarginMaxRatio(netEquityVal: number, portfolioPeak = 0, deactivatedCards: string[] = []): number {
  const activeVal = Math.max(netEquityVal, portfolioPeak)
  if (activeVal >= 500000 && !deactivatedCards.includes('apex')) {
    return 0.70 // APEX: 3.33x leverage (Cap = 70% of gross)
  } else if (activeVal >= 250000 && !deactivatedCards.includes('zenith')) {
    return 0.60 // ZENITH: 2.5x leverage (Cap = 60% of gross)
  } else {
    return 0.50 // GRID: 2x leverage (Cap = 50% of gross)
  }
}

function finite(n: number): number {
  return Number.isFinite(n) ? n : 0
}

export function holdingsValue(holdings: Holding[], stocks: Stock[]): number {
  return holdings.reduce((sum, h) => {
    const s = stocks.find((x) => x.symbol === h.symbol)
    if (!s || !Number.isFinite(h.quantity)) return sum
    const v = s.price * h.quantity
    return sum + (Number.isFinite(v) ? v : 0)
  }, 0)
}

export function grossEquity(cash: number, holdings: Holding[], stocks: Stock[]): number {
  return finite(cash) + holdingsValue(holdings, stocks)
}

export function netEquity(
  cash: number,
  holdings: Holding[],
  stocks: Stock[],
  marginLoan: number
): number {
  return finite(grossEquity(cash, holdings, stocks)) - finite(marginLoan)
}

export function maxBorrowAllowed(
  cash: number,
  holdings: Holding[],
  stocks: Stock[],
  marginLoan: number,
  portfolioPeak = 0,
  deactivatedCards: string[] = []
): number {
  const gross = grossEquity(cash, holdings, stocks)
  const net = gross - marginLoan
  const ratio = getMarginMaxRatio(net, portfolioPeak, deactivatedCards)
  const cap = gross * ratio
  return Math.max(0, cap - marginLoan)
}


export function buyingPower(
  cash: number,
  holdings: Holding[],
  stocks: Stock[],
  marginLoan: number,
  portfolioPeak = 0,
  deactivatedCards: string[] = []
): number {
  return cash + maxBorrowAllowed(cash, holdings, stocks, marginLoan, portfolioPeak, deactivatedCards)
}

export function shouldLiquidate(
  cash: number,
  holdings: Holding[],
  stocks: Stock[],
  marginLoan: number
): boolean {
  if (marginLoan <= 0) return false
  const equity = netEquity(cash, holdings, stocks, marginLoan)
  return equity < marginLoan * MARGIN_MAINTENANCE
}

/** Estimated price where net equity hits maintenance (single-symbol focus). */
export function estimateLiquidationPrice(
  symbol: string,
  cash: number,
  holdings: Holding[],
  stocks: Stock[],
  marginLoan: number
): number | null {
  if (marginLoan <= 0) return null
  const h = holdings.find((x) => x.symbol === symbol)
  if (!h || h.quantity <= 0) return null

  const other = holdings
    .filter((x) => x.symbol !== symbol)
    .reduce((sum, x) => {
      const s = stocks.find((st) => st.symbol === x.symbol)
      return sum + (s ? s.price * x.quantity : 0)
    }, 0)

  const threshold = marginLoan * MARGIN_MAINTENANCE
  const needed = threshold + marginLoan - cash - other
  const liq = needed / h.quantity
  if (!Number.isFinite(liq) || liq <= 0) return null
  return Number(liq.toFixed(2))
}

export function portfolioGainPctFromStart(netValue: number): number {
  return ((netValue - STARTING_CASH) / STARTING_CASH) * 100
}
