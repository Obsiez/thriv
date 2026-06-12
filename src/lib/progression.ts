export type RankTier = 'associate' | 'analyst' | 'strategist' | 'principal'

export interface LevelInfo {
  level: number
  title: string
  rankCode: string
  tier: RankTier
  tierLabel: string
  nextTitle: string | null
}

// Cumulative XP thresholds to unlock each level (Level 1 starts at 0 XP)
export const LEVEL_THRESHOLDS = [
  0,       // Level 1
  300,     // Level 2 (requires 300 XP total)
  800,     // Level 3 (requires 800 XP total)
  1500,    // Level 4 (requires 1,500 XP total)
  2500,    // Level 5 (requires 2,500 XP total)
  4000,    // Level 6 (requires 4,000 XP total)
  6000,    // Level 7 (requires 6,000 XP total)
  8500,    // Level 8 (requires 8,500 XP total)
  11500,   // Level 9 (requires 11,500 XP total)
  15000,   // Level 10 (requires 15,000 XP total)
]

const TITLES: { title: string; rankCode: string; tier: RankTier; tierLabel: string }[] = [
  { title: 'Market Associate I', rankCode: 'MA-I', tier: 'associate', tierLabel: 'Associate Track' },
  { title: 'Market Associate II', rankCode: 'MA-II', tier: 'associate', tierLabel: 'Associate Track' },
  { title: 'Junior Analyst', rankCode: 'JA', tier: 'analyst', tierLabel: 'Analyst Track' },
  { title: 'Equity Analyst', rankCode: 'EA', tier: 'analyst', tierLabel: 'Analyst Track' },
  { title: 'Senior Analyst', rankCode: 'SA', tier: 'analyst', tierLabel: 'Analyst Track' },
  { title: 'Portfolio Strategist', rankCode: 'PS', tier: 'strategist', tierLabel: 'Strategist Track' },
  { title: 'Lead Strategist', rankCode: 'LS', tier: 'strategist', tierLabel: 'Strategist Track' },
  { title: 'Market Director', rankCode: 'MD', tier: 'strategist', tierLabel: 'Strategist Track' },
  { title: 'Principal Trader', rankCode: 'PT', tier: 'principal', tierLabel: 'Principal Track' },
  { title: 'Thriv Fellow', rankCode: 'TF', tier: 'principal', tierLabel: 'Principal Track' },
]

export function levelFromXp(xp: number): number {
  let lvl = 1
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      lvl = i + 1
    } else {
      break
    }
  }
  return Math.min(10, lvl)
}

export function xpProgressInLevel(xp: number): { current: number; max: number; pct: number } {
  const level = levelFromXp(xp)
  if (level >= 10) {
    const max = 2000 // Reference max for Level 10 capped display
    return { current: max, max, pct: 100 }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1]
  const nextThreshold = LEVEL_THRESHOLDS[level]
  const max = nextThreshold - currentThreshold
  const current = xp - currentThreshold
  return { current, max, pct: Math.min(100, (current / max) * 100) }
}

export function getLevelInfo(level: number): LevelInfo {
  const idx = Math.min(level - 1, TITLES.length - 1)
  const cur = TITLES[idx]
  const next = TITLES[idx + 1]
  return {
    level,
    title: cur.title,
    rankCode: cur.rankCode,
    tier: cur.tier,
    tierLabel: cur.tierLabel,
    nextTitle: next?.title ?? null,
  }
}

export function titleForLevel(level: number): string {
  return getLevelInfo(level).title
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export const TIER_STYLES: Record<
  RankTier,
  { ring: string; badge: string; accent: string; label: string }
> = {
  associate: {
    ring: 'from-slate-500/40 to-slate-600/20',
    badge: 'bg-slate-800/90 border-slate-500/30 text-slate-200',
    accent: 'text-slate-400',
    label: 'Associate',
  },
  analyst: {
    ring: 'from-thriv-600/50 to-thriv-800/30',
    badge: 'bg-thriv-950/80 border-thriv-600/40 text-thriv-200',
    accent: 'text-thriv-400',
    label: 'Analyst',
  },
  strategist: {
    ring: 'from-indigo-500/40 to-violet-800/30',
    badge: 'bg-indigo-950/60 border-indigo-500/35 text-indigo-200',
    accent: 'text-indigo-400',
    label: 'Strategist',
  },
  principal: {
    ring: 'from-amber-500/45 to-amber-800/25',
    badge: 'bg-amber-950/50 border-amber-500/40 text-amber-100',
    accent: 'text-amber-400',
    label: 'Principal',
  },
}
