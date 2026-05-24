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

    if (initial) setPortfolio(normalizePortfolio(initial))

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

      useMargin = false

    ): { ok: boolean; message: string; realizedPnl?: number; borrowed?: number } => {

      if (quantity <= 0 || !Number.isInteger(quantity)) {

        return { ok: false, message: 'Quantity must be a positive whole number.' }

      }



      const fill = resolveFillPrice(side, type, stock, limitPrice)

      if (!fill.ok) return { ok: false, message: fill.message }



      const price = fill.fillPrice

      const total = roundMoney(price * quantity)

      const loan = portfolio.marginLoan ?? 0

      let realizedPnl: number | undefined

      let borrowed = 0



      if (side === 'buy') {

        if (!useMargin) {

          if (total > portfolio.cash) {

            return {

              ok: false,

              message: `Need ${formatCurrency(total)} — you have ${formatCurrency(portfolio.cash)} cash. Use Loan or reduce quantity.`,

            }

          }

        } else {

          const fullPower = buyingPower(

            portfolio.cash,

            portfolio.holdings,

            allStocks,

            loan

          )

          if (total > fullPower) {

            return {

              ok: false,

              message: 'Insufficient buying power (cash + margin credit).',

            }

          }

          if (total > portfolio.cash) {

            borrowed = roundMoney(total - portfolio.cash)

          }

        }

      } else {

        const holding = portfolio.holdings.find((h) => h.symbol === stock.symbol)

        if (!holding || holding.quantity < quantity) {

          return { ok: false, message: 'Insufficient shares to sell.' }

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

          if (total > cash) {

            marginLoan = roundMoney(marginLoan + (total - cash))

            cash = 0

          } else {

            cash = roundMoney(cash - total)

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

          let proceeds = total

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

      const msg =

        borrowed > 0

          ? `${action} ${quantity} ${stock.symbol} @ ${formatCurrency(price)} · margin ${formatCurrency(borrowed)}`

          : `${action} ${quantity} ${stock.symbol} @ ${formatCurrency(price)} · ${formatCurrency(total)} ${side === 'buy' ? 'paid' : 'received'}`



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


