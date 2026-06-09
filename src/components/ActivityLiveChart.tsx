import { useMemo } from 'react'
import type { PricePoint } from '../types'
import { TradingChart } from './TradingChart'

interface ActivityLiveChartProps {
  data: PricePoint[]
  up?: boolean
  referencePrice?: number
  className?: string
}

export function ActivityLiveChart({
  data,
  up = true,
  referencePrice,
  className,
}: ActivityLiveChartProps) {
  const color = up ? '#34d399' : '#f87171'

  const chartData = useMemo(() => {
    if (data.length >= 2) return data
    if (data.length === 1) {
      return [
        { time: data[0].time - 1000, price: data[0].price },
        data[0],
      ]
    }
    return data
  }, [data])

  return (
    <div className={className}>
      <TradingChart
        data={chartData}
        color={color}
        range="1D"
        liveTail
        referencePrice={referencePrice}
        compact
        className="h-44 sm:h-48"
      />
    </div>
  )
}

/** Build PricePoint series from raw prices (500ms ticks). */
export function pricesToSeries(prices: number[], tickMs = 500): PricePoint[] {
  const now = Date.now()
  const start = now - prices.length * tickMs
  return prices.map((price, i) => ({
    time: start + i * tickMs,
    price,
  }))
}
