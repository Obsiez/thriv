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
  isOnlineAndLoggedIn?: boolean
  macroCount?: number
  onMacroTrigger?: () => void
  sessionKey?: string
  speedMultiplier?: number
}

export interface EconomicEventDef {
  name: string
  impact: 'High' | 'Medium'
  sectors?: string[] // if empty, applies to all stocks
}

const ECONOMIC_EVENTS: EconomicEventDef[] = [
  { name: 'FOMC Interest Rate Decision', impact: 'High' },
  { name: 'CPI Inflation Report', impact: 'High', sectors: ['Technology', 'Consumer'] },
  { name: 'Non-Farm Payrolls Jobs Report', impact: 'High', sectors: ['Finance', 'Industrial'] },
  { name: 'GDP Growth Estimate', impact: 'Medium', sectors: ['Finance', 'Industrial', 'Energy'] },
  { name: 'Retail Sales Data Release', impact: 'Medium', sectors: ['Consumer', 'Communication'] },
]

function generateEventOutcome(event: EconomicEventDef): {
  headline: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  impactPct: number
} {
  const roll = Math.random()
  const sentiment: 'bullish' | 'bearish' | 'neutral' =
    roll > 0.6 ? 'bullish' : roll > 0.2 ? 'bearish' : 'neutral'
  const isHigh = event.impact === 'High'
  const impactPct =
    sentiment === 'neutral'
      ? 0
      : isHigh
        ? 2.2 + Math.random() * 1.4
        : 1.1 + Math.random() * 0.7

  let headline = ''
  if (event.name === 'FOMC Interest Rate Decision') {
    if (sentiment === 'bullish') {
      headline = 'FOMC cuts interest rates by 50 basis points, citing cooling inflation trends'
    } else if (sentiment === 'bearish') {
      headline = 'FOMC hikes rates by 25 basis points; chair warns policy may tighten further'
    } else {
      headline = 'FOMC pauses rate adjustments, keeping federal funds target unchanged'
    }
  } else if (event.name === 'CPI Inflation Report') {
    if (sentiment === 'bullish') {
      headline = 'CPI inflation prints at 2.9% year-over-year, coming in below consensus'
    } else if (sentiment === 'bearish') {
      headline = 'CPI inflation rises unexpectedly to 3.4%, stoking rate hike concerns'
    } else {
      headline = 'CPI inflation tracks in-line at 3.1%, matching economist expectations'
    }
  } else if (event.name === 'Non-Farm Payrolls Jobs Report') {
    if (sentiment === 'bullish') {
      headline = 'Non-farm payrolls expand by a healthy 210,000, signaling economic strength'
    } else if (sentiment === 'bearish') {
      headline = 'Non-farm payrolls gain only 95,000, raising labor market slowdown worries'
    } else {
      headline = 'Non-farm payrolls print flat at 155,000, indicating steady baseline growth'
    }
  } else if (event.name === 'GDP Growth Estimate') {
    if (sentiment === 'bullish') {
      headline = 'Annualized GDP growth hits robust 3.2% in second estimate, exceeding forecasts'
    } else if (sentiment === 'bearish') {
      headline = 'Annualized GDP growth decelerates to 1.1%, signaling near-term expansion risk'
    } else {
      headline = 'Annualized GDP growth matches baseline estimates at 2.1% quarterly rate'
    }
  } else {
    if (sentiment === 'bullish') {
      headline = 'Retail sales climb 0.8% in monthly telemetry, indicating robust consumer spending'
    } else if (sentiment === 'bearish') {
      headline = 'Retail sales contract 0.4%, flagging consumer pullback and margin pressures'
    } else {
      headline = 'Retail sales track flat at 0.1% month-over-month, showing stable demand'
    }
  }

  return { headline, sentiment, impactPct }
}

export function useMarket(options: UseMarketOptions = {}) {
  const { onStockSplits, isOnlineAndLoggedIn = true, macroCount = 0, onMacroTrigger, sessionKey = 'guest', speedMultiplier = 1 } = options
  const onStockSplitsRef = useRef(onStockSplits)
  onStockSplitsRef.current = onStockSplits

  const onMacroTriggerRef = useRef(onMacroTrigger)
  onMacroTriggerRef.current = onMacroTrigger

  const [stocks, setStocks] = useState<Stock[]>(() => {
    try {
      const saved = localStorage.getItem(`thriv-stocks-${sessionKey}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.warn('[useMarket] Failed to load saved stocks:', e)
    }
    return createInitialStocks()
  })
  const [news, setNews] = useState(() => getInitialNews())
  const [flashBanner, setFlashBanner] = useState<MarketNews | null>(null)
  const [marketOpen, setMarketOpen] = useState(true)
  const [lastTick, setLastTick] = useState(Date.now())
  const marketDayRef = useRef(localDateKey())

  // Load/initialize trigger count from options
  const getTodayMacroCount = useCallback(() => {
    return macroCount
  }, [macroCount])

  const incrementTodayMacroCount = useCallback(() => {
    onMacroTriggerRef.current?.()
    return macroCount + 1
  }, [macroCount])

  const todayCount = macroCount

  // Economic Calendar state
  const [macroState, setMacroState] = useState<'cooldown' | 'waiting' | 'countdown' | 'active' | 'dormant'>(() => {
    return macroCount >= 5 ? 'dormant' : 'waiting'
  })

  // Synchronize dormant state reactively when counts change
  useEffect(() => {
    if (macroCount >= 5) {
      setMacroState('dormant')
    } else if (macroState === 'dormant') {
      setMacroState('waiting')
    }
  }, [macroCount, macroState])

  // Roll wait seconds left initially: 2 to 5 minutes (120 to 300 seconds)
  const [, setWaitSecondsLeft] = useState(() =>
    Math.floor(Math.random() * (300 - 120 + 1)) + 120
  )
  const [secondsLeft, setSecondsLeft] = useState(45)
  const [, setCooldownSecondsLeft] = useState(30)
  const [eventIdx, setEventIdx] = useState(0)
  const [pulseActive, setPulseActive] = useState(false)

  const activeStocksRef = useRef(stocks)
  activeStocksRef.current = stocks

  const triggerEconomicEvent = useCallback(() => {
    const event = ECONOMIC_EVENTS[eventIdx]
    const outcome = generateEventOutcome(event)
    const currentStocks = activeStocksRef.current

    // Limit to random 3-7 companies
    const pool = event.sectors
      ? currentStocks.filter((s) => event.sectors!.includes(s.sector))
      : currentStocks

    const numToAffect = Math.floor(Math.random() * 5) + 3 // 3 to 7
    const shuffled = [...pool].sort(() => 0.5 - Math.random())
    const selectedStocks = shuffled.slice(0, Math.min(numToAffect, shuffled.length))
    const affectedSymbols = selectedStocks.map((s) => s.symbol)

    const flashNewsItem: MarketNews = {
      id: 'economic-' + Date.now(),
      headline: outcome.headline,
      summary: `Economic release: ${event.name} outcome is ${outcome.sentiment}. Impact: ${event.impact}.`,
      symbols: affectedSymbols,
      sentiment: outcome.sentiment,
      timestamp: Date.now(),
      flash: true,
      impactPct: outcome.impactPct,
    }

    setStocks((prev) => applyNewsImpact(prev, flashNewsItem))
    setNews((prev) => [flashNewsItem, ...prev].slice(0, 14))
    setFlashBanner(flashNewsItem)
    setPulseActive(true)
    setMacroState('active')

    // Increment today's macro trigger count
    incrementTodayMacroCount()

    // Cycle to next event index
    setEventIdx((prev) => (prev + 1) % ECONOMIC_EVENTS.length)

    // Volatility stays active for 15 seconds after announcement
    const timer = setTimeout(() => {
      setPulseActive(false)
      setCooldownSecondsLeft(30) // Cooldown period: 30 seconds
      setMacroState('cooldown')

      // Closes automatically after 15 seconds from Macro outlook cooldown taking place
      setTimeout(() => {
        setFlashBanner((prev) => {
          if (prev && prev.id.startsWith('economic-')) {
            return null
          }
          return prev
        })
      }, 15000)
    }, 15000)

    return () => clearTimeout(timer)
  }, [eventIdx, incrementTodayMacroCount])

  const triggerEconomicEventRef = useRef(triggerEconomicEvent)
  triggerEconomicEventRef.current = triggerEconomicEvent

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

    setMacroState('waiting')
    setWaitSecondsLeft(Math.floor(Math.random() * (300 - 120 + 1)) + 120)
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

  // Combined 1-second interval ticking price & economic timer
  useEffect(() => {
    if (!marketOpen) return
    const id = setInterval(() => {
      // Tick stock prices
      setStocks((prev) => prev.map((s) => tickPrice(s, pulseActive ? 2.5 : 1.0)))
      setLastTick(Date.now())

      // Only proceed with macro scheduling if online and logged in
      if (!isOnlineAndLoggedIn) return

      // State machine for macro releases
      if (macroState === 'dormant') {
        return
      }

      if (macroState === 'active') {
        return
      }

      if (macroState === 'cooldown') {
        setCooldownSecondsLeft((prev) => {
          if (prev <= 1) {
            // Cooldown finished! Let's check today's count
            const currentCount = getTodayMacroCount()
            if (currentCount >= 5) {
              setMacroState('dormant')
              return 0
            } else {
              // Roll new wait time: 2 to 5 minutes (120 to 300 seconds)
              const newWait = Math.floor(Math.random() * (300 - 120 + 1)) + 120
              setWaitSecondsLeft(newWait)
              setMacroState('waiting')
              return 0
            }
          }
          return prev - 1
        })
      } else if (macroState === 'waiting') {
        setWaitSecondsLeft((prev) => {
          if (prev <= 1) {
            // Wait time finished! Enter countdown phase
            setSecondsLeft(45)
            setMacroState('countdown')
            return 0
          }
          return prev - 1
        })
      } else if (macroState === 'countdown') {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Countdown finished! Trigger macro event
            triggerEconomicEventRef.current()
            return 0
          }
          return prev - 1
        })
      }
    }, Math.round(TICK_MS / speedMultiplier))
    return () => clearInterval(id)
  }, [marketOpen, pulseActive, macroState, isOnlineAndLoggedIn, getTodayMacroCount, speedMultiplier])

  useEffect(() => {
    const id = setInterval(() => {
      const item = generateNews()
      setNews((prev) => [item, ...prev].slice(0, 14))
    }, Math.round(NEWS_MS / speedMultiplier))
    return () => clearInterval(id)
  }, [speedMultiplier])

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
      hideTimer = setTimeout(() => setFlashBanner(null), Math.round(8000 / speedMultiplier))
      flashTimer = setTimeout(runFlash, Math.round(randomFlashDelayMs() / speedMultiplier))
    }

    flashTimer = setTimeout(runFlash, Math.round(randomFlashDelayMs() / speedMultiplier))

    return () => {
      clearTimeout(flashTimer)
      clearTimeout(hideTimer)
    }
  }, [speedMultiplier])

  const getStock = useCallback(
    (symbol: string) => stocks.find((s) => s.symbol === symbol),
    [stocks]
  )

  // Save stocks periodically (every 5 seconds) to avoid losing state on crashes/exits
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem(`thriv-stocks-${sessionKey}`, JSON.stringify(activeStocksRef.current))
      } catch (e) {
        console.warn('[useMarket] Periodic save failed:', e)
      }
    }, 5000)
    return () => clearInterval(saveInterval)
  }, [sessionKey])

  // Save stocks on page unload or visibility change
  useEffect(() => {
    const handleUnload = () => {
      try {
        localStorage.setItem(`thriv-stocks-${sessionKey}`, JSON.stringify(activeStocksRef.current))
      } catch (e) {
        console.warn('[useMarket] Unload save failed:', e)
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [sessionKey])

  const resetStocks = useCallback(() => {
    try {
      localStorage.removeItem(`thriv-stocks-${sessionKey}`)
    } catch (e) {
      console.warn('[useMarket] Clear saved stocks failed:', e)
    }
    setStocks(createInitialStocks())
  }, [sessionKey])

  return {
    stocks,
    news,
    flashBanner,
    marketOpen,
    setMarketOpen,
    lastTick,
    getStock,
    nextEvent: {
      name: ECONOMIC_EVENTS[eventIdx].name,
      secondsLeft: macroState === 'countdown' ? secondsLeft : null,
      impact: ECONOMIC_EVENTS[eventIdx].impact,
      macroState,
      todayCount,
      isOnlineAndLoggedIn,
    },
    pulseActive,
    resetStocks,
  }
}
