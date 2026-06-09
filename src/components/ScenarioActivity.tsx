import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { SCENARIOS } from '../data/scenarios'
import { haptic } from '../lib/haptics'

interface ScenarioActivityProps {
  onBack: () => void
  onComplete: (xp: number) => void
  onAnswer?: (correct: boolean) => void
}

export function ScenarioActivity({ onBack, onComplete, onAnswer }: ScenarioActivityProps) {
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [xpEarned, setXpEarned] = useState(0)

  const scenario = SCENARIOS[index % SCENARIOS.length]

  function choose(xp: number, text: string) {
    const maxXP = Math.max(...scenario.choices.map((c) => c.xp))
    const isCorrect = xp === maxXP
    haptic(isCorrect ? 'success' : 'alert')
    
    if (onAnswer) {
      onAnswer(isCorrect)
    }

    setFeedback(text)
    setXpEarned(xp)
    onComplete(xp)
  }

  function next() {
    setFeedback(null)
    setXpEarned(0)
    if (index + 1 >= SCENARIOS.length) {
      setIndex(0)
    } else {
      setIndex((i) => i + 1)
    }
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="glass rounded-xl p-4 sm:p-6">
        <p className="text-xs text-thriv-400 font-mono">{scenario.symbol}</p>
        <h2 className="font-display text-lg sm:text-xl font-bold mt-1">{scenario.title}</h2>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed">{scenario.context}</p>
        {!feedback ? (
          <div className="mt-6 space-y-2">
            {scenario.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => choose(c.xp, c.feedback)}
                className="w-full rounded-xl border border-white/10 bg-surface-900 p-3 sm:p-4 text-left text-sm font-medium hover:border-thriv-500/50 touch-manipulation min-h-[48px]"
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-slate-300 leading-relaxed">{feedback}</p>
            <p className="mt-3 font-mono text-thriv-400">+{xpEarned} XP</p>
            <button
              type="button"
              onClick={next}
              className="mt-4 w-full rounded-lg bg-thriv-600 py-3 font-semibold touch-manipulation min-h-[48px]"
            >
              Next scenario
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-slate-600">
        Scenario {index + 1} of {SCENARIOS.length}
      </p>
    </div>
  )
}
