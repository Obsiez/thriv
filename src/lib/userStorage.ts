import type { Portfolio, PlayerProgress } from '../types'
import { loadPortfolio, savePortfolio, resetPortfolio } from './storage'
import { loadProgress, saveProgress, resetProgress } from './progressStorage'
import { mergeProfilePrefs } from './profileTheme'

export function scopeKey(base: string, userId: string | null, guest: boolean): string {
  if (guest) return `${base}-guest`
  if (userId) return `${base}-${userId}`
  return base
}

export function loadPortfolioForUser(userId: string | null, guest: boolean): Portfolio {
  const key = scopeKey('thriv-portfolio', userId, guest)
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as Portfolio
  } catch {
    /* ignore */
  }
  return loadPortfolio()
}

export function savePortfolioForUser(
  portfolio: Portfolio,
  userId: string | null,
  guest: boolean
): void {
  const key = scopeKey('thriv-portfolio', userId, guest)
  localStorage.setItem(key, JSON.stringify(portfolio))
  if (!userId && !guest) savePortfolio(portfolio)
}

export function loadProgressForUser(userId: string | null, guest: boolean): PlayerProgress {
  const key = scopeKey('thriv-progress', userId, guest)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as PlayerProgress
      const base = loadProgress()
      return {
        ...base,
        ...parsed,
        stats: { ...base.stats, ...parsed.stats },
        profile: mergeProfilePrefs(parsed.profile),
      }
    }
  } catch {
    /* ignore */
  }
  return loadProgress()
}

export function saveProgressForUser(
  progress: PlayerProgress,
  userId: string | null,
  guest: boolean
): void {
  const key = scopeKey('thriv-progress', userId, guest)
  localStorage.setItem(key, JSON.stringify(progress))
  if (!userId && !guest) saveProgress(progress)
}

export function resetLocalForUser(userId: string | null, guest: boolean): {
  portfolio: Portfolio
  progress: PlayerProgress
} {
  const portfolio = resetPortfolio()
  const progress = resetProgress()
  savePortfolioForUser(portfolio, userId, guest)
  saveProgressForUser(progress, userId, guest)
  return { portfolio, progress }
}

export function applyCloudState(
  portfolio: Portfolio,
  progress: PlayerProgress,
  userId: string,
  guest: boolean
): void {
  savePortfolioForUser(portfolio, userId, guest)
  saveProgressForUser(progress, userId, guest)
}
