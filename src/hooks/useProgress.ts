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
    const normalized = {
      ...base,
      level: levelFromXp(base.xp ?? 0),
    }
    return ensureWeeklyChallenge({ ...normalized, profile: mergeProfilePrefs(normalized.profile) })
  })
  const [celebration, setCelebration] = useState<string | null>(null)

  const getXpMultiplier = useCallback(() => {
    const peak = progress?.stats?.portfolioPeak ?? 0
    const activeVal = Math.max(portfolioValue, peak)
    const deactivated = progress.profile?.deactivatedCards ?? []
    if (activeVal >= 500000 && !deactivated.includes('apex')) return 1.5
    if (activeVal >= 250000 && !deactivated.includes('zenith')) return 1.25
    return 1.0
  }, [portfolioValue, progress?.stats?.portfolioPeak, progress.profile?.deactivatedCards])


  useEffect(() => {
    if (initial) {
      setProgress((prev) => {
        // Deep compare stats
        const statsKeys = Object.keys(initial.stats) as (keyof typeof initial.stats)[]
        const statsDiff = statsKeys.some((k) => {
          const v1 = prev.stats[k]
          const v2 = initial.stats[k]
          if (Array.isArray(v1) && Array.isArray(v2)) {
            return v1.length !== v2.length || v1.some((item, i) => item !== v2[i])
          }
          return v1 !== v2
        })

        const questsDiff =
          prev.quests.length !== initial.quests.length ||
          prev.quests.some((q, i) => {
            const iq = initial.quests[i]
            return !iq || q.id !== iq.id || q.completed !== iq.completed || q.claimed !== iq.claimed
          })

        const achievementsDiff =
          prev.achievements.length !== initial.achievements.length ||
          prev.achievements.some((a, i) => a !== initial.achievements[i])

        const quizzesPassedDiff =
          prev.quizzesPassed.length !== initial.quizzesPassed.length ||
          prev.quizzesPassed.some((q, i) => q !== initial.quizzesPassed[i])

        const tabsVisitedDiff =
          prev.tabsVisited.length !== initial.tabsVisited.length ||
          prev.tabsVisited.some((t, i) => t !== initial.tabsVisited[i])

        const profileDiff =
          (prev.profile.accentId ?? 'teal') !== (initial.profile.accentId ?? 'teal') ||
          (prev.profile.motto ?? '') !== (initial.profile.motto ?? '') ||
          (initial.profile.gridCardNo && prev.profile.gridCardNo !== initial.profile.gridCardNo) ||
          (initial.profile.zenithCardNo && prev.profile.zenithCardNo !== initial.profile.zenithCardNo) ||
          (initial.profile.apexCardNo && prev.profile.apexCardNo !== initial.profile.apexCardNo) ||
          (prev.profile.maxLossThreshold ?? 0) !== (initial.profile.maxLossThreshold ?? 0) ||
          (prev.profile.pushNotificationsEnabled ?? false) !== (initial.profile.pushNotificationsEnabled ?? false)

        const otherDiff =
          prev.xp !== initial.xp ||
          prev.level !== initial.level ||
          prev.streak !== initial.streak ||
          prev.lastVisitDate !== initial.lastVisitDate ||
          prev.dailyQuestId !== initial.dailyQuestId ||
          prev.dailyQuestDate !== initial.dailyQuestDate ||
          prev.displayCredentialId !== initial.displayCredentialId ||
          prev.quizzersCount !== initial.quizzersCount ||
          prev.scenariosCompleted !== initial.scenariosCompleted ||
          prev.predictionsWon !== initial.predictionsWon ||
          prev.predictionsTotal !== initial.predictionsTotal ||
          prev.lastSprintDate !== initial.lastSprintDate ||
          prev.lastSizerDate !== initial.lastSizerDate ||
          prev.lastPredictDate !== initial.lastPredictDate ||
          prev.positionSizerUses !== initial.positionSizerUses ||
          prev.dailyBonusDate !== initial.dailyBonusDate ||
          prev.weeklyChallengeWeek !== initial.weeklyChallengeWeek ||
          prev.weeklyChallengeId !== initial.weeklyChallengeId ||
          prev.weeklyChallengeDone !== initial.weeklyChallengeDone ||
          prev.macroTriggerCount !== initial.macroTriggerCount ||
          prev.macroTriggerDate !== initial.macroTriggerDate

        if (
          statsDiff ||
          questsDiff ||
          achievementsDiff ||
          quizzesPassedDiff ||
          tabsVisitedDiff ||
          profileDiff ||
          otherDiff
        ) {
          console.log('[useProgress] Structurally syncing progress state from initial')
          const normalized = {
            ...initial,
            level: levelFromXp(initial.xp ?? 0),
          }
          return ensureWeeklyChallenge({ ...normalized, profile: mergeProfilePrefs(normalized.profile) })
        }
        return prev
      })
    }
  }, [initial])

  useEffect(() => {
    saveProgressForUser(progress, userId, guest)
  }, [progress, userId, guest])

  useEffect(() => {
    const today = todayKey()
    setProgress((prev) => {
      let changed = false
      
      let streak = prev.streak
      let lastVisitDate = prev.lastVisitDate
      let dailyQuestId = prev.dailyQuestId
      let dailyQuestDate = prev.dailyQuestDate
      let quests = prev.quests
      let resetQuests = false

      if (prev.lastVisitDate !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yKey = yesterday.toISOString().slice(0, 10)
        streak = prev.lastVisitDate === yKey ? prev.streak + 1 : 1
        lastVisitDate = today
        dailyQuestId = pickDailyQuest()
        dailyQuestDate = today
        resetQuests = true
        changed = true
      }
      if (prev.dailyQuestDate !== today) {
        dailyQuestId = pickDailyQuest()
        dailyQuestDate = today
        resetQuests = true
        changed = true
      }
      if (resetQuests) {
        const dailyIds = new Set(DAILY_QUESTS.map((q) => q.id))
        quests = prev.quests.map((q) =>
          dailyIds.has(q.id) ? { ...q, completed: false, claimed: false, completedAt: undefined } : q
        )
        changed = true
      }

      const prevPeak = prev.stats.portfolioPeak
      const newPeak = Math.max(prevPeak, portfolioValue)
      const peakChanged = newPeak !== prevPeak

      const gain = portfolioGainPct(portfolioValue)
      const prevBestProfit = prev.stats.bestProfitPct
      const newBestProfit = Math.max(prevBestProfit, gain)
      const bestProfitChanged = newBestProfit !== prevBestProfit

      const prevHoldingsCountMax = prev.stats.holdingsCountMax
      const newHoldingsCountMax = Math.max(
        prevHoldingsCountMax,
        portfolio.holdings.length
      )
      const holdingsCountMaxChanged = newHoldingsCountMax !== prevHoldingsCountMax

      const baselineStats = resetDayBaseline(prev.stats, portfolioValue, today)
      const baselineChanged = baselineStats !== prev.stats

      if (changed || peakChanged || bestProfitChanged || holdingsCountMaxChanged || baselineChanged) {
        const next = {
          ...prev,
          streak,
          lastVisitDate,
          dailyQuestId,
          dailyQuestDate,
          quests,
          stats: {
            ...baselineStats,
            portfolioPeak: newPeak,
            bestProfitPct: newBestProfit,
            holdingsCountMax: newHoldingsCountMax,
          }
        }
        return ensureWeeklyChallenge(next)
      }
      
      return prev
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

  // Synchronize and check quests instantly whenever stats or achievements update
  useEffect(() => {
    setProgress((prev) => {
      const { quests, changed } = syncQuestEntries(prev.quests, {
        portfolio,
        stocks,
        progress: prev,
        selectedSymbol,
        portfolioValue,
      })
      return changed ? { ...prev, quests } : prev
    })
  }, [
    progress.quizzesPassed,
    progress.scenariosCompleted,
    progress.predictionsWon,
    progress.positionSizerUses,
    progress.lastSprintDate,
    progress.lastSizerDate,
    progress.lastPredictDate,
    progress.tabsVisited,
    progress.stats,
    portfolio.watchlist,
    portfolio.alerts,
    portfolio.holdings,
    portfolioValue,
    selectedSymbol,
  ])

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

  const onRealizedGain = useCallback((gainAmount: number) => {
    setProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        cumulativeRealizedProfit: (prev.stats.cumulativeRealizedProfit ?? 0) + gainAmount,
      },
    }))
  }, [])

  const claimDailyBonus = useCallback(() => {
    setProgress((prev) => {
      if (!dailyBonusAvailable(prev)) return prev
      const xp = prev.xp + DAILY_LOGIN_XP
      haptic('success')
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
      haptic('success')
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
      const alreadyPassed = prev.quizzesPassed.includes(quizId)
      
      const quizzesPassed = passed
        ? [...prev.quizzesPassed, quizId]
        : prev.quizzesPassed
        
      const baseReward = Math.round(scorePct * 0.5)
      const finalReward = passed 
        ? (alreadyPassed ? 5 : baseReward)
        : 0
        
      const mult = getXpMultiplier()
      const boostedReward = Math.round(finalReward * mult)

      if (passed && finalReward > 0) {
        const boostText = mult > 1 ? ` (${mult}x Card Boost)` : ''
        setCelebration(`+${boostedReward} XP — Quiz Passed${boostText}`)
        setTimeout(() => setCelebration(null), 2500)
      }

      const xp = prev.xp + boostedReward
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
  }, [getXpMultiplier])

  const onQuizCorrectAnswer = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      quizzersCount: (prev.quizzersCount ?? 0) + 1,
    }))
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
      const today = todayKey()
      const isFirstSprintToday = prev.lastSprintDate !== today
      const improvement = Math.max(0, correct - prev.stats.sectorSprintScore)
      
      const xpGain = isFirstSprintToday
        ? correct * 6
        : improvement * 6
        
      const mult = getXpMultiplier()
      const boostedXp = Math.round(xpGain * mult)

      if (boostedXp > 0) {
        const boostText = mult > 1 ? ` (${mult}x Card Boost)` : ''
        setCelebration(`+${boostedXp} XP — Sector Sprint${boostText}`)
        setTimeout(() => setCelebration(null), 2500)
      }

      const xp = prev.xp + boostedXp
      return {
        ...prev,
        lastSprintDate: today,
        stats: bumpWeekStat(
          { ...prev.stats, sectorSprintScore: best },
          'sprintsThisWeek',
          'sprintWeekKey'
        ),
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [getXpMultiplier])

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
        lastSizerDate: todayKey(),
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
      const previousBest = prev.stats.flashQuotesBest ?? 0
      const improvement = Math.max(0, correct - previousBest)
      
      const xpGain = improvement * 5
      const mult = getXpMultiplier()
      const boostedXp = Math.round(xpGain * mult)

      if (boostedXp > 0) {
        const boostText = mult > 1 ? ` (${mult}x Card Boost)` : ''
        setCelebration(`+${boostedXp} XP — Flash Quotes${boostText}`)
        setTimeout(() => setCelebration(null), 2500)
      }

      const xp = prev.xp + boostedXp
      return {
        ...prev,
        stats: { ...prev.stats, flashQuotesBest: best },
        xp,
        level: levelFromXp(xp),
      }
    })
  }, [getXpMultiplier])

  const onActivityAnswer = useCallback((_correct?: boolean) => {
    setProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        activitiesPlayed: (prev.stats.activitiesPlayed ?? 0) + 1,
      },
    }))
  }, [])

  const onPrediction = useCallback((won: boolean) => {
    setProgress((prev) => {
      const predictionsWon = prev.predictionsWon + (won ? 1 : 0)
      const predictionsTotal = prev.predictionsTotal + 1
      const bonus = won ? 10 : 2
      const xp = prev.xp + bonus
      let stats = prev.stats
      if (won) {
        stats = bumpWeekStat(stats, 'predictorWinsThisWeek', 'predictorWeekKey')
      }
      return {
        ...prev,
        predictionsWon,
        predictionsTotal,
        lastPredictDate: todayKey(),
        stats: {
          ...stats,
          activitiesPlayed: (stats.activitiesPlayed ?? 0) + 1,
        },
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

      const activeSectorsCount = new Set(
        portfolio.holdings
          .map((h) => stocks.find((s) => s.symbol === h.symbol)?.sector)
          .filter(Boolean)
      ).size

      const hasLargePosition = portfolio.holdings.some((h) => {
        const s = stocks.find((x) => x.symbol === h.symbol)
        return s ? h.quantity * s.price >= 50000 : false
      })

      const totalVolume = portfolio.orders
        .filter((o) => o.status === 'filled')
        .reduce((sum, o) => sum + o.quantity * (o.fillPrice ?? 0), 0)

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

        // New trading earnings milestones
        ['profit-milestone-50k', (prev.stats.cumulativeRealizedProfit ?? 0) >= 50000],
        ['profit-milestone-100k', (prev.stats.cumulativeRealizedProfit ?? 0) >= 100000],
        ['profit-milestone-200k', (prev.stats.cumulativeRealizedProfit ?? 0) >= 200000],
        ['profit-milestone-500k', (prev.stats.cumulativeRealizedProfit ?? 0) >= 500000],
        ['profit-milestone-1M', (prev.stats.cumulativeRealizedProfit ?? 0) >= 1000000],

        // New progression based achievements
        ['leverage-master', (portfolio.marginLoan ?? 0) >= 100000],
        ['diversification-guru', activeSectorsCount === 7],
        ['diamond-hands', hasLargePosition],
        ['predictor-oracle', prev.predictionsWon >= 10],
        ['perfect-score', (prev.stats.flashQuotesBest ?? 0) >= 10],
        ['apex-trader', totalVolume >= 1000000],
      ]

      for (const [id, ok] of checks) {
        if (ok && !prev.achievements.includes(id)) unlock.push(id)
      }

      if (unlock.length === 0) {
        if (activeSectorsCount !== prev.stats.sectorsHeld) {
          return {
            ...prev,
            stats: {
              ...prev.stats,
              sectorsHeld: activeSectorsCount,
            },
          }
        }
        return prev
      }

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
        stats: {
          ...prev.stats,
          sectorsHeld: activeSectorsCount,
        },
      }
    })
  }, [portfolio, stocks, portfolioValue])

  useEffect(() => {
    checkAchievements()
  }, [
    progress.stats.totalTrades,
    progress.streak,
    progress.scenariosCompleted,
    progress.quests,
    progress.level,
    portfolioValue,
    progress.stats.sectorSprintScore,
    progress.positionSizerUses,
    progress.stats.chartRangesUsed,
    progress.stats.flashQuotesBest,
    progress.stats.largestSingleLoss,
    progress.stats.liquidationCount,
    progress.stats.portfolioPeak,
    progress.stats.marginUsed,
    progress.stats.cumulativeRealizedProfit,
    progress.predictionsWon,
    portfolio.marginLoan,
    portfolio.holdings,
    portfolio.orders,
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
    onQuizCorrectAnswer,
    onActivityAnswer,
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
    onRealizedGain,
    onMarginBorrow,
    onLiquidation,
    reset,
    setProgress,
  }
}
