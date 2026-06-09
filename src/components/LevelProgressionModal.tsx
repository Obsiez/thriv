import { useEffect } from 'react'
import {
  X,
  Flame,
  Zap,
  Trophy,
  BookOpen,
  Target,
  TrendingUp,
  Shield,
  Scale,
  Star,
  Palette,
  CheckCircle2,
  Newspaper,
  Gamepad2,
  Bell,
} from 'lucide-react'
import {
  getLevelInfo,
  TIER_STYLES,
  xpProgressInLevel,
} from '../lib/progression'
import type { PlayerProgress } from '../types'

interface LevelProgressionModalProps {
  open: boolean
  onClose: () => void
  progress: PlayerProgress
}

// Rephrase level perks into professional milestones/certifications to respect the Day 1 active platform state
const LEVEL_PERKS: Record<
  number,
  { title: string; desc: string; icon: React.ComponentType<{ className?: string }> }
> = {
  1: {
    title: 'Simulated Capital Baseline',
    desc: 'Authorized to trade 20 major equities with $100,000 baseline paper trading account.',
    icon: TrendingUp,
  },
  2: {
    title: 'Daily Objectives Access',
    desc: 'Certified to claim daily missions and earn additional active bonus reward XP.',
    icon: Target,
  },
  3: {
    title: 'Market Sentiment Competence',
    desc: 'Validated capability to interpret company news streams and understand sentiment metrics.',
    icon: Newspaper,
  },
  4: {
    title: 'Watchlist Customization',
    desc: 'Authorized to star active equities and build personalized comparison panels.',
    icon: Star,
  },
  5: {
    title: 'Visual Alert Officer',
    desc: 'Cleared to set custom thresholds and trigger price target alert feeds.',
    icon: Bell,
  },
  6: {
    title: 'Leveraged Capital Strategy',
    desc: 'Authorized to borrow virtual broker capital and practice simulated margin drills.',
    icon: Scale,
  },
  7: {
    title: 'Sector Sprint Pioneer',
    desc: 'Validated competence in dynamic fast-paced sector weight allocation runs.',
    icon: Gamepad2,
  },
  8: {
    title: 'Certified Risk Officer',
    desc: 'Certified in position sizing analytics and advanced capital drawdowns risk control.',
    icon: Shield,
  },
  9: {
    title: 'Theme Customization Authority',
    desc: 'Unlocked elite visual customization privileges to edit profile accent colors in settings.',
    icon: Palette,
  },
  10: {
    title: 'Thriv Fellow Prestige Badge',
    desc: 'Conferred with ultimate fellow standing, unique visual badge, and elite leaderboard status.',
    icon: Trophy,
  },
}

export function LevelProgressionModal({ open, onClose, progress }: LevelProgressionModalProps) {
  // Disable background scrolling when modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [open])

  if (!open) return null

  const bar = xpProgressInLevel(progress.xp)
  const currentInfo = getLevelInfo(progress.level)
  const currentTier = TIER_STYLES[currentInfo.tier]

  // Calculate stats to display
  const completedMissions = progress.quests.filter((q) => q.completed).length
  const activitiesPlayed = progress.stats.activitiesPlayed ?? 0

  return (
    <>
      {/* Backdrop (Desktop Only) */}
      <button
        type="button"
        className="hidden md:block fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm transition-opacity"
        aria-label="Close progression"
        onClick={onClose}
      />

      {/* Modal Viewport (Mobile: Full screen / Desktop: Centered dialog box) */}
      <div className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 z-[90] flex w-full md:w-[calc(100%-2rem)] md:max-w-[1002px] md:-translate-x-1/2 md:-translate-y-1/2 flex-col bg-surface-900 border-0 md:border md:border-white/[0.08] md:rounded-2xl shadow-2xl overflow-hidden h-full md:h-[770px] md:max-h-[85vh] pb-[env(safe-area-inset-bottom)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 md:px-6 md:py-5 shrink-0 bg-surface-950/40">
          <div>
            <h2 className="font-display font-semibold text-base md:text-xl tracking-tight text-white">Level Progression</h2>
            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Track your milestones and professional certifications</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg hover:bg-surface-800 transition-colors text-slate-400 hover:text-white touch-manipulation cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5 md:h-5 md:w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Contents Grid (Desktop: Equal 50/50 split / Mobile: Stacked) */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
            
            {/* ── LEFT COLUMN: Spacious Hero Banner Card & Stats Metrics Grid ── */}
            <div className="space-y-6 md:sticky md:top-0">
              
              {/* Hero Level Banner Card */}
              <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-surface-800/80 to-surface-900/90 p-4 md:p-6">
                <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${currentTier.ring}`} />
                
                <div className="relative flex items-center gap-4 md:gap-5">
                  <div className="relative shrink-0">
                    <div
                      className={`absolute -inset-1 rounded-2xl bg-gradient-to-br opacity-50 blur-sm ${currentTier.ring} animate-pulse`}
                    />
                    <div
                      className={`relative flex h-14 w-14 md:h-20 md:w-20 flex-col items-center justify-center rounded-xl border font-mono ${currentTier.badge}`}
                    >
                      <span className="text-[8px] md:text-[10px] uppercase tracking-widest opacity-60">Rank</span>
                      <span className="text-xs md:text-lg font-bold leading-none mt-0.5 md:mt-1">{currentInfo.rankCode}</span>
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className={`text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] ${currentTier.accent}`}>
                      {currentInfo.tierLabel}
                    </p>
                    <h3 className="font-display text-base md:text-2xl font-semibold text-white truncate mt-0.5 md:mt-1.5">
                      {currentInfo.title}
                    </h3>
                    <p className="text-[10px] md:text-sm text-slate-400 mt-0.5 md:mt-2">
                      Level {currentInfo.level} ·{' '}
                      <span className="font-mono text-slate-300">{progress.xp.toLocaleString()}</span> XP
                    </p>
                  </div>

                  {progress.streak > 0 && (
                    <div className="flex items-center gap-1 shrink-0 rounded-lg border border-amber-500/10 bg-amber-950/20 px-2.5 py-1 md:px-3 md:py-1.5">
                      <Flame className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 text-amber-500 animate-pulse" strokeWidth={2} />
                      <span className="text-xs md:text-sm font-semibold font-mono text-amber-300">
                        {progress.streak}d
                      </span>
                    </div>
                  )}
                </div>

                {/* Level Up Progress Bar */}
                <div className="relative mt-4 md:mt-6">
                  <div className="flex justify-between text-[9px] md:text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">
                    <span>XP progress to Level {currentInfo.level + 1}</span>
                    <span className="font-mono text-slate-300 tracking-normal normal-case">
                      {bar.current} / {bar.max} XP
                    </span>
                  </div>
                  <div className="relative h-2 md:h-2.5 overflow-hidden rounded-full bg-surface-950/70 ring-1 ring-white/5">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${currentTier.ring}`}
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats Metrics Dashboard Grid */}
              <div className="rounded-xl border border-white/[0.06] bg-surface-800/25 p-4 md:p-6">
                <h4 className="mb-3 md:mb-4 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Progression Metrics
                </h4>
                <div className="grid grid-cols-3 gap-2.5 md:gap-3.5">
                  
                  <div className="rounded-xl border border-white/[0.04] bg-surface-900/50 p-2.5 md:p-3.5 text-center">
                    <div className="mx-auto flex h-7.5 w-7.5 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-surface-950 text-thriv-400">
                      <Target className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 font-medium leading-none">Missions</p>
                    <p className="font-mono text-sm md:text-2xl font-bold text-slate-200 mt-1 md:mt-1.5">{completedMissions}</p>
                  </div>

                  <div className="rounded-xl border border-white/[0.04] bg-surface-900/50 p-2.5 md:p-3.5 text-center">
                    <div className="mx-auto flex h-7.5 w-7.5 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-surface-950 text-indigo-400">
                      <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 font-medium leading-none">Quizzers</p>
                    <p className="font-mono text-sm md:text-2xl font-bold text-slate-200 mt-1 md:mt-1.5">{progress.quizzersCount ?? 0}</p>
                  </div>

                  <div className="rounded-xl border border-white/[0.04] bg-surface-900/50 p-2.5 md:p-3.5 text-center">
                    <div className="mx-auto flex h-7.5 w-7.5 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-surface-950 text-amber-400">
                      <Trophy className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 font-medium leading-none">Credentials</p>
                    <p className="font-mono text-sm md:text-2xl font-bold text-slate-200 mt-1 md:mt-1.5">
                      {progress.achievements.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/[0.04] bg-surface-900/50 p-2.5 md:p-3.5 text-center">
                    <div className="mx-auto flex h-7.5 w-7.5 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-surface-950 text-emerald-400">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 font-medium leading-none">Games Played</p>
                    <p className="font-mono text-sm md:text-2xl font-bold text-slate-200 mt-1 md:mt-1.5">
                      {activitiesPlayed}
                    </p>
                  </div>



                  <div className="rounded-xl border border-white/[0.04] bg-surface-900/50 p-2.5 md:p-3.5 text-center">
                    <div className="mx-auto flex h-7.5 w-7.5 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-surface-950 text-violet-400">
                      <Shield className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 font-medium leading-none">Scenarios</p>
                    <p className="font-mono text-sm md:text-2xl font-bold text-slate-200 mt-1 md:mt-1.5">{progress.scenariosCompleted}</p>
                  </div>

                  <div className="rounded-xl border border-white/[0.04] bg-surface-900/50 p-2.5 md:p-3.5 text-center">
                    <div className="mx-auto flex h-7.5 w-7.5 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-surface-950 text-slate-400">
                      <Zap className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 font-medium leading-none">Calculators</p>
                    <p className="font-mono text-sm md:text-2xl font-bold text-slate-200 mt-1 md:mt-1.5">{progress.positionSizerUses}</p>
                  </div>

                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: Redesigned Minimal & Center-Aligned Timeline Roadmap ── */}
            <div className="space-y-4">
              <h4 className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-500">
                Milestones & Perks Roadmap
              </h4>
              
              <div className="flex flex-col gap-3.5">
                {Array.from({ length: 10 }).map((_, index) => {
                  const lvlNum = index + 1
                  const lvlInfo = getLevelInfo(lvlNum)
                  const lvlTier = TIER_STYLES[lvlInfo.tier]
                  const perk = LEVEL_PERKS[lvlNum]
                  const PerkIcon = perk.icon

                  // Calculate status states
                  const isCompleted = lvlNum < progress.level
                  const isCurrent = lvlNum === progress.level
                  const isLocked = lvlNum > progress.level

                  return (
                    <div key={lvlNum} className="flex items-center gap-3.5">
                      
                      {/* Left side node container: split lines & vertically centered node */}
                      <div className="flex flex-col items-center shrink-0 self-stretch w-8 md:w-12">
                        {/* Top Line segment */}
                        <div className={`w-px flex-1 bg-white/[0.06] ${lvlNum === 1 ? 'invisible' : ''}`} />
                        
                        {/* Perfect Minimal Node Circle/Checkbox */}
                        <div
                          className={`flex items-center justify-center transition-all shrink-0 z-10 ${
                            isCompleted
                              ? 'h-6 w-6 md:h-6 md:w-6 border-0 bg-transparent text-emerald-400' // Minimal borderless checkmark look
                              : isCurrent
                              ? `h-5 w-5 md:h-6 md:w-6 border-2 border-thriv-500 bg-surface-950 text-thriv-300 font-bold shadow-[0_0_10px_rgba(20,184,150,0.35)] scale-105 rounded-full` // Perfect circular badge with current lvl
                              : 'h-6 w-6 md:h-8.5 md:w-8.5 border border-white/10 bg-surface-950 text-slate-600 rounded-full' // Locked: simple circle with number inside
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 shrink-0 text-emerald-400" />
                          ) : (
                            <span className="font-mono text-[9px] md:text-xs leading-none">
                              {lvlNum}
                            </span>
                          )}
                        </div>
                        
                        {/* Bottom Line segment */}
                        <div className={`w-px flex-1 bg-white/[0.06] ${lvlNum === 10 ? 'invisible' : ''}`} />
                      </div>

                      {/* Right side detail card */}
                      <div
                        className={`flex-1 rounded-xl border p-3 md:p-4 transition-all duration-200 ${
                          isCurrent
                            ? 'border-thriv-600/30 bg-surface-800/80 shadow-[0_0_12px_rgba(20,184,150,0.06)]'
                            : isCompleted
                            ? 'border-white/[0.04] bg-surface-900/40 opacity-85 hover:opacity-100'
                            : 'border-white/[0.03] bg-surface-950/20 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 md:gap-2.5">
                            <span
                              className={`rounded px-1.5 py-0.5 font-mono text-[8px] md:text-[10px] font-semibold leading-none border ${lvlTier.badge}`}
                            >
                              {lvlInfo.rankCode}
                            </span>
                            <span className="font-display text-xs md:text-sm font-semibold text-slate-100">
                              {lvlInfo.title}
                            </span>
                          </div>
                          <span className="font-mono text-[9px] md:text-xs text-slate-500">
                            Lv.{lvlNum}
                          </span>
                        </div>

                        {/* Perk description details */}
                        <div className="mt-2.5 flex items-start gap-2.5 md:gap-3">
                          <span className={`flex h-7 w-7 md:h-8.5 md:w-8.5 shrink-0 items-center justify-center rounded-lg border border-white/[0.04] bg-surface-950 ${isLocked ? 'text-slate-600' : 'text-slate-300'}`}>
                            <PerkIcon className="h-3.5 w-3.5 md:h-4.5 md:w-4.5" />
                          </span>
                          <div>
                            <p className="text-[10px] md:text-xs font-semibold text-slate-300 leading-tight">
                              {perk.title}
                            </p>
                            <p className="text-[9px] md:text-[10.5px] text-slate-500 leading-relaxed mt-0.5 md:mt-1">
                              {perk.desc}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Footer sticky close bar */}
        <div className="border-t border-white/[0.06] p-4 shrink-0 bg-surface-950/40">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white py-3 text-xs md:text-sm font-semibold text-slate-300 transition-colors touch-manipulation min-h-[44px] cursor-pointer"
          >
            Acknowledge
          </button>
        </div>

      </div>
    </>
  )
}
