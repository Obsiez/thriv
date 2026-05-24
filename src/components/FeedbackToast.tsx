import { useEffect, useState } from 'react'
import { AlertCircle, Award, TrendingDown, Zap } from 'lucide-react'

export type FeedbackTone = 'win' | 'loss' | 'neutral' | 'achievement'

export interface FeedbackMessage {
  text: string
  tone: FeedbackTone
}

interface FeedbackToastProps {
  message: FeedbackMessage | null
}

type Phase = 'hidden' | 'enter' | 'visible' | 'exit'

export function FeedbackToast({ message }: FeedbackToastProps) {
  const [display, setDisplay] = useState<FeedbackMessage | null>(null)
  const [phase, setPhase] = useState<Phase>('hidden')

  useEffect(() => {
    if (!message) return

    setDisplay(message)
    setPhase('enter')
    const enterDone = setTimeout(() => setPhase('visible'), 30)
    const hold = setTimeout(() => setPhase('exit'), message.tone === 'loss' ? 3400 : 2600)
    const done = setTimeout(() => {
      setDisplay(null)
      setPhase('hidden')
    }, message.tone === 'loss' ? 3760 : 2920)

    return () => {
      clearTimeout(enterDone)
      clearTimeout(hold)
      clearTimeout(done)
    }
  }, [message])

  if (!display || phase === 'hidden') return null

  const styles: Record<FeedbackTone, { border: string; bg: string; icon: typeof Zap; iconBox: string }> = {
    win: {
      border: 'border-thriv-600/30',
      bg: 'bg-surface-900/98',
      icon: Zap,
      iconBox: 'border-thriv-600/35 bg-thriv-950/50 text-thriv-400',
    },
    loss: {
      border: 'border-red-500/35',
      bg: 'bg-red-950/90',
      icon: TrendingDown,
      iconBox: 'border-red-500/40 bg-red-950/60 text-red-400',
    },
    neutral: {
      border: 'border-white/10',
      bg: 'bg-surface-900/98',
      icon: AlertCircle,
      iconBox: 'border-white/10 bg-surface-800 text-slate-400',
    },
    achievement: {
      border: 'border-amber-500/25',
      bg: 'bg-surface-900/98',
      icon: Award,
      iconBox: 'border-amber-500/30 bg-amber-950/40 text-amber-400',
    },
  }

  const s = styles[display.tone]
  const Icon = s.icon

  return (
    <div
      className="toast-viewport pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
      role="status"
      aria-live={display.tone === 'loss' ? 'assertive' : 'polite'}
    >
      <div
        className={`toast-banner flex w-full max-w-sm items-center gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-md ${s.border} ${s.bg} ${
          phase === 'enter' ? 'toast-enter' : ''
        } ${phase === 'visible' ? 'toast-visible' : ''} ${phase === 'exit' ? 'toast-exit' : ''} ${
          display.tone === 'loss' ? 'loss-shake' : ''
        }`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${s.iconBox}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <p className="min-w-0 flex-1 font-display text-sm font-medium leading-snug text-slate-100">
          {display.text}
        </p>
      </div>
    </div>
  )
}
