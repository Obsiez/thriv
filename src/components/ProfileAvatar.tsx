import { getAccent, type AccentId } from '../lib/profileTheme'

interface ProfileAvatarProps {
  initial: string
  accentId: AccentId
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 sm:h-8 sm:w-8 text-xs',
  lg: 'h-14 w-14 sm:h-16 sm:w-16 text-lg sm:text-xl font-bold',
}

export function ProfileAvatar({ initial, accentId, size = 'md', className = '' }: ProfileAvatarProps) {
  const accent = getAccent(accentId)
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md font-mono font-semibold ring-1 ${sizes[size]} ${accent.bg} ${accent.text} ${accent.ring} ${className}`}
    >
      {initial}
    </span>
  )
}
