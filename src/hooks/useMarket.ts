import { useCallback, useEffect, useRef, useState } from 'react'
import { createInitialStocks } from '../data/stocks'
import { generateFlashNews, generateNews, getInitialNews, randomFlashDelayMs } from '../data/news'
import {
  applyNewsImpact,
  localDateKey,
  msUntilLocalMidnight,
  runMidnightMarketRoll,
  tickPrice,
} from '../lib/marketEngine'
import type { MarketNews, Stock } from '../types'

const TICK_MS = 1000
const NEWS_MS = 45_000

export interface StockSplitEvent {
  symbol: string
  ratio: number
}

interface UseMarketOptions {
  onStockSplits?: (splits: StockSplitEvent[]) => void
}

export function useMarket(options: UseMarketOptions = {}) {
  const { onStockSplits } = options
  const onStockSplitsRef = useRef(onStockSplits)
  onStockSplitsRef.current = onStockSplits

  const [stocks, setStocks] = useState<Stock[]>(() => createInitialStocks())
  const [news, setNews] = useState(() => getInitialNews())
  const [flashBanner, setFlashBanner] = useState<MarketNews | null>(null)
  const [marketOpen, setMarketOpen] = useState(true)
  const [lastTick, setLastTick] = useState(Date.now())
  const marketDayRef = useRef(localDateKey())

  const applyMidnightRoll = useCallback(() => {
    const splits: StockSplitEvent[] = []
    setStocks((prev) =>
      prev.map((s) => {
        const { stock, ratio } = runMidnightMarketRoll(s)
        if (ratio) splits.push({ symbol: s.symbol, ratio })
        return stock
      })
    )
    if (splits.length > 0) onStockSplitsRef.current?.(splits)
  }, [])

  const rollMarketDay = useCallback(() => {
    const today = localDateKey()
    if (marketDayRef.current === today) return
    marketDayRef.current = today
    applyMidnightRoll()
  }, [applyMidnightRoll])

  useEffect(() => {
    rollMarketDay()
    const poll = setInterval(rollMarketDay, 60_000)
    let midnightTimer: ReturnType<typeof setTimeout>

    const scheduleMidnight = () => {
      midnightTimer = setTimeout(() => {
        marketDayRef.current = localDateKey()
        applyMidnightRoll()
        scheduleMidnight()
      }, msUntilLocalMidnight())
    }
    scheduleMidnight()

    return () => {
      clearInterval(poll)
      clearTimeout(midnightTimer)
    }
  }, [rollMarketDay, applyMidnightRoll])

  useEffect(() => {
    if (!marketOpen) return
    const id = setInterval(() => {
      setStocks((prev) => prev.map(tickPrice))
      setLastTick(Date.now())
    }, TICK_MS)
    return () => clearInterval(id)
  }, [marketOpen])

  useEffect(() => {
    const id = setInterval(() => {
      const item = generateNews()
      setNews((prev) => [item, ...prev].slice(0, 14))
    }, NEWS_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>
    let flashTimer: ReturnType<typeof setTimeout>

    const runFlash = () => {
      const flash = generateFlashNews()
      setStocks((prev) => applyNewsImpact(prev, flash))
      setNews((prev) => [flash, ...prev].slice(0, 14))
      setFlashBanner(flash)
      setLastTick(Date.now())
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => setFlashBanner(null), 8000)
      flashTimer = setTimeout(runFlash, randomFlashDelayMs())
    }

    flashTimer = setTimeout(runFlash, randomFlashDelayMs())

    return () => {
      clearTimeout(flashTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const getStock = useCallback(
    (symbol: string) => stocks.find((s) => s.symbol === symbol),
    [stocks]
  )

  return { stocks, news, flashBanner, marketOpen, setMarketOpen, lastTick, getStock }
}
