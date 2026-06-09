import { Newspaper, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { MarketNews } from '../types'

interface NewsPanelProps {
  news: MarketNews[]
  compact?: boolean
}

const sentimentIcon = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
}

const sentimentColor = {
  bullish: 'text-emerald-400',
  bearish: 'text-red-400',
  neutral: 'text-slate-400',
}

export function NewsPanel({ news, compact }: NewsPanelProps) {
  const list = compact ? news.slice(0, 5) : news

  return (
    <div className={compact ? '' : 'space-y-4'}>
      {!compact && (
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Newspaper className="h-5 w-5 text-thriv-400" />
          Market news (simulated)
        </h3>
      )}
      <div className={`space-y-3 ${compact ? '' : ''}`}>
        {list.map((n) => {
          const Icon = sentimentIcon[n.sentiment]
          return (
            <article
              key={n.id}
              className={`glass rounded-lg p-4 transition-colors hover:border-thriv-800/40 ${
                n.flash
                  ? n.sentiment === 'bearish'
                    ? 'border-red-500/25 ring-1 ring-red-500/10'
                    : 'border-emerald-500/20 ring-1 ring-emerald-500/10'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${sentimentColor[n.sentiment]}`} />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-200 leading-snug">
                    {n.flash && (
                      <span className="mr-2 text-[10px] font-bold uppercase text-amber-400">
                        Flash
                      </span>
                    )}
                    {n.headline}
                  </h4>
                  {!compact && (
                    <p className="mt-1 text-sm text-slate-500">{n.summary}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-400">
                      {n.symbols.join(', ')}{' '}
                      {n.sentiment !== 'neutral' && (
                        <span
                          className={`font-semibold ${
                            n.sentiment === 'bullish' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          ({n.sentiment === 'bullish' ? '+' : '-'}{(n.impactPct != null ? n.impactPct : 0.35).toFixed(2)}%)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
