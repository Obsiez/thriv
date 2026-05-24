import { BookOpen, ListOrdered, Newspaper, Sparkles, X } from 'lucide-react'
import type { TabId } from '../types'

interface MoreMenuProps {
  open: boolean
  onClose: () => void
  onTab: (tab: TabId) => void
}

const ITEMS: { id: TabId; label: string; icon: typeof Newspaper; desc: string }[] = [
  { id: 'activities', label: 'Activities', icon: Sparkles, desc: 'Quizzes & mini-games' },
  { id: 'news', label: 'News', icon: Newspaper, desc: 'Market headlines' },
  { id: 'orders', label: 'Orders', icon: ListOrdered, desc: 'Trade history' },
  { id: 'learn', label: 'Learn', icon: BookOpen, desc: 'Glossary & lessons' },
]

export function MoreMenu({ open, onClose, onTab }: MoreMenuProps) {
  if (!open) return null
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/60 md:hidden"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl border-t border-white/10 bg-surface-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden animate-in slide-in-from-bottom">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display font-semibold">More</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-surface-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ITEMS.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onTab(id)
                onClose()
              }}
              className="flex flex-col items-start gap-1 rounded-xl border border-white/5 bg-surface-900 p-4 text-left active:bg-surface-700 touch-manipulation min-h-[72px]"
            >
              <Icon className="h-5 w-5 text-thriv-400" />
              <span className="font-medium text-sm">{label}</span>
              <span className="text-[10px] text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
