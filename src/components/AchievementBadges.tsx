import { getDisplayedCredential } from '../lib/credentialBadge'
import { IconBadge } from './IconBadge'

interface CredentialBadgeProps {
  achievementIds: string[]
  displayCredentialId?: string | null
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

/** Credential icon shown on leaderboard (player-selected or highest earned). */
export function CredentialBadge({
  achievementIds,
  displayCredentialId = null,
  size = 'sm',
  className = '',
}: CredentialBadgeProps) {
  const credential = getDisplayedCredential(achievementIds, displayCredentialId)
  if (!credential) return null

  return (
    <span
      className={`inline-flex shrink-0 ${className}`}
      title={credential.title}
      aria-label={`Credential: ${credential.title}`}
    >
      <IconBadge name={credential.icon} size={size} variant="achievement" />
    </span>
  )
}
