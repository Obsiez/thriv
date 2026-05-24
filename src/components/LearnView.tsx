import { BookOpen, GraduationCap, Trophy } from 'lucide-react'
import { GLOSSARY, LESSONS } from '../data/glossary'

interface LearnViewProps {
  onStartQuest?: () => void
}

export function LearnView({ onStartQuest }: LearnViewProps) {
  return (
    <div className="space-y-8">
      {onStartQuest && (
        <button
          type="button"
          onClick={onStartQuest}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-thriv-600/40 bg-thriv-900/40 py-4 font-display font-semibold text-sm sm:text-base touch-manipulation min-h-[52px] hover:border-thriv-500/50"
        >
          <Trophy className="h-5 w-5 text-thriv-400" strokeWidth={1.75} />
          Open mission board
        </button>
      )}

      <div className="glass rounded-xl border-thriv-800/50 p-4 sm:p-6 glow-green">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-thriv-900/50 p-3">
            <GraduationCap className="h-8 w-8 text-thriv-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Welcome to Thriv Academy</h2>
            <p className="mt-2 text-slate-400 leading-relaxed">
              Thriv is a <strong className="text-thriv-300">paper trading</strong> simulator. Prices
              mimic real major brands (Apple, Microsoft, NVIDIA, and more) with live-style updates—no
              real money is involved. Practice reading markets, placing orders, and managing a
              portfolio before risking capital in the real world.
            </p>
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <BookOpen className="h-5 w-5 text-thriv-400" />
          Quick lessons
        </h3>
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {LESSONS.map((lesson, i) => (
            <article key={lesson.title} className="glass rounded-xl p-5">
              <span className="text-xs font-bold text-thriv-500">Lesson {i + 1}</span>
              <h4 className="mt-1 font-display font-semibold">{lesson.title}</h4>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{lesson.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-4 font-display text-lg font-semibold">Glossary</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="glass rounded-lg p-4">
              <dt className="font-semibold text-thriv-300">{g.term}</dt>
              <dd className="mt-1 text-sm text-slate-400">{g.definition}</dd>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-sm text-amber-200/90">
        <strong>Disclaimer:</strong> Simulated prices are for education only. They do not constitute
        financial advice, investment recommendations, or real-time exchange data. Past simulated
        performance does not predict future results.
      </div>
    </div>
  )
}
