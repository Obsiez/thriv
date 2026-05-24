import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Gamepad2,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { DAILY_QUESTS, QUESTS } from '../data/quests'
import { ACHIEVEMENTS } from '../data/achievements'
import { formatCurrency, formatPercent } from '../lib/marketEngine'
import { portfolioGainPct } from '../lib/questChecks'
import { countClaimableQuests, isQuestClaimable } from '../lib/questState'
import { STARTING_CASH } from '../data/stocks'
import { LevelProfile } from './LevelProfile'
import { IconBadge } from './IconBadge'
import { MarketPulse } from './MarketPulse'
import type { PlayerProgress, Portfolio, Stock, TabId } from '../types'

interface HomeDashboardProps {
  progress: PlayerProgress
  totalValue: number
  stocks: Stock[]
  portfolio: Portfolio
  selectedSymbol?: string
  onTab: (tab: TabId) => void
  onClaimQuest: (id: string) => void
  onClaimAll?: () => void
  marketOpen: boolean
}

export function HomeDashboard({
  progress,
  totalValue,
  stocks,
  portfolio,
  selectedSymbol,
  onTab,
  onClaimQuest,
  onClaimAll,
  marketOpen,
}: HomeDashboardProps) {
  const gain = portfolioGainPct(totalValue)
  const ctx = { portfolio, stocks, progress, selectedSymbol, portfolioValue: totalValue }
  const claimableCount = countClaimableQuests(ctx)
  const claimable = progress.quests.filter((q) => isQuestClaimable(q.id, ctx))
  const activeQuests = progress.quests.filter((q) => !q.completed).slice(0, 3)
  const dailyDef = DAILY_QUESTS.find((d) => d.id === progress.dailyQuestId)
  const dailyProg = progress.dailyQuestId
    ? progress.quests.find((q) => q.id === progress.dailyQuestId)
    : null

  const quickActions = [
    { tab: 'market' as TabId, label: 'Markets', icon: TrendingUp },
    { tab: 'trade' as TabId, label: 'Trade', icon: Target },
    { tab: 'activities' as TabId, label: 'Activities', icon: Gamepad2 },
    { tab: 'quests' as TabId, label: 'Missions', icon: Trophy },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <LevelProfile progress={progress} />
      <MarketPulse stocks={stocks} />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {quickActions.map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTab(tab)}
            className="glass group flex min-h-[76px] sm:min-h-[84px] flex-col justify-between rounded-xl border border-white/[0.06] p-3 sm:p-4 text-left touch-manipulation transition-colors hover:border-thriv-700/30"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-surface-900/80 text-thriv-400 transition-colors group-hover:border-thriv-600/30">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="font-display text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass rounded-xl border border-white/[0.06] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Portfolio value
          </p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-semibold text-thriv-300">
            {formatCurrency(totalValue)}
          </p>
          <p className={`mt-1 font-mono text-sm ${gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatPercent(gain)} vs {formatCurrency(STARTING_CASH)}
          </p>
        </div>
        <div className="glass rounded-xl border border-white/[0.06] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Simulation
          </p>
          <p className="mt-1 font-display text-base font-semibold">
            {marketOpen ? (
              <span className="inline-flex items-center gap-2 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="text-slate-400">Paused</span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {progress.stats.totalTrades} executions · {progress.achievements.length}/
            {ACHIEVEMENTS.length} credentials
          </p>
        </div>
      </div>

      {dailyDef && (
        <div className="glass rounded-xl border border-amber-600/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 min-w-0">
              <IconBadge name={dailyDef.icon} variant="achievement" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/90">
                  Daily objective
                </p>
                <p className="mt-0.5 font-display font-semibold text-sm">{dailyDef.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{dailyDef.description}</p>
              </div>
            </div>
            {dailyDef && isQuestClaimable(dailyDef.id, ctx) ? (
              <button
                type="button"
                onClick={() => onClaimQuest(dailyDef.id)}
                className="shrink-0 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs font-semibold text-amber-200 touch-manipulation min-h-[40px]"
              >
                +{dailyDef.xpReward} XP
              </button>
            ) : dailyProg?.claimed ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" /> Done
              </span>
            ) : (
              <span className="text-xs font-mono text-amber-400/80 shrink-0">
                +{dailyDef.xpReward}
              </span>
            )}
          </div>
        </div>
      )}

      {claimableCount > 0 && (
        <div className="rounded-xl border border-thriv-600/25 bg-thriv-950/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-thriv-300">
              {claimableCount} reward{claimableCount > 1 ? 's' : ''} ready to claim
            </p>
            {onClaimAll && claimableCount > 1 && (
              <button
                type="button"
                onClick={onClaimAll}
                className="rounded-lg border border-thriv-600/40 bg-thriv-800/60 px-3 py-1.5 text-xs font-semibold touch-manipulation min-h-[36px]"
              >
                Claim all
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {claimable.map((q) => {
              const def = QUESTS.find((x) => x.id === q.id) ?? DAILY_QUESTS.find((x) => x.id === q.id)
              if (!def) return null
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onClaimQuest(q.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-thriv-600/40 bg-thriv-800/50 px-3 py-2 text-xs font-semibold touch-manipulation min-h-[40px]"
                >
                  <IconBadge name={def.icon} size="sm" />
                  +{def.xpReward} XP
                </button>
              )
            })}
          </div>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold tracking-tight">Active missions</h2>
          <button
            type="button"
            onClick={() => onTab('quests')}
            className="flex items-center gap-1 text-xs text-thriv-400 touch-manipulation min-h-[44px] px-2"
          >
            View all <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="space-y-2">
          {activeQuests.length === 0 ? (
            <p className="glass rounded-xl p-6 text-center text-slate-500 text-sm border border-white/[0.06]">
              All missions complete. Explore Activities for additional drills.
            </p>
          ) : (
            activeQuests.map((qp) => {
              const def = QUESTS.find((q) => q.id === qp.id)
              if (!def) return null
              return (
                <div
                  key={qp.id}
                  className="glass flex gap-3 rounded-xl border border-white/[0.06] p-3 sm:p-4"
                >
                  <IconBadge name={def.icon} variant="quest" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{def.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{def.description}</p>
                    <p className="mt-1 text-[10px] font-mono text-thriv-500/80">
                      +{def.xpReward} XP
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={() => onTab('learn')}
        className="glass flex w-full items-center justify-between rounded-xl border border-white/[0.06] p-4 touch-manipulation min-h-[56px] hover:border-white/10"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-surface-900/80">
            <BookOpen className="h-4 w-4 text-thriv-400" strokeWidth={1.75} />
          </span>
          <span className="text-sm font-medium">Curriculum & glossary</span>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
      </button>
    </div>
  )
}
