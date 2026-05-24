import type { MarketNews, Stock } from '../types'

/** Local calendar date (YYYY-MM-DD) for midnight day rolls. */
export function localDateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function msUntilLocalMidnight(from = new Date()): number {
  const next = new Date(from)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - from.getTime()
}

/** Roll open / high / low / previous close so day % does not compound across sessions. */
export function resetStockForNewDay(stock: Stock): Stock {
  const p = stock.price
  return {
    ...stock,
    previousClose: p,
    open: p,
    dayHigh: p,
    dayLow: p,
  }
}

export interface StockSplitResult {
  stock: Stock
  ratio?: number
}

const SPLIT_MIN_PRICE = 350

/** Pick split ratio 2:1 … 10:1 from how elevated the share price is. */
export function splitRatioForPrice(price: number): number {
  if (price >= 1800) return 10
  if (price >= 1200) return 8
  if (price >= 900) return 7
  if (price >= 700) return 6
  if (price >= 550) return 5
  if (price >= 450) return 4
  if (price >= 380) return 3
  return 2
}

/** Forward split at midnight when shares are pricey — more shares, lower price. */
export function maybeSplitStock(stock: Stock): StockSplitResult {
  if (stock.price < SPLIT_MIN_PRICE) return { stock }

  const ratio = splitRatioForPrice(stock.price)
  const newPrice = Number((stock.price / ratio).toFixed(2))
  const scaleHistory = (pts: { time: number; price: number }[]) =>
    pts.map((p) => ({ time: p.time, price: Number((p.price / ratio).toFixed(2)) }))

  return {
    ratio,
    stock: {
      ...stock,
      price: newPrice,
      previousClose: newPrice,
      open: newPrice,
      dayHigh: newPrice,
      dayLow: newPrice,
      history: scaleHistory(stock.history),
    },
  }
}

export function runMidnightMarketRoll(stock: Stock): StockSplitResult {
  const reset = resetStockForNewDay(stock)
  return maybeSplitStock(reset)
}

/** Discrete tick moves — smaller drift; rare spikes; soft mean-reversion on large day moves. */
export function tickPrice(stock: Stock): Stock {
  const dayPct =
    stock.previousClose > 0
      ? ((stock.price - stock.previousClose) / stock.previousClose) * 100
      : 0

  let bias = 0.5
  if (dayPct > 5) bias = 0.57
  else if (dayPct < -5) bias = 0.43

  const tickSize = stock.price * (0.0004 + Math.random() * 0.0012)
  const direction = Math.random() > bias ? 1 : -1
  const roll = Math.random()
  let jump: number
  if (roll > 0.985) {
    jump = direction * tickSize * 1.9
  } else if (roll > 0.972) {
    jump = direction * tickSize * 1.35
  } else {
    jump = direction * tickSize
  }

  if (Math.random() < 0.0015) {
    const shock = stock.price * (0.018 + Math.random() * 0.022) * (Math.random() > 0.5 ? 1 : -1)
    jump += shock
  }

  let newPrice = Math.max(0.01, stock.price + jump)
  const maxUp = stock.previousClose * 1.12
  const maxDown = stock.previousClose * 0.88
  if (stock.previousClose > 0) {
    newPrice = Math.min(maxUp, Math.max(maxDown, newPrice))
  }
  newPrice = Number(newPrice.toFixed(2))

  const now = Date.now()
  const history = [...stock.history.slice(-119), { time: now, price: newPrice }]

  const volumeDelta = Math.floor(Math.random() * 50_000)
  return {
    ...stock,
    price: newPrice,
    dayHigh: Math.max(stock.dayHigh, newPrice),
    dayLow: Math.min(stock.dayLow, newPrice),
    volume: stock.volume + volumeDelta,
    history,
  }
}

export function changePercent(stock: Stock): number {
  if (stock.previousClose === 0) return 0
  return ((stock.price - stock.previousClose) / stock.previousClose) * 100
}

export function formatCurrency(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1e9) {
    return `$${(n / 1e9).toFixed(2)}B`
  }
  if (compact && Math.abs(n) >= 1e6) {
    return `$${(n / 1e6).toFixed(2)}M`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatPercent(n: number, signed = true): string {
  const prefix = signed && n > 0 ? '+' : ''
  return `${prefix}${n.toFixed(2)}%`
}

/** Apply simulated news shock to affected symbols. */
export function applyNewsImpact(stocks: Stock[], news: MarketNews): Stock[] {
  const base = news.flash ? (news.impactPct ?? 3) / 100 : 0.35 / 100
  const jitter = news.flash ? 0.9 + Math.random() * 0.25 : 0.85 + Math.random() * 0.3
  const magnitude = base * jitter
  const sign =
    news.sentiment === 'bullish' ? 1 : news.sentiment === 'bearish' ? -1 : 0
  if (sign === 0) return stocks

  const symbolSet = new Set(news.symbols)
  return stocks.map((s) => {
    if (!symbolSet.has(s.symbol)) return s
    const mult = 1 + sign * magnitude
    let newPrice = Number(Math.max(0.01, s.price * mult).toFixed(2))
    if (s.previousClose > 0) {
      const capUp = s.previousClose * 1.15
      const capDown = s.previousClose * 0.85
      newPrice = Math.min(capUp, Math.max(capDown, newPrice))
    }
    const now = Date.now()
    return {
      ...s,
      price: newPrice,
      dayHigh: Math.max(s.dayHigh, newPrice),
      dayLow: Math.min(s.dayLow, newPrice),
      history: [...s.history.slice(-119), { time: now, price: newPrice }],
    }
  })
}

export function formatVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return String(n)
}
