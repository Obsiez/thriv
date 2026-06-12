import {
  Activity,
  Briefcase,
  Home,
  LayoutGrid,
  MoreHorizontal,
} from 'lucide-react'
import type { TabId } from '../types'

interface MobileNavProps {
  activeTab: TabId
  onTab: (tab: TabId) => void
  onMoreClick: () => void
  questBadge?: number
}

const PRIMARY: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'market', label: 'Market', icon: LayoutGrid },
  { id: 'trade', label: 'Trade', icon: Activity },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
]

// watchlist-tracker is a sub-route of market — treat it as market for nav highlights
const PRIMARY_IDS = ['home', 'market', 'trade', 'portfolio', 'watchlist-tracker', 'macro-sandbox', 'options-sandbox']
const MARKET_SUBROUTES: TabId[] = ['watchlist-tracker', 'macro-sandbox', 'options-sandbox']

export function MobileNav({ activeTab, onTab, onMoreClick, questBadge = 0 }: MobileNavProps) {
  const isMoreActive = !PRIMARY_IDS.includes(activeTab)

  return (
    <nav
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-7 right-7 z-50 rounded-full border border-white/[0.08] apple-glass max-w-sm mx-auto md:hidden p-1.5 bg-surface-950/40 shadow-xl"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5 gap-1 w-full">
        {PRIMARY.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id || (id === 'market' && MARKET_SUBROUTES.includes(activeTab))
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`relative flex flex-col items-center justify-center py-[11px] rounded-full transition-colors cursor-pointer touch-manipulation ${
                active
                  ? 'bg-surface-800 text-thriv-400 font-semibold shadow-sm'
                  : 'text-slate-500 hover:text-slate-350 active:text-slate-300'
              }`}
            >
              <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2 : 1.75} />
              <span className="text-[9px] mt-0.5 scale-95 tracking-tight font-medium leading-none">{label}</span>
            </button>
          )
        })}
        
        {/* More Bottom Nav Button to open bottom menu sheet */}
        <button
          type="button"
          onClick={onMoreClick}
          className={`relative flex flex-col items-center justify-center py-[11px] rounded-full transition-colors cursor-pointer touch-manipulation ${
            isMoreActive
              ? 'bg-surface-800 text-thriv-400 font-semibold shadow-sm'
              : 'text-slate-500 hover:text-slate-350 active:text-slate-300'
          }`}
        >
          <MoreHorizontal className="h-[17px] w-[17px]" strokeWidth={isMoreActive ? 2 : 1.75} />
          <span className="text-[9px] mt-0.5 scale-95 tracking-tight font-medium leading-none">More</span>
          {questBadge > 0 && (
            <span className="absolute top-1.5 right-3 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-surface-900 shadow-sm pulse-rewards">
              {questBadge > 9 ? '9+' : questBadge}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
