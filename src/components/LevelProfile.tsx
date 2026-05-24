import { Flame } from 'lucide-react'
import {
  getLevelInfo,
  TIER_STYLES,
  xpProgressInLevel,
} from '../lib/progression'
import type { PlayerProgress } from '../types'

interface LevelProfileProps {
  progress: PlayerProgress
  compact?: boolean
  motto?: string
}

export function LevelProfile({ progress, compact, motto }: LevelProfileProps) {
  const bar = xpProgressInLevel(progress.xp)
  const info = getLevelInfo(progress.level)
  const tier = TIER_STYLES[info.tier]

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-semibold tracking-tight ${tier.badge}`}
        >
          {info.rankCode}
        </div>
        <div className="min-w-0 flex-1 hidden sm:block">
          <p className="truncate text-[11px] font-medium text-slate-300">{info.title}</p>
          {motto && (
            <p className="truncate text-[10px] text-slate-500 italic">&ldquo;{motto}&rdquo;</p>
          )}
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tier.ring}`}
              style={{ width: `${bar.pct}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-surface-800/90 to-surface-900/95">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-30 ${tier.ring}`} />
      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-60 blur-sm ${tier.ring}`}
              />
              <div
                className={`relative flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] flex-col items-center justify-center rounded-xl border font-mono ${tier.badge}`}
              >
                <span className="text-[10px] uppercase tracking-widest opacity-70">Rank</span>
                <span className="text-sm sm:text-base font-bold tracking-tight">{info.rankCode}</span>
              </div>
            </div>
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${tier.accent}`}>
                {info.tierLabel}
              </p>
              <h2 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-white mt-0.5">
                {info.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Level {info.level}
                {info.nextTitle && (
                  <span className="text-slate-600"> · Next: {info.nextTitle}</span>
                )}
              </p>
              {motto && (
                <p className="mt-1.5 text-xs text-slate-500 italic max-w-md">&ldquo;{motto}&rdquo;</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
            <div className="flex items-center gap-1.5 rounded-md border border-white/5 bg-surface-900/60 px-2.5 py-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-500/90" strokeWidth={1.75} />
              <span className="text-xs font-medium text-slate-300">
                {progress.streak}d streak
              </span>
            </div>
            <p className="font-mono text-xs text-slate-500">
              <span className="text-slate-300">{progress.xp.toLocaleString()}</span> XP total
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
            <span>Progress to Level {info.level + 1}</span>
            <span className="font-mono normal-case tracking-normal text-slate-400">
              {bar.current} / {bar.max} XP
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-surface-950/80 ring-1 ring-white/5">
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${tier.ring}`}
              style={{ width: `${bar.pct}%` }}
            />
            <div className="absolute inset-0 flex justify-between px-0.5">
              {[25, 50, 75].map((t) => (
                <div
                  key={t}
                  className="w-px h-full bg-white/[0.06]"
                  style={{ marginLeft: `${t}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
