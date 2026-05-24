import type { PlayerProgress, Portfolio } from '../types'
import type { Stock } from '../types'

export interface WeeklyChallengeDef {
  id: string
  title: string
  description: string
  hint: string
  xpReward: number
  isComplete: (ctx: {
    progress: PlayerProgress
    portfolio: Portfolio
    stocks: Stock[]
    portfolioValue: number
  }) => boolean
}

export const WEEKLY_CHALLENGES: WeeklyChallengeDef[] = [
  {
    id: 'week-trades-8',
    title: 'Weekly Volume',
    description: 'Complete 8 executions this week.',
    hint: 'Buys and sells both count toward the total.',
    xpReward: 200,
    isComplete: ({ progress }) => (progress.stats.tradesThisWeek ?? 0) >= 8,
  },
  {
    id: 'week-quiz-2',
    title: 'Study Block',
    description: 'Pass 2 quizzes this week (any score ≥ 80%).',
    hint: 'Basics and Advanced quizzes in Activities.',
    xpReward: 180,
    isComplete: ({ progress }) => (progress.stats.quizzesThisWeek ?? 0) >= 2,
  },
  {
    id: 'week-sprint-3',
    title: 'Sector Drill',
    description: 'Play Sector Sprint 3 times this week.',
    hint: 'Activities → Sector Sprint.',
    xpReward: 165,
    isComplete: ({ progress }) => (progress.stats.sprintsThisWeek ?? 0) >= 3,
  },
  {
    id: 'week-profit-2',
    title: 'Green Weeks',
    description: 'Close the week with portfolio above $102,000.',
    hint: 'Disciplined entries and risk sizing help.',
    xpReward: 220,
    isComplete: ({ portfolioValue }) => portfolioValue >= 102_000,
  },
  {
    id: 'week-predict-5',
    title: 'Directional Focus',
    description: 'Win 5 Price Predictor rounds this week.',
    hint: 'Activities → Price Predictor.',
    xpReward: 190,
    isComplete: ({ progress }) => (progress.stats.predictorWinsThisWeek ?? 0) >= 5,
  },
]

export function getWeeklyChallenge(id: string | null | undefined) {
  return WEEKLY_CHALLENGES.find((c) => c.id === id) ?? WEEKLY_CHALLENGES[0]
}
