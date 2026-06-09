import { useEffect, useState } from 'react'
import { ArrowLeft, Check, X } from 'lucide-react'
import type { Sector, Stock } from '../types'
import { haptic } from '../lib/haptics'

const ROUNDS = 8

interface SectorSprintActivityProps {
  stocks: Stock[]
  onBack: () => void
  onComplete: (correct: number) => void
  onAnswer?: (correct: boolean) => void
}

export function SectorSprintActivity({ stocks, onBack, onComplete, onAnswer }: SectorSprintActivityProps) {
  const [rounds] = useState(() => {
    const shuffled = [...stocks].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
    return shuffled.map((s) => {
      const wrong = Array.from(
        new Set(
          stocks
            .filter((x) => x.sector !== s.sector)
            .map((x) => x.sector)
        )
      )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      const options = [s.sector, ...wrong].sort(() => Math.random() - 0.5)
      return { stock: s, options, answer: s.sector }
    })
  })

  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [picked, setPicked] = useState<Sector | null>(null)
  const [done, setDone] = useState(false)
  const [active, setActive] = useState(false)

  const round = rounds[idx]

  useEffect(() => {
    if (done || picked) return
    setActive(false)
    const frame = requestAnimationFrame(() => {
      setActive(true)
    })

    const timer = setTimeout(() => {
      pick('TIMEOUT' as any)
    }, 2000)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [idx, picked, done])

  function pick(sector: Sector) {
    if (picked || done) return
    setPicked(sector)
    const isTimeout = sector === ('TIMEOUT' as any)
    const ok = !isTimeout && sector === round.answer
    haptic(ok ? 'success' : 'alert')
    
    if (onAnswer) {
      onAnswer(ok)
    }

    const newCorrect = correct + (ok ? 1 : 0)
    setTimeout(() => {
      if (idx + 1 >= rounds.length) {
        setCorrect(newCorrect)
        setDone(true)
        onComplete(newCorrect)
      } else {
        setCorrect(newCorrect)
        setIdx((i) => i + 1)
        setPicked(null)
      }
    }, isTimeout ? 1000 : 2000)
  }

  if (done) {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="glass rounded-xl p-6 text-center border border-white/[0.06]">
          <p className="text-xs uppercase tracking-widest text-slate-500">Sector Sprint</p>
          <p className="mt-2 font-display text-2xl font-semibold">{correct} / {ROUNDS}</p>
          <p className="mt-2 text-sm text-slate-400">correct classifications</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <p className="text-xs text-slate-500 font-mono">
        Round {idx + 1} / {ROUNDS} · Score {correct}
      </p>
      <div className="glass rounded-xl p-5 border border-white/[0.06]">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Classify sector</p>
        <p className="mt-2 font-display text-xl font-semibold">{round.stock.symbol}</p>
        <p className="text-sm text-slate-400">{round.stock.name}</p>
        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-3 mb-1">
          <div 
            className={`bg-thriv-500 h-full transition-all ease-linear ${picked ? 'opacity-0' : ''}`}
            style={{
              width: active && !picked ? '0%' : '100%',
              transitionDuration: active && !picked ? '2000ms' : '0ms'
            }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {round.options.map((opt) => {
            let cls = 'border-white/10 bg-surface-900 hover:border-thriv-600/40'
            if (picked) {
              if (opt === round.answer) cls = 'border-emerald-500/40 bg-emerald-950/30'
              else if (opt === picked) cls = 'border-red-500/40 bg-red-950/30'
              else cls = 'opacity-40'
            }
            return (
              <button
                key={`${idx}-${opt}`}
                type="button"
                disabled={!!picked}
                onClick={() => pick(opt)}
                className={`rounded-lg border p-3 text-left text-xs font-medium touch-manipulation min-h-[48px] flex items-center justify-between ${cls}`}
              >
                {opt}
                {picked && opt === round.answer && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                {picked === opt && opt !== round.answer && <X className="h-3.5 w-3.5 text-red-400" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
