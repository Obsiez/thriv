import { ArrowRight, X } from 'lucide-react'
import { Logo } from './Logo'

interface WelcomeModalProps {
  open: boolean
  displayName: string
  onClose: () => void
}

export function WelcomeModal({ open, displayName, onClose }: WelcomeModalProps) {
  if (!open) return null

  const steps = [
    { title: 'Home', desc: 'Track rank, daily objectives, and market pulse.' },
    { title: 'Market & Trade', desc: 'Paper trade 20 major stocks with live-style prices.' },
    { title: 'Missions & Activities', desc: 'Earn XP through quests, quizzes, and drills.' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.08] bg-surface-900 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 hover:bg-surface-800"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6 sm:p-8">
          <Logo size="md" />
          <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">
            Welcome{displayName ? `, ${displayName}` : ''}
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Your analyst account is ready. You start with $100,000 in simulated capital.
          </p>
          <ul className="mt-6 space-y-3">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-thriv-700/40 bg-thriv-950/50 font-mono text-[10px] text-thriv-400">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-200">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onClose}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-thriv-700 py-3.5 text-sm font-semibold hover:bg-thriv-600 touch-manipulation min-h-[48px]"
          >
            Enter platform
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </>
  )
}
