import { STARTING_CASH } from '../data/stocks'

export interface LeaderboardEntry {
  name: string
  gainPct: number
  value: number
  isPlayer?: boolean
}

const BOTS = [
  { name: 'Alex Chen', seed: 1.1, base: 11.2 },
  { name: 'Jordan Lee', seed: 2.4, base: 7.8 },
  { name: 'Sam Rivera', seed: 3.7, base: 5.4 },
  { name: 'Casey Kim', seed: 4.2, base: 3.1 },
  { name: 'Morgan Blake', seed: 5.9, base: -1.2 },
  { name: 'Riley Park', seed: 6.3, base: 9.6 },
  { name: 'Taylor Brooks', seed: 7.8, base: 2.4 },
]

/** Simulated peers with drifting % returns — updates with market tick time. */
export function buildLeaderboard(
  playerName: string,
  playerGainPct: number,
  tickMs: number
): LeaderboardEntry[] {
  const t = tickMs / 8000

  const entries: LeaderboardEntry[] = BOTS.map((bot) => {
    const gainPct =
      bot.base +
      Math.sin(t + bot.seed) * 2.8 +
      Math.cos(t * 0.65 + bot.seed * 1.3) * 1.4
    return {
      name: bot.name,
      gainPct,
      value: STARTING_CASH * (1 + gainPct / 100),
    }
  })

  entries.push({
    name: playerName,
    gainPct: playerGainPct,
    value: STARTING_CASH * (1 + playerGainPct / 100),
    isPlayer: true,
  })

  return entries.sort((a, b) => b.gainPct - a.gainPct).slice(0, 8)
}
