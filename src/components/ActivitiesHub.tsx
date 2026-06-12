import { useState } from 'react'
import {
  Brain,
  Calculator,
  ChevronRight,
  GitCompare,
  Grid3x3,
  LineChart,
  Shield,
  Swords,
  Target,
  AlertTriangle,
  Zap,
  Globe,
  Layers,
} from 'lucide-react'
import { FlashQuotesActivity } from './FlashQuotesActivity'
import { QuizActivity } from './QuizActivity'
import { ScenarioActivity } from './ScenarioActivity'
import { PredictorActivity } from './PredictorActivity'
import { SectorSprintActivity } from './SectorSprintActivity'
import { StockCompareTool } from './StockCompareTool'
import { PositionSizerTool } from './PositionSizerTool'
import { OrderBookCombatActivity } from './OrderBookCombatActivity'
import { BidAskSniperActivity } from './BidAskSniperActivity'
import { MarginCallSurvivorActivity } from './MarginCallSurvivorActivity'
import { OptionsExpiryActivity } from './OptionsExpiryActivity'
import type { Stock, TabId } from '../types'

type ActivityId =
  | 'menu'
  | 'quiz-basics'
  | 'quiz-advanced'
  | 'scenario'
  | 'predictor'
  | 'sector-sprint'
  | 'compare'
  | 'sizer'
  | 'flash-quotes'
  | 'combat'
  | 'bid-ask-sniper'
  | 'margin-call'
  | 'options-expiry'

interface ActivitiesHubProps {
  stocks: Stock[]
  selectedSymbol: string
  portfolioCash: number
  onQuizPass: (quizId: string, scorePct: number) => void
  onScenarioComplete: (xp: number) => void
  onPrediction: (won: boolean) => void
  onSectorSprintComplete: (correct: number) => void
  onCompareUsed: () => void
  onPositionSizerUsed: () => void
  onFlashQuotesComplete: (correct: number, total: number) => void
  onQuizCorrectAnswer?: () => void
  onActivityAnswer: (correct: boolean) => void
  onNavigate: (tab: TabId) => void
}

export function ActivitiesHub({
  stocks,
  selectedSymbol,
  portfolioCash,
  onQuizPass,
  onScenarioComplete,
  onPrediction,
  onSectorSprintComplete,
  onCompareUsed,
  onPositionSizerUsed,
  onFlashQuotesComplete,
  onQuizCorrectAnswer,
  onActivityAnswer,
  onNavigate,
}: ActivitiesHubProps) {
  const [view, setView] = useState<ActivityId>('menu')
  const stock = stocks.find((s) => s.symbol === selectedSymbol) ?? stocks[0]

  if (view === 'quiz-basics') {
    return (
      <QuizActivity
        quizId="basics"
        title="Market Basics Quiz"
        onBack={() => setView('menu')}
        onCorrectAnswer={onQuizCorrectAnswer}
        onAnswer={onActivityAnswer}
        onComplete={(pct) => {
          onQuizPass('basics', pct)
          setView('menu')
        }}
      />
    )
  }

  if (view === 'quiz-advanced') {
    return (
      <QuizActivity
        quizId="advanced"
        title="Advanced Quiz"
        questionsKey="advanced"
        onBack={() => setView('menu')}
        onCorrectAnswer={onQuizCorrectAnswer}
        onAnswer={onActivityAnswer}
        onComplete={(pct) => {
          onQuizPass('advanced', pct)
          if (pct >= 80) onQuizPass(`daily-${Date.now()}`, pct)
          setView('menu')
        }}
      />
    )
  }

  if (view === 'scenario') {
    return (
      <ScenarioActivity
        onBack={() => setView('menu')}
        onAnswer={onActivityAnswer}
        onComplete={onScenarioComplete}
      />
    )
  }

  if (view === 'predictor' && stock) {
    return (
      <PredictorActivity
        stock={stock}
        stocks={stocks}
        onBack={() => setView('menu')}
        onResult={onPrediction}
      />
    )
  }

  if (view === 'sector-sprint') {
    return (
      <SectorSprintActivity
        stocks={stocks}
        onBack={() => setView('menu')}
        onAnswer={onActivityAnswer}
        onComplete={(c) => {
          onSectorSprintComplete(c)
          setView('menu')
        }}
      />
    )
  }

  if (view === 'compare') {
    return (
      <StockCompareTool
        stocks={stocks}
        defaultA={selectedSymbol}
        defaultB="MSFT"
        onBack={() => setView('menu')}
        onUsed={onCompareUsed}
      />
    )
  }

  if (view === 'sizer') {
    return (
      <PositionSizerTool
        portfolioCash={portfolioCash}
        onBack={() => setView('menu')}
        onUsed={onPositionSizerUsed}
      />
    )
  }

  if (view === 'flash-quotes') {
    return (
      <FlashQuotesActivity
        stocks={stocks}
        onBack={() => setView('menu')}
        onAnswer={onActivityAnswer}
        onComplete={(correct, total) => {
          onFlashQuotesComplete(correct, total)
          setView('menu')
        }}
      />
    )
  }

  if (view === 'combat') {
    return (
      <OrderBookCombatActivity
        onBack={() => setView('menu')}
        onComplete={(xp) => {
          onScenarioComplete(xp)
          setView('menu')
        }}
      />
    )
  }

  if (view === 'bid-ask-sniper') {
    return (
      <BidAskSniperActivity
        onBack={() => setView('menu')}
        onAnswer={onActivityAnswer}
        onComplete={(xp) => {
          onScenarioComplete(xp)
          setView('menu')
        }}
      />
    )
  }

  if (view === 'margin-call') {
    return (
      <MarginCallSurvivorActivity
        onBack={() => setView('menu')}
        onComplete={(xp) => {
          onScenarioComplete(xp)
          setView('menu')
        }}
      />
    )
  }

  if (view === 'options-expiry') {
    return (
      <OptionsExpiryActivity
        onBack={() => setView('menu')}
        onAnswer={onActivityAnswer}
        onComplete={(xp) => {
          onScenarioComplete(xp)
          setView('menu')
        }}
      />
    )
  }

  const cards = [
    {
      id: 'quiz-basics' as const,
      title: 'Basics Quiz',
      desc: '6 questions · 80% to pass',
      icon: Brain,
      xp: 'Up to 60 XP',
      color: 'border-thriv-600/25',
    },
    {
      id: 'quiz-advanced' as const,
      title: 'Advanced Quiz',
      desc: '4 intermediate questions',
      icon: Brain,
      xp: 'Up to 40 XP',
      color: 'border-violet-600/25',
    },
    {
      id: 'sector-sprint' as const,
      title: 'Sector Sprint',
      desc: '8 rapid sector classifications',
      icon: Grid3x3,
      xp: '12 XP per correct',
      color: 'border-indigo-600/25',
    },
    {
      id: 'scenario' as const,
      title: 'Scenario Lab',
      desc: 'Decision trees with feedback',
      icon: Swords,
      xp: '20–35 XP each',
      color: 'border-amber-600/25',
    },
    {
      id: 'predictor' as const,
      title: 'Price Predictor',
      desc: '15-second directional call',
      icon: LineChart,
      xp: '15 XP per win',
      color: 'border-emerald-600/25',
    },
    {
      id: 'flash-quotes' as const,
      title: 'Flash Quotes',
      desc: '8 rapid higher-price calls',
      icon: Zap,
      xp: '8 XP per correct',
      color: 'border-amber-500/25',
    },
    {
      id: 'combat' as const,
      title: 'Order Book Combat',
      desc: '3 waves · defend $99.10 support',
      icon: Shield,
      xp: '80 XP · all waves',
      color: 'border-thriv-600/25',
    },
    {
      id: 'bid-ask-sniper' as const,
      title: 'Bid-Ask Sniper',
      desc: '10 rounds · widening spreads',
      icon: Target,
      xp: '5 XP per correct · 50 max',
      color: 'border-violet-600/25',
    },
    {
      id: 'margin-call' as const,
      title: 'Margin Call Survivor',
      desc: 'Survive 30s of 2× leverage',
      icon: AlertTriangle,
      xp: '50 XP survive · 20 XP partial',
      color: 'border-orange-600/25',
    },
    {
      id: 'options-expiry' as const,
      title: 'Options Expiry',
      desc: '8 rounds · ITM or OTM?',
      icon: Zap,
      xp: '8 XP per correct · 64 max',
      color: 'border-indigo-600/25',
    },
    {
      id: 'compare' as const,
      title: 'Stock Compare',
      desc: 'Side-by-side fundamentals',
      icon: GitCompare,
      xp: 'Mission credit',
      color: 'border-slate-500/25',
    },
    {
      id: 'sizer' as const,
      title: 'Position Sizer',
      desc: 'Risk-based share calculator',
      icon: Calculator,
      xp: 'Mission credit',
      color: 'border-slate-500/25',
    },
    {
      id: 'macro-sandbox' as any,
      title: 'Macroeconomic Sandbox',
      desc: ' Federal Funds Rate, GDP, CPI, and Unemployment sliders with sector heatmap impact and central bank challenges',
      icon: Globe,
      xp: 'Scenario reward: 40 XP',
      color: 'border-emerald-600/25',
    },
    {
      id: 'options-sandbox' as any,
      title: 'Options Sandbox & Greeks',
      desc: 'Interactive multi-leg payoff diagrams (2D/3D), Greeks visualizer, and risk simulator',
      icon: Layers,
      xp: 'Interactive Tool',
      color: 'border-indigo-600/25',
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">Activities</h1>
        <p className="text-sm text-slate-400 mt-1">
          Structured drills and tools — earn XP while building market literacy.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ id, title, desc, icon: Icon, xp, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id === 'macro-sandbox' || id === 'options-sandbox') {
                onNavigate(id)
              } else {
                setView(id)
              }
            }}
            className={`glass flex min-h-[96px] items-center gap-4 rounded-xl border p-4 text-left touch-manipulation transition-colors hover:border-white/10 ${color}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-surface-900/80">
              <Icon className="h-5 w-5 text-thriv-400" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-sm">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              <p className="text-[10px] text-thriv-500/90 mt-1 font-medium">{xp}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" strokeWidth={1.75} />
          </button>
        ))}
      </div>
    </div>
  )
}
