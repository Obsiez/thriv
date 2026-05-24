import type { Portfolio } from '../types'
import { STARTING_CASH } from '../data/stocks'

const KEY = 'thriv-portfolio'

export function loadPortfolio(): Portfolio {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Portfolio
      return {
        cash: parsed.cash ?? STARTING_CASH,
        holdings: parsed.holdings ?? [],
        orders: parsed.orders ?? [],
        watchlist: parsed.watchlist ?? ['AAPL', 'NVDA', 'MSFT'],
        alerts: parsed.alerts ?? [],
        marginLoan: parsed.marginLoan ?? 0,
      }
    }
  } catch {
    /* ignore */
  }
  return {
    cash: STARTING_CASH,
    holdings: [],
    orders: [],
    watchlist: ['AAPL', 'NVDA', 'MSFT'],
    alerts: [],
    marginLoan: 0,
  }
}

export function savePortfolio(portfolio: Portfolio): void {
  localStorage.setItem(KEY, JSON.stringify(portfolio))
}

export function resetPortfolio(): Portfolio {
  const fresh: Portfolio = {
    cash: STARTING_CASH,
    holdings: [],
    orders: [],
    watchlist: ['AAPL', 'NVDA', 'MSFT'],
    alerts: [],
    marginLoan: 0,
  }
  savePortfolio(fresh)
  return fresh
}
