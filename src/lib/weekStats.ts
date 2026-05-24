import { weekKey } from './retention'
import type { PlayerStats } from '../types'

export function bumpWeekStat(
  stats: PlayerStats,
  field:
    | 'tradesThisWeek'
    | 'quizzesThisWeek'
    | 'sprintsThisWeek'
    | 'predictorWinsThisWeek',
  keyField: 'weekTradeKey' | 'quizWeekKey' | 'sprintWeekKey' | 'predictorWeekKey'
): PlayerStats {
  const wk = weekKey()
  const current = stats[keyField] === wk ? (stats[field] ?? 0) : 0
  return { ...stats, [keyField]: wk, [field]: current + 1 }
}

export function resetDayBaseline(stats: PlayerStats, portfolioValue: number, today: string): PlayerStats {
  if (stats.dayStartDate === today) return stats
  return { ...stats, dayStartDate: today, dayStartValue: portfolioValue }
}
