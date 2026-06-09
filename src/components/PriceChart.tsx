import { useEffect, useMemo, useRef, useState } from 'react'
import { clearStaticChartCache } from '../lib/chartSeries'
import type { Stock, Order } from '../types'
import { changePercent, formatCurrency, formatPercent } from '../lib/marketEngine'
import {
  build1DSeries,
  CHART_RANGES,
  getStaticChartSeries,
  rangeChangePct,
  type ChartRange,
} from '../lib/chartSeries'
import { TradingChart } from './TradingChart'

interface PriceChartProps {
  stock: Stock
  onRangeView?: (range: ChartRange) => void
  orders?: Order[]
  showVolume?: boolean
}

export function PriceChart({ stock, onRangeView, orders = [], showVolume }: PriceChartProps) {
  const [range, setRange] = useState<ChartRange>('1D')
  const anchorRef = useRef(stock.price)

  useEffect(() => {
    anchorRef.current = stock.price
    clearStaticChartCache(stock.symbol)
  }, [stock.symbol])

  const series1D = useMemo(
    () => build1DSeries(stock),
    [stock.symbol, stock.history, stock.price]
  )

  const seriesLong = useMemo(() => {
    if (range === '1D') return series1D
    return getStaticChartSeries(stock.symbol, range, anchorRef.current)
  }, [range, stock.symbol, series1D])

  const series = range === '1D' ? series1D : seriesLong
  const rangeCh = rangeChangePct(series)
  const dayCh = changePercent(stock)
  const up = rangeCh >= 0
  const color = up ? '#34d399' : '#f87171'

  useEffect(() => {
    onRangeView?.('1D')
  }, [stock.symbol, onRangeView])

  function selectRange(r: ChartRange) {
    setRange(r)
    onRangeView?.(r)
  }

  return (
    <div className="glass overflow-hidden rounded-xl border border-white/[0.06]">
      <div className="border-b border-white/[0.06] px-3 py-2.5 sm:px-5 sm:py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="font-display text-lg sm:text-2xl font-bold tracking-tight">
                {stock.symbol}
              </h2>
              <span className="rounded-md border border-white/[0.06] bg-surface-900/80 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-slate-500">
                {stock.sector}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 truncate">{stock.name}</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <p className="font-mono text-xl sm:text-3xl font-semibold tabular-nums tracking-tight">
              {formatCurrency(stock.price)}
            </p>
            <p className={`font-mono text-[10px] sm:text-xs tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatPercent(rangeCh)} {range}
              <span className="text-slate-600 mx-1">·</span>
              <span className="text-slate-500">{formatPercent(dayCh)} day</span>
            </p>
          </div>
        </div>

        <div className="mt-2 sm:mt-3 flex w-full max-w-full gap-0.5 rounded-lg border border-white/[0.06] bg-surface-900/80 p-0.5">
          {CHART_RANGES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => selectRange(id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] sm:text-xs font-semibold font-mono transition-colors touch-manipulation min-h-[36px] sm:min-h-[32px] sm:flex-none sm:px-3 ${
                range === id
                  ? 'bg-thriv-800 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-0.5 pt-1 pb-0 sm:px-2 sm:pt-2 sm:pb-1 -mx-0.5 sm:mx-0">
        <TradingChart
          data={series}
          color={color}
          range={range}
          liveTail={range === '1D'}
          orders={orders}
          showVolume={showVolume}
          className="h-[200px] min-h-[200px] max-h-[240px] sm:h-[280px] sm:max-h-none md:h-[300px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5 border-t border-white/[0.06] p-2.5 text-xs sm:grid-cols-4 sm:gap-3 sm:p-4">
        <Stat label="Open" value={formatCurrency(stock.open)} />
        <Stat label="Day high" value={formatCurrency(stock.dayHigh)} />
        <Stat label="Day low" value={formatCurrency(stock.dayLow)} />
        <Stat label="Prev close" value={formatCurrency(stock.previousClose)} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-surface-900/50 px-2 py-1.5 sm:px-3 sm:py-2">
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-mono text-xs sm:text-sm font-medium text-slate-200 tabular-nums truncate">
        {value}
      </p>
    </div>
  )
}
