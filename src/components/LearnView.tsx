import { useState, useEffect } from 'react'
import {
  BookOpen,
  GraduationCap,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Search,
  TrendingUp,
  ShieldAlert,
  Play,
  Sparkles,
  CheckCircle,
  HelpCircle,
  BarChart2,
  Zap
} from 'lucide-react'
import { GLOSSARY } from '../data/glossary'

interface LearnViewProps {
  onStartQuest?: () => void
}

type TabType = 'lessons' | 'flashcards' | 'glossary'

const ACADEMY_LESSONS = [
  {
    title: 'Start with a Plan (Paper Trading)',
    concept: 'Paper trading uses virtual money to simulate real market conditions without financial risk. Thriv gives you $100,000 cash to start your portfolio.',
    takeaway: 'Practice placing orders, reading charts, and monitoring price movements before using actual money in real markets.',
    icon: <Sparkles className="h-5 w-5 text-emerald-400" />
  },
  {
    title: 'Market Orders vs. Limit Orders',
    concept: 'A Market Order fills instantly at the current best price. A Limit Order sets a specific target price and only executes if the stock price reaches that target.',
    takeaway: 'Use Market orders for speed. Use Limit orders for price precision and control.',
    icon: <Play className="h-5 w-5 text-blue-400" />
  },
  {
    title: 'Diversification & Sector Weights',
    concept: 'Diversification means spreading your capital across different companies and sectors (Technology, Finance, Energy, Consumer) to lower overall portfolio volatility.',
    takeaway: 'If one sector suffers a crash, other sectors can hedge your portfolio to limit total losses.',
    icon: <TrendingUp className="h-5 w-5 text-indigo-400" />
  },
  {
    title: 'Leverage and Margin Risks',
    concept: 'Leverage allows you to borrow capital using a Margin Loan. This boosts your buying power but multiplies both gains and losses.',
    takeaway: 'If your equity falls below requirements, you will experience a Margin Call and auto-liquidation of your holdings.',
    icon: <ShieldAlert className="h-5 w-5 text-amber-400" />
  },
  {
    title: 'Fundamental Analysis (P/E & Market Cap)',
    concept: 'Fundamental analysis evaluates a company\'s underlying business health. The P/E (Price-to-Earnings) Ratio shows how much investors pay for each dollar of profit, while Market Cap is the total value of all shares.',
    takeaway: 'Lower P/E ratios might suggest value or stress, while higher P/E ratios reflect high growth expectations or overvaluation.',
    icon: <BarChart2 className="h-5 w-5 text-purple-400" />
  },
  {
    title: 'Reading the Tape (Volume & Spreads)',
    concept: 'Volume represents trading activity. The Bid/Ask Spread is the difference between the highest buyer offer (Bid) and lowest seller ask (Ask). liquid stocks have tight spreads; thin stocks have wide spreads.',
    takeaway: 'High volume validates price movements. Wide spreads in low volume increase execution costs (slippage).',
    icon: <Zap className="h-5 w-5 text-cyan-400" />
  }
]

export function LearnView({ onStartQuest }: LearnViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('lessons')

  // Lessons state
  const [activeLessonIdx, setActiveLessonIdx] = useState(0)

  // Simulator 1 State (Paper Trading Basics)
  const [sim1Cash, setSim1Cash] = useState(100000)
  const [sim1Holdings, setSim1Holdings] = useState(0)
  const [sim1Price] = useState(150.00)

  // Simulator 2 State (Market vs Limit Orders)
  const [sim2Price, setSim2Price] = useState(200.00)
  const [sim2LimitPrice, setSim2LimitPrice] = useState('198.50')
  const [sim2Holdings, setSim2Holdings] = useState(0)
  const [sim2Cash, setSim2Cash] = useState(1000)
  const [sim2LimitOrder, setSim2LimitOrder] = useState<number | null>(null)
  const [sim2Logs, setSim2Logs] = useState<string[]>(['Academy ticker started.'])

  // Simulator 3 State (Diversification)
  const [sim3TechCrash, setSim3TechCrash] = useState(false)

  // Simulator 4 State (Margin Risk)
  const [sim4Leverage, setSim4Leverage] = useState(2) // 1x, 2x, 3x, 4x
  const [sim4Shocked, setSim4Shocked] = useState(false)

  // Simulator 5 State (Fundamental Analysis)
  const [sim5Price, setSim5Price] = useState(120.00)
  const [sim5Earnings, setSim5Earnings] = useState(4.00) // EPS
  const [sim5Shares] = useState(100_000_000) // 100M shares outstanding

  // Simulator 6 State (Volume & Spreads)
  const [sim6Liquidity, setSim6Liquidity] = useState<'high' | 'low'>('high')
  const [sim6Bids, setSim6Bids] = useState<{ price: number; qty: number }[]>([])
  const [sim6Asks, setSim6Asks] = useState<{ price: number; qty: number }[]>([])
  const [sim6SlippageLog, setSim6SlippageLog] = useState<string[]>([])

  // Flashcards state
  const [currentCardIdx, setCurrentCardIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [learnedCards, setLearnedCards] = useState<string[]>([])

  // Glossary state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Categories list derived from GLOSSARY
  const categories = ['All', 'Basics', 'Trading', 'Analysis', 'Trends', 'Risk Management']

  // Sim 2 Ticker Effect
  useEffect(() => {
    if (activeTab !== 'lessons' || activeLessonIdx !== 1) return
    const interval = setInterval(() => {
      setSim2Price((prev) => {
        const delta = (Math.random() - 0.5) * 1.5
        const next = Math.max(195.00, Math.min(205.00, Number((prev + delta).toFixed(2))))

        // Check if limit price is hit
        if (sim2LimitOrder !== null && next <= sim2LimitOrder) {
          const cost = Number((sim2LimitOrder * 1).toFixed(2))
          if (sim2Cash >= cost) {
            setSim2Cash((c) => Number((c - cost).toFixed(2)))
            setSim2Holdings((h) => h + 1)
            setSim2Logs((l) => [`[FILL] Limit Order filled: 1 Share bought at $${sim2LimitOrder.toFixed(2)}`, ...l])
            setSim2LimitOrder(null)
          } else {
            setSim2Logs((l) => [`[ERROR] Insufficient cash to fill limit order at $${sim2LimitOrder.toFixed(2)}`, ...l])
            setSim2LimitOrder(null)
          }
        }
        return next
      })
    }, 900)
    return () => clearInterval(interval)
  }, [activeTab, activeLessonIdx, sim2LimitOrder, sim2Cash])

  // Sim 6 Order Book populating based on Liquidity selection
  useEffect(() => {
    if (sim6Liquidity === 'high') {
      setSim6Bids([
        { price: 150.00, qty: 1500 },
        { price: 149.95, qty: 2200 },
        { price: 149.90, qty: 3500 },
      ])
      setSim6Asks([
        { price: 150.05, qty: 1200 },
        { price: 150.10, qty: 1900 },
        { price: 150.15, qty: 3100 },
      ])
    } else {
      setSim6Bids([
        { price: 148.50, qty: 100 },
        { price: 147.20, qty: 150 },
        { price: 146.00, qty: 200 },
      ])
      setSim6Asks([
        { price: 151.50, qty: 80 },
        { price: 152.80, qty: 120 },
        { price: 154.00, qty: 185 },
      ])
    }
  }, [sim6Liquidity])

  // Reset helper for Simulator 1
  const handleResetSim1 = () => {
    setSim1Cash(100000)
    setSim1Holdings(0)
  }

  // Handle Sim 2 Buy Order
  const handleSim2MarketBuy = () => {
    if (sim2Cash < sim2Price) {
      setSim2Logs((l) => [`[ERROR] Not enough cash ($${sim2Cash}) to buy at $${sim2Price.toFixed(2)}`, ...l])
      return
    }
    setSim2Cash((c) => Number((c - sim2Price).toFixed(2)))
    setSim2Holdings((h) => h + 1)
    setSim2Logs((l) => [`[FILL] Market Buy Filled: 1 Share bought at $${sim2Price.toFixed(2)}`, ...l])
  }

  const handleSim2LimitBuy = () => {
    const limit = parseFloat(sim2LimitPrice)
    if (isNaN(limit) || limit <= 0) {
      setSim2Logs((l) => [`[ERROR] Invalid limit price.`, ...l])
      return
    }
    if (sim2Cash < limit) {
      setSim2Logs((l) => [`[ERROR] Limit price $${limit.toFixed(2)} exceeds your cash balance of $${sim2Cash}.`, ...l])
      return
    }
    setSim2LimitOrder(limit)
    setSim2Logs((l) => [`[ORDER] Buy Limit placed at $${limit.toFixed(2)}. Waiting for ticker...`, ...l])
  }

  // Reset helper for Sim 2
  const handleResetSim2 = () => {
    setSim2Cash(1000)
    setSim2Holdings(0)
    setSim2LimitOrder(null)
    setSim2Logs(['Simulator reset.'])
  }

  // Reset helper for Sim 4
  const handleResetSim4 = () => {
    setSim4Shocked(false)
  }

  // Simulator 6 Execution Action
  const handleSim6MarketBuy = () => {
    if (sim6Liquidity === 'high') {
      setSim6SlippageLog((prev) => [
        `[HIGH LIQUIDITY] Bought 100 shares at $150.05. Spread cost: $5.00. (Slippage: $0.00 — Fast, cheap fill!)`,
        ...prev
      ])
    } else {
      setSim6SlippageLog((prev) => [
        `[LOW LIQUIDITY] Bought 100 shares at $151.50. Spread cost: $150.00. (Slippage: +$1.45/share execution penalty!)`,
        ...prev
      ])
    }
  }

  // Flashcards helpers
  const handleCardNext = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev + 1) % GLOSSARY.length)
    }, 150)
  }

  const handleCardPrev = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentCardIdx((prev) => (prev - 1 + GLOSSARY.length) % GLOSSARY.length)
    }, 150)
  }

  const toggleCardLearned = (term: string) => {
    setLearnedCards((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term]
    )
  }

  // Filter glossary list
  const filteredGlossary = GLOSSARY.filter((g) => {
    const matchesSearch = g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.definition.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Tab configurations
  const TABS = [
    { id: 'lessons' as TabType, label: 'Lessons', icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'flashcards' as TabType, label: 'Flashcards', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'glossary' as TabType, label: 'Glossary', icon: <Search className="h-4 w-4" /> }
  ]

  // Simulator 5 Valuation calculations
  const sim5PE = Number((sim5Price / sim5Earnings).toFixed(1))
  const sim5MarketCap = sim5Price * sim5Shares
  const getValuationLabel = (pe: number) => {
    if (pe < 12) return { text: 'Value (Undervalued / Low Growth)', color: 'text-emerald-400' }
    if (pe <= 25) return { text: 'Fairly Valued (Standard Growth)', color: 'text-slate-300' }
    if (pe <= 45) return { text: 'Growth (Premium Valuation)', color: 'text-purple-400' }
    return { text: 'Speculative Growth (Highly Overvalued)', color: 'text-red-400' }
  }
  const sim5Valuation = getValuationLabel(sim5PE)

  return (
    <div className="space-y-6 w-full">
      {/* Academy Navigation / Tab selector */}
      <div className="grid grid-cols-3 rounded-xl bg-surface-950/60 p-1 border border-white/[0.06] backdrop-blur-sm shadow-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id)
              setIsFlipped(false)
            }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 touch-manipulation min-h-[44px] cursor-pointer ${
              activeTab === t.id
                ? 'bg-thriv-700 text-white shadow-lg shadow-thriv-700/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Main View Port */}
      <div className="animate-in fade-in duration-300">
        
        {/* ==================== TAB 1: INTERACTIVE LESSONS ==================== */}
        {activeTab === 'lessons' && (
          <div className="grid gap-6 md:grid-cols-12">
            
            {/* Lessons Sidebar */}
            <div className="md:col-span-4 lg:col-span-3 space-y-2.5">
              <div className="px-1 py-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Learning Path</span>
                <h2 className="text-base font-bold font-display text-slate-200 mt-0.5 animate-pulse">Basics of Trading</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
                {ACADEMY_LESSONS.map((lesson, idx) => (
                  <button
                    key={lesson.title}
                    type="button"
                    onClick={() => {
                      setActiveLessonIdx(idx)
                      setIsFlipped(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 text-left rounded-xl transition-all border touch-manipulation min-h-[48px] cursor-pointer ${
                      activeLessonIdx === idx
                        ? 'bg-thriv-900/40 border-thriv-500/40 text-white shadow-md'
                        : 'bg-surface-800/40 border-white/[0.04] text-slate-400 hover:bg-surface-850/65 hover:text-slate-200'
                    }`}
                  >
                    <div className="rounded-lg bg-surface-900/60 p-2 shrink-0">
                      {lesson.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold text-thriv-400 uppercase tracking-wide">Lesson {idx + 1}</span>
                      <h3 className="text-xs font-semibold truncate leading-snug mt-0.5">{lesson.title}</h3>
                    </div>
                  </button>
                ))}
              </div>

              {onStartQuest && (
                <button
                  type="button"
                  onClick={onStartQuest}
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-thriv-600/30 bg-thriv-900/10 hover:bg-thriv-950/20 py-3.5 font-display font-semibold text-xs lg:text-sm text-thriv-400 touch-manipulation min-h-[44px] transition-all cursor-pointer"
                >
                  <Trophy className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Open mission board
                </button>
              )}
            </div>

            {/* Lesson Content Area */}
            <div className="md:col-span-8 lg:col-span-9 space-y-4">
              {/* Theory Card */}
              <div className="glass rounded-2xl border-thriv-800/30 p-4 sm:p-6 shadow-xl">
                <span className="inline-block text-[10px] font-bold bg-thriv-900/50 text-thriv-400 border border-thriv-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                  Lesson {activeLessonIdx + 1} Theory
                </span>
                <h2 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 leading-tight">
                  {ACADEMY_LESSONS[activeLessonIdx].title}
                </h2>
                
                <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed mb-4">
                  {ACADEMY_LESSONS[activeLessonIdx].concept}
                </p>

                <div className="bg-surface-950/40 border-l-2 border-thriv-500 p-3.5 lg:p-4.5 rounded-r-xl">
                  <h4 className="text-[10px] lg:text-xs font-bold text-thriv-400 uppercase tracking-wide font-display">Key Takeaway</h4>
                  <p className="text-xs lg:text-sm text-slate-350 mt-1 leading-relaxed">
                    {ACADEMY_LESSONS[activeLessonIdx].takeaway}
                  </p>
                </div>
              </div>

              {/* Simulator Playground Card */}
              <div className="glass rounded-2xl border-white/[0.06] p-4 sm:p-6 shadow-xl relative overflow-hidden bg-gradient-to-br from-surface-800 to-surface-900">
                <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-thriv-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-thriv-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Interactive simulator</span>
                  </div>
                  
                  {activeLessonIdx === 1 && (
                    <button
                      onClick={handleResetSim2}
                      className="text-[10px] text-slate-500 hover:text-slate-300 underline font-semibold cursor-pointer"
                    >
                      Reset Ticker
                    </button>
                  )}
                </div>

                {/* --- Sim 1: Paper Trading --- */}
                {activeLessonIdx === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface-950/50 rounded-xl p-4 border border-white/[0.02]">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Virtual Cash</span>
                        <span className="text-base sm:text-lg lg:text-xl font-mono font-bold text-emerald-400 mt-1 block">
                          ${sim1Cash.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-surface-950/50 rounded-xl p-4 border border-white/[0.02]">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase block">Shares Held</span>
                        <span className="text-base sm:text-lg lg:text-xl font-mono font-bold text-slate-200 mt-1 block">
                          {sim1Holdings} AAPL
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-900/60 p-4 rounded-xl border border-white/[0.04]">
                      <div>
                        <span className="text-xs font-bold text-slate-300">AAPL Market Price</span>
                        <span className="block text-sm lg:text-base font-mono text-thriv-400 font-semibold mt-0.5">${sim1Price.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (sim1Cash >= sim1Price) {
                              setSim1Cash((c) => c - sim1Price)
                              setSim1Holdings((h) => h + 1)
                            }
                          }}
                          disabled={sim1Cash < sim1Price}
                          className="px-4 py-2 rounded-lg bg-thriv-700 hover:bg-thriv-600 disabled:opacity-55 disabled:hover:bg-thriv-700 text-xs lg:text-sm font-bold text-white transition-all cursor-pointer min-h-[36px]"
                        >
                          Buy 1 Share
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (sim1Holdings > 0) {
                              setSim1Cash((c) => c + sim1Price)
                              setSim1Holdings((h) => h - 1)
                            }
                          }}
                          disabled={sim1Holdings <= 0}
                          className="px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 disabled:opacity-55 disabled:hover:bg-surface-700 text-xs lg:text-sm font-bold text-slate-200 transition-all cursor-pointer min-h-[36px]"
                        >
                          Sell 1 Share
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Portfolio Value: ${(sim1Cash + sim1Holdings * sim1Price).toLocaleString()}</span>
                      <button onClick={handleResetSim1} className="underline hover:text-slate-400 cursor-pointer">Reset</button>
                    </div>
                  </div>
                )}

                {/* --- Sim 2: Market vs Limit Orders --- */}
                {activeLessonIdx === 1 && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-950/60 p-4 rounded-xl border border-white/[0.04]">
                      <div className="flex justify-between items-center sm:block">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">AAPL Academy Ticker</span>
                        <span className="text-xl lg:text-2xl font-mono font-bold text-thriv-400 mt-1 block">
                          ${sim2Price.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center sm:text-right">
                        <div className="border-r border-white/[0.04] pr-4">
                          <span className="text-[9px] lg:text-[10px] text-slate-500 font-bold uppercase block">Cash</span>
                          <span className="text-sm lg:text-base font-mono font-bold text-slate-200">${sim2Cash.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] lg:text-[10px] text-slate-500 font-bold uppercase block">Shares</span>
                          <span className="text-sm lg:text-base font-mono font-bold text-slate-200">{sim2Holdings}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Panel Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Market Order panel */}
                      <div className="bg-surface-900/50 p-4 rounded-xl border border-white/[0.02] flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs lg:text-sm font-bold text-white mb-1">Market Order</h4>
                          <p className="text-[10px] lg:text-xs text-slate-400 leading-normal mb-4">Fills instantly at current market price (${sim2Price.toFixed(2)})</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleSim2MarketBuy}
                          className="w-full py-2.5 bg-thriv-700 hover:bg-thriv-600 text-xs lg:text-sm font-bold text-white rounded-lg transition-all min-h-[38px] cursor-pointer"
                        >
                          Execute Market Buy
                        </button>
                      </div>

                      {/* Limit Order panel */}
                      <div className="bg-surface-900/50 p-4 rounded-xl border border-white/[0.02] flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs lg:text-sm font-bold text-white mb-1">Limit Order</h4>
                          <p className="text-[10px] lg:text-xs text-slate-400 leading-normal mb-3">Buy only when price falls to or below limit target</p>
                          
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className="text-xs lg:text-sm font-semibold text-slate-500">$</span>
                            <input
                              type="number"
                              value={sim2LimitPrice}
                              onChange={(e) => setSim2LimitPrice(e.target.value)}
                              placeholder="198.50"
                              className="w-full bg-surface-900 border border-white/[0.06] rounded-md px-2 py-1 text-xs lg:text-sm font-mono text-slate-200 focus:outline-none focus:border-thriv-600"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleSim2LimitBuy}
                          disabled={sim2LimitOrder !== null}
                          className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-55 disabled:hover:bg-blue-700 text-xs lg:text-sm font-bold text-white rounded-lg transition-all min-h-[38px] cursor-pointer"
                        >
                          {sim2LimitOrder ? 'Pending...' : 'Set Limit Buy'}
                        </button>
                      </div>
                    </div>

                    {/* Pending Limit Order notification banner */}
                    {sim2LimitOrder && (
                      <div className="flex items-center justify-between px-3 py-2 bg-blue-950/20 border border-blue-500/20 rounded-lg text-[11px] text-blue-300 font-medium">
                        <span>Active Buy Limit Order: 1 share at ${sim2LimitOrder.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSim2LimitOrder(null)
                            setSim2Logs((l) => ['[ORDER] Limit order cancelled.', ...l])
                          }}
                          className="underline hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Simulation logs */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Simulation Log</span>
                      <div className="h-24 overflow-y-auto bg-surface-950 rounded-lg p-2.5 font-mono text-[10px] text-slate-400 space-y-1.5 border border-white/[0.04]">
                        {sim2Logs.map((log, i) => (
                          <div key={i} className={`flex items-start gap-1.5 leading-normal ${log.startsWith('[FILL]') ? 'text-emerald-400' : log.startsWith('[ERROR]') ? 'text-red-400' : log.startsWith('[ORDER]') ? 'text-blue-400' : 'text-slate-500'}`}>
                            <span className="shrink-0">•</span>
                            <span>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Sim 3: Diversification --- */}
                {activeLessonIdx === 2 && (
                  <div className="space-y-4">
                    <p className="text-xs sm:text-sm text-slate-400">
                      Observe two portfolios starting with $10,000 cash value. Port A places all bets on Technology. Port B diversifies across Tech, Health, Energy, and Consumer sectors.
                    </p>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* Port A (Tech Only) */}
                      <div className="bg-surface-900/50 p-4 rounded-xl border border-white/[0.02] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h4 className="text-xs lg:text-sm font-bold text-white">Portfolio A (Concentrated)</h4>
                              <span className="text-[10px] text-slate-500 font-semibold">100% Technology (NVDA)</span>
                            </div>
                            <span className={`text-sm lg:text-base font-mono font-bold ${sim3TechCrash ? 'text-red-400' : 'text-slate-200'}`}>
                              ${sim3TechCrash ? '2,000' : '10,000'}
                            </span>
                          </div>
                          
                          {/* Bar Graphic */}
                          <div className="w-full bg-surface-950 h-3 rounded-full overflow-hidden border border-white/[0.04] mb-2">
                            <div
                              className={`h-full transition-all duration-700 ${sim3TechCrash ? 'bg-red-500 w-1/5' : 'bg-thriv-500 w-full'}`}
                            />
                          </div>
                        </div>
                        {sim3TechCrash && (
                          <span className="text-[10px] lg:text-xs text-red-500 font-bold block mt-1">Tech sector crash: NVDA collapses by -80%!</span>
                        )}
                      </div>

                      {/* Port B (Diversified) */}
                      <div className="bg-surface-900/50 p-4 rounded-xl border border-white/[0.02] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h4 className="text-xs lg:text-sm font-bold text-white">Portfolio B (Diversified)</h4>
                              <span className="text-[10px] text-slate-500 font-semibold">25% Tech, 25% Health, 25% Energy, 25% Consumer</span>
                            </div>
                            <span className={`text-sm lg:text-base font-mono font-bold ${sim3TechCrash ? 'text-amber-400' : 'text-slate-200'}`}>
                              ${sim3TechCrash ? '7,975' : '10,000'}
                            </span>
                          </div>
                          
                          {/* Bar Graphic */}
                          <div className="w-full bg-surface-950 h-3 rounded-full overflow-hidden border border-white/[0.04] mb-2">
                            <div
                              className={`h-full transition-all duration-700 ${sim3TechCrash ? 'bg-amber-500 w-[79.75%]' : 'bg-thriv-500 w-full'}`}
                            />
                          </div>
                        </div>
                        {sim3TechCrash && (
                          <span className="text-[10px] lg:text-xs text-slate-350 block mt-1">
                            Tech plummets, but Defensive Health (+5%) and Energy/Consumer buffer the portfolio. Loss: only <strong className="text-amber-400 font-bold">-20.25%</strong>!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSim3TechCrash(true)}
                        className={`flex-1 py-2 text-xs lg:text-sm font-bold rounded-lg transition-all min-h-[38px] cursor-pointer ${
                          sim3TechCrash
                            ? 'bg-red-950/20 text-red-400 border border-red-500/20'
                            : 'bg-red-700 hover:bg-red-600 text-white'
                        }`}
                      >
                        {sim3TechCrash ? 'Shock Activated (nvda down 80%)' : 'Simulate Tech Sector Crash (-80%)'}
                      </button>
                      {sim3TechCrash && (
                        <button
                          type="button"
                          onClick={() => setSim3TechCrash(false)}
                          className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-xs lg:text-sm font-bold text-white rounded-lg transition-all min-h-[38px] cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* --- Sim 4: Margin Risk & Leverage --- */}
                {activeLessonIdx === 3 && (
                  <div className="space-y-4">
                    <p className="text-xs sm:text-sm text-slate-400">
                      Choose your leverage level. See how borrowing increases buying power but leaves you vulnerable to a margin call (liquidation) during a market drop.
                    </p>

                    <div className="bg-surface-950/60 p-4 rounded-xl border border-white/[0.04] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Select Leverage</span>
                        <span className="text-xs lg:text-sm font-bold font-mono text-amber-400">{sim4Leverage}x Leverage</span>
                      </div>
                      
                      {/* Leverage Slider */}
                      <input
                        type="range"
                        min="1"
                        max="4"
                        value={sim4Leverage}
                        onChange={(e) => {
                          setSim4Leverage(parseInt(e.target.value))
                          setSim4Shocked(false)
                        }}
                        disabled={sim4Shocked}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] lg:text-xs font-semibold">
                        <div>
                          <span className="text-slate-500 block uppercase">Equity</span>
                          <span className="font-mono text-slate-200 mt-0.5 block">$10,000</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase">Buying Power</span>
                          <span className="font-mono text-slate-200 mt-0.5 block">${(10000 * sim4Leverage).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase">Loan</span>
                          <span className="font-mono text-slate-200 mt-0.5 block">${(10000 * (sim4Leverage - 1)).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Liquidation Threshold details */}
                      <div className="text-[10px] lg:text-xs text-slate-400 text-center border-t border-white/[0.04] pt-2.5">
                        {sim4Leverage === 1 ? (
                          <span className="text-emerald-400 font-semibold flex justify-center items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> No borrowing, 0% liquidation risk.
                          </span>
                        ) : (
                          <span>
                            Liquidation triggers if the stock declines by{' '}
                            <strong className="text-red-400">{Math.round(100 / sim4Leverage)}%</strong> or more.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Results Box */}
                    {sim4Shocked ? (
                      <div className={`p-4 rounded-xl border ${
                        sim4Leverage >= 3
                          ? 'bg-red-950/20 border-red-500/20 text-red-200'
                          : 'bg-amber-950/20 border-amber-500/20 text-amber-200'
                      }`}>
                        <div className="flex gap-2">
                          <ShieldAlert className="h-5 w-5 shrink-0" />
                          <div className="space-y-1">
                            <h4 className="text-xs lg:text-sm font-bold uppercase tracking-wide font-display">
                              {sim4Leverage >= 3 ? 'Margin Call & Liquidation' : 'Post-Shock Result'}
                            </h4>
                            <p className="text-xs lg:text-sm leading-relaxed">
                              {sim4Leverage === 1 && 'Stock fell -30%. Your portfolio value is now $7,000 (Loss: -30%).'}
                              {sim4Leverage === 2 && 'Stock fell -30%. With 2x leverage, your loss is doubled to -60%. Your remaining equity is $4,000.'}
                              {sim4Leverage >= 3 && `LIQUIDATED! A -30% drop exceeded your threshold of ${Math.round(100 / sim4Leverage)}%. Your equity was wiped out to $0 and positions were sold automatically!`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSim4Shocked(true)}
                        className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 text-xs lg:text-sm font-bold text-white rounded-lg transition-all min-h-[38px] cursor-pointer"
                      >
                        Simulate -30% Market Drop
                      </button>
                    )}

                    {sim4Shocked && (
                      <div className="text-right">
                        <button
                          onClick={handleResetSim4}
                          className="text-[10px] text-slate-500 hover:text-slate-300 underline font-semibold cursor-pointer"
                        >
                          Reset Simulation
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* --- Sim 5: Fundamental Analysis (P/E & Market Cap) --- */}
                {activeLessonIdx === 4 && (
                  <div className="space-y-4">
                    <p className="text-xs sm:text-sm text-slate-400">
                      Drag the sliders to change stock price and earnings. Observe how the P/E Ratio and Market Cap adjust in real-time, dictating stock valuation.
                    </p>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="bg-surface-950/60 p-4 rounded-xl border border-white/[0.04] space-y-4">
                        {/* Price Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] lg:text-xs font-semibold text-slate-400">
                            <span>STOCK PRICE</span>
                            <span className="font-mono text-slate-200">${sim5Price.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="300"
                            value={sim5Price}
                            onChange={(e) => setSim5Price(parseFloat(e.target.value))}
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                        </div>

                        {/* Earnings Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] lg:text-xs font-semibold text-slate-400">
                            <span>EARNINGS PER SHARE (EPS)</span>
                            <span className="font-mono text-slate-200">${sim5Earnings.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="15.0"
                            step="0.1"
                            value={sim5Earnings}
                            onChange={(e) => setSim5Earnings(parseFloat(e.target.value))}
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 flex flex-col justify-between">
                        {/* Calculated Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-surface-900/50 p-3.5 rounded-xl border border-white/[0.02]">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase font-display">P/E Ratio</span>
                            <span className="text-lg lg:text-xl font-mono font-bold text-purple-400 mt-1 block">
                              {sim5PE}x
                            </span>
                          </div>
                          
                          <div className="bg-surface-900/50 p-3.5 rounded-xl border border-white/[0.02]">
                            <span className="text-[10px] text-slate-500 font-bold block uppercase font-display">Market Cap</span>
                            <span className="text-lg lg:text-xl font-mono font-bold text-slate-200 mt-1 block">
                              ${(sim5MarketCap / 1e9).toFixed(2)}B
                            </span>
                          </div>
                        </div>

                        <div className="bg-purple-950/20 border border-purple-500/25 p-3 rounded-xl flex items-center gap-2.5">
                          <BarChart2 className="h-5 w-5 text-purple-400 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Valuation Classification</span>
                            <p className={`text-xs lg:text-sm font-semibold ${sim5Valuation.color} mt-0.5`}>
                              {sim5Valuation.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Sim 6: Volume & Spreads (Slippage) --- */}
                {activeLessonIdx === 5 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-slate-400">
                        Toggle market liquidity. Compare order spreads and check the slippage penalty on buy fills.
                      </p>
                      
                      {/* Liquidity toggle switcher */}
                      <div className="flex rounded-lg bg-surface-950/80 p-0.5 border border-white/[0.04]">
                        <button
                          type="button"
                          onClick={() => setSim6Liquidity('high')}
                          className={`px-2.5 py-1 text-[9px] lg:text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            sim6Liquidity === 'high' ? 'bg-cyan-700 text-white shadow' : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          High Vol
                        </button>
                        <button
                          type="button"
                          onClick={() => setSim6Liquidity('low')}
                          className={`px-2.5 py-1 text-[9px] lg:text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                            sim6Liquidity === 'low' ? 'bg-cyan-700 text-white shadow' : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          Thin Vol
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Bids List (Buyers) */}
                        <div className="bg-emerald-950/10 border border-emerald-500/10 rounded-xl p-3.5">
                          <span className="text-[9px] lg:text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2.5 text-center">BIDS (Buyers)</span>
                          <div className="space-y-2">
                            {sim6Bids.map((b, idx) => (
                              <div key={idx} className="flex justify-between font-mono text-[10px] lg:text-xs text-slate-300">
                                <span>${b.price.toFixed(2)}</span>
                                <span className="text-slate-500">{b.qty} shrs</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Asks List (Sellers) */}
                        <div className="bg-red-950/10 border border-red-500/10 rounded-xl p-3.5">
                          <span className="text-[9px] lg:text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-2.5 text-center">ASKS (Sellers)</span>
                          <div className="space-y-2">
                            {sim6Asks.map((a, idx) => (
                              <div key={idx} className="flex justify-between font-mono text-[10px] lg:text-xs text-slate-300">
                                <span>${a.price.toFixed(2)}</span>
                                <span className="text-slate-500">{a.qty} shrs</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between space-y-4">
                        {/* Spread Info Block */}
                        <div className="flex items-center justify-between bg-surface-950/50 p-4 rounded-xl border border-white/[0.02] text-xs lg:text-sm">
                          <div>
                            <span className="text-[9px] lg:text-[10px] text-slate-500 font-bold block uppercase">Bid/Ask Spread</span>
                            <span className="font-mono font-bold text-cyan-400 block mt-0.5">
                              ${Number((sim6Asks[0]?.price - sim6Bids[0]?.price || 0).toFixed(2))}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleSim6MarketBuy}
                            className="py-2 px-5 bg-cyan-700 hover:bg-cyan-600 text-xs lg:text-sm font-bold text-white rounded-lg transition-all min-h-[36px] cursor-pointer"
                          >
                            Buy 100 Shares (Market)
                          </button>
                        </div>

                        {/* Execution logs */}
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Trade Execution Slippage Logs</span>
                          <div className="h-24 overflow-y-auto bg-surface-950 rounded-lg p-2.5 font-mono text-[9px] lg:text-[10px] text-slate-400 space-y-1.5 border border-white/[0.04]">
                            {sim6SlippageLog.length === 0 ? (
                              <div className="text-slate-600 italic">No trades placed in this lesson yet.</div>
                            ) : (
                              sim6SlippageLog.map((log, i) => (
                                <div key={i} className={`flex items-start gap-1 leading-normal ${log.startsWith('[HIGH') ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  <span className="shrink-0">•</span>
                                  <span>{log}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: INTERACTIVE FLASHCARDS ==================== */}
        {activeTab === 'flashcards' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center px-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Study Tool</span>
              <h2 className="text-xl font-bold font-display text-white mt-1">Trading Flashcards</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-normal">
                Flip cards to test your memory of core financial concepts.
              </p>
            </div>

            {/* 3D Flippable Card Frame */}
            <div
              className="w-full h-60 sm:h-64 lg:h-72 perspective-1000 cursor-pointer touch-manipulation"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Card Front (Term) */}
                <div className="absolute inset-0 w-full h-full backface-hidden glass rounded-2xl p-6 lg:p-8 flex flex-col justify-between items-center text-center shadow-2xl border border-white/[0.08] bg-surface-850">
                  <div className="text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Term {currentCardIdx + 1} of {GLOSSARY.length}
                  </div>
                  
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold font-display text-white px-4 leading-snug my-auto">
                    {GLOSSARY[currentCardIdx].term}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] lg:text-xs text-thriv-400 font-semibold animate-pulse">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Tap to reveal definition</span>
                  </div>
                </div>

                {/* Card Back (Definition) */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 glass rounded-2xl p-6 lg:p-8 flex flex-col justify-between items-center text-center shadow-2xl border border-thriv-500/20 bg-surface-900">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[9px] lg:text-[10px] font-bold text-thriv-400 uppercase tracking-widest">Definition</span>
                    <span className="text-[9px] lg:text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold uppercase">
                      {GLOSSARY[currentCardIdx].category || 'Basics'}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-slate-200 px-4 my-auto">
                    {GLOSSARY[currentCardIdx].definition}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCardLearned(GLOSSARY[currentCardIdx].term)
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] lg:text-xs font-bold transition-all border ${
                      learnedCards.includes(GLOSSARY[currentCardIdx].term)
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                        : 'bg-surface-800 border-white/[0.06] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {learnedCards.includes(GLOSSARY[currentCardIdx].term) ? 'Learned!' : 'Mark as Learned'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={handleCardPrev}
                className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-200 py-2 px-3 rounded-lg hover:bg-white/[0.02] touch-manipulation min-h-[40px] cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>

              <div className="text-[10px] lg:text-xs font-mono text-slate-500 font-semibold">
                Learned: {learnedCards.length} / {GLOSSARY.length} ({Math.round((learnedCards.length / GLOSSARY.length) * 100)}%)
              </div>

              <button
                type="button"
                onClick={handleCardNext}
                className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-200 py-2 px-3 rounded-lg hover:bg-white/[0.02] touch-manipulation min-h-[40px] cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: SEARCHABLE GLOSSARY ==================== */}
        {activeTab === 'glossary' && (
          <div className="space-y-4">
            {/* Header controls */}
            <div className="grid gap-3 sm:grid-cols-3 sm:items-center bg-surface-950/40 p-3 rounded-xl border border-white/[0.04]">
              {/* Search */}
              <div className="sm:col-span-1 relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search terminology..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-900 border border-white/[0.06] rounded-lg pl-9 pr-3 py-1.5 text-xs lg:text-sm text-slate-200 focus:outline-none focus:border-thriv-600 focus:ring-1 focus:ring-thriv-600/30 min-h-[36px]"
                />
              </div>
              
              {/* Category selector */}
              <div className="sm:col-span-2 scroll-chips">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-3 py-1 text-[10px] font-bold touch-manipulation min-h-[30px] transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-thriv-700 text-white'
                        : 'bg-surface-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Glossary Listing */}
            {filteredGlossary.length === 0 ? (
              <div className="text-center py-10 glass rounded-xl text-slate-500 text-xs">
                No matching terms found. Try a different query.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {filteredGlossary.map((g) => (
                  <div key={g.term} className="glass rounded-xl p-4 border-white/[0.05] hover:border-thriv-500/25 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <dt className="font-bold font-display text-sm lg:text-base text-thriv-300 leading-snug">{g.term}</dt>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-slate-500 font-bold uppercase shrink-0">
                          {g.category || 'Basics'}
                        </span>
                      </div>
                      <dd className="text-xs lg:text-sm text-slate-400 leading-relaxed font-normal">{g.definition}</dd>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Disclaimers card */}
      <div className="rounded-xl border border-amber-500/15 bg-amber-950/10 p-3.5 text-[10px] sm:text-xs leading-relaxed text-amber-200/80">
        <strong>Disclaimer:</strong> Academy metrics and simulators are mock educational loops. They do not constitute financial advice or predict actual trading outcomes. Simulated prices in the simulator modules are self-contained and do not affect your portfolio.
      </div>
    </div>
  )
}
