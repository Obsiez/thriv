import { useState } from 'react'
import { ArrowLeft, Check, GraduationCap, X, XCircle } from 'lucide-react'
import { ADVANCED_QUIZ, BASICS_QUIZ } from '../data/quizzes'
import type { QuizQuestion } from '../types'
import { haptic } from '../lib/haptics'

interface QuizActivityProps {
  quizId: string
  title: string
  questionsKey?: 'basics' | 'advanced'
  onBack: () => void
  onComplete: (scorePct: number) => void
  onCorrectAnswer?: () => void
  onAnswer?: (correct: boolean) => void
}

export function QuizActivity({
  title,
  questionsKey = 'basics',
  onBack,
  onComplete,
  onCorrectAnswer,
  onAnswer,
}: QuizActivityProps) {
  const questions: QuizQuestion[] = questionsKey === 'advanced' ? ADVANCED_QUIZ : BASICS_QUIZ
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  const q = questions[index]

  function pick(i: number) {
    if (picked !== null) return
    const correct = i === q.correctIndex
    haptic(correct ? 'success' : 'alert')
    const newScore = score + (correct ? 1 : 0)
    setPicked(i)
    setScore(newScore)

    if (onAnswer) {
      onAnswer(correct)
    }

    if (correct && onCorrectAnswer) {
      onCorrectAnswer()
    }

    setTimeout(() => {
      if (index + 1 >= questions.length) {
        const pct = (newScore / questions.length) * 100
        setDone(true)
        onComplete(pct)
      } else {
        setIndex((x) => x + 1)
        setPicked(null)
      }
    }, 1200)
  }

  if (done) {
    const finalPct = (score / questions.length) * 100
    const passed = finalPct >= 80
    return (
      <div className="space-y-4">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className={`glass rounded-2xl p-6 sm:p-8 text-center border border-white/[0.06] ${passed ? 'border-thriv-600/30' : ''}`}>
          <span className={`inline-flex h-14 w-14 items-center justify-center rounded-xl border mb-3 ${passed ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400' : 'border-white/10 bg-surface-900 text-slate-400'}`}>
            {passed ? <GraduationCap className="h-7 w-7" strokeWidth={1.5} /> : <XCircle className="h-7 w-7" strokeWidth={1.5} />}
          </span>
          <h2 className="font-display text-xl font-semibold">
            {passed ? 'Passed!' : 'Keep practicing'}
          </h2>
          <p className="mt-2 font-mono text-2xl text-thriv-300">{Math.round(finalPct)}%</p>
          <p className="mt-2 text-sm text-slate-400">
            {score}/{questions.length} correct · Need 80% to pass
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 touch-manipulation min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{title}</span>
        <span>
          {index + 1}/{questions.length}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-800">
        <div
          className="h-full bg-thriv-500 transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>
      <div className="glass rounded-xl p-4 sm:p-6">
        <p className="font-display text-base sm:text-lg font-semibold leading-snug">{q.question}</p>
        <div className="mt-4 space-y-2">
          {q.options.map((opt, i) => {
            let style = 'border-white/10 bg-surface-900 hover:border-thriv-600/50'
            if (picked !== null) {
              if (i === q.correctIndex) style = 'border-emerald-500/50 bg-emerald-950/40'
              else if (i === picked) style = 'border-red-500/50 bg-red-950/40'
              else style = 'opacity-50'
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={picked !== null}
                onClick={() => pick(i)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border p-3 sm:p-4 text-left text-sm touch-manipulation min-h-[48px] ${style}`}
              >
                <span>{opt}</span>
                {picked !== null && i === q.correctIndex && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                {picked === i && i !== q.correctIndex && <X className="h-4 w-4 text-red-400 shrink-0" />}
              </button>
            )
          })}
        </div>
        {picked !== null && (
          <p className="mt-4 text-sm text-slate-400 border-t border-white/5 pt-4">{q.explanation}</p>
        )}
      </div>
    </div>
  )
}
