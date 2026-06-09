import { BookOpen, ListOrdered, Newspaper, Sparkles, X, Gamepad2, Settings, LogOut, ChevronRight } from 'lucide-react'
import type { PlayerProgress, TabId } from '../types'
import { formatCurrency } from '../lib/marketEngine'
import { getLevelInfo, xpProgressInLevel } from '../lib/progression'

interface SidebarProps {
  open: boolean
  onClose: () => void
  totalValue: number
  progress: PlayerProgress
  questBadge: number
  activeTab: TabId
  onTab: (tab: TabId) => void
  onOpenSettings: () => void
  onLogout: () => void
}

const ITEMS: { id: TabId; label: string; icon: typeof Newspaper | typeof Gamepad2; desc: string }[] = [
  { id: 'quests', label: 'Quests', icon: Gamepad2, desc: 'Missions & rewards' },
  { id: 'activities', label: 'Activities', icon: Sparkles, desc: 'Quizzes & mini-games' },
  { id: 'news', label: 'News', icon: Newspaper, desc: 'Market headlines' },
  { id: 'orders', label: 'Orders', icon: ListOrdered, desc: 'Trade history' },
  { id: 'learn', label: 'Learn', icon: BookOpen, desc: 'Glossary & lessons' },
]

export function Sidebar({
  open,
  onClose,
  totalValue,
  progress,
  questBadge,
  activeTab,
  onTab,
  onOpenSettings,
  onLogout,
}: SidebarProps) {
  const rank = getLevelInfo(progress.level)
  const bar = xpProgressInLevel(progress.xp)

  return (
    <>
      {/* Backdrop overlay */}
      <button
        type="button"
        onClick={onClose}
        className={`fixed inset-0 z-[100] bg-black/60 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-label="Close sidebar"
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[110] w-[280px] max-w-[85vw] bg-surface-900 border-r border-white/[0.08] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header section with Balance & XP details */}
          <div className="p-4 border-b border-white/[0.08] bg-surface-950/40 relative">
            <div className="flex items-center justify-end mb-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-surface-800 transition-colors text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-[10px] uppercase tracking-wider text-slate-500">Portfolio Balance</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-thriv-300 mt-1 leading-none">
              {formatCurrency(totalValue)}
            </p>

            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span className="font-mono font-bold text-thriv-400">Level {progress.level} ({rank.rankCode})</span>
                <span className="font-mono tabular-nums">{bar.current}/{bar.max} XP</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-850 ring-1 ring-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-thriv-700 to-thriv-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${bar.pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar Menu items */}
          <nav className="p-3 space-y-1">
            {ITEMS.map(({ id, label, icon: Icon, desc }) => {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onTab(id)
                    onClose()
                  }}
                  className={`w-full relative flex items-center gap-3 p-3 rounded-xl text-left transition-all border touch-manipulation min-h-[52px] cursor-pointer ${
                    active
                      ? 'bg-thriv-900/40 border-thriv-500/40 text-white font-semibold'
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5 text-thriv-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold">{label}</span>
                    <span className="block text-[10px] text-slate-500 font-normal truncate">{desc}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />
                  
                  {id === 'quests' && questBadge > 0 && (
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-surface-900 pulse-rewards">
                      {questBadge > 9 ? '9+' : questBadge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Footer Settings & Logout buttons */}
        <div className="p-4 border-t border-white/[0.08] bg-surface-950/20 space-y-2 shrink-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              onOpenSettings()
              onClose()
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-surface-800 hover:bg-surface-750 text-slate-200 py-2.5 text-xs font-semibold transition-all touch-manipulation min-h-[44px] cursor-pointer"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onLogout()
              onClose()
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/25 border border-red-900/20 hover:bg-red-950/40 text-red-400 py-2.5 text-xs font-semibold transition-all touch-manipulation min-h-[44px] cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
