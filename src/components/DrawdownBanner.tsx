import { AlertTriangle, TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercent } from '../lib/marketEngine'

interface DrawdownBannerProps {
  portfolioValue: number
  peakValue: number
  dayStartValue: number
}

export function DrawdownBanner({ portfolioValue, peakValue, dayStartValue }: DrawdownBannerProps) {
  const fromPeak = peakValue > 0 ? ((portfolioValue - peakValue) / peakValue) * 100 : 0
  const dayLoss = portfolioValue - dayStartValue
  const showPeak = fromPeak <= -1.5
  const showDay = dayLoss < -500 && !showPeak

  if (!showPeak && !showDay) return null

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        showPeak
          ? 'border-red-500/25 bg-red-950/25 text-red-200/90'
          : 'border-amber-600/20 bg-amber-950/20 text-amber-200/90'
      }`}
      role="status"
    >
      {showPeak ? (
        <TrendingDown className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} />
      )}
      <div className="min-w-0">
        {showPeak ? (
          <>
            <p className="font-semibold">Portfolio drawdown</p>
            <p className="text-xs mt-0.5 opacity-90">
              You are {formatPercent(fromPeak)} below your session peak ({formatCurrency(peakValue)}).
              Review sizing and conviction before adding risk.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">Session in the red</p>
            <p className="text-xs mt-0.5 opacity-90">
              Down {formatCurrency(Math.abs(dayLoss))} since today&apos;s open. Slow down — revenge
              trading amplifies losses.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
