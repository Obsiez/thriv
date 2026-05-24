import type { Stock } from '../types'

/** Seed prices approximate real-world levels (educational simulation). */
const SEED: Omit<Stock, 'history' | 'dayHigh' | 'dayLow' | 'volume'>[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 198.42, previousClose: 196.8, open: 197.1, marketCap: 3.05e12, peRatio: 31.2, dividendYield: 0.44 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', price: 428.15, previousClose: 425.2, open: 426.0, marketCap: 3.18e12, peRatio: 35.8, dividendYield: 0.72 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication', price: 178.63, previousClose: 176.9, open: 177.5, marketCap: 2.21e12, peRatio: 26.4, dividendYield: 0 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer', price: 198.87, previousClose: 195.4, open: 196.2, marketCap: 2.06e12, peRatio: 42.1, dividendYield: 0 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', price: 124.58, previousClose: 121.3, open: 122.0, marketCap: 3.04e12, peRatio: 68.5, dividendYield: 0.03 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Communication', price: 582.34, previousClose: 575.1, open: 578.0, marketCap: 1.48e12, peRatio: 27.9, dividendYield: 0.35 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer', price: 248.91, previousClose: 252.3, open: 251.0, marketCap: 792e9, peRatio: 62.4, dividendYield: 0 },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Finance', price: 242.18, previousClose: 239.5, open: 240.2, marketCap: 692e9, peRatio: 11.8, dividendYield: 2.15 },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance', price: 312.45, previousClose: 308.9, open: 310.0, marketCap: 638e9, peRatio: 29.6, dividendYield: 0.78 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', price: 156.72, previousClose: 155.8, open: 156.0, marketCap: 378e9, peRatio: 9.2, dividendYield: 2.98 },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare', price: 528.34, previousClose: 522.1, open: 524.0, marketCap: 486e9, peRatio: 22.4, dividendYield: 1.42 },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy', price: 118.42, previousClose: 116.8, open: 117.2, marketCap: 512e9, peRatio: 14.1, dividendYield: 3.12 },
  { symbol: 'CVX', name: 'Chevron Corp.', sector: 'Energy', price: 162.18, previousClose: 160.5, open: 161.0, marketCap: 298e9, peRatio: 13.8, dividendYield: 3.85 },
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer', price: 92.48, previousClose: 91.2, open: 91.8, marketCap: 742e9, peRatio: 28.3, dividendYield: 0.92 },
  { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication', price: 108.24, previousClose: 106.9, open: 107.5, marketCap: 198e9, peRatio: 38.2, dividendYield: 0 },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication', price: 892.15, previousClose: 878.4, open: 885.0, marketCap: 384e9, peRatio: 44.6, dividendYield: 0 },
  { symbol: 'BA', name: 'Boeing Co.', sector: 'Industrial', price: 178.92, previousClose: 175.3, open: 176.5, marketCap: 118e9, peRatio: -42.1, dividendYield: 0 },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrial', price: 368.42, previousClose: 362.8, open: 365.0, marketCap: 178e9, peRatio: 16.2, dividendYield: 1.48 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology', price: 162.34, previousClose: 158.9, open: 160.0, marketCap: 262e9, peRatio: 48.3, dividendYield: 0 },
  { symbol: 'INTC', name: 'Intel Corp.', sector: 'Technology', price: 22.48, previousClose: 22.1, open: 22.2, marketCap: 96e9, peRatio: -8.2, dividendYield: 0 },
]

function generateHistory(basePrice: number, points = 60): { time: number; price: number }[] {
  const now = Date.now()
  const history: { time: number; price: number }[] = []
  let price = basePrice * (0.98 + Math.random() * 0.03)
  for (let i = points; i >= 0; i--) {
    const tick = basePrice * (0.0012 + Math.random() * 0.0028)
    const dir = Math.random() > 0.5 ? 1 : -1
    const spike = Math.random() > 0.88 ? dir * tick * 2.2 : dir * tick
    price = Math.max(basePrice * 0.88, Math.min(basePrice * 1.12, price + spike))
    history.push({ time: now - i * 60_000, price: Number(price.toFixed(2)) })
  }
  history[history.length - 1] = { time: now, price: basePrice }
  return history
}

export function createInitialStocks(): Stock[] {
  return SEED.map((s) => {
    const history = generateHistory(s.price)
    const prices = history.map((h) => h.price)
    return {
      ...s,
      history,
      dayHigh: Math.max(...prices, s.price),
      dayLow: Math.min(...prices, s.price),
      volume: Math.floor(5_000_000 + Math.random() * 45_000_000),
    }
  })
}

export const STARTING_CASH = 100_000
