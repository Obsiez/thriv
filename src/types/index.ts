export type Sector =
  | 'Technology'
  | 'Healthcare'
  | 'Finance'
  | 'Consumer'
  | 'Energy'
  | 'Industrial'
  | 'Communication'

export interface Stock {
  symbol: string
  name: string
  sector: Sector
  price: number
  previousClose: number
  open: number
  dayHigh: number
  dayLow: number
  volume: number
  marketCap: number
  peRatio: number
  dividendYield: number
  history: PricePoint[]
}

export interface PricePoint {
  time: number
  price: number
}

export type OrderType = 'market' | 'limit'
export type OrderSide = 'buy' | 'sell'
export type OrderStatus = 'filled' | 'pending' | 'cancelled'

export interface Order {
  id: string
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  limitPrice?: number
  fillPrice?: number
  status: OrderStatus
  createdAt: number
}

export interface Holding {
  symbol: string
  quantity: number
  avgCost: number
}

export interface PriceAlert {
  id: string
  symbol: string
  targetPrice: number
  direction: 'above' | 'below'
  triggered?: boolean
}

export interface Portfolio {
  cash: number
  holdings: Holding[]
  orders: Order[]
  watchlist: string[]
  alerts: PriceAlert[]
  /** Virtual margin loan balance (simulated). */
  marginLoan?: number
}

export interface MarketNews {
  id: string
  headline: string
  summary: string
  symbols: string[]
  sentiment: 'bullish' | 'bearish' | 'neutral'
  timestamp: number
  /** Breaking story — immediate price move. */
  flash?: boolean
  impactPct?: number
}

export type TabId =
  | 'home'
  | 'market'
  | 'trade'
  | 'portfolio'
  | 'quests'
  | 'activities'
  | 'news'
  | 'orders'
  | 'learn'

export interface GlossaryTerm {
  term: string
  definition: string
}

export type QuestCategory = 'tutorial' | 'trading' | 'learning' | 'daily' | 'challenge'

import type { IconName } from '../lib/icons'
import type { ProfilePrefs } from '../lib/profileTheme'

export interface QuestDef {
  id: string
  title: string
  description: string
  hint: string
  category: QuestCategory
  xpReward: number
  icon: IconName
}

export interface QuestProgress {
  id: string
  completed: boolean
  completedAt?: number
  claimed: boolean
}

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: IconName
  xpBonus: number
}

export interface PlayerProgress {
  xp: number
  level: number
  quests: QuestProgress[]
  achievements: string[]
  /** Player-chosen credential shown on leaderboard; null = highest on ladder */
  displayCredentialId?: string | null
  streak: number
  lastVisitDate: string
  stats: PlayerStats
  dailyQuestId: string | null
  dailyQuestDate: string | null
  quizzesPassed: string[]
  scenariosCompleted: number
  predictionsWon: number
  predictionsTotal: number
  tabsVisited: string[]
  toastQueue: string[]
  lastSprintDate: string | null
  positionSizerUses: number
  profile: ProfilePrefs
  dailyBonusDate: string | null
  weeklyChallengeWeek: string | null
  weeklyChallengeId: string | null
  weeklyChallengeDone: boolean
}

export interface PlayerStats {
  totalTrades: number
  buyOrders: number
  sellOrders: number
  limitOrders: number
  watchlistAdds: number
  sectorsHeld: number
  bestProfitPct: number
  portfolioPeak: number
  sectorSprintScore: number
  compareToolUsed: boolean
  positionSizerUsed: boolean
  holdingsCountMax: number
  chartRangesUsed: string[]
  flashQuotesBest: number
  tradesThisWeek: number
  weekTradeKey: string
  quizzesThisWeek: number
  quizWeekKey: string
  sprintsThisWeek: number
  sprintWeekKey: string
  predictorWinsThisWeek: number
  predictorWeekKey: string
  dayStartValue: number
  dayStartDate: string
  largestSingleLoss: number
  marginUsed: boolean
  liquidationCount: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface ScenarioDef {
  id: string
  title: string
  context: string
  symbol: string
  choices: { id: string; label: string; feedback: string; xp: number }[]
}
