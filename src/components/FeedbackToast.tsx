import { useEffect, useState, useRef, useCallback } from 'react'
import { AlertCircle, Award, TrendingDown, Zap, X } from 'lucide-react'

export type FeedbackTone = 'win' | 'loss' | 'neutral' | 'achievement'

export interface FeedbackMessage {
  text: string
  tone: FeedbackTone
}

interface FeedbackToastProps {
  message: FeedbackMessage | null
}

type Phase = 'hidden' | 'enter' | 'visible' | 'exit' | 'swipe-exit'

export function FeedbackToast({ message }: FeedbackToastProps) {
  const [display, setDisplay] = useState<FeedbackMessage | null>(null)
  const [phase, setPhase] = useState<Phase>('hidden')

  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismissToast = useCallback((isSwipe = false) => {
    if (phase !== 'visible' && phase !== 'enter') return

    // Clear auto-dismiss timers
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current)

    if (isSwipe) {
      setPhase('swipe-exit')
      doneTimerRef.current = setTimeout(() => {
        setDisplay(null)
        setPhase('hidden')
      }, 120) // 120ms matches the swipe-exit transition duration
    } else {
      setPhase('exit')
      doneTimerRef.current = setTimeout(() => {
        setDisplay(null)
        setPhase('hidden')
      }, 300) // 300ms matches the exit transition duration
    }
  }, [phase])

  useEffect(() => {
    if (!message) return

    // Clear any active timers
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current)

    setDisplay(message)
    setPhase('enter')
    
    enterTimerRef.current = setTimeout(() => setPhase('visible'), 30)

    const holdDuration = message.tone === 'loss' ? 3400 : 2600
    const doneDuration = message.tone === 'loss' ? 3760 : 2920

    holdTimerRef.current = setTimeout(() => {
      setPhase('exit')
    }, holdDuration)

    doneTimerRef.current = setTimeout(() => {
      setDisplay(null)
      setPhase('hidden')
    }, doneDuration)

    return () => {
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current)
    }
  }, [message])

  // Swipe-to-dismiss support for mobile
  const touchStartY = useRef<number | null>(null)
  const touchEndY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY
    if (e.cancelable) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (touchStartY.current === null || touchEndY.current === null) return
    const diffY = touchStartY.current - touchEndY.current
    // Swipe up threshold: 50px
    if (diffY > 50) {
      dismissToast(true)
    }
    touchStartY.current = null
    touchEndY.current = null
  }

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
        className={`toast-banner pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border px-4 py-3 shadow-xl backdrop-blur-md ${s.border} ${s.bg} ${
          phase === 'enter' ? 'toast-enter' : ''
        } ${phase === 'visible' ? 'toast-visible' : ''} ${
          phase === 'swipe-exit' ? 'toast-swipe-exit' : phase === 'exit' ? 'toast-exit' : ''
        } ${display.tone === 'loss' ? 'loss-shake' : ''}`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${s.iconBox}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <p className="min-w-0 flex-1 font-display text-sm font-medium leading-snug text-slate-100">
          {display.text}
        </p>
        <button
          type="button"
          onClick={() => dismissToast(false)}
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors focus:outline-none touch-manipulation cursor-pointer"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
