import { DAILY_QUESTS, QUESTS } from '../data/quests'
import { isQuestComplete, type QuestCheckContext } from './questChecks'
import type { PlayerProgress, QuestProgress } from '../types'

export function ensureQuestEntry(quests: QuestProgress[], id: string): QuestProgress[] {
  if (quests.some((q) => q.id === id)) return quests
  return [...quests, { id, completed: false, claimed: false }]
}

export function getQuestRecord(
  progress: PlayerProgress,
  questId: string
): QuestProgress {
  return (
    progress.quests.find((q) => q.id === questId) ?? {
      id: questId,
      completed: false,
      claimed: false,
    }
  )
}

export function isQuestClaimable(
  questId: string,
  ctx: QuestCheckContext
): boolean {
  const qp = getQuestRecord(ctx.progress, questId)
  if (qp.claimed) return false
  return qp.completed || isQuestComplete(questId, ctx)
}

export function countClaimableQuests(ctx: QuestCheckContext): number {
  const dailyId = ctx.progress.dailyQuestId
  const ids = [
    ...QUESTS.map((q) => q.id),
    ...(dailyId ? [dailyId] : []),
  ]
  return ids.filter((id) => isQuestClaimable(id, ctx)).length
}

export function syncQuestEntries(
  quests: QuestProgress[],
  ctx: QuestCheckContext
): { quests: QuestProgress[]; changed: boolean } {
  let next = [...quests]
  let changed = false

  const dailyDef = ctx.progress.dailyQuestId
    ? DAILY_QUESTS.find((d) => d.id === ctx.progress.dailyQuestId)
    : undefined
  const allDefs = [...QUESTS, ...(dailyDef ? [dailyDef] : [])]

  for (const def of allDefs) {
    if (!def) continue
    const exists = next.some((q) => q.id === def.id)
    if (!exists) {
      next.push({ id: def.id, completed: false, claimed: false })
      changed = true
    }
    const idx = next.findIndex((x) => x.id === def.id)
    if (!next[idx].completed && isQuestComplete(def.id, ctx)) {
      next[idx] = { ...next[idx], completed: true, completedAt: Date.now() }
      changed = true
    }
  }

  return { quests: next, changed }
}
