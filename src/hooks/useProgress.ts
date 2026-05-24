import { useCallback, useEffect, useState } from 'react'
import { ACHIEVEMENTS } from '../data/achievements'
import { haptic } from '../lib/haptics'
import { getDisplayedCredential, sanitizeDisplayCredential } from '../lib/credentialBadge'
import { DAILY_QUESTS, QUESTS } from '../data/quests'
import { portfolioGainPct, allMainQuestsDone, countCompletedQuests, isQuestComplete } from '../lib/questChecks'
import { ensureQuestEntry, isQuestClaimable, syncQuestEntries } from '../lib/questState'
import {
  levelFromXp,
  titleForLevel,
  todayKey,
  xpProgressInLevel,
} from '../lib/progression'
import { pickDailyQuest } from '../lib/progressStorage'
import { getWeeklyChallenge } from '../data/weeklyChallenges'
import {
  DAILY_LOGIN_XP,
  dailyBonusAvailable,
  ensureWeeklyChallenge,
} from '../lib/retention'
import { bumpWeekStat, resetDayBaseline } from '../lib/weekStats'
import { mergeProfilePrefs } from '../lib/profileTheme'
import {
  loadProgressForUser,
  resetLocalForUser,
  saveProgressForUser,
} from '../lib/userStorage'
import type { ChartRange } from '../lib/chartSeries'
import type { Portfolio, PlayerProgress, Stock } from '../types'

interface UseProgressOptions {
  portfolio: Portfolio
  stocks: Stock[]
  portfolioValue: number
  selectedSymbol?: string
  userId: string | null
  guest: boolean
  initial?: PlayerProgress | null
}

export function useProgress({
  portfolio,
  stocks,
  portfolioValue,
  selectedSymbol,
  userId,
  guest,
  initial,
}: UseProgressOptions) {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const base = initial ?? loadProgressForUser(userId, guest)
    return ensureWeeklyChallenge({ ...base, profile: mergeProfilePrefs(base.profile) })
  })
  const [celebration, setCelebration] = useState<string | null>(null)

  useEffect(() => {
    if (initial) setProgress(initial)
  }, [initial])

  useEffect(() => {
    saveProgressForUser(progress, userId, guest)
  }, [progress, userId, guest])

  useEffect(() => {
    const today = todayKey()
    setProgress((prev) => {
      let next = { ...prev }
      if (prev.lastVisitDate !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yKey = yesterday.toISOString().slice(0, 10)
        const streak = prev.lastVisitDate === yKey ? prev.streak + 1 : 1
        next = {
          ...next,
          streak,
          lastVisitDate: today,
          dailyQuestId: pickDailyQuest(),
          dailyQuestDate: today,
        }
      }
      if (next.dailyQuestDate !== today) {
        next.dailyQuestId = pickDailyQuest()
        next.dailyQuestDate = today
      }
      next.stats.portfolioPeak = Math.max(next.stats.portfolioPeak, portfolioValue)
      const gain = portfolioGainPct(portfolioValue)
      next.stats.bestProfitPct = Math.max(next.stats.bestProfitPct, gain)
      next.stats.holdingsCountMax = Math.max(
        next.stats.holdingsCountMax,
        portfolio.holdings.length
      )
      next.stats = resetDayBaseline(next.stats, portfolioValue, today)
      return ensureWeeklyChallenge(next)
    })
  }, [portfolioValue, portfolio.holdings.length])

  const visitTab = useCallback((tab: string) => {
    setProgress((prev) => ({
      ...prev,
      tabsVisited: prev.tabsVisited.includes(tab) ? prev.tabsVisited : [...prev.tabsVisited, tab],
    }))
  }, [])

  const buildCtx = useCallback(
    (p: PlayerProgress) => ({
      portfolio,
      stocks,
      progress: p,
      selectedSymbol,
      portfolioValue,
    }),
    [portfolio, stocks, selectedSymbol, portfolioValue]
  )

  const syncQuests = useCallback(() => {
    setProgress((prev) => {
      const { quests, changed } = syncQuestEntries(prev.quests, buildCtx(prev))
      return changed ? { ...prev, quests } : prev
    })
  }, [buildCtx])

  useEffect(() => {
    syncQuests()
  }, [syncQuests])

  const claimQuest = useCallback(
    (questId: string) => {
      const def = [...QUESTS, ...DAILY_QUESTS].find((q) => q.id === questId)
      if (!def) return

      setProgress((prev) => {
        const ctx = buildCtx(prev)
        if (!isQuestClaimable(questId, ctx)) return prev

        let quests = ensureQuestEntry(prev.quests, questId)
        const idx = quests.findIndex((x) => x.id === questId)
        quests = quests.map((x, i) =>
          i === idx
            ? {
                ...x,
                completed: true,
                claimed: true,
                completedAt: x.completedAt ?? Date.now(),
              }
            : x
        )

        const xp = prev.xp + def.xpReward
        haptic('success')
        setCelebration(`+${def.xpReward} XP — ${def.title}`)
        setTimeout(() => setCelebration(null), 2800)
        return { ...prev, quests, xp, level: levelFromXp(xp) }
      })
    },
    [buildCtx]
  )

  const claimAllQuests = useCallback(() => {
    setProgress((prev) => {
      const ctx = buildCtx(prev)
      let quests = [...prev.quests]
      let xp = prev.xp
      let claimedAny = false
      const defs = [
        ...QUESTS,
        ...(prev.dailyQuestId
          ? DAILY_QUESTS.filter((d) => d.id === prev.dailyQuestId)
          : []),
      ]

      for (const def of defs) {
        const idx = quests.findIndex((x) => x.id === def.id)
        const entry =
          idx >= 0
            ? quests[idx]
            : { id: def.id, completed: false, claimed: false }
        const done = entry.completed || isQuestComplete(def.id, ctx)
        if (!done || entry.claimed) continue

        if (idx < 0) {
          quests.push({
            id: def.id,
            completed: true,
            claimed: true,
            completedAt: Date.now(),
          })
        } else {
          quests[idx] = {
            ...entry,
            completed: true,
            claimed: true,
            completedAt: entry.completedAt ?? Date.now(),
          }
        }
        xp += def.xpReward
        claimedAny = true
      }

      if (!claimedAny) return prev
      haptic('success')
      setCelebration('Rewards claimed!')
      setTimeout(() => setCelebration(null), 2800)
      return { ...prev, quests, xp, level: levelFromXp(xp) }
    })
  }, [buildCtx])

  const addXp = useCallback((amount: number, reason?: string) => {
    setProgress((prev) => {
      const xp = prev.xp + amount
      if (reason) {
        setCelebration(`+${amount} XP — ${reason}`)
        setTimeout(() => setCelebration(null), 2500)
      }
      return { ...prev, xp, level: levelFromXp(xp) }
    })
  }, [])

  const onTrade = useCallback((side: 'buy' | 'sell', type: 'market' | 'limit') => {
    setProgress((prev) => ({
      ...prev,
      stats: bumpWeekStat(
        {
          ...prev.stats,
          totalTrades: prev.stats.totalTrades + 1,
          buyOrders: prev.stats.buyOrders + (side === 'buy' ? 1 : 0),
          sellOrders: prev.stats.sellOrders + (side === 'sell' ? 1 : 0),
          limitOrders: prev.stats.limitOrders + (type === 'limit' ? 1 : 0),
        },
        'tradesThisWeek',
        'weekTradeKey'
      ),
    }))
  }, [])

  const onMarginBorrow = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      stats: { ...prev.stats, marginUsed: true },
    }))
  }, [])

  const onLiquidation = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        liquidationCount: (prev.stats.liquidationCount ?? 0) + 1,
      },
    }))
  }, [])

  const onRealizedLoss = useCallback((lossAmount: number) => {
    setProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        largestSingleLoss: Math.max(prev.stats.largestSingleLoss ?? 0, lossAmount),
      },
    }))
  }, [])

  const claimDailyBonus = useCallback(() => {
    setProgress((prev) => {
      if (!dailyBonusAvailable(prev)) return prev
      const xp = prev.xp + DAILY_LOGIN_XP
      setCelebration(`+${DAILY_LOGIN_XP} XP — Daily login`)
      setTimeout(() => setCelebration(null), 2800)
      return {
        ...prev,
        dailyBonusDate: todayKey(),
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [])

  const claimWeeklyReward = useCallback(() => {
    setProgress((prev) => {
      const def = getWeeklyChallenge(prev.weeklyChallengeId)
      const done = def.isComplete({
        progress: prev,
        portfolio,
        stocks,
        portfolioValue,
      })
      if (!done || prev.weeklyChallengeDone) return prev
      const xp = prev.xp + def.xpReward
      setCelebration(`+${def.xpReward} XP — ${def.title}`)
      setTimeout(() => setCelebration(null), 2800)
      return {
        ...prev,
        weeklyChallengeDone: true,
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [portfolio, stocks, portfolioValue])

  const onWatchlistAdd = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      stats: { ...prev.stats, watchlistAdds: prev.stats.watchlistAdds + 1 },
    }))
  }, [])

  const onQuizPass = useCallback((quizId: string, scorePct: number) => {
    setProgress((prev) => {
      const passed = scorePct >= 80
      const quizzesPassed = passed
        ? [...new Set([...prev.quizzesPassed, quizId])]
        : prev.quizzesPassed
      const xp = passed ? prev.xp + Math.round(scorePct * 0.5) : prev.xp
      let stats = prev.stats
      if (passed) {
        stats = bumpWeekStat(stats, 'quizzesThisWeek', 'quizWeekKey')
      }
      return {
        ...prev,
        quizzesPassed,
        stats,
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [])

  const onScenarioComplete = useCallback((xp: number) => {
    setProgress((prev) => {
      const total = prev.xp + xp
      return {
        ...prev,
        scenariosCompleted: prev.scenariosCompleted + 1,
        xp: total,
        level: levelFromXp(total),
      }
    })
  }, [])

  const onSectorSprintComplete = useCallback((correct: number) => {
    setProgress((prev) => {
      const best = Math.max(prev.stats.sectorSprintScore, correct)
      const xp = prev.xp + correct * 12
      return {
        ...prev,
        lastSprintDate: todayKey(),
        stats: bumpWeekStat(
          { ...prev.stats, sectorSprintScore: best },
          'sprintsThisWeek',
          'sprintWeekKey'
        ),
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [])

  const onCompareUsed = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      stats: { ...prev.stats, compareToolUsed: true },
    }))
  }, [])

  const onPositionSizerUsed = useCallback(() => {
    setProgress((prev) => {
      const uses = prev.positionSizerUses + 1
      return {
        ...prev,
        positionSizerUses: uses,
        stats: { ...prev.stats, positionSizerUsed: true },
      }
    })
  }, [])

  const onChartRangeView = useCallback(
    (range: ChartRange) => {
      setProgress((prev) => {
        const used = prev.stats.chartRangesUsed ?? []
        const nextUsed = used.includes(range) ? used : [...used, range]
        const tabKey = `chart-${range}`
        const tabsVisited = prev.tabsVisited.includes(tabKey)
          ? prev.tabsVisited
          : [...prev.tabsVisited, tabKey]
        return {
          ...prev,
          tabsVisited,
          stats: { ...prev.stats, chartRangesUsed: nextUsed },
        }
      })
    },
    []
  )

  const onFlashQuotesComplete = useCallback((correct: number) => {
    setProgress((prev) => {
      const best = Math.max(prev.stats.flashQuotesBest ?? 0, correct)
      const xp = prev.xp + correct * 8
      return {
        ...prev,
        stats: { ...prev.stats, flashQuotesBest: best },
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [])

  const onPrediction = useCallback((won: boolean) => {
    setProgress((prev) => {
      const predictionsWon = prev.predictionsWon + (won ? 1 : 0)
      const predictionsTotal = prev.predictionsTotal + 1
      const bonus = won ? 15 : 5
      const xp = prev.xp + bonus
      let stats = prev.stats
      if (won) {
        stats = bumpWeekStat(stats, 'predictorWinsThisWeek', 'predictorWeekKey')
      }
      return {
        ...prev,
        predictionsWon,
        predictionsTotal,
        stats,
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [])

  const checkAchievements = useCallback(() => {
    setProgress((prev) => {
      const unlock: string[] = []
      const completed = countCompletedQuests(prev)
      const gain = portfolioGainPct(portfolioValue)

      const checks: [string, boolean][] = [
        ['level-5', prev.level >= 5],
        ['level-10', prev.level >= 10],
        ['trades-10', prev.stats.totalTrades >= 10],
        ['trades-25', prev.stats.totalTrades >= 25],
        ['streak-3', prev.streak >= 3],
        ['streak-7', prev.streak >= 7],
        ['quests-5', completed >= 5],
        ['quests-all', allMainQuestsDone(prev)],
        ['profit-5pct', gain >= 5],
        ['scenarios-5', prev.scenariosCompleted >= 5],
        ['sprint-master', prev.stats.sectorSprintScore >= 8],
        ['risk-aware', prev.positionSizerUses >= 3],
        ['chart-explorer', (prev.stats.chartRangesUsed ?? []).length >= 4],
        ['flash-hot', (prev.stats.flashQuotesBest ?? 0) >= 7],
        ['lesson-first-loss', (prev.stats.largestSingleLoss ?? 0) > 0],
        ['lesson-liquidated', (prev.stats.liquidationCount ?? 0) >= 1],
        [
          'lesson-drawdown',
          prev.stats.portfolioPeak > 0 &&
            portfolioValue < prev.stats.portfolioPeak * 0.95,
        ],
        ['lesson-margin', prev.stats.marginUsed === true],
        ['lesson-panic-sell', (prev.stats.largestSingleLoss ?? 0) >= 2000],
      ]

      for (const [id, ok] of checks) {
        if (ok && !prev.achievements.includes(id)) unlock.push(id)
      }

      if (unlock.length === 0) return prev
      haptic('success')
      let xp = prev.xp
      for (const id of unlock) {
        const a = ACHIEVEMENTS.find((x) => x.id === id)
        if (a) xp += a.xpBonus
      }
      const nextAchievements = [...prev.achievements, ...unlock]
      const credential = getDisplayedCredential(
        nextAchievements,
        sanitizeDisplayCredential(nextAchievements, prev.displayCredentialId)
      )
      setCelebration(
        credential
          ? `Credential upgraded: ${credential.title}`
          : 'Achievement unlocked'
      )
      setTimeout(() => setCelebration(null), 3200)
      return {
        ...prev,
        achievements: nextAchievements,
        displayCredentialId: sanitizeDisplayCredential(
          nextAchievements,
          prev.displayCredentialId
        ),
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [portfolioValue])

  useEffect(() => {
    checkAchievements()
  }, [
    progress.stats.totalTrades,
    progress.streak,
    progress.scenariosCompleted,
    progress.quests,
    progress.level,
    portfolioValue,
    checkAchievements,
  ])

  const setDisplayCredential = useCallback((id: string | null) => {
    setProgress((prev) => {
      const nextId = id ? sanitizeDisplayCredential(prev.achievements, id) : null
      if (nextId === (prev.displayCredentialId ?? null)) return prev
      haptic('success')
      return { ...prev, displayCredentialId: nextId }
    })
  }, [])

  const reset = useCallback(() => {
    const fresh = resetLocalForUser(userId, guest).progress
    setProgress(fresh)
    return fresh
  }, [userId, guest])

  const xpBar = xpProgressInLevel(progress.xp)

  return {
    progress,
    celebration,
    xpBar,
    title: titleForLevel(progress.level),
    visitTab,
    claimQuest,
    claimAllQuests,
    syncQuests,
    setDisplayCredential,
    addXp,
    onTrade,
    onWatchlistAdd,
    onQuizPass,
    onScenarioComplete,
    onPrediction,
    onSectorSprintComplete,
    onCompareUsed,
    onPositionSizerUsed,
    onChartRangeView,
    onFlashQuotesComplete,
    claimDailyBonus,
    claimWeeklyReward,
    onRealizedLoss,
    onMarginBorrow,
    onLiquidation,
    reset,
    setProgress,
  }
}
