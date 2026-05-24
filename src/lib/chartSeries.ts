import type { PricePoint, Stock } from '../types'

export type ChartRange = '1D' | '5D' | '1M' | '6M'

export const CHART_RANGES: { id: ChartRange; label: string }[] = [
  { id: '1D', label: '1D' },
  { id: '5D', label: '5D' },
  { id: '1M', label: '1M' },
  { id: '6M', label: '6M' },
]

const MS = {
  '1D': 24 * 60 * 60 * 1000,
  '5D': 5 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '6M': 180 * 24 * 60 * 60 * 1000,
}

const INTERVAL = {
  '1D': 60_000,
  '5D': 60 * 60 * 1000,
  '1M': 24 * 60 * 60 * 1000,
  '6M': 24 * 60 * 60 * 1000,
}

const LONG_RANGES: ChartRange[] = ['5D', '1M', '6M']

function symbolSeed(symbol: string): number {
  return symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0) * 31, 7)
}

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function tickWalk(price: number, base: number, rand: () => number, scale = 1): number {
  const tick = base * (0.001 + rand() * 0.003) * scale
  const dir = rand() > 0.48 ? 1 : -1
  const spike = rand() > 0.9 ? dir * tick * 2.5 : dir * tick
  return Math.max(base * 0.7, Math.min(base * 1.35, price + spike))
}

function synthesize(
  symbol: string,
  endPrice: number,
  endTime: number,
  startTime: number,
  intervalMs: number
): PricePoint[] {
  const rand = rng(symbolSeed(symbol) + Math.floor(startTime / 86400000))
  const points: PricePoint[] = []
  const slots = Math.max(2, Math.floor((endTime - startTime) / intervalMs))
  let price = endPrice * (0.92 + rand() * 0.06)

  for (let i = 0; i <= slots; i++) {
    const t = startTime + i * intervalMs
    const pull = (endPrice - price) * (i / slots) * 0.15
    price = tickWalk(price + pull, endPrice, rand, intervalMs < 3600000 ? 1 : 0.6)
    points.push({ time: t, price: Number(price.toFixed(2)) })
  }

  points[points.length - 1] = { time: endTime, price: endPrice }
  return points
}

function downsample(points: PricePoint[], max: number): PricePoint[] {
  if (points.length <= max) return points
  const step = (points.length - 1) / (max - 1)
  const out: PricePoint[] = []
  for (let i = 0; i < max; i++) {
    out.push(points[Math.round(i * step)])
  }
  return out
}

function buildStaticSeries(symbol: string, range: ChartRange, anchorPrice: number): PricePoint[] {
  const now = Date.now()
  const start = now - MS[range]
  const interval = INTERVAL[range]
  const synth = synthesize(symbol, anchorPrice, now, start, interval)
  const maxPts = range === '6M' ? 200 : range === '1M' ? 90 : 150
  return downsample(synth, maxPts)
}

const staticCache = new Map<string, Partial<Record<ChartRange, PricePoint[]>>>()

/** Long-range charts: fixed at first view per symbol — not tied to live ticks. */
export function getStaticChartSeries(symbol: string, range: ChartRange, anchorPrice: number): PricePoint[] {
  let entry = staticCache.get(symbol)
  if (!entry) {
    entry = {}
    staticCache.set(symbol, entry)
  }
  if (!entry[range]) {
    entry[range] = buildStaticSeries(symbol, range, anchorPrice)
  }
  return entry[range]!
}

export function clearStaticChartCache(symbol?: string) {
  if (symbol) staticCache.delete(symbol)
  else staticCache.clear()
}

/** Live intraday — updates every tick. */
export function build1DSeries(stock: Stock): PricePoint[] {
  const now = Date.now()
  const live = stock.history.length > 0 ? stock.history : [{ time: now, price: stock.price }]
  return downsample(live, 120)
}

export function buildSeriesForRange(stock: Stock, range: ChartRange): PricePoint[] {
  if (range === '1D') return build1DSeries(stock)
  return getStaticChartSeries(stock.symbol, range, stock.price)
}

export function formatChartTime(ts: number, range: ChartRange): string {
  const d = new Date(ts)
  if (range === '1D') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  if (range === '5D') {
    return d.toLocaleString([], { weekday: 'short', hour: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function rangeChangePct(series: PricePoint[]): number {
  if (series.length < 2) return 0
  const first = series[0].price
  const last = series[series.length - 1].price
  if (first === 0) return 0
  return ((last - first) / first) * 100
}

export { LONG_RANGES }
