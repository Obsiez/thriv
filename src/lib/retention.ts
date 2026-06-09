import { WEEKLY_CHALLENGES } from '../data/weeklyChallenges'
import type { PlayerProgress } from '../types'
import { todayKey } from './progression'

/** ISO week id e.g. "2026-W21" */
export function weekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function pickWeeklyChallenge(week: string): string {
  const idx = week.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return WEEKLY_CHALLENGES[idx % WEEKLY_CHALLENGES.length].id
}

export function ensureWeeklyChallenge(progress: PlayerProgress): PlayerProgress {
  const wk = weekKey()
  if (progress.weeklyChallengeWeek === wk && progress.weeklyChallengeId) {
    return progress
  }
  return {
    ...progress,
    weeklyChallengeWeek: wk,
    weeklyChallengeId: pickWeeklyChallenge(wk),
    weeklyChallengeDone: false,
    stats: {
      ...progress.stats,
      tradesThisWeek: 0,
      weekTradeKey: wk,
      quizzesThisWeek: 0,
      quizWeekKey: wk,
      sprintsThisWeek: 0,
      sprintWeekKey: wk,
      predictorWinsThisWeek: 0,
      predictorWeekKey: wk,
    },
  }
}

export function dailyBonusAvailable(progress: PlayerProgress): boolean {
  return progress.dailyBonusDate !== todayKey()
}

export const DAILY_LOGIN_XP = 35
