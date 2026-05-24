import { Calendar, Flame, Gift, Target, X } from 'lucide-react'
import { getWeeklyChallenge } from '../data/weeklyChallenges'
import { DAILY_LOGIN_XP, dailyBonusAvailable } from '../lib/retention'
import { formatCurrency } from '../lib/marketEngine'
import type { PlayerProgress, Portfolio, Stock } from '../types'

interface RetentionBriefingProps {
  progress: PlayerProgress
  portfolio: Portfolio
  stocks: Stock[]
  portfolioValue: number
  onClaimDaily: () => void
  onClaimWeekly: () => void
  onDismiss: () => void
}

export function RetentionBriefing({
  progress,
  portfolio,
  stocks,
  portfolioValue,
  onClaimDaily,
  onClaimWeekly,
  onDismiss,
}: RetentionBriefingProps) {
  const canDaily = dailyBonusAvailable(progress)
  const weekly = getWeeklyChallenge(progress.weeklyChallengeId)
  const weeklyDone = weekly.isComplete({
    progress,
    portfolio,
    stocks,
    portfolioValue,
  })
  const canWeekly = weeklyDone && !progress.weeklyChallengeDone

  return (
    <div className="glass rounded-xl border border-thriv-600/20 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <p className="font-display text-sm font-semibold tracking-tight">Session briefing</p>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-surface-800 touch-manipulation"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-amber-600/20 bg-amber-950/20 px-3 py-2.5">
          <Flame className="h-5 w-5 text-amber-400 shrink-0" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-200/90">
              {progress.streak} day login streak
            </p>
            <p className="text-[10px] text-amber-200/60 mt-0.5">
              Return tomorrow to keep momentum — streak resets if you skip a day.
            </p>
          </div>
        </div>

        {canDaily && (
          <button
            type="button"
            onClick={onClaimDaily}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-thriv-600/35 bg-thriv-950/40 px-3 py-3 text-left touch-manipulation min-h-[52px] hover:border-thriv-500/50 transition-colors"
          >
            <span className="flex items-center gap-3 min-w-0">
              <Gift className="h-5 w-5 text-thriv-400 shrink-0" strokeWidth={1.75} />
              <span>
                <span className="text-sm font-semibold text-white">Daily login bonus</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">One claim per calendar day</span>
              </span>
            </span>
            <span className="font-mono text-sm font-semibold text-thriv-300 shrink-0">
              +{DAILY_LOGIN_XP} XP
            </span>
          </button>
        )}

        <div className="rounded-lg border border-white/[0.06] bg-surface-900/60 px-3 py-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400/90">
                Weekly objective
              </p>
              <p className="text-sm font-semibold mt-0.5">{weekly.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{weekly.description}</p>
              {canWeekly ? (
                <button
                  type="button"
                  onClick={onClaimWeekly}
                  className="mt-2 rounded-lg border border-indigo-500/40 bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-200 touch-manipulation min-h-[40px]"
                >
                  Claim +{weekly.xpReward} XP
                </button>
              ) : progress.weeklyChallengeDone ? (
                <p className="mt-2 text-xs text-emerald-400">Weekly reward claimed</p>
              ) : (
                <p className="mt-2 text-[10px] text-slate-600">{weekly.hint}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] px-3 py-2 text-[10px] text-slate-500">
          <Target className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span>
            Day P/L vs open:{' '}
            <span
              className={
                portfolioValue >= progress.stats.dayStartValue
                  ? 'text-emerald-400 font-mono'
                  : 'text-red-400 font-mono'
              }
            >
              {formatCurrency(portfolioValue - progress.stats.dayStartValue)}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
