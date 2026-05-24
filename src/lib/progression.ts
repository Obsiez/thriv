export const XP_PER_LEVEL = 300

export type RankTier = 'associate' | 'analyst' | 'strategist' | 'principal'

export interface LevelInfo {
  level: number
  title: string
  rankCode: string
  tier: RankTier
  tierLabel: string
  nextTitle: string | null
}

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
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function xpProgressInLevel(xp: number): { current: number; max: number; pct: number } {
  const level = levelFromXp(xp)
  const start = (level - 1) * XP_PER_LEVEL
  const current = xp - start
  return { current, max: XP_PER_LEVEL, pct: Math.min(100, (current / XP_PER_LEVEL) * 100) }
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
