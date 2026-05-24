import {
  Activity,
  BookOpen,
  Briefcase,
  Gamepad2,
  Home,
  LayoutGrid,
  ListOrdered,
  Newspaper,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Logo } from './Logo'
import { LevelProfile } from './LevelProfile'
import { ProfileAvatar } from './ProfileAvatar'
import { SyncStatus } from './SyncStatus'
import { formatCurrency } from '../lib/marketEngine'
import { getLevelInfo, xpProgressInLevel } from '../lib/progression'
import type { AccentId } from '../lib/profileTheme'
import type { PlayerProgress, TabId } from '../types'

interface HeaderProps {
  activeTab: TabId
  onTab: (tab: TabId) => void
  totalValue: number
  marketOpen: boolean
  onToggleMarket: () => void
  onReset: () => void
  lastTick: number
  progress: PlayerProgress
  questBadge: number
  portfolioValue?: number
  portfolioUnderWater?: boolean
  displayName?: string
  accentId?: AccentId
  onOpenSettings: () => void
}

const DESKTOP_TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'market', label: 'Market', icon: LayoutGrid },
  { id: 'trade', label: 'Trade', icon: Activity },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'quests', label: 'Quests', icon: Gamepad2 },
  { id: 'activities', label: 'Play', icon: Sparkles },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'orders', label: 'Orders', icon: ListOrdered },
  { id: 'learn', label: 'Learn', icon: BookOpen },
]

const iconBtn =
  'flex items-center justify-center rounded-lg border border-white/[0.08] bg-surface-800 text-slate-400 hover:text-white touch-manipulation h-10 w-10 shrink-0'

export function Header({
  activeTab,
  onTab,
  totalValue,
  marketOpen,
  onToggleMarket,
  onReset,
  lastTick,
  progress,
  questBadge,
  portfolioUnderWater = false,
  displayName,
  accentId = 'teal',
  onOpenSettings,
}: HeaderProps) {
  const initial = (displayName?.trim() || 'T').charAt(0).toUpperCase()
  const rank = getLevelInfo(progress.level)
  const bar = xpProgressInLevel(progress.xp)

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface-900/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 lg:px-6">
        <button type="button" onClick={() => onTab('home')} className="shrink-0 touch-manipulation">
          <Logo size="sm" />
        </button>

        <div className="hidden lg:block flex-1 max-w-sm mx-4">
          <LevelProfile progress={progress} compact motto={progress.profile?.motto} />
        </div>

        <nav className="hidden md:flex flex-wrap gap-0.5 rounded-xl bg-surface-800 p-0.5 max-w-[70%] overflow-x-auto">
          {DESKTOP_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`relative flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium whitespace-nowrap lg:px-3 lg:py-2 lg:text-sm ${
                activeTab === id
                  ? 'bg-thriv-700 text-white'
                  : 'text-slate-400 hover:bg-surface-700 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" strokeWidth={1.75} />
              {label}
              {id === 'quests' && questBadge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-surface-900">
                  {questBadge > 9 ? '9+' : questBadge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="text-right sm:hidden pr-0.5">
            <p
              className={`font-mono text-xs font-semibold tabular-nums ${
                portfolioUnderWater ? 'text-red-400' : 'text-thriv-300'
              }`}
            >
              {formatCurrency(totalValue)}
            </p>
            <p className="text-[9px] text-slate-500">Lv.{progress.level}</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Portfolio</p>
            <p
              className={`font-mono text-sm lg:text-lg font-semibold tabular-nums ${
                portfolioUnderWater ? 'text-red-400' : 'text-thriv-300'
              }`}
            >
              {formatCurrency(totalValue)}
            </p>
          </div>

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

          <SyncStatus />

          <button
            type="button"
            onClick={onReset}
            className={`hidden sm:flex ${iconBtn}`}
            aria-label="Reset portfolio cash"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className={`${iconBtn} sm:!w-auto sm:justify-center sm:pl-1 sm:pr-2 text-slate-300`}
            aria-label="Settings and profile"
          >
            <ProfileAvatar
              initial={initial}
              accentId={accentId}
              size="sm"
              className="sm:mr-2"
            />
            <Settings className="h-4 w-4 hidden sm:block shrink-0" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="md:hidden px-3 pb-2">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span className="font-mono text-slate-400">{rank.rankCode}</span>
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
      </div>

      <p className="sr-only" aria-live="polite">
        Market updated {new Date(lastTick).toLocaleTimeString()}
      </p>
    </header>
  )
}
