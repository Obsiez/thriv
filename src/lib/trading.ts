import type { OrderSide, OrderType, Stock } from '../types'

export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Number(n.toFixed(2))
}

export function parseLimitPrice(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null
  const s = String(raw).trim()
  if (!s) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return null
  return roundMoney(n)
}

export type FillResolution =
  | { ok: true; fillPrice: number; limitPrice?: number }
  | { ok: false; message: string }

/** Instant fill when limit is marketable; price is always the live quote. */
export function resolveFillPrice(
  side: OrderSide,
  type: OrderType,
  stock: Stock,
  limitPrice: number | null | undefined
): FillResolution {
  const market = roundMoney(stock.price)
  if (!Number.isFinite(market) || market <= 0) {
    return { ok: false, message: 'Invalid market price for this symbol.' }
  }

  if (type !== 'limit') {
    return { ok: true, fillPrice: market }
  }

  const limit = parseLimitPrice(limitPrice)
  if (limit == null) {
    return { ok: false, message: 'Enter a valid limit price greater than $0.' }
  }

  if (side === 'buy') {
    if (market > limit) {
      return {
        ok: false,
        message: `Market (${market.toFixed(2)}) is above your limit (${limit.toFixed(2)}). Raise your limit or use Market.`,
      }
    }
    return { ok: true, fillPrice: market, limitPrice: limit }
  }

  if (market < limit) {
    return {
      ok: false,
      message: `Market (${market.toFixed(2)}) is below your limit (${limit.toFixed(2)}). Lower your limit or use Market.`,
    }
  }
  return { ok: true, fillPrice: market, limitPrice: limit }
}
