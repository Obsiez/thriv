import { getIcon, type IconName } from '../lib/icons'

interface IconBadgeProps {
  name: IconName
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'quest' | 'achievement' | 'muted'
}

const sizes = {
  xs: { box: 'h-5 w-5', icon: 'h-2.5 w-2.5' },
  sm: { box: 'h-8 w-8', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-10 w-10', icon: 'h-4 w-4' },
  lg: { box: 'h-12 w-12', icon: 'h-5 w-5' },
}

const variants = {
  default: 'border-white/10 bg-surface-900/80 text-thriv-400',
  quest: 'border-thriv-700/30 bg-thriv-950/50 text-thriv-300',
  achievement: 'border-amber-600/20 bg-amber-950/20 text-amber-400/90',
  muted: 'border-white/5 bg-surface-800/60 text-slate-400',
}

export function IconBadge({ name, size = 'md', variant = 'default' }: IconBadgeProps) {
  const Icon = getIcon(name)
  const s = sizes[size]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border ${s.box} ${variants[variant]}`}
      aria-hidden
    >
      <Icon className={s.icon} strokeWidth={1.75} />
    </span>
  )
}
