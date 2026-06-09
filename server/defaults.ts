/** Default game state for new accounts — mirrors client defaults. */
import type { GameStatePayload } from './types.js'

function generateGridCardNo(): string {
  let num = '4'
  for (let i = 0; i < 15; i++) {
    num += Math.floor(Math.random() * 10).toString()
  }
  return num.replace(/(\d{4})/g, '$1 ').trim()
}

function generateZenithCardNo(): string {
  let num = ''
  if (Math.random() < 0.5) {
    const prefix = Math.floor(Math.random() * 5) + 51
    num = prefix.toString()
    for (let i = 0; i < 14; i++) {
      num += Math.floor(Math.random() * 10).toString()
    }
  } else {
    const prefix = Math.floor(Math.random() * 500) + 2221
    num = prefix.toString()
    for (let i = 0; i < 12; i++) {
      num += Math.floor(Math.random() * 10).toString()
    }
  }
  return num.replace(/(\d{4})/g, '$1 ').trim()
}

function generateApexCardNo(): string {
  const prefix = Math.random() < 0.5 ? '34' : '37'
  let num = prefix
  for (let i = 0; i < 13; i++) {
    num += Math.floor(Math.random() * 10).toString()
  }
  const part1 = num.slice(0, 4)
  const part2 = num.slice(4, 10)
  const part3 = num.slice(10, 15)
  return `${part1} ${part2} ${part3}`
}

function generateCvv(): string {
  return Math.floor(100 + Math.random() * 900).toString()
}

function generateExpiry(): string {
  const month = Math.floor(Math.random() * 12) + 1
  const monthStr = month < 10 ? `0${month}` : `${month}`
  const year = 29 + Math.floor(Math.random() * 5)
  return `${monthStr}/${year}`
}

export function defaultGameState(): GameStatePayload {
  return {
    portfolio: {
      cash: 100_000,
      holdings: [],
      orders: [],
      watchlist: ['AAPL', 'NVDA', 'MSFT'],
      alerts: [],
      marginLoan: 0,
    },
    progress: {
      xp: 0,
      level: 1,
      quests: [],
      achievements: [],
      streak: 1,
      lastVisitDate: new Date().toISOString().slice(0, 10),
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
        weekTradeKey: new Date().toISOString().slice(0, 10),
        quizzesThisWeek: 0,
        quizWeekKey: new Date().toISOString().slice(0, 10),
        sprintsThisWeek: 0,
        sprintWeekKey: new Date().toISOString().slice(0, 10),
        predictorWinsThisWeek: 0,
        predictorWeekKey: new Date().toISOString().slice(0, 10),
        dayStartValue: 100_000,
        dayStartDate: new Date().toISOString().slice(0, 10),
        largestSingleLoss: 0,
        marginUsed: false,
        liquidationCount: 0,
      },
      dailyBonusDate: null,
      weeklyChallengeWeek: null,
      weeklyChallengeId: null,
      weeklyChallengeDone: false,
      dailyQuestId: 'daily-trade-2',
      dailyQuestDate: new Date().toISOString().slice(0, 10),
      quizzesPassed: [],
      scenariosCompleted: 0,
      predictionsWon: 0,
      predictionsTotal: 0,
      tabsVisited: [],
      toastQueue: [],
      lastSprintDate: null,
      positionSizerUses: 0,
      profile: {
        accentId: 'teal',
        motto: '',
        gridCardNo: generateGridCardNo(),
        gridCvv: generateCvv(),
        gridExpiry: generateExpiry(),
        zenithCardNo: generateZenithCardNo(),
        zenithCvv: generateCvv(),
        zenithExpiry: generateExpiry(),
        apexCardNo: generateApexCardNo(),
        apexCvv: generateCvv(),
        apexExpiry: generateExpiry(),
      },
    },
  }
}

