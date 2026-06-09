import { QUESTS } from '../data/quests'
import { STARTING_CASH } from '../data/stocks'
import type { Portfolio, PlayerProgress, Stock } from '../types'

export interface QuestCheckContext {
  portfolio: Portfolio
  stocks: Stock[]
  progress: PlayerProgress
  selectedSymbol?: string
  portfolioValue: number
}

export function isQuestComplete(questId: string, ctx: QuestCheckContext): boolean {
  const { portfolio, stocks, progress, portfolioValue } = ctx
  const sectors = new Set(
    portfolio.holdings
      .map((h) => stocks.find((s) => s.symbol === h.symbol)?.sector)
      .filter(Boolean)
  )

  switch (questId) {
    case 'explore-market':
      return progress.tabsVisited.includes('market') && !!ctx.selectedSymbol
    case 'first-watch':
      return portfolio.watchlist.length >= 1
    case 'first-buy':
      return progress.stats.buyOrders >= 1
    case 'limit-order':
      return progress.stats.limitOrders >= 1
    case 'diversify':
      return sectors.size >= 3
    case 'first-sell':
      return progress.stats.sellOrders >= 1
    case 'quiz-basics':
      return progress.quizzesPassed.includes('basics')
    case 'scenario-1':
      return progress.scenariosCompleted >= 1
    case 'predict-win':
      return progress.predictionsWon >= 3
    case 'portfolio-105':
      return portfolioValue >= 105_000
    case 'read-news':
      return progress.tabsVisited.includes('news')
    case 'set-alert':
      return portfolio.alerts.length >= 1
    case 'sector-sprint':
      return progress.stats.sectorSprintScore >= 4
    case 'use-compare':
      return progress.stats.compareToolUsed
    case 'position-sizer':
      return progress.stats.positionSizerUsed || progress.positionSizerUses >= 1
    case 'hold-five':
      return portfolio.holdings.length >= 5
    case 'portfolio-review':
      return progress.tabsVisited.includes('portfolio')
    case 'chart-timeframe': {
      const used = progress.stats.chartRangesUsed ?? []
      return used.includes('1M') || used.includes('6M')
    }
    case 'chart-explorer':
      return (progress.stats.chartRangesUsed ?? []).length >= 3
    case 'ten-trades':
      return progress.stats.totalTrades >= 10
    case 'quiz-advanced':
      return progress.quizzesPassed.includes('advanced')
    case 'energy-hold':
      return portfolio.holdings.some(
        (h) => stocks.find((s) => s.symbol === h.symbol)?.sector === 'Energy'
      )
    case 'flash-quotes':
      return (progress.stats.flashQuotesBest ?? 0) >= 6
    case 'daily-trade-2':
      return progress.stats.totalTrades >= 2 && progress.dailyQuestDate === progress.lastVisitDate
    case 'daily-watch-3':
      return portfolio.watchlist.length >= 3
    case 'daily-quiz':
      return progress.quizzesPassed.some((q) => q.startsWith('daily-'))
    case 'daily-sprint':
      return progress.lastSprintDate === progress.lastVisitDate
    case 'daily-chart':
      return (
        progress.tabsVisited.includes('chart-5D') ||
        progress.tabsVisited.includes('chart-1M')
      )
    case 'daily-sizer':
      return progress.lastSizerDate === progress.lastVisitDate
    case 'daily-predict':
      return progress.lastPredictDate === progress.lastVisitDate
    default:
      return false
  }
}

export function countCompletedQuests(progress: PlayerProgress): number {
  return progress.quests.filter((q) => q.completed).length
}

export function allMainQuestsDone(progress: PlayerProgress): boolean {
  return QUESTS.every((q) => progress.quests.find((p) => p.id === q.id)?.completed)
}

export function portfolioGainPct(value: number): number {
  return ((value - STARTING_CASH) / STARTING_CASH) * 100
}
