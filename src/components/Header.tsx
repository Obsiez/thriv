import { useState } from 'react'
import {
  Pause,
  Play,
} from 'lucide-react'
import { Logo } from './Logo'
import { SyncStatus } from './SyncStatus'

import { formatCurrency } from '../lib/marketEngine'
import { getLevelInfo, xpProgressInLevel } from '../lib/progression'
import type { PlayerProgress, TabId } from '../types'

interface HeaderProps {
  onTab: (tab: TabId) => void
  totalValue: number
  marketOpen: boolean
  onToggleMarket: () => void
  lastTick: number
  progress: PlayerProgress
  portfolioValue?: number
  portfolioUnderWater?: boolean
  onOpenProgression: () => void
  onOpenSidebar: () => void
  onOpenSettings: () => void
  displayName: string
  guest?: boolean
}

const iconBtn =
  'flex items-center justify-center rounded-lg border border-white/[0.08] bg-surface-800 text-slate-400 hover:text-white hover:border-thriv-500/40 hover:ring-1 hover:ring-thriv-500/20 transition-all duration-150 touch-manipulation h-10 w-10 shrink-0'

export function Header({
  onTab,
  totalValue,
  marketOpen,
  onToggleMarket,
  lastTick,
  progress,
  portfolioUnderWater = false,
  onOpenProgression,
  onOpenSettings,
  displayName,
  guest = false,
}: HeaderProps) {
  const rank = getLevelInfo(progress.level)
  const bar = xpProgressInLevel(progress.xp)
  const accentId = progress.profile?.accentId ?? 'teal'
  const initial = guest ? 'T' : (displayName || 'U').charAt(0).toUpperCase()
  const [balanceHidden, setBalanceHidden] = useState(true)

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] apple-glass">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 lg:px-6 relative">
        {/* Left Section: Logo only (Left Corner) */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0 z-10">
          <button
            type="button"
            onClick={() => onTab('home')}
            className="touch-manipulation flex items-center justify-center p-0 m-0 border-0 bg-transparent focus:outline-none"
          >
            <Logo size="sm" className="md:hidden" />
            <Logo size="md" className="hidden md:flex" />
          </button>
        </div>

        {/* Right Section: Balance, Pause, Sync, Avatar */}
        <div className="flex items-center gap-2 md:gap-2.5 shrink-0 ml-auto z-10">
          {/* Portfolio balance - mobile only, clickable to reveal/hide (larger text sizes) */}
          <button
            type="button"
            onClick={() => setBalanceHidden(!balanceHidden)}
            className="text-right focus:outline-none cursor-pointer select-none md:hidden block"
            aria-label={balanceHidden ? 'Show portfolio balance' : 'Hide portfolio balance'}
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-500 leading-none mb-0.5">Portfolio</p>
            <p
              className={`font-mono text-sm font-bold tabular-nums leading-tight ${
                portfolioUnderWater ? 'text-red-400' : 'text-thriv-300'
              }`}
            >
              {balanceHidden ? '$ ••••••' : formatCurrency(totalValue)}
            </p>
          </button>

          {/* Portfolio balance - desktop only, always visible */}
          <div className="hidden md:block text-right select-none">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 leading-normal">Portfolio</p>
            <p
              className={`font-mono text-sm lg:text-lg font-semibold tabular-nums leading-normal ${
                portfolioUnderWater ? 'text-red-400' : 'text-thriv-300'
              }`}
            >
              {formatCurrency(totalValue)}
            </p>
          </div>

          {/* Button Group: pause, cloud, profile */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleMarket}
              className={iconBtn}
              aria-label={marketOpen ? 'Pause market' : 'Resume market'}
            >
              {marketOpen ? (
                <Pause className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
              ) : (
                <Play className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>

            {/* Sync status - hidden on mobile (md break) */}
            <div className="hidden md:block shrink-0">
              <SyncStatus />
            </div>

            {/* Custom Profile Card */}
            <button
              type="button"
              onClick={onOpenSettings}
              className={`flex items-center justify-center rounded-lg border transition-colors duration-150 h-10 w-10 shrink-0 font-mono font-bold text-sm select-none ${
                accentId === 'teal'
                  ? 'bg-gradient-to-br from-thriv-950/90 to-thriv-900/30 border-thriv-500/20 text-thriv-300 hover:border-thriv-500/55'
                  : accentId === 'indigo'
                  ? 'bg-gradient-to-br from-indigo-950/90 to-indigo-900/30 border-indigo-500/20 text-indigo-300 hover:border-indigo-500/55'
                  : accentId === 'amber'
                  ? 'bg-gradient-to-br from-amber-950/90 to-amber-900/30 border-amber-500/20 text-amber-300 hover:border-amber-500/55'
                  : accentId === 'emerald'
                  ? 'bg-gradient-to-br from-emerald-950/90 to-emerald-900/30 border-emerald-500/20 text-emerald-300 hover:border-emerald-500/55'
                  : accentId === 'violet'
                  ? 'bg-gradient-to-br from-violet-950/90 to-violet-900/30 border-violet-500/20 text-violet-300 hover:border-violet-500/55'
                  : 'bg-gradient-to-br from-slate-900/90 to-slate-800/30 border-slate-500/20 text-slate-200 hover:border-slate-400/50'
              }`}
            >
              {initial}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenProgression}
        className="w-full text-left md:hidden px-3 pb-2.5 active:scale-[0.99] transition-transform focus:outline-none focus:ring-1 focus:ring-thriv-500/20 rounded-md cursor-pointer group"
      >
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span className="font-mono text-slate-400 group-hover:text-thriv-400 transition-colors">{rank.rankCode}</span>
          <span className="font-mono tabular-nums">
            {bar.current}/{bar.max} XP
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-surface-800 ring-1 ring-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-thriv-700 to-thriv-500 transition-[width] duration-500 ease-out"
            style={{ width: `${bar.pct}%` }}
          />
        </div>
      </button>

      <p className="sr-only" aria-live="polite">
        Market updated {new Date(lastTick).toLocaleTimeString()}
      </p>
    </header>
  )
}
