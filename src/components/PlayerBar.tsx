import { Flame, Zap } from 'lucide-react'
import { xpProgressInLevel } from '../lib/progression'
import type { PlayerProgress } from '../types'

interface PlayerBarProps {
  progress: PlayerProgress
  title: string
  compact?: boolean
}

export function PlayerBar({ progress, title, compact }: PlayerBarProps) {
  const bar = xpProgressInLevel(progress.xp)

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-thriv-800 text-xs font-bold text-thriv-200">
          {progress.level}
        </div>
        <div className="min-w-0 flex-1 hidden xs:block sm:block">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-thriv-500 to-thriv-300 transition-all duration-500"
              style={{ width: `${bar.pct}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-thriv-600 to-thriv-800 font-display text-lg font-bold shadow-lg">
            {progress.level}
          </div>
          <div>
            <p className="font-display text-sm font-bold sm:text-base">{title}</p>
            <p className="text-xs text-slate-500">
              Level {progress.level} · {progress.xp.toLocaleString()} XP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-amber-950/50 px-2.5 py-1 text-amber-300">
            <Flame className="h-3.5 w-3.5" />
            {progress.streak} day streak
          </span>
          <span className="flex items-center gap-1 text-thriv-400">
            <Zap className="h-3.5 w-3.5" />
            {bar.current}/{bar.max} XP
          </span>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-900">
        <div
          className="h-full rounded-full bg-gradient-to-r from-thriv-600 via-thriv-400 to-emerald-400 transition-all duration-700"
          style={{ width: `${bar.pct}%` }}
        />
      </div>
    </div>
  )
}
