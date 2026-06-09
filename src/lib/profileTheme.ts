export type AccentId = 'teal' | 'indigo' | 'amber' | 'emerald' | 'violet' | 'slate'

export interface ProfilePrefs {
  accentId: AccentId
  motto: string
  gridCardNo?: string
  gridCvv?: string
  gridExpiry?: string
  zenithCardNo?: string
  zenithCvv?: string
  zenithExpiry?: string
  apexCardNo?: string
  apexCvv?: string
  apexExpiry?: string
  maxLossThreshold?: number
  pushNotificationsEnabled?: boolean
  defaultOrderType?: 'market' | 'limit'
  defaultOrderQty?: number
  showVolume?: boolean
  simulationSpeedMultiplier?: number
  traderArchetype?: 'scalper' | 'day' | 'swing' | 'position'
  featuredBadge?: string
  profileCardTheme?: 'glass' | 'terminal' | 'cyber' | 'minimal'
  leverageLimit?: number
  autoTakeProfit?: string
  largePositionWarning?: boolean
  chartColorTheme?: 'classic' | 'colorblind' | 'monochrome'
  chartStrokeThickness?: 'thin' | 'medium' | 'thick'
  showStrikePriceMarkers?: boolean
  performanceModeToggle?: boolean
  audioVolume?: number
  ambientSoundtrack?: boolean
  
  // New Preferences from Settings Plan
  streakFreeze?: boolean
  socialLink?: string
  oneClickTrading?: boolean
  positionConcentrationLimit?: number
  gridlineDensity?: 'high' | 'medium' | 'low'
  showMacd?: boolean
  autoBackupSchedule?: 'off' | 'daily' | 'weekly'
  soundEffectsVolume?: number

  // Card Controls
  deactivatedCards?: string[]
  defaultCardId?: string
}

export const DEFAULT_PROFILE: ProfilePrefs = {
  accentId: 'teal',
  motto: '',
  maxLossThreshold: 0,
  pushNotificationsEnabled: false,
  defaultOrderType: 'market',
  defaultOrderQty: 10,
  showVolume: true,
  simulationSpeedMultiplier: 1,
  traderArchetype: 'day',
  featuredBadge: 'novice',
  profileCardTheme: 'glass',
  leverageLimit: 1,
  autoTakeProfit: 'none',
  largePositionWarning: true,
  chartColorTheme: 'classic',
  chartStrokeThickness: 'medium',
  showStrikePriceMarkers: true,
  performanceModeToggle: false,
  audioVolume: 50,
  ambientSoundtrack: false,
  
  // New Preferences Defaults
  streakFreeze: false,
  socialLink: '',
  oneClickTrading: false,
  positionConcentrationLimit: 0,
  gridlineDensity: 'medium',
  showMacd: false,
  autoBackupSchedule: 'off',
  soundEffectsVolume: 50,
  deactivatedCards: [],
  defaultCardId: 'grid',
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

function generateGridCardNo(): string {
  let num = '4'
  for (let i = 0; i < 15; i++) {
    num += Math.floor(Math.random() * 10).toString()
  }
  return num.replace(/(\d{4})/g, '$1 ').trim()
}

function generateZenithCardNo(): string {
  let num = ''
  if (Math.random() < 0.5) {
    const prefix = Math.floor(Math.random() * 5) + 51
    num = prefix.toString()
    for (let i = 0; i < 14; i++) {
      num += Math.floor(Math.random() * 10).toString()
    }
  } else {
    const prefix = Math.floor(Math.random() * 500) + 2221
    num = prefix.toString()
    for (let i = 0; i < 12; i++) {
      num += Math.floor(Math.random() * 10).toString()
    }
  }
  return num.replace(/(\d{4})/g, '$1 ').trim()
}

function generateApexCardNo(): string {
  const prefix = Math.random() < 0.5 ? '34' : '37'
  let num = prefix
  for (let i = 0; i < 13; i++) {
    num += Math.floor(Math.random() * 10).toString()
  }
  const part1 = num.slice(0, 4)
  const part2 = num.slice(4, 10)
  const part3 = num.slice(10, 15)
  return `${part1} ${part2} ${part3}`
}

function generateCvv(): string {
  return Math.floor(100 + Math.random() * 900).toString()
}

function generateExpiry(): string {
  const month = Math.floor(Math.random() * 12) + 1
  const monthStr = month < 10 ? `0${month}` : `${month}`
  const year = 29 + Math.floor(Math.random() * 5)
  return `${monthStr}/${year}`
}

export function mergeProfilePrefs(partial?: Partial<ProfilePrefs>): ProfilePrefs {
  return {
    ...DEFAULT_PROFILE,
    gridCardNo: partial?.gridCardNo ?? generateGridCardNo(),
    gridCvv: partial?.gridCvv ?? generateCvv(),
    gridExpiry: partial?.gridExpiry ?? generateExpiry(),
    zenithCardNo: partial?.zenithCardNo ?? generateZenithCardNo(),
    zenithCvv: partial?.zenithCvv ?? generateCvv(),
    zenithExpiry: partial?.zenithExpiry ?? generateExpiry(),
    apexCardNo: partial?.apexCardNo ?? generateApexCardNo(),
    apexCvv: partial?.apexCvv ?? generateCvv(),
    apexExpiry: partial?.apexExpiry ?? generateExpiry(),
    ...partial,
    accentId: partial?.accentId ?? DEFAULT_PROFILE.accentId,
    motto: (partial?.motto ?? '').slice(0, 48),
    maxLossThreshold: partial?.maxLossThreshold ?? DEFAULT_PROFILE.maxLossThreshold,
    pushNotificationsEnabled: partial?.pushNotificationsEnabled ?? DEFAULT_PROFILE.pushNotificationsEnabled,
    defaultOrderType: partial?.defaultOrderType ?? DEFAULT_PROFILE.defaultOrderType,
    defaultOrderQty: partial?.defaultOrderQty ?? DEFAULT_PROFILE.defaultOrderQty,
    showVolume: partial?.showVolume ?? DEFAULT_PROFILE.showVolume,
    simulationSpeedMultiplier: partial?.simulationSpeedMultiplier ?? DEFAULT_PROFILE.simulationSpeedMultiplier,
    traderArchetype: partial?.traderArchetype ?? DEFAULT_PROFILE.traderArchetype,
    featuredBadge: partial?.featuredBadge ?? DEFAULT_PROFILE.featuredBadge,
    profileCardTheme: partial?.profileCardTheme ?? DEFAULT_PROFILE.profileCardTheme,
    leverageLimit: partial?.leverageLimit ?? DEFAULT_PROFILE.leverageLimit,
    autoTakeProfit: partial?.autoTakeProfit ?? DEFAULT_PROFILE.autoTakeProfit,
    largePositionWarning: partial?.largePositionWarning ?? DEFAULT_PROFILE.largePositionWarning,
    chartColorTheme: partial?.chartColorTheme ?? DEFAULT_PROFILE.chartColorTheme,
    chartStrokeThickness: partial?.chartStrokeThickness ?? DEFAULT_PROFILE.chartStrokeThickness,
    showStrikePriceMarkers: partial?.showStrikePriceMarkers ?? DEFAULT_PROFILE.showStrikePriceMarkers,
    performanceModeToggle: partial?.performanceModeToggle ?? DEFAULT_PROFILE.performanceModeToggle,
    audioVolume: partial?.audioVolume ?? DEFAULT_PROFILE.audioVolume,
    ambientSoundtrack: partial?.ambientSoundtrack ?? DEFAULT_PROFILE.ambientSoundtrack,
    
    streakFreeze: partial?.streakFreeze ?? DEFAULT_PROFILE.streakFreeze,
    socialLink: partial?.socialLink ?? DEFAULT_PROFILE.socialLink,
    oneClickTrading: partial?.oneClickTrading ?? DEFAULT_PROFILE.oneClickTrading,
    positionConcentrationLimit: partial?.positionConcentrationLimit ?? DEFAULT_PROFILE.positionConcentrationLimit,
    gridlineDensity: partial?.gridlineDensity ?? DEFAULT_PROFILE.gridlineDensity,
    showMacd: partial?.showMacd ?? DEFAULT_PROFILE.showMacd,
    autoBackupSchedule: partial?.autoBackupSchedule ?? DEFAULT_PROFILE.autoBackupSchedule,
    soundEffectsVolume: partial?.soundEffectsVolume ?? DEFAULT_PROFILE.soundEffectsVolume,
    deactivatedCards: partial?.deactivatedCards ?? DEFAULT_PROFILE.deactivatedCards,
    defaultCardId: partial?.defaultCardId ?? DEFAULT_PROFILE.defaultCardId,
  }
}

