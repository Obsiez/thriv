import { useEffect, useState } from 'react'
import { Award, Zap } from 'lucide-react'

interface CelebrationToastProps {
  message: string | null
}

type Phase = 'hidden' | 'enter' | 'visible' | 'exit'

export function CelebrationToast({ message }: CelebrationToastProps) {
  const [display, setDisplay] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('hidden')

  useEffect(() => {
    if (!message) return

    setDisplay(message)
    setPhase('enter')
    const enterDone = setTimeout(() => setPhase('visible'), 30)
    const hold = setTimeout(() => setPhase('exit'), 2600)
    const done = setTimeout(() => {
      setDisplay(null)
      setPhase('hidden')
    }, 2920)

    return () => {
      clearTimeout(enterDone)
      clearTimeout(hold)
      clearTimeout(done)
    }
  }, [message])

  if (!display || phase === 'hidden') return null

  const isAchievement = display.toLowerCase().includes('achievement')
  const Icon = isAchievement ? Award : Zap

  return (
    <div
      className="toast-viewport pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      role="status"
      aria-live="polite"
    >
      <div
        className={`toast-banner flex w-full max-w-sm items-center gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-md ${
          isAchievement
            ? 'border-amber-500/25 bg-surface-900/98'
            : 'border-thriv-600/30 bg-surface-900/98'
        } ${phase === 'enter' ? 'toast-enter' : ''} ${phase === 'visible' ? 'toast-visible' : ''} ${
          phase === 'exit' ? 'toast-exit' : ''
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
            isAchievement
              ? 'border-amber-500/30 bg-amber-950/40 text-amber-400'
              : 'border-thriv-600/35 bg-thriv-950/50 text-thriv-400'
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <p className="min-w-0 flex-1 font-display text-sm font-medium leading-snug text-slate-100">
          {display}
        </p>
      </div>
    </div>
  )
}
