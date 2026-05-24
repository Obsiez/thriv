import { useMemo } from 'react'
import { Medal } from 'lucide-react'
import { buildLeaderboard } from '../lib/leaderboardBots'
import { formatPercent } from '../lib/marketEngine'
import { CredentialBadge } from './AchievementBadges'

interface LeaderboardProps {
  playerName: string
  playerGainPct: number
  marketTick: number
  playerAchievements?: string[]
  displayCredentialId?: string | null
}

export function Leaderboard({
  playerName,
  playerGainPct,
  marketTick,
  playerAchievements = [],
  displayCredentialId = null,
}: LeaderboardProps) {
  const entries = useMemo(
    () => buildLeaderboard(playerName, playerGainPct, marketTick),
    [playerName, playerGainPct, marketTick]
  )

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <Medal className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
        Academy leaderboard
      </h3>
      <p className="text-[10px] text-slate-600 mt-0.5">Ranked by portfolio % gain · live simulation</p>
      <ul className="mt-3 space-y-1.5">
        {entries.map((e, i) => {
          const up = e.gainPct >= 0
          return (
            <li
              key={e.name}
              className={`flex items-center justify-between rounded-lg px-2 py-2 text-xs ${
                e.isPlayer ? 'bg-thriv-900/40 border border-thriv-600/30' : 'hover:bg-white/[0.02]'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className={`font-mono w-4 text-center ${
                    i === 0 ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="truncate font-medium">{e.name}</span>
                {e.isPlayer && (
                  <>
                    <CredentialBadge
                      achievementIds={playerAchievements}
                      displayCredentialId={displayCredentialId}
                      size="xs"
                      className="opacity-85"
                    />
                    <span className="text-[9px] uppercase tracking-wider text-thriv-500 shrink-0">
                      You
                    </span>
                  </>
                )}
              </span>
              <span
                className={`font-mono shrink-0 ml-2 tabular-nums ${
                  up ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatPercent(e.gainPct)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
