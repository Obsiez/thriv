export type AccentId = 'teal' | 'indigo' | 'amber' | 'emerald' | 'violet' | 'slate'

export interface ProfilePrefs {
  accentId: AccentId
  motto: string
}

export const DEFAULT_PROFILE: ProfilePrefs = {
  accentId: 'teal',
  motto: '',
}

export const ACCENT_OPTIONS: {
  id: AccentId
  label: string
  ring: string
  bg: string
  text: string
}[] = [
  { id: 'teal', label: 'Teal', ring: 'ring-thriv-500/50', bg: 'bg-thriv-900/70', text: 'text-thriv-300' },
  { id: 'indigo', label: 'Indigo', ring: 'ring-indigo-500/50', bg: 'bg-indigo-950/70', text: 'text-indigo-300' },
  { id: 'amber', label: 'Amber', ring: 'ring-amber-500/50', bg: 'bg-amber-950/70', text: 'text-amber-300' },
  { id: 'emerald', label: 'Emerald', ring: 'ring-emerald-500/50', bg: 'bg-emerald-950/70', text: 'text-emerald-300' },
  { id: 'violet', label: 'Violet', ring: 'ring-violet-500/50', bg: 'bg-violet-950/70', text: 'text-violet-300' },
  { id: 'slate', label: 'Slate', ring: 'ring-slate-400/40', bg: 'bg-slate-800/80', text: 'text-slate-200' },
]

export function getAccent(id: AccentId) {
  return ACCENT_OPTIONS.find((a) => a.id === id) ?? ACCENT_OPTIONS[0]
}

export function mergeProfilePrefs(partial?: Partial<ProfilePrefs>): ProfilePrefs {
  return {
    ...DEFAULT_PROFILE,
    ...partial,
    accentId: partial?.accentId ?? DEFAULT_PROFILE.accentId,
    motto: (partial?.motto ?? '').slice(0, 48),
  }
}
