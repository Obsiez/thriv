import { ACHIEVEMENTS } from '../data/achievements'
import type { AchievementDef } from '../types'

/** Ordered ladder — highest unlocked entry is the one credential shown. */
export const CREDENTIAL_LADDER: string[] = [
  'trades-10',
  'streak-3',
  'lesson-first-loss',
  'level-5',
  'quests-5',
  'risk-aware',
  'profit-5pct',
  'chart-explorer',
  'lesson-margin',
  'trades-25',
  'streak-7',
  'scenarios-5',
  'sprint-master',
  'flash-hot',
  'lesson-drawdown',
  'lesson-panic-sell',
  'level-10',
  'lesson-liquidated',
  'quests-all',
  
  // New Progression & Sizing achievements
  'leverage-master',
  'diversification-guru',
  'diamond-hands',
  'predictor-oracle',
  'apex-trader',
  'perfect-score',
  
  // Profit milestones (highest honors)
  'profit-milestone-50k',
  'profit-milestone-100k',
  'profit-milestone-200k',
  'profit-milestone-500k',
  'profit-milestone-1M',
]

export function getActiveCredential(achievementIds: string[]): AchievementDef | null {
  let active: AchievementDef | null = null
  for (const id of CREDENTIAL_LADDER) {
    if (achievementIds.includes(id)) {
      active = ACHIEVEMENTS.find((a) => a.id === id) ?? active
    }
  }
  return active
}

/** Player pick, or highest ladder badge if none / invalid. */
export function getDisplayedCredential(
  achievementIds: string[],
  displayCredentialId?: string | null
): AchievementDef | null {
  if (
    displayCredentialId &&
    achievementIds.includes(displayCredentialId)
  ) {
    return ACHIEVEMENTS.find((a) => a.id === displayCredentialId) ?? null
  }
  return getActiveCredential(achievementIds)
}

export function sanitizeDisplayCredential(
  achievementIds: string[],
  displayCredentialId?: string | null
): string | null {
  if (
    displayCredentialId &&
    achievementIds.includes(displayCredentialId)
  ) {
    return displayCredentialId
  }
  return null
}
