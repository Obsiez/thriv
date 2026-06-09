import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Search, Download } from 'lucide-react'
import { Header } from './components/Header'
import { TickerBar } from './components/TickerBar'
import { MarketIndices } from './components/MarketIndices'
import { MarketTable } from './components/MarketTable'
import { PriceChart } from './components/PriceChart'
import { TradePanel } from './components/TradePanel'
import { PortfolioView } from './components/PortfolioView'
import { OrdersView } from './components/OrdersView'
import { LearnView } from './components/LearnView'
import { NewsPanel } from './components/NewsPanel'
import { WatchlistTracker } from './components/WatchlistTracker'
import { StockDetail } from './components/StockDetail'
import { HomeDashboard } from './components/HomeDashboard'
import { QuestHub } from './components/QuestHub'
import { ActivitiesHub } from './components/ActivitiesHub'
import { MobileNav } from './components/MobileNav'
import { MoreMenu } from './components/MoreMenu'
import { FeedbackToast, type FeedbackMessage } from './components/FeedbackToast'
import { RetentionBriefing } from './components/RetentionBriefing'
import { DrawdownBanner } from './components/DrawdownBanner'
import { dailyBonusAvailable } from './lib/retention'
import { todayKey } from './lib/progression'
import { formatCurrency } from './lib/marketEngine'
import { haptic } from './lib/haptics'
import { Leaderboard } from './components/Leaderboard'
import { PriceAlerts } from './components/PriceAlerts'
import { SettingsPanel } from './components/SettingsPanel'
import { SidebarDesktop } from './components/SidebarDesktop'
import { LedgerView } from './components/ProfilePanel'
import { WelcomeModal } from './components/WelcomeModal'
import { GuestBanner } from './components/GuestBanner'
import { AppFooter } from './components/AppFooter'
import { LevelProgressionModal } from './components/LevelProgressionModal'
import { useMarket, type StockSplitEvent } from './hooks/useMarket'
import { usePortfolio } from './hooks/usePortfolio'
import { useProgress } from './hooks/useProgress'
import { useAuth } from './contexts/AuthContext'
import { STARTING_CASH } from './data/stocks'
import { countClaimableQuests } from './lib/questState'
import { loadLastSymbol, saveLastSymbol } from './lib/lastSymbol'
import { portfolioGainPctFromStart } from './lib/margin'
import { FlashNewsBanner } from './components/FlashNewsBanner'
import { EconomicCalendarBar } from './components/EconomicCalendar'
import type { Sector, TabId, PlayerProgress } from './types'

const SECTORS: (Sector | 'All')[] = [
  'All',
  'Technology',
  'Healthcare',
  'Finance',
  'Consumer',
  'Energy',
  'Industrial',
  'Communication',
]

interface ThrivAppProps {
  sessionKey: string
}

export default function ThrivApp({ sessionKey }: ThrivAppProps) {
  const {
    user,
    mode,
    initialPortfolio,
    initialProgress,
    queueCloudSave,
    markWelcomeSeen,
    welcomeSeen,
    logout,
  } = useAuth()

  const userId = user?.id ?? null
  const guest = mode === 'guest'
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)

  const {
    portfolio,
    setPortfolio,
    placeOrder,
    applyStockSplits,
    runLiquidation,
    toggleWatchlist,
    addAlert,
    removeAlert,
    checkAlerts,
    reset: resetPortfolio,
    portfolioValue,
  } = usePortfolio({
    userId,
    guest,
    initial: initialPortfolio,
  })

  const handleStockSplits = useCallback(
    (splits: StockSplitEvent[]) => {
      applyStockSplits(splits)
      if (splits.length > 0) {
        const summary = splits.map((s) => `${s.symbol} ${s.ratio}:1`).join(', ')
        haptic('alert')
        setFeedback({ tone: 'win', text: `Stock split — ${summary}` })
      }
    },
    [applyStockSplits, setFeedback]
  )

  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [macroCount, setMacroCount] = useState(0)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const setProgressRef = useRef<React.Dispatch<React.SetStateAction<PlayerProgress>> | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const isOnlineAndLoggedIn = !!user && isOnline

  const handleMacroTrigger = useCallback(() => {
    setMacroCount((prev) => prev + 1)
    if (setProgressRef.current) {
      setProgressRef.current((prev: PlayerProgress) => {
        const today = todayKey()
        const current = prev.macroTriggerDate === today ? (prev.macroTriggerCount ?? 0) : 0
        return {
          ...prev,
          macroTriggerDate: today,
          macroTriggerCount: current + 1,
        }
      })
    }
  }, [])

  const {
    stocks,
    news,
    flashBanner,
    marketOpen,
    setMarketOpen,
    lastTick,
    getStock,
    nextEvent,
    pulseActive,
    resetStocks,
  } = useMarket({
    onStockSplits: handleStockSplits,
    isOnlineAndLoggedIn,
    macroCount,
    onMacroTrigger: handleMacroTrigger,
    sessionKey,
    speedMultiplier,
  })

  const [tab, setTab] = useState<TabId>('home')
  const [selected, setSelected] = useState(() => loadLastSymbol('AAPL'))
  const mainRef = useRef<HTMLElement>(null)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState<Sector | 'All'>('All')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = useState(false)
  const [pwaPrompt, setPwaPrompt] = useState<any>(null)
  const [showPwaBanner, setShowPwaBanner] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setPwaPrompt(e)
      const dismissed = sessionStorage.getItem('thriv-pwa-dismissed')
      if (!dismissed) {
        setShowPwaBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallPwa = async () => {
    if (!pwaPrompt) return
    pwaPrompt.prompt()
    const { outcome } = await pwaPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)
    setPwaPrompt(null)
    setShowPwaBanner(false)
  }

  const handleDismissPwa = () => {
    sessionStorage.setItem('thriv-pwa-dismissed', 'true')
    setShowPwaBanner(false)
  }

  const [levelProgressionOpen, setLevelProgressionOpen] = useState(false)
  const [showBriefing, setShowBriefing] = useState(false)
  const hasSetBriefingRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)



  const totalValue = portfolioValue(stocks)
  const prevValueRef = useRef(totalValue)
  const valueInitRef = useRef(true)
  const lastLossToastAtRef = useRef(0)
  const LOSS_TOAST_COOLDOWN_MS = 120_000
  const selectedStock = getStock(selected)
  const holdingQty =
    portfolio.holdings.find((h) => h.symbol === selected)?.quantity ?? 0

  const {
    progress,
    celebration,
    visitTab,
    claimQuest,
    claimAllQuests,
    syncQuests,
    setDisplayCredential,
    onTrade,
    onWatchlistAdd,
    onQuizPass,
    onQuizCorrectAnswer,
    onActivityAnswer,
    onScenarioComplete,
    onPrediction,
    onSectorSprintComplete,
    onCompareUsed,
    onPositionSizerUsed,
    onChartRangeView,
    onFlashQuotesComplete,
    claimDailyBonus,
    claimWeeklyReward,
    onRealizedLoss,
    onRealizedGain,
    onMarginBorrow,
    onLiquidation,
    reset: resetProg,
    setProgress,
  } = useProgress({
    portfolio,
    stocks,
    portfolioValue: totalValue,
    selectedSymbol: selected,
    userId,
    guest,
    initial: initialProgress,
  })

  setProgressRef.current = setProgress

  const questBadge = useMemo(
    () =>
      countClaimableQuests({
        portfolio,
        stocks,
        progress,
        selectedSymbol: selected,
        portfolioValue: totalValue,
      }),
    [portfolio, stocks, progress, selected, totalValue]
  )

  useEffect(() => {
    const today = todayKey()
    const count = progress && progress.macroTriggerDate === today ? (progress.macroTriggerCount ?? 0) : 0
    setMacroCount(count)
  }, [progress])

  useEffect(() => {
    if (progress?.profile?.simulationSpeedMultiplier != null) {
      setSpeedMultiplier(progress.profile.simulationSpeedMultiplier)
    }
  }, [progress?.profile?.simulationSpeedMultiplier])

  useEffect(() => {
    if (userId !== lastUserIdRef.current) {
      lastUserIdRef.current = userId
      hasSetBriefingRef.current = false
    }
  }, [userId])

  useEffect(() => {
    if (progress && !hasSetBriefingRef.current) {
      const today = todayKey()
      const seen = progress.lastBriefingDate === today || localStorage.getItem('thriv-briefing-date') === today
      setShowBriefing(!seen)
      if (seen) {
        hasSetBriefingRef.current = true
      }
    }
  }, [progress])

  useEffect(() => {
    visitTab(tab)
  }, [tab, visitTab])

  // Mobile sidebar gesture disabled as mobile sidebar has been removed

  useEffect(() => {
    checkAlerts(stocks)
  }, [stocks, checkAlerts])

  // Watch for triggered price alerts to dispatch browser notifications
  const prevAlertsRef = useRef(portfolio.alerts)
  useEffect(() => {
    const prev = prevAlertsRef.current
    const current = portfolio.alerts
    current.forEach((a) => {
      const wasTriggered = prev.some((x) => x.id === a.id && x.triggered)
      if (a.triggered && !wasTriggered) {
        setFeedback({
          tone: 'win',
          text: `🔔 Alert: ${a.symbol} crossed ${a.direction} ${formatCurrency(a.targetPrice)}!`,
        })
        haptic('alert')
        if (progress.profile?.pushNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Thriv Price Alert', {
              body: `${a.symbol} crossed ${a.direction} ${formatCurrency(a.targetPrice)}!`,
              icon: '/favicon.svg',
            })
          } catch (e) {
            console.warn('Native notification failed:', e)
          }
        }
      }
    })
    prevAlertsRef.current = current
  }, [portfolio.alerts, progress.profile?.pushNotificationsEnabled, setFeedback])

  // Schedule 2x daily engagement notifications (12-hour intervals) when app is backgrounded
  useEffect(() => {
    if (!progress.profile?.pushNotificationsEnabled) return

    let reminderTimeoutId: any = null

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const twelveHoursMs = 12 * 60 * 60 * 1000
        reminderTimeoutId = setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Thriv - Market Update', {
                body: "Your simulated portfolio is active! Log in now to complete today's quests and check stock movements.",
                icon: '/favicon.svg',
              })
            } catch (e) {
              console.warn('Native notification failed:', e)
            }
          }
        }, twelveHoursMs)
      } else {
        if (reminderTimeoutId) {
          clearTimeout(reminderTimeoutId)
          reminderTimeoutId = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (reminderTimeoutId) clearTimeout(reminderTimeoutId)
    }
  }, [progress.profile?.pushNotificationsEnabled])

  useEffect(() => {
    const result = runLiquidation(stocks)
    if (result.liquidated) {
      onLiquidation()
      haptic('alert')
      setFeedback({ tone: 'loss', text: result.message ?? 'Margin liquidation executed.' })
    }
  }, [stocks, portfolio.marginLoan, portfolio.holdings, portfolio.cash, runLiquidation, onLiquidation])

  const prevProgressRef = useRef(progress)
  const prevPortfolioRef = useRef(portfolio)

  useEffect(() => {
    const dailyBonusClaimed = progress.dailyBonusDate !== prevProgressRef.current.dailyBonusDate
    
    // Calculate and award daily card yield on daily login bonus claim
    if (dailyBonusClaimed && prevProgressRef.current.dailyBonusDate && progress.dailyBonusDate) {
      let yieldPct = 0
      let tierName = ''
      const activeVal = Math.max(totalValue, progress.stats.portfolioPeak)
      const deactivated = progress.profile?.deactivatedCards ?? []
      if (activeVal >= 500000 && !deactivated.includes('apex')) {
        yieldPct = 0.0010 // APEX: 3% monthly yield / 30 = 0.1% daily
        tierName = 'APEX'
      } else if (activeVal >= 250000 && !deactivated.includes('zenith')) {
        yieldPct = 0.0005 // ZENITH: 1.5% monthly yield / 30 = 0.05% daily
        tierName = 'ZENITH'
      }

      if (yieldPct > 0) {
        const reward = Math.round(totalValue * yieldPct)
        if (reward > 0) {
          setPortfolio((prev) => ({
            ...prev,
            cash: prev.cash + reward,
          }))
          haptic('success')
          setFeedback({
            tone: 'win',
            text: `Card yield received: +${formatCurrency(reward)} (${tierName} Tier Daily Return)`,
          })
        }
      }
    }

    const questsChanged = progress.quests.some((q) => {
      const prevQ = prevProgressRef.current.quests?.find((x) => x.id === q.id)
      return q.claimed && !prevQ?.claimed
    })
    const weeklyRewardClaimed = progress.weeklyChallengeDone !== prevProgressRef.current.weeklyChallengeDone
    
    const statsChanged =
      progress.stats.activitiesPlayed !== prevProgressRef.current.stats.activitiesPlayed

    const holdingsChanged =
      portfolio.holdings.length !== prevPortfolioRef.current.holdings.length ||
      portfolio.holdings.some((h, i) => {
        const ph = prevPortfolioRef.current.holdings[i]
        return !ph || h.symbol !== ph.symbol || h.quantity !== ph.quantity || h.avgCost !== ph.avgCost
      })

    const ordersChanged =
      portfolio.orders.length !== prevPortfolioRef.current.orders.length ||
      portfolio.orders.some((o, i) => {
        const po = prevPortfolioRef.current.orders[i]
        return (
          !po ||
          o.id !== po.id ||
          o.symbol !== po.symbol ||
          o.side !== po.side ||
          o.type !== po.type ||
          o.quantity !== po.quantity ||
          o.limitPrice !== po.limitPrice ||
          o.fillPrice !== po.fillPrice ||
          o.status !== po.status ||
          o.createdAt !== po.createdAt
        )
      })

    const tradeOrLoanChanged =
      portfolio.cash !== prevPortfolioRef.current.cash ||
      holdingsChanged ||
      ordersChanged ||
      (portfolio.marginLoan ?? 0) !== (prevPortfolioRef.current.marginLoan ?? 0)

    const profileChanged =
      JSON.stringify(progress.profile ?? {}) !== JSON.stringify(prevProgressRef.current.profile ?? {})

    const immediate =
      dailyBonusClaimed ||
      questsChanged ||
      weeklyRewardClaimed ||
      statsChanged ||
      tradeOrLoanChanged ||
      profileChanged

    queueCloudSave(portfolio, progress, immediate)
    
    prevProgressRef.current = progress
    prevPortfolioRef.current = portfolio
  }, [portfolio, progress, queueCloudSave])

  useEffect(() => {
    if (valueInitRef.current) {
      valueInitRef.current = false
      prevValueRef.current = totalValue
      return
    }
    const prev = prevValueRef.current
    const drop = prev - totalValue
    const dropPct = prev > 0 ? (drop / prev) * 100 : 0
    const now = Date.now()
    const cooledDown = now - lastLossToastAtRef.current >= LOSS_TOAST_COOLDOWN_MS
    if (cooledDown && (drop > 2_000 || dropPct >= 2.5)) {
      lastLossToastAtRef.current = now
      setFeedback({
        tone: 'loss',
        text: `Portfolio −${formatCurrency(drop)} (${dropPct.toFixed(1)}%) — reassess before next trade.`,
      })
    }
    prevValueRef.current = totalValue
  }, [totalValue])

  useEffect(() => {
    if (!celebration) return
    const tone = celebration.toLowerCase().includes('loss')
      ? 'loss'
      : celebration.toLowerCase().includes('achievement')
        ? 'achievement'
        : 'win'
    setFeedback({ text: celebration, tone })
  }, [celebration])

  const portfolioUnderWater = totalValue < progress.stats.dayStartValue
  const playerGainPct = portfolioGainPctFromStart(totalValue)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && tab === 'market' && !e.ctrlKey && !e.metaKey) {
        const t = e.target as HTMLElement
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab])

  const filteredStocks = useMemo(() => {
    if (sector === 'All') return stocks
    return stocks.filter((s) => s.sector === sector)
  }, [stocks, sector])

  const watchlistStocks = useMemo(
    () =>
      portfolio.watchlist
        .map((sym) => stocks.find((s) => s.symbol === sym))
        .filter(Boolean),
    [portfolio.watchlist, stocks]
  )

  const triggeredAlerts = portfolio.alerts.filter((a) => a.triggered)
  const prevAlertCountRef = useRef(0)

  useEffect(() => {
    const n = triggeredAlerts.length
    if (n > prevAlertCountRef.current) haptic('alert')
    prevAlertCountRef.current = n
  }, [triggeredAlerts.length])
  const showWelcome = mode === 'authenticated' && !welcomeSeen && !!user

  function selectSymbol(symbol: string) {
    setSelected(symbol)
    saveLastSymbol(symbol)
  }

  function navigate(t: TabId) {
    setTab(t)
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    if (t === 'quests') syncQuests()
  }

  useEffect(() => {
    if (tab === 'quests') syncQuests()
  }, [tab, syncQuests])

  function handleBalanceReset() {
    resetPortfolio()
  }

  function handleFullReset() {
    resetPortfolio()
    resetProg()
    resetStocks()
    setTab('home')
  }

  function handleWatch(symbol: string) {
    const had = portfolio.watchlist.includes(symbol)
    toggleWatchlist(symbol, () => {
      if (!had) onWatchlistAdd()
    })
  }

  function handleTrade(
    side: 'buy' | 'sell',
    type: 'market' | 'limit',
    qty: number,
    limit?: number,
    useMargin = false
  ) {
    if (!selectedStock) return { ok: false, message: 'No stock selected.' }

    // Enforce Daily Maximum Loss Threshold Risk Control
    const maxLoss = progress.profile?.maxLossThreshold ?? 0
    if (maxLoss > 0) {
      const dayStart = progress.stats.dayStartValue
      const dropPct = dayStart > 0 ? ((dayStart - totalValue) / dayStart) * 100 : 0
      if (dropPct >= maxLoss) {
        haptic('alert')
        return {
          ok: false,
          message: `Trading locked! Daily loss threshold of ${maxLoss}% reached. Drawdown: ${dropPct.toFixed(1)}%.`
        }
      }
    }

    const result = placeOrder(
      selectedStock,
      side,
      type,
      qty,
      limit,
      stocks,
      useMargin,
      progress.stats.portfolioPeak,
      progress.profile?.deactivatedCards
    )
    if (result.ok) {
      haptic('success')
      onTrade(side, type)
      if (result.borrowed) onMarginBorrow()
      if (result.realizedPnl != null && result.realizedPnl < 0) {
        const loss = Math.abs(result.realizedPnl)
        onRealizedLoss(loss)
        setFeedback({
          tone: 'loss',
          text: `Realized loss on ${selectedStock.symbol}: −${formatCurrency(loss)}`,
        })
      } else if (result.realizedPnl != null && result.realizedPnl > 0) {
        onRealizedGain(result.realizedPnl)
        setFeedback({
          tone: 'win',
          text: `Realized gain on ${selectedStock.symbol}: +${formatCurrency(result.realizedPnl)}`,
        })
      } else {
        setFeedback({ tone: 'win', text: result.message })
      }
    }
    return result
  }

  function dismissBriefing() {
    const today = todayKey()
    localStorage.setItem('thriv-briefing-date', today)
    setShowBriefing(false)
    hasSetBriefingRef.current = true
    setProgress((prev) => ({
      ...prev,
      lastBriefingDate: today,
    }))
  }

  return (
    <div key={sessionKey} className="flex min-h-[100dvh] flex-col">
      <FeedbackToast message={feedback} />
      <WelcomeModal
        open={showWelcome}
        displayName={user?.displayName ?? ''}
        onClose={markWelcomeSeen}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        portfolio={portfolio}
        progress={progress}
        onFullReset={handleFullReset}
        onBalanceReset={handleBalanceReset}
        onProfileChange={(profile) => setProgress((p) => ({ ...p, profile }))}
      />
      <LevelProgressionModal
        open={levelProgressionOpen}
        onClose={() => setLevelProgressionOpen(false)}
        progress={progress}
      />

      {showPwaBanner && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-[100] rounded-2xl border border-white/[0.08] bg-surface-900 p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-thriv-500/10 border border-thriv-500/20 text-thriv-400 shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Install Thriv App</p>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Add to home screen for native fullscreen experience.</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDismissPwa}
              className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Later
            </button>
            <button
              type="button"
              onClick={handleInstallPwa}
              className="px-3 py-1.5 text-[10px] font-semibold bg-thriv-600 hover:bg-thriv-500 text-white rounded-lg transition-colors shadow-lg shadow-thriv-600/15"
            >
              Install
            </button>
          </div>
        </div>
      )}


      <div className="flex flex-1 min-h-0 relative">
        <SidebarDesktop
          activeTab={tab}
          onTab={navigate}
          progress={progress}
          questBadge={questBadge}
          expanded={desktopSidebarExpanded}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenProgression={() => setLevelProgressionOpen(true)}
          onToggleDesktopSidebar={() => setDesktopSidebarExpanded(!desktopSidebarExpanded)}
        />
        
        <div className={`flex-1 min-w-0 flex flex-col ${desktopSidebarExpanded ? 'md:pl-[240px]' : 'md:pl-[68px]'}`}>
          {guest && <GuestBanner onSignUp={() => logout()} />}
          <Header
            onTab={navigate}
            totalValue={totalValue}
            marketOpen={marketOpen}
            onToggleMarket={() => setMarketOpen((o) => !o)}
            lastTick={lastTick}
            progress={progress}
            portfolioValue={totalValue}
            portfolioUnderWater={portfolioUnderWater}
            onOpenProgression={() => setLevelProgressionOpen(true)}
            onOpenSidebar={() => {}}
            onOpenSettings={() => setSettingsOpen(true)}
            displayName={user?.displayName ?? ''}
            guest={guest}
          />
          <TickerBar stocks={stocks} />
          {nextEvent.macroState !== 'dormant' && (
            <EconomicCalendarBar event={nextEvent} pulseActive={pulseActive} />
          )}
          <FlashNewsBanner news={flashBanner} />

          {triggeredAlerts.length > 0 && tab === 'market' && (
        <div className="mx-auto w-full max-w-[1600px] px-3 pt-2 lg:px-6">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
            <Bell className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            <span>
              Alert triggered:{' '}
              {triggeredAlerts.map((a) => `${a.symbol} ${a.direction} $${a.targetPrice}`).join(' · ')}
            </span>
          </div>
        </div>
      )}

      <main
        ref={mainRef}
        className="main-pad-mobile mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 scroll-smooth"
      >
        {tab === 'home' && (
          <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
            <div className="lg:col-span-2 space-y-4">
              {(showBriefing || dailyBonusAvailable(progress)) && (
                <RetentionBriefing
                  progress={progress}
                  portfolio={portfolio}
                  stocks={stocks}
                  portfolioValue={totalValue}
                  onClaimDaily={() => {
                    claimDailyBonus()
                    dismissBriefing()
                  }}
                  onClaimWeekly={claimWeeklyReward}
                  onDismiss={dismissBriefing}
                />
              )}
              <DrawdownBanner
                portfolioValue={totalValue}
                peakValue={progress.stats.portfolioPeak}
                dayStartValue={progress.stats.dayStartValue}
              />
              <HomeDashboard
                progress={progress}
                totalValue={totalValue}
                stocks={stocks}
                portfolio={portfolio}
                selectedSymbol={selected}
                onTab={navigate}
                onClaimQuest={claimQuest}
                onClaimAll={claimAllQuests}
                marketOpen={marketOpen}
                onOpenProgression={() => setLevelProgressionOpen(true)}
              />
            </div>
            <div className="space-y-4">
              <Leaderboard
                playerName={user?.displayName ?? 'You'}
                playerGainPct={playerGainPct}
                marketTick={lastTick}
                playerAchievements={progress.achievements}
                displayCredentialId={progress.displayCredentialId}
              />
            </div>
          </div>
        )}

        {tab === 'market' && (
          <div className="space-y-4 sm:space-y-6">
            <MarketIndices stocks={stocks} />
            <div>
              <h1 className="font-display text-lg sm:text-2xl font-semibold tracking-tight">
                Live market
              </h1>
              <p className="text-[10px] text-slate-600 mt-1 hidden sm:block">
                Press <kbd className="rounded border border-white/10 px-1 font-mono">/</kbd> to
                search
              </p>
              <div className="scroll-chips mt-3">
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSector(s)}
                    className={`rounded-full px-3 py-2 text-xs font-medium touch-manipulation min-h-[36px] ${
                      sector === s
                        ? 'bg-thriv-700 text-white'
                        : 'bg-surface-800 text-slate-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search stocks… (press /)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-surface-800 py-2.5 pl-10 pr-4 text-sm min-h-[44px] focus:border-thriv-600/50 focus:outline-none focus:ring-1 focus:ring-thriv-600/30"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
              <div className="lg:col-span-2 space-y-4">
                {selectedStock && (
                  <PriceChart stock={selectedStock} onRangeView={onChartRangeView} orders={portfolio.orders} showVolume={progress.profile?.showVolume ?? true} />
                )}
                <MarketTable
                  stocks={filteredStocks}
                  watchlist={portfolio.watchlist}
                  selected={selected}
                  onSelect={selectSymbol}
                  onToggleWatch={handleWatch}
                  filter={search}
                />
              </div>
              <div className="space-y-4">
                {selectedStock && <StockDetail stock={selectedStock} />}
                <PriceAlerts
                  stock={selectedStock}
                  alerts={portfolio.alerts}
                  onAdd={addAlert}
                  onRemove={removeAlert}
                />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-400">Watchlist</h3>
                    <button
                      type="button"
                      onClick={() => navigate('watchlist-tracker')}
                      className="text-[11px] font-semibold text-thriv-400 hover:text-thriv-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Bell className="h-3 w-3" />
                      Manage Alerts & Tracker
                    </button>
                  </div>
                  <div className="glass rounded-xl divide-y divide-white/[0.06]">
                    {watchlistStocks.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">Star stocks to watch.</p>
                    ) : (
                      watchlistStocks.map(
                        (s) =>
                          s && (
                            <button
                              key={s.symbol}
                              type="button"
                              onClick={() => selectSymbol(s.symbol)}
                              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 touch-manipulation min-h-[48px]"
                            >
                              <span className="font-mono text-thriv-300">{s.symbol}</span>
                              <span className="font-mono text-sm">${s.price.toFixed(2)}</span>
                            </button>
                          )
                      )
                    )}
                  </div>
                </div>
                <NewsPanel news={news} compact />
              </div>
            </div>
          </div>
        )}

        {tab === 'trade' && (
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-4 order-2 lg:order-1">
              {selectedStock ? (
                <PriceChart stock={selectedStock} onRangeView={onChartRangeView} orders={portfolio.orders} showVolume={progress.profile?.showVolume ?? true} />
              ) : (
                <p className="text-slate-500 text-sm">Select a symbol below.</p>
              )}
              <MarketTable
                stocks={stocks}
                watchlist={portfolio.watchlist}
                selected={selected}
                onSelect={selectSymbol}
                onToggleWatch={handleWatch}
              />
            </div>
            <div className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
              <TradePanel
                stock={selectedStock}
                cash={portfolio.cash}
                marginLoan={portfolio.marginLoan ?? 0}
                holdings={portfolio.holdings}
                stocks={stocks}
                holdingQty={holdingQty}
                onTrade={handleTrade}
                portfolioPeak={progress.stats.portfolioPeak}
                profile={progress.profile}
              />
            </div>
          </div>
        )}

        {tab === 'portfolio' && (
          <PortfolioView
            cash={portfolio.cash}
            marginLoan={portfolio.marginLoan}
            holdings={portfolio.holdings}
            stocks={stocks}
            totalValue={totalValue}
            startingCash={STARTING_CASH}
            orders={portfolio.orders}
            portfolioPeak={progress.stats.portfolioPeak}
          />
        )}

        {tab === 'quests' && (
          <QuestHub
            progress={progress}
            portfolio={portfolio}
            stocks={stocks}
            portfolioValue={totalValue}
            selectedSymbol={selected}
            onClaim={claimQuest}
            onClaimAll={claimAllQuests}
            onSyncQuests={syncQuests}
            onSelectCredential={setDisplayCredential}
          />
        )}

        {tab === 'activities' && (
          <ActivitiesHub
            stocks={stocks}
            selectedSymbol={selected}
            portfolioCash={portfolio.cash}
            onQuizPass={onQuizPass}
            onQuizCorrectAnswer={onQuizCorrectAnswer}
            onScenarioComplete={onScenarioComplete}
            onPrediction={onPrediction}
            onSectorSprintComplete={onSectorSprintComplete}
            onCompareUsed={onCompareUsed}
            onPositionSizerUsed={onPositionSizerUsed}
            onFlashQuotesComplete={onFlashQuotesComplete}
            onActivityAnswer={onActivityAnswer}
          />
        )}

        {tab === 'orders' && <OrdersView orders={portfolio.orders} />}

        {tab === 'news' && <NewsPanel news={news} />}

        {tab === 'learn' && <LearnView onStartQuest={() => navigate('quests')} />}

        {tab === 'ledger' && (
          <LedgerView
            portfolio={portfolio}
            progress={progress}
            totalValue={totalValue}
            stocks={stocks}
            onProfileChange={(profile) => setProgress((p) => ({ ...p, profile }))}
          />
        )}

        {tab === 'watchlist-tracker' && (
          <WatchlistTracker
            stocks={stocks}
            watchlist={portfolio.watchlist}
            alerts={portfolio.alerts}
            onToggleWatch={handleWatch}
            onAddAlert={addAlert}
            onRemoveAlert={removeAlert}
            onSelectStock={(symbol) => {
              selectSymbol(symbol)
              navigate('market')
            }}
            onNavigate={navigate}
            pushNotificationsEnabled={progress.profile?.pushNotificationsEnabled ?? false}
            onToggleNotifications={(enabled) => {
              setProgress((prev) => ({
                ...prev,
                profile: {
                  ...prev.profile,
                  pushNotificationsEnabled: enabled,
                },
              }))
            }}
          />
        )}
      </main>

          <AppFooter />
        </div>
      </div>

      <div className="progressive-blur-container md:hidden" aria-hidden />
      <MobileNav
        activeTab={tab}
        onTab={navigate}
        onMoreClick={() => setMoreMenuOpen(true)}
        questBadge={questBadge}
      />
      <MoreMenu
        open={moreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
        onTab={navigate}
        questBadge={questBadge}
      />
    </div>
  )
}
