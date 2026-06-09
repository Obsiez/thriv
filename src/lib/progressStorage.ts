import { QUESTS, DAILY_QUESTS } from '../data/quests'
import type { PlayerProgress, QuestProgress } from '../types'
import { todayKey } from './progression'
import { ensureWeeklyChallenge, weekKey } from './retention'
import { sanitizeDisplayCredential } from './credentialBadge'
import { DEFAULT_PROFILE, mergeProfilePrefs } from './profileTheme'

const KEY = 'thriv-progress'

function defaultQuests(): QuestProgress[] {
  return [
    ...QUESTS.map((q) => ({ id: q.id, completed: false, claimed: false })),
    ...DAILY_QUESTS.map((q) => ({ id: q.id, completed: false, claimed: false })),
  ]
}

export function defaultProgress(): PlayerProgress {
  const base: PlayerProgress = {
    xp: 0,
    level: 1,
    quests: defaultQuests(),
    achievements: [],
    displayCredentialId: null,
    streak: 1,
    lastVisitDate: todayKey(),
    stats: {
      totalTrades: 0,
      buyOrders: 0,
      sellOrders: 0,
      limitOrders: 0,
      watchlistAdds: 0,
      sectorsHeld: 0,
      bestProfitPct: 0,
      portfolioPeak: 100_000,
      sectorSprintScore: 0,
      compareToolUsed: false,
      positionSizerUsed: false,
      holdingsCountMax: 0,
      chartRangesUsed: [],
      flashQuotesBest: 0,
      tradesThisWeek: 0,
      weekTradeKey: weekKey(),
      quizzesThisWeek: 0,
      quizWeekKey: weekKey(),
      sprintsThisWeek: 0,
      sprintWeekKey: weekKey(),
      predictorWinsThisWeek: 0,
      predictorWeekKey: weekKey(),
      dayStartValue: 100_000,
      dayStartDate: todayKey(),
      largestSingleLoss: 0,
      marginUsed: false,
      liquidationCount: 0,
      cumulativeRealizedProfit: 0,
      activitiesPlayed: 0,
    },
    dailyQuestId: DAILY_QUESTS[0].id,
    dailyQuestDate: todayKey(),
    quizzesPassed: [],
    quizzersCount: 0,
    scenariosCompleted: 0,
    predictionsWon: 0,
    predictionsTotal: 0,
    tabsVisited: [],
    toastQueue: [],
    lastSprintDate: null,
    lastSizerDate: null,
    lastPredictDate: null,
    positionSizerUses: 0,
    profile: { ...DEFAULT_PROFILE },
    dailyBonusDate: null,
    weeklyChallengeWeek: null,
    weeklyChallengeId: null,
    weeklyChallengeDone: false,
    macroTriggerCount: 0,
    macroTriggerDate: null,
    lastBriefingDate: null,
  }
  return ensureWeeklyChallenge(base)
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as PlayerProgress
      const merged = {
        ...defaultProgress(),
        ...p,
        stats: {
          ...defaultProgress().stats,
          ...p.stats,
          activitiesPlayed: p.stats?.activitiesPlayed ?? 0,
        },
        profile: mergeProfilePrefs(p.profile),
      }
      const knownIds = new Set([
        ...QUESTS.map((q) => q.id),
        ...DAILY_QUESTS.map((q) => q.id),
      ])
      merged.quests = [
        ...merged.quests.filter((q) => knownIds.has(q.id)),
        ...defaultQuests().filter((q) => !merged.quests.some((x) => x.id === q.id)),
      ]
      merged.displayCredentialId = sanitizeDisplayCredential(
        merged.achievements,
        merged.displayCredentialId
      )
      return ensureWeeklyChallenge(merged)
    }
  } catch {
    /* ignore */
  }
  return defaultProgress()
}

export function saveProgress(p: PlayerProgress): void {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function resetProgress(): PlayerProgress {
  const fresh = defaultProgress()
  saveProgress(fresh)
  return fresh
}

export function pickDailyQuest(): string {
  const day = new Date().getDate()
  return DAILY_QUESTS[day % DAILY_QUESTS.length].id
}
