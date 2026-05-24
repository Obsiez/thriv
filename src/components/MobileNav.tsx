import {
  Activity,
  Briefcase,
  Gamepad2,
  Home,
  LayoutGrid,
  MoreHorizontal,
} from 'lucide-react'
import type { TabId } from '../types'

interface MobileNavProps {
  activeTab: TabId
  onTab: (tab: TabId) => void
  onMore: () => void
  questBadge?: number
}

const PRIMARY: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'market', label: 'Market', icon: LayoutGrid },
  { id: 'trade', label: 'Trade', icon: Activity },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'quests', label: 'Quests', icon: Gamepad2 },
]

export function MobileNav({ activeTab, onTab, onMore, questBadge = 0 }: MobileNavProps) {
  const moreActive = ['activities', 'news', 'orders', 'learn'].includes(activeTab)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-surface-900/98 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {PRIMARY.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`relative flex min-h-[52px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 touch-manipulation ${
                active ? 'text-thriv-400' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {id === 'quests' && questBadge > 0 && (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-surface-900">
                  {questBadge > 9 ? '9+' : questBadge}
                </span>
              )}
            </button>
          )
        })}
        <button
          type="button"
          onClick={onMore}
          className={`relative flex min-h-[52px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 touch-manipulation ${
            moreActive ? 'text-thriv-400' : 'text-slate-500'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive ? 2.5 : 2} />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  )
}
