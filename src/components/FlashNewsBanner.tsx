import { Radio } from 'lucide-react'
import type { MarketNews } from '../types'

interface FlashNewsBannerProps {
  news: MarketNews | null
}

export function FlashNewsBanner({ news }: FlashNewsBannerProps) {
  if (!news?.flash) return null

  const up = news.sentiment === 'bullish'
  const down = news.sentiment === 'bearish'

  return (
    <div
      className={`mx-auto w-full max-w-[1600px] px-3 pt-2 lg:px-6 ${
        down ? 'flash-news-down' : up ? 'flash-news-up' : ''
      }`}
      role="alert"
    >
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${
          down
            ? 'border-red-500/35 bg-red-950/30'
            : up
              ? 'border-emerald-500/30 bg-emerald-950/25'
              : 'border-amber-500/30 bg-amber-950/25'
        }`}
      >
        <Radio className="h-4 w-4 shrink-0 mt-0.5 text-amber-400 animate-pulse" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
            News flash
          </p>
          <p className="text-sm font-medium text-slate-100 leading-snug">{news.headline}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {news.symbols.join(', ')}{' '}
            {news.sentiment !== 'neutral' && (
              <span
                className={`font-mono font-semibold ${
                  up ? 'text-emerald-400' : down ? 'text-red-400' : ''
                }`}
              >
                ({up ? '+' : down ? '-' : ''}{(news.impactPct != null ? news.impactPct : 3.0).toFixed(2)}%)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
