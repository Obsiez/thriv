import { useEffect, useMemo } from 'react'
import { Check, Gift, Lock, Sparkles } from 'lucide-react'
import { getDisplayedCredential } from '../lib/credentialBadge'
import { DAILY_QUESTS, QUESTS } from '../data/quests'
import { ACHIEVEMENTS } from '../data/achievements'
import {
  countClaimableQuests,
  getQuestRecord,
  isQuestClaimable,
} from '../lib/questState'
import type { QuestCheckContext } from '../lib/questChecks'
import { IconBadge } from './IconBadge'
import type { PlayerProgress, Portfolio, Stock } from '../types'

interface QuestHubProps {
  progress: PlayerProgress
  portfolio: Portfolio
  stocks: Stock[]
  portfolioValue: number
  selectedSymbol?: string
  onClaim: (id: string) => void
  onClaimAll: () => void
  onSyncQuests: () => void
  onSelectCredential: (id: string | null) => void
}

const CATEGORIES = ['tutorial', 'trading', 'learning', 'challenge', 'daily'] as const

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  tutorial: 'Onboarding',
  trading: 'Execution',
  learning: 'Research',
  challenge: 'Performance',
  daily: 'Daily objective',
}

export function QuestHub({
  progress,
  portfolio,
  stocks,
  portfolioValue,
  selectedSymbol,
  onClaim,
  onClaimAll,
  onSyncQuests,
  onSelectCredential,
}: QuestHubProps) {
  const displayed = getDisplayedCredential(
    progress.achievements,
    progress.displayCredentialId
  )
  const selectedId = progress.displayCredentialId ?? null
  const ctx: QuestCheckContext = useMemo(
    () => ({ portfolio, stocks, progress, selectedSymbol, portfolioValue }),
    [portfolio, stocks, progress, selectedSymbol, portfolioValue]
  )

  useEffect(() => {
    onSyncQuests()
  }, [onSyncQuests])

  const dailyId = progress.dailyQuestId
  const allQuests = [
    ...QUESTS,
    ...(dailyId ? [DAILY_QUESTS.find((d) => d.id === dailyId)!].filter(Boolean) : []),
  ]

  const claimableCount = countClaimableQuests(ctx)
  const completed = progress.quests.filter((q) => q.completed || q.claimed).length
  const totalXpAvailable = allQuests
    .filter((def) => isQuestClaimable(def.id, ctx))
    .reduce((sum, def) => sum + def.xpReward, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">Missions</h1>
          <p className="text-sm text-slate-400 mt-1">
            {completed} of {allQuests.length} tracked · Earn XP to advance your analyst rank.
          </p>
        </div>
        {claimableCount > 0 && (
          <button
            type="button"
            onClick={onClaimAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-thriv-600/50 bg-thriv-800/70 px-4 py-2.5 text-sm font-semibold text-thriv-100 touch-manipulation min-h-[44px] shadow-sm hover:bg-thriv-700/80 transition-colors"
          >
            <Gift className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            Claim all ({claimableCount}) · +{totalXpAvailable} XP
          </button>
        )}
      </div>

      {claimableCount > 0 && (
        <div className="rounded-xl border border-thriv-600/25 bg-thriv-950/40 px-4 py-3 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-thriv-400 shrink-0" strokeWidth={1.75} />
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-thriv-300">{claimableCount} reward{claimableCount > 1 ? 's' : ''}</span>{' '}
            ready — tap Claim on each mission or use Claim all above.
          </p>
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const items = allQuests.filter((q) => q.category === cat)
        if (items.length === 0) return null
        return (
          <section key={cat}>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="space-y-2">
              {items.map((def) => {
                const qp = getQuestRecord(progress, def.id)
                const claimable = isQuestClaimable(def.id, ctx)
                const claimed = qp.claimed

                return (
                  <div
                    key={def.id}
                    className={`glass rounded-xl border p-3 sm:p-4 ${
                      claimable ? 'border-thriv-600/35 ring-1 ring-thriv-600/15' : 'border-white/[0.06]'
                    }`}
                  >
                    <div className="flex gap-3">
                      <IconBadge name={def.icon} variant="quest" size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold text-sm">{def.title}</p>
                          <span className="font-mono text-[10px] text-thriv-400/90 shrink-0">
                            +{def.xpReward} XP
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{def.description}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{def.hint}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      {claimed ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> Claimed
                        </span>
                      ) : claimable ? (
                        <button
                          type="button"
                          onClick={() => onClaim(def.id)}
                          className="rounded-lg border border-thriv-500/60 bg-thriv-700/80 px-4 py-2 text-xs font-semibold text-white touch-manipulation min-h-[44px] hover:bg-thriv-600/90 active:scale-[0.98] transition-all"
                        >
                          Claim +{def.xpReward} XP
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Lock className="h-3 w-3" strokeWidth={1.75} /> In progress
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <section>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-base font-semibold tracking-tight">Credentials</h2>
          <p className="text-[10px] text-slate-500">
            Tap an unlocked badge to show it on the leaderboard
          </p>
        </div>
        {displayed && (
          <p className="mb-3 text-xs text-slate-400">
            Showing: <span className="text-thriv-300 font-medium">{displayed.title}</span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = progress.achievements.includes(a.id)
            const equipped = unlocked && selectedId === a.id
            const autoPick =
              unlocked && !selectedId && displayed?.id === a.id

            if (!unlocked) {
              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-white/[0.04] bg-surface-900/40 p-3 text-center opacity-45"
                >
                  <div className="flex justify-center">
                    <IconBadge name={a.icon} variant="muted" size="md" />
                  </div>
                  <p className="mt-2 text-xs font-semibold">{a.title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{a.description}</p>
                </div>
              )
            }

            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  onSelectCredential(equipped ? null : a.id)
                }
                className={`rounded-xl border p-3 text-center transition-all touch-manipulation ${
                  equipped
                    ? 'border-thriv-500 ring-2 ring-thriv-500/40 bg-thriv-950/40'
                    : autoPick
                      ? 'border-thriv-700/50 bg-thriv-950/30'
                      : 'border-thriv-700/30 bg-thriv-950/25 hover:border-thriv-600/50'
                }`}
              >
                <div className="flex justify-center relative">
                  <IconBadge name={a.icon} variant="achievement" size="md" />
                  {(equipped || autoPick) && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-thriv-600 text-[8px] font-bold text-white">
                      {equipped ? '✓' : '★'}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs font-semibold">{a.title}</p>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{a.description}</p>
                <p className="mt-1.5 text-[9px] uppercase tracking-wider text-thriv-400/90">
                  {equipped ? 'Selected' : autoPick ? 'Default' : 'Select'}
                </p>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
