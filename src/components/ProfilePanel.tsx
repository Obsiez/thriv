import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  ChevronLeft,
  ChevronRight,
  Share2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency } from '../lib/marketEngine'
import { ProfileAvatar } from './ProfileAvatar'
import type { Portfolio, PlayerProgress, Stock } from '../types'
import type { ProfilePrefs } from '../lib/profileTheme'

interface LedgerViewProps {
  portfolio: Portfolio
  progress: PlayerProgress
  totalValue: number
  stocks: Stock[]
  onProfileChange: (profile: ProfilePrefs) => void
  onOpenShareStats: () => void
}

// Card tier metadata structure
interface CardTier {
  id: 'grid' | 'zenith' | 'apex' | 'vellum'
  name: string
  threshold: number
  cvv: string
  expiry: string
  textColor: string
  borderClass: string
  glowClass: string
  gradientClass: string
}

const CARD_TIERS: CardTier[] = [
  {
    id: 'grid',
    name: 'GRID',
    threshold: 0,
    cvv: '321',
    expiry: '12/30',
    textColor: 'text-white font-semibold',
    borderClass: '',
    glowClass: '',
    gradientClass: 'from-[#b91c1c] via-[#991b1b] to-[#450a0a]',
  },
  {
    id: 'zenith',
    name: 'ZENITH',
    threshold: 250000,
    cvv: '789',
    expiry: '08/31',
    textColor: 'text-slate-100 font-extrabold tracking-widest bg-gradient-to-r from-slate-200 via-white to-slate-400 text-transparent bg-clip-text',
    borderClass: '',
    glowClass: '',
    gradientClass: 'from-[#2d3748] via-[#1a202c] to-[#0f172a]',
  },
  {
    id: 'apex',
    name: 'APEX',
    threshold: 500000,
    cvv: '456',
    expiry: '05/32',
    textColor: 'bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 text-transparent bg-clip-text font-black tracking-widest',
    borderClass: '',
    glowClass: '',
    gradientClass: 'from-[#0f1115] via-[#090b0e] to-[#020202]',
  },
  {
    id: 'vellum',
    name: 'VELLUM',
    threshold: 0,
    cvv: '147',
    expiry: '03/31',
    textColor: 'text-[#4a4a4f] font-extrabold tracking-widest',
    borderClass: '',
    glowClass: '',
    gradientClass: 'from-[#f5f5f7] via-[#ebebed] to-[#dcdce0]',
  },
]

const EMVChip = ({ variant }: { variant: 'silver' | 'dark' | 'gold' | 'matte' }) => {
  let bgGradient = 'from-slate-300 via-slate-100 to-slate-400 border-slate-400/40'
  let gridColor = 'border-slate-800/30'
  let innerBg = 'bg-slate-200/50'

  if (variant === 'dark') {
    bgGradient = 'from-zinc-750 via-zinc-550 to-zinc-850 border-zinc-800/40'
    gridColor = 'border-zinc-950/45'
    innerBg = 'bg-zinc-600/40'
  } else if (variant === 'gold') {
    bgGradient = 'from-amber-400 via-yellow-100 to-amber-600 border-amber-600/45'
    gridColor = 'border-amber-950/40'
    innerBg = 'bg-yellow-300/40'
  } else if (variant === 'matte') {
    bgGradient = 'from-[#ebebed] via-[#d8d8dc] to-[#c8c8cc] border-[#c0c0c6]'
    gridColor = 'border-[#9e9ea6]/50'
    innerBg = 'bg-[#d8d8dc]/60'
  }

  const baseClass = `relative h-6 w-8 rounded-md bg-gradient-to-br ${bgGradient} border p-0.5 overflow-hidden flex flex-col justify-between shrink-0 z-10`

  return (
    <div className={baseClass}>
      {/* Satin highlight — top-left whisper of white, matte variant only */}
      {variant === 'matte' && (
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-20 rounded-t-md" />
      )}
      <div className="absolute inset-0 grid grid-cols-3 gap-[1px] opacity-40">
        <div className={`border-r border-b ${gridColor}`}></div>
        <div className={`border-r border-b ${gridColor}`}></div>
        <div className={`border-b ${gridColor}`}></div>
        <div className={`border-r border-b ${gridColor}`}></div>
        <div className={`border-r border-b ${gridColor}`}></div>
        <div className={`border-b ${gridColor}`}></div>
        <div className={`border-r ${gridColor}`}></div>
        <div className={`border-r ${gridColor}`}></div>
        <div></div>
      </div>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-2.5 rounded-sm border ${gridColor} ${innerBg}`} />
    </div>
  )
}


// Mock data for interactive chart
interface ChartDataPoint {
  label: string
  investedPct: number
  earnedPct: number
  lostPct: number
}

const CHART_DATASETS: Record<'day' | 'week' | 'month', ChartDataPoint[]> = {
  day: [
    { label: '09:30', investedPct: 60, earnedPct: 3.5, lostPct: 1.2 },
    { label: '11:30', investedPct: 65, earnedPct: 5.2, lostPct: 1.5 },
    { label: '13:30', investedPct: 72, earnedPct: 6.8, lostPct: 2.1 },
    { label: '15:30', investedPct: 78, earnedPct: 5.9, lostPct: 3.4 },
    { label: '17:30', investedPct: 75, earnedPct: 8.5, lostPct: 2.8 },
  ],
  week: [
    { label: 'Mon', investedPct: 62, earnedPct: 4.2, lostPct: 1.8 },
    { label: 'Tue', investedPct: 68, earnedPct: 5.5, lostPct: 2.2 },
    { label: 'Wed', investedPct: 70, earnedPct: 3.8, lostPct: 4.5 },
    { label: 'Thu', investedPct: 75, earnedPct: 7.1, lostPct: 3.0 },
    { label: 'Fri', investedPct: 80, earnedPct: 9.6, lostPct: 2.5 },
    { label: 'Sat', investedPct: 80, earnedPct: 9.6, lostPct: 2.5 },
    { label: 'Sun', investedPct: 78, earnedPct: 11.2, lostPct: 2.0 },
  ],
  month: [
    { label: 'Wk 1', investedPct: 55, earnedPct: 3.0, lostPct: 2.0 },
    { label: 'Wk 2', investedPct: 62, earnedPct: 5.1, lostPct: 2.5 },
    { label: 'Wk 3', investedPct: 68, earnedPct: 7.8, lostPct: 1.8 },
    { label: 'Wk 4', investedPct: 72, earnedPct: 6.2, lostPct: 5.0 },
    { label: 'Wk 5', investedPct: 76, earnedPct: 9.4, lostPct: 3.2 },
    { label: 'Wk 6', investedPct: 82, earnedPct: 12.5, lostPct: 2.8 },
  ],
}

const PIE_COLORS = [
  '#14b896', // thriv-500
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#f43f5e', // rose
]

interface LedgerItem {
  id: string
  type: 'buy' | 'sell' | 'deposit'
  symbol?: string
  title: string
  subtitle: string
  amount: number
  dateText: string
}

export function LedgerView({
  portfolio,
  progress,
  totalValue,
  stocks,
  onProfileChange,
  onOpenShareStats,
}: LedgerViewProps) {
  const { user } = useAuth()
  const [activeCardIndex, setActiveCardIndex] = useState(() => {
    let latestUnlockedIndex = 0
    const peak = progress?.stats?.portfolioPeak ?? 0
    const activeVal = Math.max(totalValue, peak)
    for (let i = CARD_TIERS.length - 1; i >= 0; i--) {
      if (activeVal >= CARD_TIERS[i].threshold) {
        latestUnlockedIndex = i
        break
      }
    }
    return latestUnlockedIndex
  })
  const [isFlipped, setIsFlipped] = useState(false)

  const handleToggleCardActive = (cardId: string) => {
    const deactivated = progress.profile?.deactivatedCards ?? []
    let nextDeactivated: string[]
    let nextDefault = progress.profile?.defaultCardId || 'grid'

    if (deactivated.includes(cardId)) {
      // Activate
      nextDeactivated = deactivated.filter((id) => id !== cardId)
    } else {
      // Deactivate
      nextDeactivated = [...deactivated, cardId]
      if (nextDefault === cardId) {
        nextDefault = 'grid'
      }
    }

    onProfileChange({
      ...progress.profile,
      deactivatedCards: nextDeactivated,
      defaultCardId: nextDefault,
    })
  }

  const handleSetCardDefault = (cardId: string) => {
    onProfileChange({
      ...progress.profile,
      defaultCardId: cardId,
    })
  }
  const [chartTab, setChartTab] = useState<'day' | 'week' | 'month'>('week')
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null)

  const carouselRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScrolling = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  // Refs to hold the latest values from props
  const latestTotalValueRef = useRef(totalValue)
  const latestStocksRef = useRef(stocks)
  const latestPortfolioRef = useRef(portfolio)

  // Keep refs up-to-date on every render (cheap O(1) operation)
  useEffect(() => {
    latestTotalValueRef.current = totalValue
    latestStocksRef.current = stocks
    latestPortfolioRef.current = portfolio
  }, [totalValue, stocks, portfolio])

  // Live state with throttle to avoid massive CPU/RAM load on market ticks
  const [liveTotalValue, setLiveTotalValue] = useState(totalValue)
  const [liveStocks, setLiveStocks] = useState(stocks)
  const [livePortfolio, setLivePortfolio] = useState(portfolio)

  const activePeakVal = Math.max(liveTotalValue, progress?.stats?.portfolioPeak ?? 0)
  const deactivated = progress.profile?.deactivatedCards ?? []
  const isApexActive = activePeakVal >= 500000 && !deactivated.includes('apex')
  const isZenithActive = activePeakVal >= 250000 && !deactivated.includes('zenith')

  // Immediately sync when props change
  useEffect(() => {
    setLiveTotalValue(totalValue)
    setLiveStocks(stocks)
    setLivePortfolio(portfolio)
  }, [totalValue, stocks, portfolio])

  // Throttled updates every 1.5 seconds to reduce DOM churn and CPU/RAM load
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTotalValue(latestTotalValueRef.current)
      setLiveStocks(latestStocksRef.current)
      setLivePortfolio(latestPortfolioRef.current)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // QoL: Scroll to the default card when Ledger is opened (mount only)
  useEffect(() => {
    const defaultId = progress.profile?.defaultCardId || 'grid'
    const defaultIdx = CARD_TIERS.findIndex((c) => c.id === defaultId)
    const targetIndex = defaultIdx >= 0 ? defaultIdx : 0
    setActiveCardIndex(targetIndex)
    setIsFlipped(false)
    
    // Instantly snap scroll positions to the default card
    const timer = setTimeout(() => {
      if (carouselRef.current) {
        const containerWidth = carouselRef.current.offsetWidth
        carouselRef.current.scrollLeft = targetIndex * (containerWidth + 16)
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Handle scroll events inside the horizontal carousel to sync dot indicators
  const handleScroll = () => {
    if (isProgrammaticScrolling.current) return
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft
      const containerWidth = carouselRef.current.offsetWidth
      if (containerWidth > 0) {
        const index = Math.round(scrollLeft / (containerWidth + 16))
        if (index !== activeCardIndex && index >= 0 && index < CARD_TIERS.length) {
          setActiveCardIndex(index)
        }
      }
    }
  }

  // Scroll smoothly to a specific card index
  const scrollToCard = (index: number) => {
    if (carouselRef.current) {
      isProgrammaticScrolling.current = true
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      
      const containerWidth = carouselRef.current.offsetWidth
      carouselRef.current.scrollTo({
        left: index * (containerWidth + 16),
        behavior: 'smooth',
      })
      setActiveCardIndex(index)

      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrolling.current = false
      }, 400)
    }
  }

  // Map and compute held stocks by current market value and percentage
  const holdingsData = useMemo(() => {
    if (!livePortfolio.holdings) return []
    const data = livePortfolio.holdings
      .map((h) => {
        const stock = liveStocks.find((s) => s.symbol === h.symbol)
        const currentPrice = stock?.price ?? h.avgCost
        const value = h.quantity * currentPrice
        return {
          symbol: h.symbol,
          name: stock?.name ?? h.symbol,
          quantity: h.quantity,
          currentPrice,
          value,
          sector: stock?.sector ?? 'Other',
        }
      })
      .filter((h) => h.quantity > 0)

    // Sort by value descending
    data.sort((a, b) => b.value - a.value)
    return data
  }, [livePortfolio.holdings, liveStocks])

  const totalHoldingsValue = useMemo(() => {
    return holdingsData.reduce((sum, h) => sum + h.value, 0)
  }, [holdingsData])

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false)
  }, [activeCardIndex])

  if (!open) return null

  const displayName = user?.displayName || 'Trader'
  const motto = progress.profile?.motto || 'Discipline over noise'
  const accentId = progress.profile?.accentId || 'teal'
  const initial = displayName.charAt(0).toUpperCase()

  const analystBadge = useMemo(() => {
    let title = 'Bronze Analyst'
    let style = 'bg-amber-950/20 text-amber-500 border-amber-500/30'
    
    if (progress.level >= 15) {
      title = 'Platinum Elite'
      style = 'bg-slate-300/10 text-slate-200 border-slate-300/30'
    } else if (progress.level >= 10) {
      title = 'Gold Master'
      style = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    } else if (progress.level >= 5) {
      title = 'Silver Pro'
      style = 'bg-slate-500/15 text-slate-300 border-slate-500/30'
    }
    return { title, style }
  }, [progress.level])

  // Dynamic Tier status & Glow lines
  const tierInfo = useMemo(() => {
    let label = 'Standard Tier'
    let badgeStyle = 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    let glowGradient = 'from-teal-500/40 via-indigo-500/10 to-transparent'
    
    if (isApexActive) {
      label = 'Black Card Elite'
      badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      glowGradient = 'from-amber-500/30 via-amber-600/10 to-transparent'
    } else if (isZenithActive) {
      label = 'Silver Executive'
      badgeStyle = 'bg-slate-400/10 text-slate-300 border-slate-400/20'
      glowGradient = 'from-slate-400/35 via-slate-500/10 to-transparent'
    }
    return { label, badgeStyle, glowGradient }
  }, [isApexActive, isZenithActive])

  // Milestone Calculations
  const milestoneInfo = useMemo(() => {
    let label = ''
    let progressPct = 0
    let nextThreshold = ''
    
    const peak = progress?.stats?.portfolioPeak ?? 0
    const activePeak = Math.max(liveTotalValue, peak)
    
    if (activePeak < 250000) {
      label = 'Progress to ZENITH Tier'
      progressPct = Math.min(100, Math.max(0, (liveTotalValue / 250000) * 100))
      nextThreshold = '$250,000'
    } else if (activePeak < 500000) {
      label = 'Progress to APEX Tier'
      progressPct = Math.min(100, Math.max(0, ((liveTotalValue - 250000) / 250000) * 100))
      nextThreshold = '$500,000'
    } else {
      label = 'Ultimate Milestone Reached'
      progressPct = 100
      nextThreshold = 'APEX Tier'
    }
    return { label, progressPct, nextThreshold }
  }, [liveTotalValue, progress?.stats?.portfolioPeak])

  // Card unlock status check
  const isCardUnlocked = (tier: CardTier) => {
    const peak = progress?.stats?.portfolioPeak ?? 0
    return Math.max(liveTotalValue, peak) >= tier.threshold
  }

  const activeDataset = CHART_DATASETS[chartTab]

  // Recent Activity Log
  const ledgerItems = useMemo((): LedgerItem[] => {
    const filledOrders = [...livePortfolio.orders]
      .filter((o) => o.status === 'filled')
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 4)

    const mappedItems: LedgerItem[] = filledOrders.map((o) => {
      const isBuy = o.side === 'buy'
      const price = o.fillPrice ?? o.limitPrice ?? 0
      const totalCost = o.quantity * price
      const formattedDate = new Date(o.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      
      return {
        id: o.id,
        type: isBuy ? 'buy' : 'sell',
        symbol: o.symbol,
        title: `${isBuy ? 'Bought' : 'Sold'} ${o.symbol}`,
        subtitle: `${o.quantity.toLocaleString()} shares @ ${formatCurrency(price)}`,
        amount: isBuy ? -totalCost : totalCost,
        dateText: formattedDate,
      }
    })

    const fallbacks: LedgerItem[] = [
      {
        id: 'fallback-deposit',
        type: 'deposit',
        title: 'Initial Deposit Received',
        subtitle: 'Paper trading account loaded',
        amount: 100000,
        dateText: 'Day 1',
      },
      {
        id: 'fallback-welcome',
        type: 'deposit',
        title: 'Welcome Bonus Claimed',
        subtitle: 'Level 1 basic certification achieved',
        amount: 0,
        dateText: 'Day 1',
      },
      {
        id: 'fallback-setup',
        type: 'deposit',
        title: 'Simulator Setup Completed',
        subtitle: 'Security protocol accepted',
        amount: 0,
        dateText: 'Day 1',
      },
    ]

    const result = [...mappedItems]
    for (const item of fallbacks) {
      if (result.length >= 4) break
      result.push(item)
    }

    return result.slice(0, 4)
  }, [livePortfolio.orders])

  return (
    <div className="space-y-6">

      {/* Main Contents Body */}
      <div className="space-y-5 md:space-y-6">
          
          {/* Overhauled Compact Player Card */}
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-surface-950/50 p-3 sm:p-4 flex items-center justify-between gap-4 w-full">
            <div className={`absolute inset-0 bg-gradient-to-br opacity-15 ${tierInfo.glowGradient} pointer-events-none`} />
            
            <div className="flex items-center gap-3 min-w-0 relative z-10">
              <div className="relative shrink-0 flex items-center">
                <ProfileAvatar initial={initial} accentId={accentId} size="md" />
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-semibold text-sm sm:text-base text-white truncate leading-none">
                    {displayName}
                  </h3>
                  <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-slate-300 leading-none">
                    Lv. {progress.level}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-semibold border ${analystBadge.style} leading-none`}>
                    <span className="h-1 w-1 rounded-full bg-current" />
                    {analystBadge.title}
                  </span>
                  <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider ${tierInfo.badgeStyle} leading-none`}>
                    {tierInfo.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic truncate leading-snug">
                  "{motto}"
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end gap-1.5 relative z-10 pr-1">
              <div className="font-mono text-[9px] text-slate-500 space-y-0.5">
                <p className="text-slate-300 font-bold tracking-tight">{progress.xp.toLocaleString()} XP</p>
                <p className="opacity-80">{progress.stats.totalTrades} trade(s)</p>
              </div>
              <button
                type="button"
                onClick={onOpenShareStats}
                className="flex items-center gap-1 px-2 py-0.5 bg-thriv-500/10 hover:bg-thriv-500/20 active:scale-95 text-thriv-400 border border-thriv-500/20 rounded-md cursor-pointer transition-all text-[9px] font-semibold"
              >
                <Share2 className="h-2.5 w-2.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: Card Carousel (Left) & Balance/Milestone (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
            
            {/* Left Column: Carousel Card Container */}
            <div className="flex flex-col items-center w-full max-w-[440px] mx-auto overflow-hidden">
              <div className="w-full flex items-center justify-between mb-3.5 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Virtual Cards</span>
                <span className="text-[10px] font-mono text-slate-400">Card {activeCardIndex + 1} of {CARD_TIERS.length}</span>
              </div>
              
              {/* Carousel Track with native scroll snap */}
              <div className="relative w-full select-none">
                <div 
                  ref={carouselRef}
                  onScroll={handleScroll}
                  className="flex w-full gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none py-1 scroll-smooth"
                >
                  {CARD_TIERS.map((card, i) => {
                    const unlocked = isCardUnlocked(card)
                    const cardNo = card.id === 'grid' 
                      ? progress.profile.gridCardNo || '4000 1234 5678 9010' 
                      : card.id === 'zenith' 
                      ? progress.profile.zenithCardNo || '5100 9876 5432 1098' 
                      : card.id === 'apex'
                      ? progress.profile.apexCardNo || '3700 1111 2222 3333'
                      : '6011 4444 5555 6666'

                    const cvv = card.id === 'grid'
                      ? progress.profile.gridCvv || '321'
                      : card.id === 'zenith'
                      ? progress.profile.zenithCvv || '789'
                      : card.id === 'apex'
                      ? progress.profile.apexCvv || '456'
                      : '147'

                    const expiry = card.id === 'grid'
                      ? progress.profile.gridExpiry || '12/30'
                      : card.id === 'zenith'
                      ? progress.profile.zenithExpiry || '08/31'
                      : card.id === 'apex'
                      ? progress.profile.apexExpiry || '05/32'
                      : '03/31'

                    return (
                      <div 
                        key={card.id} 
                        className="w-full shrink-0 snap-center snap-always px-0.5"
                      >
                        <div
                          className={`relative w-full aspect-[1.586] rounded-2xl transition-all duration-500 transform-style-3d cursor-pointer shadow-none ${card.glowClass} ${
                            activeCardIndex === i && isFlipped ? 'rotate-y-180' : ''
                          }`}
                          onClick={() => {
                            if (unlocked && activeCardIndex === i) {
                              setIsFlipped(!isFlipped)
                            }
                          }}
                        >
                          {/* FRONT SIDE */}
                          <div className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${card.gradientClass} p-5 sm:p-6 flex flex-col justify-between backface-hidden z-20 overflow-hidden shadow-none ${card.id === 'vellum' ? 'shadow-[0_2px_24px_0_rgba(0,0,0,0.10)]' : ''}`}>
                            
                            {/* Crimson Red Card Texture Overlay */}
                            {card.id === 'grid' && (
                              <div 
                                className="absolute inset-0 z-0 opacity-25 mix-blend-overlay"
                                style={{
                                  backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
                                  backgroundSize: '12px 12px',
                                }}
                              />
                            )}

                            {/* Zenith Grey Card Texture Overlay */}
                            {card.id === 'zenith' && (
                              <>
                                <div 
                                  className="absolute inset-0 z-0 opacity-20 mix-blend-overlay"
                                  style={{
                                    backgroundImage: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                                    backgroundSize: '6px 100%',
                                  }}
                                />
                                <div className="absolute inset-0 z-0 opacity-[0.06] flex flex-wrap gap-x-6 gap-y-4 p-4 text-[8px] font-mono tracking-widest text-white uppercase select-none pointer-events-none rotate-12 scale-110">
                                  {Array.from({ length: 24 }).map((_, idx) => (
                                    <span key={idx} className="font-semibold">THRIV</span>
                                  ))}
                                </div>
                              </>
                            )}

                            {/* Apex Black Steel Gold Accent Lines */}
                            {card.id === 'apex' && (
                              <>
                                <div 
                                  className="absolute inset-0 z-0 opacity-[0.15]"
                                  style={{
                                    backgroundImage: 'linear-gradient(135deg, transparent 40%, #fbbf24 40.5%, #fbbf24 41%, transparent 41.5%, transparent 45%, #fbbf24 45.5%, transparent 46%)',
                                    backgroundSize: '100px 100px',
                                  }}
                                />
                                <div 
                                  className="absolute inset-0 z-0 opacity-5"
                                  style={{
                                    backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.05) 75%, transparent 75%, transparent)',
                                    backgroundSize: '3px 3px',
                                  }}
                                />
                              </>
                            )}
                            
                            {/* Vellum Card Texture — soft diagonal linen weave */}
                            {card.id === 'vellum' && (
                              <>
                                <div
                                  className="absolute inset-0 z-0 opacity-[0.35] mix-blend-multiply"
                                  style={{
                                    backgroundImage: 'repeating-linear-gradient(135deg, rgba(180,180,190,0.18) 0px, rgba(180,180,190,0.18) 1px, transparent 1px, transparent 8px)',
                                  }}
                                />
                                {/* Subtle silver shimmer band */}
                                <div className="absolute top-[-50%] left-[-20%] w-[40%] h-[200%] bg-gradient-to-r from-transparent via-white/[0.55] to-transparent rotate-[30deg] pointer-events-none z-10" />
                              </>
                            )}

                            {/* Elegant subtle glass reflection gloss */}
                            {card.id !== 'vellum' && (
                              <div className="absolute top-[-50%] left-[-20%] w-[45%] h-[200%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent rotate-30 pointer-events-none z-10" />
                            )}

                            {/* EMV Chip and Tier name */}
                            <div className="flex items-center justify-between relative z-10">
                              <EMVChip variant={card.id === 'apex' ? 'gold' : card.id === 'vellum' ? 'matte' : 'silver'} />
                              <div className="flex items-center gap-1.5">

                                <span className={`font-display text-xs sm:text-sm font-extrabold tracking-widest ${card.textColor}`}>
                                  {card.name}
                                </span>
                              </div>
                            </div>
                            
                            {/* Card Holder name */}
                            <div className="mt-3 relative z-10">
                              <p className={`text-[6px] sm:text-[7px] font-mono tracking-widest uppercase leading-none ${
                                card.id === 'grid' ? 'text-white font-bold' 
                                : card.id === 'vellum' ? 'text-[#6e6e73] font-semibold'
                                : 'text-white/70'
                              }`}>Card Holder</p>
                              <p className={`text-[10px] sm:text-xs font-bold truncate tracking-wide mt-1 ${
                                card.id === 'apex' 
                                  ? 'bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent' 
                                  : card.id === 'vellum'
                                  ? 'text-[#1d1d1f]'
                                  : 'text-white'
                              }`}>{displayName}</p>
                            </div>
                            
                            <div className="flex items-end justify-between mt-auto relative z-10">
                              <p className={`font-mono text-xs sm:text-sm tracking-widest ${
                                card.id === 'apex' ? 'text-amber-400/90' 
                                : card.id === 'vellum' ? 'text-[#3a3a3c]'
                                : 'text-slate-300'
                              }`}>
                                {unlocked ? '•••• ' + cardNo.slice(-4) : '•••• ••••'}
                              </p>
                              
                              {unlocked ? (
                                <button
                                  type="button"
                                  className={`text-[8px] font-bold uppercase tracking-wider rounded px-2.5 py-1 transition-all border ${
                                    card.id === 'apex' 
                                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20' 
                                      : card.id === 'zenith'
                                      ? 'text-slate-200 bg-white/5 border-white/10 hover:bg-white/15'
                                      : card.id === 'vellum'
                                      ? 'text-[#3a3a3c] bg-black/5 border-[#c7c7cc]/60 hover:bg-black/10'
                                      : 'text-red-200 bg-white/5 border-white/10 hover:bg-white/15'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setIsFlipped(true)
                                  }}
                                >
                                  Details
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 text-[8px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-mono leading-none">
                                  <Lock className="h-2.5 w-2.5 shrink-0" />
                                  Locked
                                </div>
                              )}
                            </div>

                            {/* Locked Blur Overlay */}
                            {!unlocked && (
                              <div className="absolute -inset-px rounded-2xl bg-black/70 backdrop-blur-[6px] flex flex-col items-center justify-center text-center p-4 z-30">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 mb-2">
                                  <Lock className="h-5 w-5" />
                                </div>
                                <p className="text-xs font-semibold text-white tracking-wide">{card.name} Premium Card</p>
                                <p className="text-[8px] text-slate-400 mt-1 font-mono">Unlocks at {formatCurrency(card.threshold)}</p>
                              </div>
                            )}

                            {/* Card Border Overlay */}
                            <div className={`absolute inset-0 rounded-2xl border pointer-events-none z-35 ${
                              card.id === 'apex' 
                                ? 'border-amber-500/20' 
                                : card.id === 'zenith'
                                ? 'border-slate-500/20'
                                : card.id === 'vellum'
                                ? 'border-[#b0b0b8]/50'
                                : 'border-white/10'
                            }`} />
                          </div>

                          {/* BACK SIDE */}
                          {unlocked && (
                            <div className={`absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col justify-between backface-hidden rotate-y-180 z-10 overflow-hidden shadow-none ${
                              card.id === 'apex'
                                ? 'bg-gradient-to-br from-[#0c0d10] via-black to-[#050505] text-amber-400'
                                : card.id === 'zenith'
                                ? 'bg-gradient-to-br from-zinc-800 via-neutral-900 to-neutral-950 text-slate-200'
                                : card.id === 'vellum'
                                ? 'bg-gradient-to-br from-[#f0f0f2] via-[#e8e8ea] to-[#dcdcde] text-[#3a3a3c]'
                                : 'bg-gradient-to-br from-red-950 via-neutral-950 to-neutral-950 text-red-200'
                            }`}>
                              {/* Magnetic Stripe */}
                              <div className={`absolute top-4 left-[-8px] right-[-8px] h-8 z-0 border-y ${
                                card.id === 'vellum'
                                  ? 'bg-[#c7c7cc]/60 border-[#b0b0b8]/40'
                                  : 'bg-neutral-950 border-white/5'
                              }`} />
                              
                              {/* Signature Panel & CVV */}
                              <div className="mt-8 flex items-end justify-between gap-3 relative z-10 w-full px-1">
                                <div className="flex-1">
                                  <p className="text-[6px] uppercase font-mono leading-none text-slate-400 tracking-wider mb-1">Signature</p>
                                  <div className="h-8 flex items-center rounded px-3 bg-white border border-slate-200 select-none">
                                    <span className="font-display font-medium text-[8px] italic tracking-wide text-black truncate">
                                      {displayName}
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-[6px] uppercase font-mono leading-none text-slate-400 tracking-wider mb-1">CVV</p>
                                  <div className="h-8 w-12 flex items-center justify-center rounded bg-white border border-slate-200 text-center">
                                    <span className="font-bold font-mono text-[9px] tracking-wider text-black">{cvv}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Full Card Number & Expiry */}
                              <div className="mt-auto space-y-1 relative z-10">
                                <div className="flex justify-between items-end">
                                  <div>
                                    <p className="text-[6px] uppercase font-mono leading-none text-slate-400 tracking-wider">Card Number</p>
                                    <p className={`text-[11px] font-bold font-mono tracking-widest mt-0.5 ${
                                      card.id === 'apex'
                                        ? 'bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent'
                                        : 'text-white'
                                    }`}>{cardNo}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[6px] uppercase font-mono leading-none text-slate-400 tracking-wider font-semibold">Expires</p>
                                    <p className="text-[10px] font-bold font-mono mt-0.5 text-white">{expiry}</p>
                                  </div>
                                </div>
                                
                                {/* Disclaimer */}
                                <div className="border-t border-white/[0.04] pt-1.5 flex justify-between items-center text-[5.5px] font-mono tracking-wide text-slate-500 uppercase">
                                  <span>Thriv Virtual Ledger Card</span>
                                  <span>Simulated Trading Use Only</span>
                                </div>
                              </div>

                              {/* Card Border Overlay */}
                              <div className={`absolute inset-0 rounded-2xl border pointer-events-none z-30 ${
                                card.id === 'apex' 
                                  ? 'border-amber-500/20' 
                                  : card.id === 'zenith'
                                  ? 'border-slate-500/20'
                                  : card.id === 'vellum'
                                  ? 'border-[#b0b0b8]/50'
                                  : 'border-white/10'
                              }`} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Slider indicators with Chevrons (Desktop only, compact spacing) */}
              <div className="flex items-center justify-center gap-4 mt-3.5 md:mt-2">
                {/* Chevron Left */}
                <button
                  type="button"
                  onClick={() => {
                    const prevIndex = Math.max(0, activeCardIndex - 1)
                    scrollToCard(prevIndex)
                  }}
                  disabled={activeCardIndex === 0}
                  className={`hidden md:inline-flex p-0.5 rounded-full transition-all ${
                    activeCardIndex === 0 
                      ? 'text-white/10 cursor-not-allowed opacity-30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 active:scale-90'
                  }`}
                  aria-label="Previous card"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Dot Indicators */}
                <div className="flex justify-center gap-1.5">
                  {CARD_TIERS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        scrollToCard(i)
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeCardIndex === i ? 'w-4 bg-thriv-500' : 'w-1.5 bg-white/20'
                      }`}
                      aria-label={`Slide to card ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Chevron Right */}
                <button
                  type="button"
                  onClick={() => {
                    const nextIndex = Math.min(CARD_TIERS.length - 1, activeCardIndex + 1)
                    scrollToCard(nextIndex)
                  }}
                  disabled={activeCardIndex === CARD_TIERS.length - 1}
                  className={`hidden md:inline-flex p-0.5 rounded-full transition-all ${
                    activeCardIndex === CARD_TIERS.length - 1 
                      ? 'text-white/10 cursor-not-allowed opacity-30' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 active:scale-90'
                  }`}
                  aria-label="Next card"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Card Actions Panel */}
              <div className="w-full mt-4 p-3.5 rounded-xl border border-white/[0.06] bg-surface-900/60 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Card Status</span>
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border leading-none ${
                    !isCardUnlocked(CARD_TIERS[activeCardIndex])
                      ? 'bg-neutral-800 text-slate-500 border-white/5'
                      : deactivated.includes(CARD_TIERS[activeCardIndex].id)
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : progress.profile?.defaultCardId === CARD_TIERS[activeCardIndex].id
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {!isCardUnlocked(CARD_TIERS[activeCardIndex])
                      ? 'LOCKED'
                      : deactivated.includes(CARD_TIERS[activeCardIndex].id)
                      ? 'DEACTIVATED'
                      : progress.profile?.defaultCardId === CARD_TIERS[activeCardIndex].id
                      ? 'DEFAULT / ACTIVE'
                      : 'ACTIVE'}
                  </span>
                </div>
                
                {isCardUnlocked(CARD_TIERS[activeCardIndex]) ? (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Activate / Deactivate Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleCardActive(CARD_TIERS[activeCardIndex].id)}
                      disabled={CARD_TIERS[activeCardIndex].id === 'grid' || CARD_TIERS[activeCardIndex].id === 'vellum'}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        deactivated.includes(CARD_TIERS[activeCardIndex].id)
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      {deactivated.includes(CARD_TIERS[activeCardIndex].id) ? 'Activate Card' : 'Deactivate Card'}
                    </button>
                    
                    {/* Set Default Button */}
                    <button
                      type="button"
                      onClick={() => handleSetCardDefault(CARD_TIERS[activeCardIndex].id)}
                      disabled={deactivated.includes(CARD_TIERS[activeCardIndex].id) || progress.profile?.defaultCardId === CARD_TIERS[activeCardIndex].id}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold border transition-all ${
                        progress.profile?.defaultCardId === CARD_TIERS[activeCardIndex].id
                          ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                          : deactivated.includes(CARD_TIERS[activeCardIndex].id)
                          ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed opacity-50'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 cursor-pointer'
                      }`}
                    >
                      {progress.profile?.defaultCardId === CARD_TIERS[activeCardIndex].id ? 'Default Card' : 'Set as Default'}
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 text-center font-mono leading-normal">
                    This premium card is currently locked. Keep trading to increase your portfolio equity and unlock it.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Balance & Milestone Progress Panel */}
            <div className="rounded-xl border border-white/[0.06] bg-surface-800/25 p-4 flex flex-col justify-between h-full space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Overall Portfolio Value</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-display font-semibold text-3xl text-white tracking-tight leading-none">
                    {formatCurrency(liveTotalValue)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-medium">USD</span>
                </div>
                
                {/* Visual portfolio status */}
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-mono">
                  <Unlock className="h-3.5 w-3.5" />
                  <span>
                    {activePeakVal >= 500000
                      ? 'APEX Tier Unlocked'
                      : activePeakVal >= 250000
                      ? 'ZENITH Tier Unlocked'
                      : 'GRID Tier Unlocked'}
                  </span>
                </div>

                {/* Card perks display */}
                <div className="mt-3 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3 text-xs space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Card Benefits</p>
                  <ul className="space-y-1 text-slate-300 font-mono text-[10px]">
                    {isApexActive ? (
                      <>
                        <li className="flex items-center gap-1.5 text-amber-400">
                          <span className="h-1 w-1 rounded-full bg-amber-400" />
                          APEX Tier: 3.3x Leverage (70% Cap)
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          3.0% Monthly Cash Yield (Paid Daily)
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          1.5x XP Quiz & Sprint Boost active
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          Free Trades: $0.00 Commission
                        </li>
                      </>
                    ) : isZenithActive ? (
                      <>
                        <li className="flex items-center gap-1.5 text-slate-300">
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          ZENITH Tier: 2.5x Leverage (60% Cap)
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          1.5% Monthly Cash Yield (Paid Daily)
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          1.25x XP Quiz & Sprint Boost active
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                          50% Lower Commission ($2.50 / trade)
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-1.5 text-red-400">
                          <span className="h-1 w-1 rounded-full bg-red-400" />
                          GRID Tier: 2.0x Leverage (50% Cap)
                        </li>
                        <li className="flex items-center gap-1.5 text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                          No cash yield (Unlock Zenith at $250k)
                        </li>
                        <li className="flex items-center gap-1.5 text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                          Standard XP progression
                        </li>
                        <li className="flex items-center gap-1.5 text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                          Standard commission: $5.00 / trade
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Milestone Progress Bar */}
              <div className="border-t border-white/[0.04] pt-4 mt-auto">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-medium">
                  <span>{milestoneInfo.label}</span>
                  <span className="font-mono text-slate-300">{milestoneInfo.nextThreshold}</span>
                </div>

                <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-950/70 ring-1 ring-white/5 p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-thriv-600 via-teal-500 to-indigo-500 transition-all duration-1000 ease-out"
                    style={{ width: `${milestoneInfo.progressPct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[9px] text-slate-500 mt-1.5 font-mono">
                  <span>{formatCurrency(liveTotalValue)}</span>
                  <span>{milestoneInfo.progressPct >= 100 ? 'Max Card Achieved' : `${milestoneInfo.progressPct.toFixed(1)}% Completed`}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Grid 2: Earning / Investment & Stocks Pie Chart Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
            
            {/* Earning and Investment Report Card */}
            <div className="rounded-xl border border-white/[0.06] bg-surface-800/25 p-4 space-y-4 h-full flex flex-col justify-between">
              
              {/* Chart Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-display font-semibold text-sm text-slate-200">Interactive Earnings & Investment Report</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Money Earned vs Invested vs Losses</p>
                </div>

                {/* Day / Week / Month Tab Toggles */}
                <div className="flex items-center gap-0.5 rounded-lg bg-surface-950 p-0.5 self-start">
                  {(['day', 'week', 'month'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setChartTab(tab)
                        setHoveredBarIndex(null)
                      }}
                      className={`rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        chartTab === tab
                          ? 'bg-thriv-700 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pure HTML/CSS Bar Chart Grid Area */}
              <div className="relative min-h-[220px] rounded-lg bg-surface-950/40 border border-white/[0.03] p-4 flex flex-col justify-end">
                
                {/* Horizontal Gridlines behind bars */}
                <div className="absolute inset-x-0 inset-y-4 flex flex-col justify-between pointer-events-none opacity-20 px-4">
                  {[0, 1, 2, 3, 4].map((gridline) => (
                    <div key={gridline} className="w-full border-t border-dashed border-slate-600" />
                  ))}
                </div>

                {/* Vertical Bars container */}
                <div key={chartTab} className="relative flex justify-around items-end h-[140px] select-none z-10">
                  {activeDataset.map((pt, i) => {
                    const investedAmount = liveTotalValue * (pt.investedPct / 100)
                    const earnedAmount = liveTotalValue * (pt.earnedPct / 100)
                    const lostAmount = liveTotalValue * (pt.lostPct / 100)
                    
                    // Height variables animation-controlled
                    const heightInvested = `${Math.max(8, pt.investedPct)}%`
                    const heightEarned = `${Math.max(8, pt.earnedPct * 5.0)}%`
                    const heightLost = `${Math.max(8, pt.lostPct * 5.0)}%`

                    const isHovered = hoveredBarIndex === i
                    const isDimmed = hoveredBarIndex !== null && !isHovered

                    return (
                      <div
                        key={pt.label}
                        className={`flex flex-col items-center justify-end h-full w-[36px] sm:w-[48px] group cursor-pointer relative transition-all duration-300 ${
                          isDimmed ? 'opacity-30 scale-95 blur-[0.3px]' : 'opacity-100 scale-100'
                        }`}
                        onMouseEnter={() => setHoveredBarIndex(i)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      >
                        {/* Active tooltip on hover */}
                        {isHovered && (
                          <div className="absolute bottom-[calc(100%+6px)] z-20 flex flex-col gap-1 w-[125px] rounded-lg border border-white/[0.08] bg-surface-900 p-2 text-[9px] font-mono leading-none shadow-xl text-left">
                            <p className="font-semibold text-slate-300 text-center border-b border-white/5 pb-1 mb-1">{pt.label}</p>
                            <p className="flex justify-between text-[#9db2c6] gap-2">
                              <span>Invested:</span>
                              <span>{formatCurrency(investedAmount)}</span>
                            </p>
                            <p className="flex justify-between text-[#8ebfa9] gap-2">
                              <span>Earned:</span>
                              <span>{formatCurrency(earnedAmount)}</span>
                            </p>
                            <p className="flex justify-between text-[#cc7a88] gap-2">
                              <span>Losses:</span>
                              <span>{formatCurrency(lostAmount)}</span>
                            </p>
                          </div>
                        )}

                        {/* Triple bars container */}
                        <div className="flex items-end justify-center gap-1 w-full h-[110px]">
                          {/* Slate Blue-Gray Invested Bar */}
                          <div
                            className="w-2 rounded-t-sm bg-[#5c738c] origin-bottom shadow-sm group-hover:brightness-110"
                            style={{
                              height: heightInvested,
                              animation: `growUp 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 40}ms both`,
                            }}
                          />
                          {/* Sage Mint Green Earned Bar */}
                          <div
                            className="w-2 rounded-t-sm bg-[#6b9e8a] origin-bottom shadow-sm group-hover:brightness-110"
                            style={{
                              height: heightEarned,
                              animation: `growUp 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 40 + 20}ms both`,
                            }}
                          />
                          {/* Muted Rose Losses Bar */}
                          <div
                            className="w-2 rounded-t-sm bg-[#cc7a88] origin-bottom shadow-sm group-hover:brightness-110"
                            style={{
                              height: heightLost,
                              animation: `growUp 500ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 40 + 40}ms both`,
                            }}
                          />
                        </div>
                        
                        {/* Axis Label */}
                        <span className="text-[9px] font-mono text-slate-500 mt-2 tracking-tight group-hover:text-slate-300">
                          {pt.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

              </div>

              {/* Legend row */}
              <div className="flex justify-center gap-4 text-[9px] font-mono text-slate-400 pt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#5c738c] border border-white/10" />
                  <span>Invested</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#6b9e8a] border border-white/10" />
                  <span>Earned</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#cc7a88] border border-white/10" />
                  <span>Losses</span>
                </div>
              </div>

            </div>

            {/* Stocks Holdings Pie Chart Card */}
            <div className="rounded-xl border border-white/[0.06] bg-surface-800/25 p-4 space-y-4 h-full flex flex-col justify-between min-h-[310px]">
              <div>
                <h4 className="font-display font-semibold text-sm text-slate-200">Asset Allocation Breakdown</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Held stocks by current market value & percentage</p>
              </div>

              {holdingsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center h-full w-full my-auto">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/40 text-slate-500 border border-white/5 mb-3">
                    <Coins className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">No stock assets held</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mt-1">
                    Buy stocks in the <span className="text-thriv-400 font-medium">Trade</span> tab to build your holdings portfolio.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
                  
                  {/* SVG Pie/Donut Chart Container */}
                  <div className="relative w-[150px] h-[150px] shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 select-none">
                      {/* Base background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="rgba(255, 255, 255, 0.03)"
                        strokeWidth="8"
                      />
                      {/* Render segments */}
                      {(() => {
                        let accumulatedOffset = 0
                        const C = 2 * Math.PI * 38 // 238.76

                        return holdingsData.map((h, idx) => {
                          const pct = (h.value / totalHoldingsValue) * 100
                          const strokeLength = (pct / 100) * C
                          const strokeOffset = -accumulatedOffset
                          accumulatedOffset += strokeLength

                          const isSelected = hoveredPieIndex === idx
                          const isDimmed = hoveredPieIndex !== null && !isSelected

                          // Add a tiny gap if there are multiple sectors
                          const gap = holdingsData.length > 1 ? 1.5 : 0
                          const finalStrokeLength = Math.max(0.5, strokeLength - gap)

                          return (
                            <circle
                              key={h.symbol}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="transparent"
                              stroke={PIE_COLORS[idx % PIE_COLORS.length]}
                              strokeWidth={isSelected ? 11 : 8}
                              strokeDasharray={`${finalStrokeLength} ${C}`}
                              strokeDashoffset={strokeOffset}
                              className="transition-all duration-300 cursor-pointer origin-center"
                              style={{
                                opacity: isDimmed ? 0.35 : 1,
                                transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                              }}
                              onMouseEnter={() => setHoveredPieIndex(idx)}
                              onMouseLeave={() => setHoveredPieIndex(null)}
                            />
                          )
                        })
                      })()}
                    </svg>

                    {/* Donut Center Overlay Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      {hoveredPieIndex === null ? (
                        <>
                          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-semibold leading-none">Stocks Held</span>
                          <span className="text-xs font-bold text-white font-mono mt-1 leading-none">{formatCurrency(totalHoldingsValue)}</span>
                          <span className="text-[7px] text-slate-400 font-mono mt-0.5 leading-none">{holdingsData.length} position(s)</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-bold text-white tracking-wide leading-none">{holdingsData[hoveredPieIndex].symbol}</span>
                          <span className="text-[10px] font-bold text-emerald-400 font-mono mt-1 leading-none">
                            {formatCurrency(holdingsData[hoveredPieIndex].value)}
                          </span>
                          <span className="text-[8px] text-slate-400 font-mono mt-0.5 leading-none">
                            {((holdingsData[hoveredPieIndex].value / totalHoldingsValue) * 100).toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legend side-list */}
                  <div className="flex-1 space-y-1.5 max-h-[160px] overflow-y-auto w-full pr-1 scrollbar-thin">
                    {holdingsData.map((h, idx) => {
                      const isSelected = hoveredPieIndex === idx
                      const isDimmed = hoveredPieIndex !== null && !isSelected
                      const pct = (h.value / totalHoldingsValue) * 100

                      return (
                        <div
                          key={h.symbol}
                          className={`flex items-center justify-between p-1 rounded-lg border border-transparent transition-all duration-300 cursor-pointer ${
                            isSelected ? 'bg-white/[0.04] border-white/[0.06]' : ''
                          } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                          onMouseEnter={() => setHoveredPieIndex(idx)}
                          onMouseLeave={() => setHoveredPieIndex(null)}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span 
                              className="h-1.5 w-1.5 rounded-full shrink-0" 
                              style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                            />
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-white leading-none">{h.symbol}</p>
                              <p className="text-[8px] text-slate-500 truncate mt-0.5 leading-none">{h.name}</p>
                            </div>
                          </div>
                          <div className="text-right font-mono text-[9px] shrink-0 pl-2">
                            <p className="font-semibold text-slate-200 leading-none">{formatCurrency(h.value)}</p>
                            <p className="text-[8px] text-slate-500 mt-0.5 leading-none">{pct.toFixed(1)}%</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* Recent Activity Ledger (Transaction Ledger) */}
          <div className="rounded-xl border border-white/[0.06] bg-surface-800/25 p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
              <h4 className="font-display font-semibold text-sm text-slate-200">Recent Activity Log</h4>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Transaction Ledger</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {ledgerItems.map((item) => {
                const isPositive = item.amount >= 0
                const isBuy = item.type === 'buy'
                const isDeposit = item.type === 'deposit'
                
                let iconColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20'
                let Icon = ArrowUpRight
                
                if (isBuy) {
                  iconColor = 'text-red-400 bg-red-950/20 border-red-500/20'
                  Icon = ArrowDownLeft
                } else if (isDeposit) {
                  iconColor = 'text-teal-400 bg-teal-950/20 border-teal-500/20'
                  Icon = Coins
                }

                return (
                  <div key={item.id} className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-center ${iconColor}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {item.amount !== 0 ? (
                        <p className={`text-xs font-semibold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}
                          {formatCurrency(item.amount)}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400 font-mono">—</p>
                      )}
                      <p className="text-[9px] font-mono text-slate-500 mt-0.5 leading-none">
                        {item.dateText}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

      </div>
    </div>
  )
}
