import { useCallback, useEffect, useState } from 'react'

import {

  buyingPower,

  holdingsValue,

  netEquity,

  shouldLiquidate,

} from '../lib/margin'

import { formatCurrency } from '../lib/marketEngine'

import { resolveFillPrice, roundMoney } from '../lib/trading'

import {

  loadPortfolioForUser,

  resetLocalForUser,

  savePortfolioForUser,

} from '../lib/userStorage'

import type { Order, OrderSide, OrderType, Portfolio, PriceAlert, Stock } from '../types'



function uid(): string {

  return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

}



function safeMoney(n: number): number {

  return Number.isFinite(n) ? roundMoney(n) : 0

}



function normalizePortfolio(p: Portfolio): Portfolio {

  return {

    ...p,

    cash: safeMoney(p.cash),

    marginLoan: safeMoney(p.marginLoan ?? 0),

    holdings: (p.holdings ?? []).map((h) => ({

      ...h,

      quantity: Number.isFinite(h.quantity) ? Math.max(0, Math.floor(h.quantity)) : 0,

      avgCost: safeMoney(h.avgCost),

    })),

  }

}



interface UsePortfolioOptions {

  userId: string | null

  guest: boolean

  initial?: Portfolio | null

}



export function usePortfolio({ userId, guest, initial }: UsePortfolioOptions) {

  const [portfolio, setPortfolio] = useState<Portfolio>(() =>

    normalizePortfolio(initial ?? loadPortfolioForUser(userId, guest))

  )



  useEffect(() => {
    if (initial) {
      setPortfolio((prev) => {
        const normalizedInitial = normalizePortfolio(initial)
        
        const cashDiff = prev.cash !== normalizedInitial.cash
        const loanDiff = (prev.marginLoan ?? 0) !== (normalizedInitial.marginLoan ?? 0)
        
        const holdingsDiff =
          prev.holdings.length !== normalizedInitial.holdings.length ||
          prev.holdings.some((h, i) => {
            const ih = normalizedInitial.holdings[i]
            return !ih || h.symbol !== ih.symbol || h.quantity !== ih.quantity || h.avgCost !== ih.avgCost
          })

        const ordersDiff =
          prev.orders.length !== normalizedInitial.orders.length ||
          prev.orders.some((o, i) => {
            const io = normalizedInitial.orders[i]
            return (
              !io ||
              o.id !== io.id ||
              o.symbol !== io.symbol ||
              o.side !== io.side ||
              o.type !== io.type ||
              o.quantity !== io.quantity ||
              o.limitPrice !== io.limitPrice ||
              o.fillPrice !== io.fillPrice ||
              o.status !== io.status ||
              o.createdAt !== io.createdAt
            )
          })

        const watchlistDiff =
          prev.watchlist.length !== normalizedInitial.watchlist.length ||
          prev.watchlist.some((w, i) => w !== normalizedInitial.watchlist[i])

        const alertsDiff =
          prev.alerts.length !== normalizedInitial.alerts.length ||
          prev.alerts.some((a, i) => {
            const ia = normalizedInitial.alerts[i]
            return (
              !ia ||
              a.id !== ia.id ||
              a.symbol !== ia.symbol ||
              a.targetPrice !== ia.targetPrice ||
              a.direction !== ia.direction ||
              a.triggered !== ia.triggered
            )
          })

        if (cashDiff || loanDiff || holdingsDiff || ordersDiff || watchlistDiff || alertsDiff) {
          console.log('[usePortfolio] Structurally syncing portfolio state from initial')
          return normalizedInitial
        }
        return prev
      })
    }
  }, [initial])



  useEffect(() => {

    savePortfolioForUser(portfolio, userId, guest)

  }, [portfolio, userId, guest])



  const applyStockSplits = useCallback((splits: { symbol: string; ratio: number }[]) => {

    if (splits.length === 0) return

    setPortfolio((prev) => {

      let holdings = [...prev.holdings]

      for (const { symbol, ratio } of splits) {

        const idx = holdings.findIndex((h) => h.symbol === symbol)

        if (idx < 0) continue

        const h = holdings[idx]

        holdings[idx] = {

          ...h,

          quantity: h.quantity * ratio,

          avgCost: safeMoney(h.avgCost / ratio),

        }

      }

      return { ...prev, holdings }

    })

  }, [])



  const placeOrder = useCallback(
    (
      stock: Stock,
      side: OrderSide,
      type: OrderType,
      quantity: number,
      limitPrice: number | undefined,
      allStocks: Stock[],
      useMargin = false,
      portfolioPeak?: number,
      deactivatedCards: string[] = []
    ): { ok: boolean; message: string; realizedPnl?: number; borrowed?: number } => {
      if (quantity <= 0 || !Number.isInteger(quantity)) {
        return { ok: false, message: 'Quantity must be a positive whole number.' }
      }

      const fill = resolveFillPrice(side, type, stock, limitPrice)
      if (!fill.ok) return { ok: false, message: fill.message }

      const price = fill.fillPrice
      const total = roundMoney(price * quantity)
      const loan = portfolio.marginLoan ?? 0

      // Calculate commission based on Card Tier (net equity)
      const netVal = netEquity(portfolio.cash, portfolio.holdings, allStocks, loan)
      const activeTierVal = Math.max(netVal, portfolioPeak ?? 0)
      let commission = 5.00
      let commName = 'GRID'
      if (activeTierVal >= 500000 && !deactivatedCards.includes('apex')) {
        commission = 0.00
        commName = 'APEX'
      } else if (activeTierVal >= 250000 && !deactivatedCards.includes('zenith')) {
        commission = 2.50
        commName = 'ZENITH'
      }

      const totalWithComm = roundMoney(total + commission)
      let realizedPnl: number | undefined
      let borrowed = 0

      if (side === 'buy') {
        if (!useMargin) {
          if (totalWithComm > portfolio.cash) {
            return {
              ok: false,
              message: `Need ${formatCurrency(totalWithComm)} (includes ${formatCurrency(commission)} ${commName} fee) — you have ${formatCurrency(portfolio.cash)} cash. Use Loan or reduce quantity.`,
            }
          }
        } else {
          const fullPower = buyingPower(
            portfolio.cash,
            portfolio.holdings,
            allStocks,
            loan,
            portfolioPeak,
            deactivatedCards
          )
          if (totalWithComm > fullPower) {
            return {
              ok: false,
              message: 'Insufficient buying power (cash + margin credit).',
            }
          }
          if (totalWithComm > portfolio.cash) {
            borrowed = roundMoney(totalWithComm - portfolio.cash)
          }
        }
      } else {
        const holding = portfolio.holdings.find((h) => h.symbol === stock.symbol)
        if (!holding || holding.quantity < quantity) {
          return { ok: false, message: 'Insufficient shares to sell.' }
        }
        if (total < commission) {
          return { ok: false, message: `Sell proceeds ${formatCurrency(total)} are not enough to cover the ${formatCurrency(commission)} commission.` }
        }
        realizedPnl = roundMoney((price - holding.avgCost) * quantity)
      }

      const order: Order = {
        id: uid(),
        symbol: stock.symbol,
        side,
        type,
        quantity,
        limitPrice: fill.limitPrice,
        fillPrice: price,
        status: 'filled',
        createdAt: Date.now(),
      }

      setPortfolio((prev) => {
        let cash = safeMoney(prev.cash)
        let holdings = [...prev.holdings]
        let marginLoan = safeMoney(prev.marginLoan ?? 0)

        if (side === 'buy') {
          if (totalWithComm > cash) {
            marginLoan = roundMoney(marginLoan + (totalWithComm - cash))
            cash = 0
          } else {
            cash = roundMoney(cash - totalWithComm)
          }

          const idx = holdings.findIndex((h) => h.symbol === stock.symbol)
          if (idx >= 0) {
            const h = holdings[idx]
            const newQty = h.quantity + quantity
            holdings[idx] = {
              ...h,
              quantity: newQty,
              avgCost: safeMoney((h.avgCost * h.quantity + price * quantity) / newQty),
            }
          } else {
            holdings.push({ symbol: stock.symbol, quantity, avgCost: price })
          }
        } else {
          let proceeds = roundMoney(total - commission)
          const repay = Math.min(proceeds, marginLoan)
          marginLoan = roundMoney(marginLoan - repay)
          proceeds = roundMoney(proceeds - repay)
          cash = roundMoney(cash + proceeds)

          const idx = holdings.findIndex((h) => h.symbol === stock.symbol)
          const h = holdings[idx]
          const newQty = h.quantity - quantity
          if (newQty <= 0) {
            holdings = holdings.filter((x) => x.symbol !== stock.symbol)
          } else {
            holdings[idx] = { ...h, quantity: newQty }
          }
        }

        return {
          ...prev,
          cash,
          holdings,
          marginLoan,
          orders: [order, ...prev.orders].slice(0, 100),
        }
      })

      const action = side === 'buy' ? 'Bought' : 'Sold'
      const commMsg = commission > 0 ? ` (fee: ${formatCurrency(commission)})` : ' (free trade)'
      const msg =
        borrowed > 0
          ? `${action} ${quantity} ${stock.symbol} @ ${formatCurrency(price)}${commMsg} · margin ${formatCurrency(borrowed)}`
          : `${action} ${quantity} ${stock.symbol} @ ${formatCurrency(price)}${commMsg} · ${formatCurrency(side === 'buy' ? totalWithComm : roundMoney(total - commission))} ${side === 'buy' ? 'paid' : 'received'}`

      return { ok: true, message: msg, realizedPnl, borrowed: borrowed > 0 ? borrowed : undefined }
    },
    [portfolio]
  )



  const runLiquidation = useCallback(

    (stocks: Stock[]): { liquidated: boolean; message?: string } => {

      const loan = portfolio.marginLoan ?? 0

      if (loan <= 0) return { liquidated: false }

      if (!shouldLiquidate(portfolio.cash, portfolio.holdings, stocks, loan)) {

        return { liquidated: false }

      }



      let cash = safeMoney(portfolio.cash)

      let marginLoan = safeMoney(loan)

      const orders: Order[] = []



      for (const h of portfolio.holdings) {

        const s = stocks.find((x) => x.symbol === h.symbol)

        if (!s) continue

        const proceeds = roundMoney(s.price * h.quantity)

        const repay = Math.min(proceeds, marginLoan)

        marginLoan = roundMoney(marginLoan - repay)

        cash = roundMoney(cash + proceeds - repay)

        orders.push({

          id: uid(),

          symbol: h.symbol,

          side: 'sell',

          type: 'market',

          quantity: h.quantity,

          fillPrice: s.price,

          status: 'filled',

          createdAt: Date.now(),

        })

      }



      setPortfolio((prev) => ({

        ...prev,

        cash,

        holdings: [],

        marginLoan,

        orders: [...orders, ...prev.orders].slice(0, 100),

      }))



      return {

        liquidated: true,

        message: 'Margin call: positions liquidated to cover your loan.',

      }

    },

    [portfolio]

  )



  const toggleWatchlist = useCallback((symbol: string, onAdd?: () => void) => {

    setPortfolio((prev) => {

      const has = prev.watchlist.includes(symbol)

      if (!has) onAdd?.()

      return {

        ...prev,

        watchlist: has

          ? prev.watchlist.filter((s) => s !== symbol)

          : [...prev.watchlist, symbol],

      }

    })

  }, [])



  const addAlert = useCallback(

    (symbol: string, targetPrice: number, direction: 'above' | 'below') => {

      const alert: PriceAlert = {

        id: `alert-${Date.now()}`,

        symbol,

        targetPrice,

        direction,

      }

      setPortfolio((prev) => ({

        ...prev,

        alerts: [...prev.alerts.filter((a) => !(a.symbol === symbol && !a.triggered)), alert].slice(

          0,

          10

        ),

      }))

    },

    []

  )



  const removeAlert = useCallback((id: string) => {

    setPortfolio((prev) => ({

      ...prev,

      alerts: prev.alerts.filter((a) => a.id !== id),

    }))

  }, [])



  const checkAlerts = useCallback((stocks: Stock[]) => {

    setPortfolio((prev) => {

      let changed = false

      const alerts = prev.alerts.map((a) => {

        if (a.triggered) return a

        const s = stocks.find((x) => x.symbol === a.symbol)

        if (!s) return a

        const hit =

          a.direction === 'above'

            ? s.price >= a.targetPrice

            : s.price <= a.targetPrice

        if (hit) {

          changed = true

          return { ...a, triggered: true }

        }

        return a

      })

      return changed ? { ...prev, alerts } : prev

    })

  }, [])



  const reset = useCallback(() => {

    const fresh = normalizePortfolio(resetLocalForUser(userId, guest).portfolio)

    setPortfolio(fresh)

    return fresh

  }, [userId, guest])



  const portfolioValue = useCallback(

    (stocks: Stock[]) => {

      return netEquity(portfolio.cash, portfolio.holdings, stocks, portfolio.marginLoan ?? 0)

    },

    [portfolio]

  )



  const grossValue = useCallback(

    (stocks: Stock[]) => {

      return portfolio.cash + holdingsValue(portfolio.holdings, stocks)

    },

    [portfolio]

  )



  return {

    portfolio,

    setPortfolio,

    placeOrder,

    applyStockSplits,

    runLiquidation,

    toggleWatchlist,

    addAlert,

    removeAlert,

    checkAlerts,

    reset,

    portfolioValue,

    grossValue,

  }

}


