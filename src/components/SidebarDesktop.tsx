import {
  Activity,
  BookOpen,
  Briefcase,
  CreditCard,
  Gamepad2,
  Home,
  LayoutGrid,
  ListOrdered,
  Newspaper,
  PanelLeft,
  Settings,
  Sparkles,
} from 'lucide-react'
import { getAccent } from '../lib/profileTheme'
import { getLevelInfo, xpProgressInLevel } from '../lib/progression'
import type { PlayerProgress, TabId } from '../types'

interface SidebarDesktopProps {
  activeTab: TabId
  onTab: (tab: TabId) => void
  progress: PlayerProgress
  questBadge: number
  expanded: boolean
  onOpenSettings: () => void
  onOpenProgression: () => void
  onToggleDesktopSidebar: () => void
}

const SIDEBAR_TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'market', label: 'Market', icon: LayoutGrid },
  { id: 'trade', label: 'Trade', icon: Activity },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'ledger', label: 'Ledger', icon: CreditCard },
  { id: 'quests', label: 'Quests', icon: Gamepad2 },
  { id: 'activities', label: 'Play', icon: Sparkles },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'orders', label: 'Orders', icon: ListOrdered },
  { id: 'learn', label: 'Learn', icon: BookOpen },
]

export function SidebarDesktop({
  activeTab,
  onTab,
  progress,
  questBadge,
  expanded,
  onOpenSettings,
  onOpenProgression,
  onToggleDesktopSidebar,
}: SidebarDesktopProps) {
  const accent = getAccent(progress.profile?.accentId ?? 'teal')
  const rank = getLevelInfo(progress.level)
  const bar = xpProgressInLevel(progress.xp)

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col justify-between border-r border-white/[0.06] bg-[#0b1016] select-none overflow-hidden ${
        expanded ? 'w-[240px]' : 'w-[68px]'
      }`}
    >
      {/* Top section containing the PanelLeft toggle */}
      <div className="h-[68px] shrink-0 border-b border-white/[0.06] flex items-center px-[14px]">
        <button
          type="button"
          onClick={onToggleDesktopSidebar}
          className="flex h-10 w-10 items-center justify-center text-slate-400 hover:text-white shrink-0 cursor-pointer focus:outline-none rounded-lg hover:bg-surface-800/50 transition-colors"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-none">
        {SIDEBAR_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <div key={id} className="relative group">
              <button
                type="button"
                onClick={() => onTab(id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-150 relative touch-manipulation min-h-[44px] overflow-hidden ${
                  isActive
                    ? `bg-surface-800 text-white font-medium shadow-sm ring-1 ring-white/10`
                    : 'text-slate-400 hover:bg-surface-800/50 hover:text-slate-100'
                }`}
              >
                {/* Active Indicator Line on the left */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-full"
                    style={{ backgroundColor: accent.id === 'slate' ? '#94a3b8' : `var(--color-${accent.id}-500, #34d3b0)` }}
                  />
                )}
                
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-150 ${
                    isActive ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                  style={isActive && accent.id !== 'slate' ? { color: `var(--color-${accent.id}-400, #34d3b0)` } : undefined}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                
                {expanded && (
                  <span className="text-xs tracking-wide truncate ml-3">
                    {label}
                  </span>
                )}
 
                {/* Badge count for Quests */}
                {id === 'quests' && questBadge > 0 && (
                  <span
                    className={`absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-surface-900 shadow-sm transition-all duration-200 ${
                      expanded ? 'right-3 top-1/2 -translate-y-1/2' : 'right-2 top-2 scale-75'
                    }`}
                  >
                    {questBadge > 9 ? '9+' : questBadge}
                  </span>
                )}
              </button>
 
              {/* Tooltip on Hover when collapsed */}
              {!expanded && (
                <div className="absolute left-[58px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap bg-surface-950/95 border border-white/[0.08] px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-100 shadow-xl">
                  {label}
                </div>
              )}
            </div>
          )
        })}
      </div>
 
      {/* Level progression & Quick settings at the bottom */}
      <div className={`p-3 bg-[#0a0f14]/40 space-y-3 shrink-0 ${expanded ? 'border-t border-white/[0.06]' : ''}`}>
        {/* Profile, Settings, and Sign out buttons */}
        <div className="flex flex-col gap-3 w-full">
          {/* Level Progression Shortcut */}
          {expanded ? (
            <button
              type="button"
              onClick={onOpenProgression}
              className="w-full flex items-center gap-3 p-2 rounded-xl border border-white/[0.08] bg-surface-900/30 hover:bg-surface-800/40 cursor-pointer text-left focus:outline-none"
            >
              {/* Squared border with rankCode */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-surface-900/50 font-mono text-[13px] font-bold text-slate-350">
                {rank.rankCode}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {rank.title}
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                    Lvl {progress.level}
                  </span>
                </div>
                {/* Clean, simple XP bar - not too attractive/attention seeking */}
                <div className="mt-1 space-y-1">
                  <div className="h-1 overflow-hidden rounded-full bg-surface-950/80">
                    <div
                      className="h-full rounded-full bg-slate-500/50 transition-[width] duration-500"
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono leading-none">
                    <span>{bar.current}/{bar.max} XP</span>
                    <span>{Math.round(bar.pct)}%</span>
                  </div>
                </div>
              </div>
            </button>
          ) : (
            <div className={`relative group flex w-full justify-center`}>
              <button
                type="button"
                onClick={onOpenProgression}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-surface-900/50 font-mono text-[13px] font-bold text-slate-350 hover:text-white hover:border-white/25 transition-colors duration-150 cursor-pointer focus:outline-none"
              >
                {rank.rankCode}
              </button>
              <div className="absolute left-[58px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap bg-surface-950/95 border border-white/[0.08] px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-100 shadow-xl">
                Level {progress.level} ({bar.current}/{bar.max} XP)
              </div>
            </div>
          )}

          {/* Settings Button */}
          <div className="relative group">
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full flex items-center px-3 py-2.5 rounded-xl transition-colors duration-150 relative touch-manipulation min-h-[44px] overflow-hidden text-slate-400 hover:bg-surface-800/50 hover:text-slate-100 cursor-pointer focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
            >
              <Settings
                className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-105"
                strokeWidth={1.75}
              />
              {expanded && (
                <span className="text-xs tracking-wide truncate ml-3">
                  Settings
                </span>
              )}
            </button>
            {!expanded && (
              <div className="absolute left-[58px] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap bg-surface-950/95 border border-white/[0.08] px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-100 shadow-xl">
                Settings
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
