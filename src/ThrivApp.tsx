import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Search } from 'lucide-react'
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
import { WelcomeModal } from './components/WelcomeModal'
import { GuestBanner } from './components/GuestBanner'
import { AppFooter } from './components/AppFooter'
import { useMarket, type StockSplitEvent } from './hooks/useMarket'
import { usePortfolio } from './hooks/usePortfolio'
import { useProgress } from './hooks/useProgress'
import { useAuth } from './contexts/AuthContext'
import { STARTING_CASH } from './data/stocks'
import { countClaimableQuests } from './lib/questState'
import { loadLastSymbol, saveLastSymbol } from './lib/lastSymbol'
import { portfolioGainPctFromStart } from './lib/margin'
import { FlashNewsBanner } from './components/FlashNewsBanner'
import type { Sector, TabId } from './types'

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

  const { stocks, news, flashBanner, marketOpen, setMarketOpen, lastTick, getStock } =
    useMarket({ onStockSplits: handleStockSplits })

  const [tab, setTab] = useState<TabId>('home')
  const [selected, setSelected] = useState(() => loadLastSymbol('AAPL'))
  const mainRef = useRef<HTMLElement>(null)
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState<Sector | 'All'>('All')
  const [moreOpen, setMoreOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showBriefing, setShowBriefing] = useState(
    () => localStorage.getItem('thriv-briefing-date') !== todayKey()
  )
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
    visitTab(tab)
  }, [tab, visitTab])

  useEffect(() => {
    checkAlerts(stocks)
  }, [stocks, checkAlerts])

  useEffect(() => {
    const result = runLiquidation(stocks)
    if (result.liquidated) {
      onLiquidation()
      haptic('alert')
      setFeedback({ tone: 'loss', text: result.message ?? 'Margin liquidation executed.' })
    }
  }, [stocks, portfolio.marginLoan, portfolio.holdings, portfolio.cash, runLiquidation, onLiquidation])

  useEffect(() => {
    queueCloudSave(portfolio, progress)
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
    setMoreOpen(false)
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    if (t === 'quests') syncQuests()
  }

  useEffect(() => {
    if (tab === 'quests') syncQuests()
  }, [tab, syncQuests])

  function handleReset() {
    if (confirm('Reset portfolio to $100,000 cash? Mission progress is kept.')) {
      resetPortfolio()
    }
  }

  function handleFullReset() {
    if (confirm('Reset all simulation data and mission progress?')) {
      resetPortfolio()
      resetProg()
      setTab('home')
    }
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
    const result = placeOrder(selectedStock, side, type, qty, limit, stocks, useMargin)
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
    localStorage.setItem('thriv-briefing-date', todayKey())
    setShowBriefing(false)
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
        onProfileChange={(profile) => setProgress((p) => ({ ...p, profile }))}
      />

      {guest && <GuestBanner onSignUp={() => logout()} />}

      <Header
        activeTab={tab}
        onTab={navigate}
        totalValue={totalValue}
        marketOpen={marketOpen}
        onToggleMarket={() => setMarketOpen((o) => !o)}
        onReset={handleReset}
        lastTick={lastTick}
        progress={progress}
        questBadge={questBadge}
        portfolioValue={totalValue}
        portfolioUnderWater={portfolioUnderWater}
        displayName={user?.displayName}
        accentId={progress.profile?.accentId ?? 'teal'}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <TickerBar stocks={stocks} />
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
                  <PriceChart stock={selectedStock} onRangeView={onChartRangeView} />
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
                  <h3 className="mb-2 text-sm font-semibold text-slate-400">Watchlist</h3>
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
                <PriceChart stock={selectedStock} onRangeView={onChartRangeView} />
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
            onScenarioComplete={onScenarioComplete}
            onPrediction={onPrediction}
            onSectorSprintComplete={onSectorSprintComplete}
            onCompareUsed={onCompareUsed}
            onPositionSizerUsed={onPositionSizerUsed}
            onFlashQuotesComplete={onFlashQuotesComplete}
          />
        )}

        {tab === 'orders' && <OrdersView orders={portfolio.orders} />}

        {tab === 'news' && <NewsPanel news={news} />}

        {tab === 'learn' && <LearnView onStartQuest={() => navigate('quests')} />}
      </main>

      <AppFooter />

      <MobileNav
        activeTab={tab}
        onTab={navigate}
        onMore={() => setMoreOpen(true)}
        questBadge={questBadge}
      />
      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} onTab={navigate} />
    </div>
  )
}
