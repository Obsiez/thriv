import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  LogOut,
  Palette,
  Scale,
  Shield,
  ShieldAlert,
  User,
  X,
  Sliders,
  BarChart3,
  EyeOff,
  Award,
  Gem,
  Brain,
  Sparkles,
  Globe,
  Flag,
  Square,
  Crown,
  Cpu,
  Moon,
  Activity,
  Layout,
  Grid,
  Minus,
  Percent,
  DollarSign,
  Hash,
  Clock,
  Zap,
  Landmark,
  Smartphone,
  Briefcase,
  TrendingUp,
  LineChart,
  AreaChart,
  Contrast,
  Gauge,
  Battery,
  LayoutGrid,
  Columns,
  Maximize2,
  Archive,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  ACCENT_OPTIONS,
  DEFAULT_PROFILE,
  mergeProfilePrefs,
  type AccentId,
  type ProfilePrefs,
} from '../lib/profileTheme'
import { ProfileAvatar } from './ProfileAvatar'
import type { Portfolio, PlayerProgress } from '../types'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  portfolio: Portfolio
  progress: PlayerProgress
  onFullReset: () => void
  onBalanceReset: () => void
  onProfileChange: (profile: ProfilePrefs) => void
}

type SettingsCategory = 'profile' | 'trading' | 'chart' | 'system' | 'legal'

const CATEGORIES: { id: SettingsCategory; label: string; icon: any }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'trading', label: 'Trading', icon: Sliders },
  { id: 'chart', label: 'Charts', icon: BarChart3 },
  { id: 'system', label: 'System', icon: ShieldAlert },
  { id: 'legal', label: 'Legal', icon: Scale },
]

interface CustomSelectOption<T extends string | number> {
  value: T
  label: string
  icon?: any
}

interface CustomSelectProps<T extends string | number> {
  value: T
  onChange: (val: T) => void
  options: CustomSelectOption<T>[]
}

function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((opt) => opt.value === value) || options[0]
  const Icon = selectedOption?.icon

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-white/[0.08] bg-surface-800 py-2.5 px-3 text-sm focus:outline-none focus:border-thriv-600/50 text-slate-350 cursor-pointer hover:bg-surface-850 transition-colors"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" strokeWidth={1.75} />}
          <span>{selectedOption?.label}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          strokeWidth={1.75}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent w-full h-full"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1.5 w-full rounded-lg border border-white/[0.08] bg-surface-800 shadow-xl z-50 max-h-60 overflow-y-auto scrollbar-thin divide-y divide-white/[0.04]">
            {options.map((opt) => {
              const OptIcon = opt.icon
              const active = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left transition-colors hover:bg-surface-700/50 ${
                    active ? 'bg-surface-700/60 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {OptIcon && (
                    <OptIcon
                      className={`h-4 w-4 shrink-0 ${active ? 'text-thriv-400' : 'text-slate-500'}`}
                      strokeWidth={1.75}
                    />
                  )}
                  <span>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

const RANK_OPTIONS = [
  { value: 'novice', label: 'Novice Scalper', icon: Shield },
  { value: 'hodl', label: 'HODL Master', icon: Gem },
  { value: 'quant', label: 'Quant Intern', icon: Brain },
  { value: 'wizard', label: 'Market Wizard', icon: Sparkles },
  { value: 'risk', label: 'Risk Manager', icon: Award },
]

const REGION_OPTIONS = [
  { value: 'global', label: 'Global / Default', icon: Globe },
  { value: 'us', label: 'United States (US)', icon: Flag },
  { value: 'uk', label: 'United Kingdom (UK)', icon: Flag },
  { value: 'eu', label: 'European Union (EU)', icon: Globe },
  { value: 'jp', label: 'Japan (JP)', icon: Flag },
  { value: 'ca', label: 'Canada (CA)', icon: Flag },
]

const FRAME_OPTIONS = [
  { value: 'none', label: 'None / Classic Border', icon: Square },
  { value: 'gold', label: 'Elite Gold Glow', icon: Crown },
  { value: 'silver', label: 'Chrono Cyberpunk Silver', icon: Cpu },
  { value: 'obsidian', label: 'Obsidian Shadow', icon: Moon },
  { value: 'emerald', label: 'Vibrant Emerald', icon: Sparkles },
]

const BG_OPTIONS = [
  { value: 'solid', label: 'Solid Slate Dark', icon: Layout },
  { value: 'gradient', label: 'Celestial Gradient Glow', icon: Sparkles },
  { value: 'grid', label: 'Holographic Grid Matrix', icon: Grid },
  { value: 'minimal', label: 'Minimalist Border Style', icon: Minus },
]

const POS_SIZE_MODEL_OPTIONS = [
  { value: 'percentage', label: 'Percentage of Buying Power', icon: Percent },
  { value: 'fixed_usd', label: 'Fixed USD Amount per order', icon: DollarSign },
  { value: 'fixed_shares', label: 'Fixed Share count per order', icon: Hash },
]

const FIXED_SIZE_OPTIONS = [
  { value: '500', label: '$500 per Trade', icon: DollarSign },
  { value: '1000', label: '$1,000 per Trade', icon: DollarSign },
  { value: '5000', label: '$5,000 per Trade', icon: DollarSign },
  { value: '10000', label: '$10,000 per Trade', icon: DollarSign },
  { value: '25000', label: '$25,000 per Trade', icon: DollarSign },
]

const TIF_OPTIONS = [
  { value: 'day', label: 'Day Order (TIF-DAY)', icon: Clock },
  { value: 'gtc', label: 'GTC (Good \'Til Cancelled)', icon: Clock },
]

const SLIPPAGE_OPTIONS = [
  { value: '0.0', label: 'Instant (0.0% slippage)', icon: Zap },
  { value: '0.1', label: 'Low Volatility (0.10%)', icon: TrendingUp },
  { value: '0.25', label: 'Normal Market (0.25%)', icon: Activity },
  { value: '0.75', label: 'High Slippage / News (0.75%)', icon: AlertTriangle },
]

const COMMISSION_OPTIONS = [
  { value: 'institutional', label: 'Institutional (0.00% fee)', icon: Landmark },
  { value: 'discount', label: 'Discount Broker (0.01% fee)', icon: Smartphone },
  { value: 'full', label: 'Full-Service Broker (0.15% fee)', icon: Briefcase },
]

const MAX_LOSS_OPTIONS = [
  { value: 0, label: 'Disabled', icon: Shield },
  { value: 3, label: '3% Daily Drawdown', icon: ShieldAlert },
  { value: 5, label: '5% Daily Drawdown', icon: ShieldAlert },
  { value: 10, label: '10% Daily Drawdown', icon: ShieldAlert },
  { value: 15, label: '15% Daily Drawdown', icon: ShieldAlert },
  { value: 20, label: '20% Daily Drawdown', icon: ShieldAlert },
]

const TIMEFRAME_OPTIONS = [
  { value: '1m', label: '1 Minute (HFT View)', icon: Clock },
  { value: '5m', label: '5 Minutes (Intraday Scalp)', icon: Clock },
  { value: '15m', label: '15 Minutes (Day Trade)', icon: Clock },
  { value: '1h', label: '1 Hour (Swing View)', icon: Clock },
  { value: '1d', label: '1 Day (Standard History)', icon: Clock },
]

const CHART_LAYOUT_OPTIONS = [
  { value: 'candle', label: 'Japanese Candlesticks', icon: BarChart3 },
  { value: 'hollow', label: 'Hollow Candlesticks', icon: BarChart3 },
  { value: 'heikin', label: 'Heikin-Ashi Candles', icon: BarChart3 },
  { value: 'area', label: 'Colored Area Chart', icon: AreaChart },
  { value: 'line', label: 'Clean Line Plot', icon: LineChart },
]

const CHART_THEME_OPTIONS = [
  { value: 'classic', label: 'Classic Red & Green', icon: Palette },
  { value: 'neon', label: 'Cyberpunk Teal & Pink', icon: Sparkles },
  { value: 'monochrome', label: 'Monochrome Slate & White', icon: Contrast },
]

const PERFORMANCE_OPTIONS = [
  { value: 'fluid', label: 'Fluid Dynamic (60fps animation)', icon: Zap },
  { value: 'standard', label: 'Standard Performance (Balanced)', icon: Gauge },
  { value: 'eco', label: 'Eco Saving (Static UI transitions)', icon: Battery },
]

const WORKSPACE_OPTIONS = [
  { value: 'midnight', label: 'Three-Column Power Grid (Default)', icon: LayoutGrid },
  { value: 'deepslate', label: 'Dual Panel Workspace', icon: Columns },
  { value: 'cyberpunk', label: 'Minimalist Focused Workspace', icon: Maximize2 },
]

const ARCHIVE_OPTIONS = [
  { value: 'never', label: 'Never (Keep all logs)', icon: Archive },
  { value: '30', label: 'Auto-clear trades older than 30 days', icon: Archive },
  { value: '90', label: 'Auto-clear trades older than 90 days', icon: Archive },
]

const ARCHETYPE_OPTIONS = [
  { value: 'scalper', label: 'Scalper Focus', icon: Zap },
  { value: 'day', label: 'Day Trader Focus', icon: User },
  { value: 'swing', label: 'Swing Trader Focus', icon: TrendingUp },
  { value: 'position', label: 'Position Trader Focus', icon: Briefcase },
]

const SHOWCASE_BADGE_OPTIONS = [
  { value: 'novice', label: 'Novice Badge', icon: Shield },
  { value: 'expert', label: 'Expert Badge', icon: Award },
  { value: 'master', label: 'Master Badge', icon: Gem },
  { value: 'legend', label: 'Legend Badge', icon: Crown },
]

const PROFILE_THEME_OPTIONS = [
  { value: 'glass', label: 'Premium Glass', icon: Sparkles },
  { value: 'terminal', label: 'Retro Terminal', icon: Cpu },
  { value: 'cyber', label: 'Cyberpunk Neon', icon: Moon },
  { value: 'minimal', label: 'Minimalist Matte', icon: Square },
]

const LEVERAGE_OPTIONS = [
  { value: 1, label: '1x Leverage (No Borrowing)', icon: Shield },
  { value: 2, label: '2x Leverage (Standard)', icon: Sliders },
  { value: 3, label: '3x Leverage (Aggressive)', icon: TrendingUp },
  { value: 4, label: '4x Leverage (Maximum)', icon: Zap },
]

const TAKE_PROFIT_OPTIONS = [
  { value: 'none', label: 'None', icon: Square },
  { value: '5', label: '+5% Take Profit', icon: Percent },
  { value: '10', label: '+10% Take Profit', icon: Percent },
  { value: '25', label: '+25% Take Profit', icon: Percent },
  { value: '50', label: '+50% Take Profit', icon: Percent },
]

const CHART_STROKE_OPTIONS = [
  { value: 'thin', label: 'Thin Stroke', icon: Minus },
  { value: 'medium', label: 'Medium Stroke', icon: Minus },
  { value: 'thick', label: 'Thick Stroke', icon: Minus },
]

const VOLUME_OPTIONS = [
  { value: 0, label: 'Muted (0%)', icon: EyeOff },
  { value: 25, label: 'Low (25%)', icon: Sliders },
  { value: 50, label: 'Medium (50%)', icon: Sliders },
  { value: 80, label: 'Loud (80%)', icon: Sliders },
  { value: 100, label: 'Max (100%)', icon: Sliders },
]

const CONCENTRATION_OPTIONS = [
  { value: 0, label: 'No Limit Warning', icon: Shield },
  { value: 10, label: '10% Concentration Warning', icon: ShieldAlert },
  { value: 25, label: '25% Concentration Warning', icon: ShieldAlert },
  { value: 50, label: '50% Concentration Warning', icon: ShieldAlert },
]

const DENSITY_OPTIONS = [
  { value: 'medium', label: 'Standard Gridline Density', icon: Grid },
  { value: 'high', label: 'Dense Gridline Density (More lines)', icon: Grid },
  { value: 'low', label: 'Sparse Gridline Density (Fewer lines)', icon: Grid },
]

const BACKUP_OPTIONS = [
  { value: 'off', label: 'Off / Manual Backup Only', icon: Square },
  { value: 'daily', label: 'Daily Automated Backup (24h)', icon: Clock },
  { value: 'weekly', label: 'Weekly Automated Backup (7d)', icon: Clock },
]

const SFX_VOLUME_OPTIONS = [
  { value: 0, label: 'SFX: Muted', icon: EyeOff },
  { value: 25, label: 'SFX: Low (25%)', icon: Sliders },
  { value: 50, label: 'SFX: Medium (50%)', icon: Sliders },
  { value: 80, label: 'SFX: Loud (80%)', icon: Sliders },
  { value: 100, label: 'SFX: Max (100%)', icon: Sliders },
]

export function SettingsPanel({
  open,
  onClose,
  portfolio,
  progress,
  onFullReset,
  onBalanceReset,
  onProfileChange,
}: SettingsPanelProps) {
  const { user, mode, logout, updateDisplayName, syncStatus, refreshSync } = useAuth()

  const handleManualSync = async () => {
    if (syncStatus === 'syncing') return
    try {
      await refreshSync()
    } catch (e) {
      console.error('Manual sync failed:', e)
    }
  }
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('profile')
  const [showResetModal, setShowResetModal] = useState(false)
  const [confirmResetType, setConfirmResetType] = useState<'balance' | 'full' | null>(null)
  const [name, setName] = useState(user?.displayName ?? '')
  const [motto, setMotto] = useState(progress.profile?.motto ?? '')
  const [accentId, setAccentId] = useState<AccentId>(
    progress.profile?.accentId ?? DEFAULT_PROFILE.accentId
  )
  const [maxLossThreshold, setMaxLossThreshold] = useState<number>(
    progress.profile?.maxLossThreshold ?? 0
  )
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState<boolean>(
    progress.profile?.pushNotificationsEnabled ?? false
  )
  const [defaultOrderType, setDefaultOrderType] = useState<'market' | 'limit'>(
    progress.profile?.defaultOrderType ?? 'market'
  )
  const [defaultOrderQty, setDefaultOrderQty] = useState<number>(
    progress.profile?.defaultOrderQty ?? 10
  )
  const [showVolume, setShowVolume] = useState<boolean>(
    progress.profile?.showVolume ?? true
  )
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState<number>(
    progress.profile?.simulationSpeedMultiplier ?? 1
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [legalPage, setLegalPage] = useState<'terms' | 'privacy' | null>(null)

  // Open a legal sub-page as a history branch of settings
  const openLegalPage = (page: 'terms' | 'privacy') => {
    window.history.pushState({ modal: 'settings-legal', page }, '')
    setLegalPage(page)
  }

  // Close legal page — pop the history entry we pushed
  const closeLegalPage = () => {
    setLegalPage(null)
    if (window.history.state?.modal === 'settings-legal') {
      window.history.back()
    }
  }

  // Listen for browser back from within the legal sub-page
  useEffect(() => {
    if (!open) return
    const handlePopState = (e: PopStateEvent) => {
      // If we land back on the settings state, close the legal page
      if (e.state?.modal === 'settings') {
        setLegalPage(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [open])

  // 12 Profile-saved Settings States
  const [traderArchetype, setTraderArchetype] = useState<'scalper' | 'day' | 'swing' | 'position'>(
    progress.profile?.traderArchetype ?? DEFAULT_PROFILE.traderArchetype ?? 'day'
  )
  const [featuredBadge, setFeaturedBadge] = useState<string>(
    progress.profile?.featuredBadge ?? DEFAULT_PROFILE.featuredBadge ?? 'novice'
  )
  const [profileCardTheme, setProfileCardTheme] = useState<'glass' | 'terminal' | 'cyber' | 'minimal'>(
    progress.profile?.profileCardTheme ?? DEFAULT_PROFILE.profileCardTheme ?? 'glass'
  )
  const [leverageLimit, setLeverageLimit] = useState<number>(
    progress.profile?.leverageLimit ?? DEFAULT_PROFILE.leverageLimit ?? 1
  )
  const [autoTakeProfit, setAutoTakeProfit] = useState<string>(
    progress.profile?.autoTakeProfit ?? DEFAULT_PROFILE.autoTakeProfit ?? 'none'
  )
  const [largePositionWarning, setLargePositionWarning] = useState<boolean>(
    progress.profile?.largePositionWarning ?? DEFAULT_PROFILE.largePositionWarning ?? true
  )
  const [chartColorThemeProfile, setChartColorThemeProfile] = useState<'classic' | 'colorblind' | 'monochrome'>(
    progress.profile?.chartColorTheme ?? DEFAULT_PROFILE.chartColorTheme ?? 'classic'
  )
  const [chartStrokeThickness, setChartStrokeThickness] = useState<'thin' | 'medium' | 'thick'>(
    progress.profile?.chartStrokeThickness ?? DEFAULT_PROFILE.chartStrokeThickness ?? 'medium'
  )
  const [showStrikePriceMarkers, setShowStrikePriceMarkers] = useState<boolean>(
    progress.profile?.showStrikePriceMarkers ?? DEFAULT_PROFILE.showStrikePriceMarkers ?? true
  )
  const [performanceModeToggle, setPerformanceModeToggle] = useState<boolean>(
    progress.profile?.performanceModeToggle ?? DEFAULT_PROFILE.performanceModeToggle ?? false
  )
  const [audioVolume, setAudioVolume] = useState<number>(
    progress.profile?.audioVolume ?? DEFAULT_PROFILE.audioVolume ?? 50
  )
  const [ambientSoundtrack, setAmbientSoundtrack] = useState<boolean>(
    progress.profile?.ambientSoundtrack ?? DEFAULT_PROFILE.ambientSoundtrack ?? false
  )
  // 8 New Preferences States
  const [streakFreeze, setStreakFreeze] = useState<boolean>(
    progress.profile?.streakFreeze ?? DEFAULT_PROFILE.streakFreeze ?? false
  )
  const [socialLink, setSocialLink] = useState<string>(
    progress.profile?.socialLink ?? DEFAULT_PROFILE.socialLink ?? ''
  )
  const [oneClickTrading, setOneClickTrading] = useState<boolean>(
    progress.profile?.oneClickTrading ?? DEFAULT_PROFILE.oneClickTrading ?? false
  )
  const [positionConcentrationLimit, setPositionConcentrationLimit] = useState<number>(
    progress.profile?.positionConcentrationLimit ?? DEFAULT_PROFILE.positionConcentrationLimit ?? 0
  )
  const [gridlineDensity, setGridlineDensity] = useState<'high' | 'medium' | 'low'>(
    progress.profile?.gridlineDensity ?? DEFAULT_PROFILE.gridlineDensity ?? 'medium'
  )
  const [showMacd, setShowMacd] = useState<boolean>(
    progress.profile?.showMacd ?? DEFAULT_PROFILE.showMacd ?? false
  )
  const [autoBackupSchedule, setAutoBackupSchedule] = useState<'off' | 'daily' | 'weekly'>(
    progress.profile?.autoBackupSchedule ?? DEFAULT_PROFILE.autoBackupSchedule ?? 'off'
  )
  const [soundEffectsVolume, setSoundEffectsVolume] = useState<number>(
    progress.profile?.soundEffectsVolume ?? DEFAULT_PROFILE.soundEffectsVolume ?? 50
  )
  
  // State for typed simulator certification verification
  const [certifyText, setCertifyText] = useState('')

  // Rich Interactive Settings State Variables
  const [leaderboardPrivacy, setLeaderboardPrivacy] = useState(() => localStorage.getItem('thriv_settings_leaderboard_privacy') === 'true')
  const [regionFlag, setRegionFlag] = useState(() => localStorage.getItem('thriv_settings_region_flag') ?? 'global')
  
  const [preTradeConfirm, setPreTradeConfirm] = useState(() => localStorage.getItem('thriv_settings_pre_trade_confirm') !== 'false')
  const [timeInForce, setTimeInForce] = useState(() => localStorage.getItem('thriv_settings_time_in_force') ?? 'day')
  const [marginWarning, setMarginWarning] = useState(() => localStorage.getItem('thriv_settings_margin_warning') !== 'false')
  
  const [showEma, setShowEma] = useState(() => localStorage.getItem('thriv_settings_show_ema') === 'true')
  const [showGrid, setShowGrid] = useState(() => localStorage.getItem('thriv_settings_show_grid') !== 'false')
  
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem('thriv_settings_audio_enabled') !== 'false')
  const [autoArchive, setAutoArchive] = useState(() => localStorage.getItem('thriv_settings_auto_archive') ?? 'never')
  const [appThemeVariant, setAppThemeVariant] = useState(() => localStorage.getItem('thriv_settings_app_theme_variant') ?? 'midnight')
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  
  // Extra Rich Settings Options (Added to make the panel look very full)
  const [rankTitle, setRankTitle] = useState(() => localStorage.getItem('thriv_settings_rank_title') ?? 'wizard')
  const [avatarFrame, setAvatarFrame] = useState(() => localStorage.getItem('thriv_settings_avatar_frame') ?? 'gold')
  const [sharePortfolio, setSharePortfolio] = useState(() => localStorage.getItem('thriv_settings_share_portfolio') === 'true')
  const [profileBackground, setProfileBackground] = useState(() => localStorage.getItem('thriv_settings_profile_background') ?? 'gradient')
  const [showLevelBadge, setShowLevelBadge] = useState(() => localStorage.getItem('thriv_settings_show_level_badge') !== 'false')

  const [positionSizeModel, setPositionSizeModel] = useState(() => localStorage.getItem('thriv_settings_pos_size_model') ?? 'percentage')
  const [fixedQtyUsd, setFixedQtyUsd] = useState(() => localStorage.getItem('thriv_settings_fixed_qty_usd') ?? '5000')
  const [slippageFactor, setSlippageFactor] = useState(() => localStorage.getItem('thriv_settings_slippage_factor') ?? '0.25')
  const [commissionTier, setCommissionTier] = useState(() => localStorage.getItem('thriv_settings_commission_tier') ?? 'discount')
  const [shortSellingEnabled, setShortSellingEnabled] = useState(() => localStorage.getItem('thriv_settings_short_selling') === 'true')
  const [autoLoadSearchSymbol, setAutoLoadSearchSymbol] = useState(() => localStorage.getItem('thriv_settings_auto_load_search') !== 'false')

  const [defaultChartInterval, setDefaultChartInterval] = useState(() => localStorage.getItem('thriv_settings_chart_interval') ?? '1d')
  const [chartLayoutStyle, setChartLayoutStyle] = useState(() => localStorage.getItem('thriv_settings_chart_layout') ?? 'candle')
  const [autoDrawPivotZones, setAutoDrawPivotZones] = useState(() => localStorage.getItem('thriv_settings_auto_draw_pivots') === 'true')
  const [showCrosshairLabels, setShowCrosshairLabels] = useState(() => localStorage.getItem('thriv_settings_crosshair_labels') !== 'false')
  const [showRsiOscillator, setShowRsiOscillator] = useState(() => localStorage.getItem('thriv_settings_show_rsi') === 'false')
  const [showMacdOscillator, setShowMacdOscillator] = useState(() => localStorage.getItem('thriv_settings_show_macd') === 'false')

  const [autoCooldownLock, setAutoCooldownLock] = useState(() => localStorage.getItem('thriv_settings_auto_cooldown') === 'true')
  const [keyPressAudio, setKeyPressAudio] = useState(() => localStorage.getItem('thriv_settings_key_press_audio') === 'false')
  const [vibrationFeedback, setVibrationFeedback] = useState(() => localStorage.getItem('thriv_settings_vibration') === 'true')
  const [performanceMode, setPerformanceMode] = useState(() => localStorage.getItem('thriv_settings_performance_mode') ?? 'fluid')
  const [devLogsEnabled, setDevLogsEnabled] = useState(() => localStorage.getItem('thriv_settings_dev_logs') === 'false')

  const [certifySimulatorChecked, setCertifySimulatorChecked] = useState(() => localStorage.getItem('thriv_settings_certify_simulator') !== 'false')

  const toggleLeaderboardPrivacy = () => {
    const next = !leaderboardPrivacy
    setLeaderboardPrivacy(next)
    localStorage.setItem('thriv_settings_leaderboard_privacy', String(next))
  }
  const changeRegionFlag = (val: string) => {
    setRegionFlag(val)
    localStorage.setItem('thriv_settings_region_flag', val)
  }
  const togglePreTradeConfirm = () => {
    const next = !preTradeConfirm
    setPreTradeConfirm(next)
    localStorage.setItem('thriv_settings_pre_trade_confirm', String(next))
  }
  const changeTimeInForce = (val: string) => {
    setTimeInForce(val)
    localStorage.setItem('thriv_settings_time_in_force', val)
  }
  const toggleMarginWarning = () => {
    const next = !marginWarning
    setMarginWarning(next)
    localStorage.setItem('thriv_settings_margin_warning', String(next))
  }
  const toggleShowEma = () => {
    const next = !showEma
    setShowEma(next)
    localStorage.setItem('thriv_settings_show_ema', String(next))
  }
  const toggleShowGrid = () => {
    const next = !showGrid
    setShowGrid(next)
    localStorage.setItem('thriv_settings_show_grid', String(next))
  }
  const changeChartColorTheme = (val: string) => {
    localStorage.setItem('thriv_settings_chart_color_theme', val)
  }
  const toggleAudioEnabled = () => {
    const next = !audioEnabled
    setAudioEnabled(next)
    localStorage.setItem('thriv_settings_audio_enabled', String(next))
  }
  const changeAutoArchive = (val: string) => {
    setAutoArchive(val)
    localStorage.setItem('thriv_settings_auto_archive', val)
  }
  const changeAppThemeVariant = (val: string) => {
    setAppThemeVariant(val)
    localStorage.setItem('thriv_settings_app_theme_variant', val)
  }

  const changeRankTitle = (val: string) => {
    setRankTitle(val)
    localStorage.setItem('thriv_settings_rank_title', val)
  }
  const changeAvatarFrame = (val: string) => {
    setAvatarFrame(val)
    localStorage.setItem('thriv_settings_avatar_frame', val)
  }
  const toggleSharePortfolio = () => {
    const next = !sharePortfolio
    setSharePortfolio(next)
    localStorage.setItem('thriv_settings_share_portfolio', String(next))
  }
  const changeProfileBackground = (val: string) => {
    setProfileBackground(val)
    localStorage.setItem('thriv_settings_profile_background', val)
  }
  const toggleShowLevelBadge = () => {
    const next = !showLevelBadge
    setShowLevelBadge(next)
    localStorage.setItem('thriv_settings_show_level_badge', String(next))
  }

  const changePositionSizeModel = (val: string) => {
    setPositionSizeModel(val)
    localStorage.setItem('thriv_settings_pos_size_model', val)
  }
  const changeFixedQtyUsd = (val: string) => {
    setFixedQtyUsd(val)
    localStorage.setItem('thriv_settings_fixed_qty_usd', val)
  }
  const changeSlippageFactor = (val: string) => {
    setSlippageFactor(val)
    localStorage.setItem('thriv_settings_slippage_factor', val)
  }
  const changeCommissionTier = (val: string) => {
    setCommissionTier(val)
    localStorage.setItem('thriv_settings_commission_tier', val)
  }
  const toggleShortSelling = () => {
    const next = !shortSellingEnabled
    setShortSellingEnabled(next)
    localStorage.setItem('thriv_settings_short_selling', String(next))
  }
  const toggleAutoLoadSearchSymbol = () => {
    const next = !autoLoadSearchSymbol
    setAutoLoadSearchSymbol(next)
    localStorage.setItem('thriv_settings_auto_load_search', String(next))
  }

  const changeDefaultChartInterval = (val: string) => {
    setDefaultChartInterval(val)
    localStorage.setItem('thriv_settings_chart_interval', val)
  }
  const changeChartLayoutStyle = (val: string) => {
    setChartLayoutStyle(val)
    localStorage.setItem('thriv_settings_chart_layout', val)
  }
  const toggleAutoDrawPivotZones = () => {
    const next = !autoDrawPivotZones
    setAutoDrawPivotZones(next)
    localStorage.setItem('thriv_settings_auto_draw_pivots', String(next))
  }
  const toggleShowCrosshairLabels = () => {
    const next = !showCrosshairLabels
    setShowCrosshairLabels(next)
    localStorage.setItem('thriv_settings_crosshair_labels', String(next))
  }
  const toggleShowRsiOscillator = () => {
    const next = !showRsiOscillator
    setShowRsiOscillator(next)
    localStorage.setItem('thriv_settings_show_rsi', String(next))
  }
  const toggleShowMacdOscillator = () => {
    const next = !showMacdOscillator
    setShowMacdOscillator(next)
    localStorage.setItem('thriv_settings_show_macd', String(next))
  }

  const toggleAutoCooldownLock = () => {
    const next = !autoCooldownLock
    setAutoCooldownLock(next)
    localStorage.setItem('thriv_settings_auto_cooldown', String(next))
  }
  const toggleKeyPressAudio = () => {
    const next = !keyPressAudio
    setKeyPressAudio(next)
    localStorage.setItem('thriv_settings_key_press_audio', String(next))
  }
  const toggleVibrationFeedback = () => {
    const next = !vibrationFeedback
    setVibrationFeedback(next)
    localStorage.setItem('thriv_settings_vibration', String(next))
  }
  const changePerformanceMode = (val: string) => {
    setPerformanceMode(val)
    localStorage.setItem('thriv_settings_performance_mode', val)
  }
  const toggleDevLogsEnabled = () => {
    const next = !devLogsEnabled
    setDevLogsEnabled(next)
    localStorage.setItem('thriv_settings_dev_logs', String(next))
  }

  useEffect(() => {
    if (!showResetModal) {
      setConfirmResetType(null)
    }
  }, [showResetModal])

  const [wasOpen, setWasOpen] = useState(false)

  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (!wasOpen) {
        setName(user?.displayName ?? '')
        setMotto(progress.profile?.motto ?? '')
        setAccentId(progress.profile?.accentId ?? DEFAULT_PROFILE.accentId)
        setMaxLossThreshold(progress.profile?.maxLossThreshold ?? 0)
        setPushNotificationsEnabled(progress.profile?.pushNotificationsEnabled ?? false)
        setDefaultOrderType(progress.profile?.defaultOrderType ?? 'market')
        setDefaultOrderQty(progress.profile?.defaultOrderQty ?? 10)
        setShowVolume(progress.profile?.showVolume ?? true)
        setSimulationSpeedMultiplier(progress.profile?.simulationSpeedMultiplier ?? 1)
        setTraderArchetype(progress.profile?.traderArchetype ?? DEFAULT_PROFILE.traderArchetype ?? 'day')
        setFeaturedBadge(progress.profile?.featuredBadge ?? DEFAULT_PROFILE.featuredBadge ?? 'novice')
        setProfileCardTheme(progress.profile?.profileCardTheme ?? DEFAULT_PROFILE.profileCardTheme ?? 'glass')
        setLeverageLimit(progress.profile?.leverageLimit ?? DEFAULT_PROFILE.leverageLimit ?? 1)
        setAutoTakeProfit(progress.profile?.autoTakeProfit ?? DEFAULT_PROFILE.autoTakeProfit ?? 'none')
        setLargePositionWarning(progress.profile?.largePositionWarning ?? DEFAULT_PROFILE.largePositionWarning ?? true)
        setChartColorThemeProfile(progress.profile?.chartColorTheme ?? DEFAULT_PROFILE.chartColorTheme ?? 'classic')
        setChartStrokeThickness(progress.profile?.chartStrokeThickness ?? DEFAULT_PROFILE.chartStrokeThickness ?? 'medium')
        setShowStrikePriceMarkers(progress.profile?.showStrikePriceMarkers ?? DEFAULT_PROFILE.showStrikePriceMarkers ?? true)
        setPerformanceModeToggle(progress.profile?.performanceModeToggle ?? DEFAULT_PROFILE.performanceModeToggle ?? false)
        setAudioVolume(progress.profile?.audioVolume ?? DEFAULT_PROFILE.audioVolume ?? 50)
        setAmbientSoundtrack(progress.profile?.ambientSoundtrack ?? DEFAULT_PROFILE.ambientSoundtrack ?? false)
        
        // Load new settings
        setStreakFreeze(progress.profile?.streakFreeze ?? DEFAULT_PROFILE.streakFreeze ?? false)
        setSocialLink(progress.profile?.socialLink ?? DEFAULT_PROFILE.socialLink ?? '')
        setOneClickTrading(progress.profile?.oneClickTrading ?? DEFAULT_PROFILE.oneClickTrading ?? false)
        setPositionConcentrationLimit(progress.profile?.positionConcentrationLimit ?? DEFAULT_PROFILE.positionConcentrationLimit ?? 0)
        setGridlineDensity(progress.profile?.gridlineDensity ?? DEFAULT_PROFILE.gridlineDensity ?? 'medium')
        setShowMacd(progress.profile?.showMacd ?? DEFAULT_PROFILE.showMacd ?? false)
        setAutoBackupSchedule(progress.profile?.autoBackupSchedule ?? DEFAULT_PROFILE.autoBackupSchedule ?? 'off')
        setSoundEffectsVolume(progress.profile?.soundEffectsVolume ?? DEFAULT_PROFILE.soundEffectsVolume ?? 50)

        setWasOpen(true)
      }
    } else {
      setWasOpen(false)
    }
  }, [open, user?.displayName, progress.profile, wasOpen])

  if (!open) return null

  const initial = (name || (user?.displayName ?? 'T')).charAt(0).toUpperCase()

  function applyProfile(next: Partial<ProfilePrefs>) {
    const merged = mergeProfilePrefs({
      accentId,
      motto,
      maxLossThreshold,
      pushNotificationsEnabled,
      defaultOrderType,
      defaultOrderQty,
      showVolume,
      simulationSpeedMultiplier,
      traderArchetype,
      featuredBadge,
      profileCardTheme,
      leverageLimit,
      autoTakeProfit,
      largePositionWarning,
      chartColorTheme: chartColorThemeProfile,
      chartStrokeThickness,
      showStrikePriceMarkers,
      performanceModeToggle,
      audioVolume,
      ambientSoundtrack,
      
      streakFreeze,
      socialLink,
      oneClickTrading,
      positionConcentrationLimit,
      gridlineDensity,
      showMacd,
      autoBackupSchedule,
      soundEffectsVolume,
      ...next
    })
    setAccentId(merged.accentId)
    setMotto(merged.motto)
    if (merged.maxLossThreshold !== undefined) setMaxLossThreshold(merged.maxLossThreshold)
    if (merged.pushNotificationsEnabled !== undefined) setPushNotificationsEnabled(merged.pushNotificationsEnabled)
    if (merged.defaultOrderType !== undefined) setDefaultOrderType(merged.defaultOrderType)
    if (merged.defaultOrderQty !== undefined) setDefaultOrderQty(merged.defaultOrderQty)
    if (merged.showVolume !== undefined) setShowVolume(merged.showVolume)
    if (merged.simulationSpeedMultiplier !== undefined) setSimulationSpeedMultiplier(merged.simulationSpeedMultiplier)
    
    if (merged.traderArchetype !== undefined) setTraderArchetype(merged.traderArchetype)
    if (merged.featuredBadge !== undefined) setFeaturedBadge(merged.featuredBadge)
    if (merged.profileCardTheme !== undefined) setProfileCardTheme(merged.profileCardTheme)
    if (merged.leverageLimit !== undefined) setLeverageLimit(merged.leverageLimit)
    if (merged.autoTakeProfit !== undefined) setAutoTakeProfit(merged.autoTakeProfit)
    if (merged.largePositionWarning !== undefined) setLargePositionWarning(merged.largePositionWarning)
    if (merged.chartColorTheme !== undefined) setChartColorThemeProfile(merged.chartColorTheme)
    if (merged.chartStrokeThickness !== undefined) setChartStrokeThickness(merged.chartStrokeThickness)
    if (merged.showStrikePriceMarkers !== undefined) setShowStrikePriceMarkers(merged.showStrikePriceMarkers)
    if (merged.performanceModeToggle !== undefined) setPerformanceModeToggle(merged.performanceModeToggle)
    if (merged.audioVolume !== undefined) setAudioVolume(merged.audioVolume)
    if (merged.ambientSoundtrack !== undefined) setAmbientSoundtrack(merged.ambientSoundtrack)
    
    if (merged.streakFreeze !== undefined) setStreakFreeze(merged.streakFreeze)
    if (merged.socialLink !== undefined) setSocialLink(merged.socialLink)
    if (merged.oneClickTrading !== undefined) setOneClickTrading(merged.oneClickTrading)
    if (merged.positionConcentrationLimit !== undefined) setPositionConcentrationLimit(merged.positionConcentrationLimit)
    if (merged.gridlineDensity !== undefined) setGridlineDensity(merged.gridlineDensity)
    if (merged.showMacd !== undefined) setShowMacd(merged.showMacd)
    if (merged.autoBackupSchedule !== undefined) setAutoBackupSchedule(merged.autoBackupSchedule)
    if (merged.soundEffectsVolume !== undefined) setSoundEffectsVolume(merged.soundEffectsVolume)

    onProfileChange(merged)
  }

  async function saveAccount() {
    if (!name.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      if (mode === 'authenticated') {
        await updateDisplayName(name.trim())
      }
      applyProfile({
        motto: motto.trim(),
        accentId,
        maxLossThreshold,
        pushNotificationsEnabled,
        defaultOrderType,
        defaultOrderQty,
        showVolume,
        simulationSpeedMultiplier,
        traderArchetype,
        featuredBadge,
        profileCardTheme,
        leverageLimit,
        autoTakeProfit,
        largePositionWarning,
        chartColorTheme: chartColorThemeProfile,
        chartStrokeThickness,
        showStrikePriceMarkers,
        performanceModeToggle,
        audioVolume,
        ambientSoundtrack,
        
        streakFreeze,
        socialLink: socialLink.trim(),
        oneClickTrading,
        positionConcentrationLimit,
        gridlineDensity,
        showMacd,
        autoBackupSchedule,
        soundEffectsVolume,
      })
      setMessage('Profile saved.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          { portfolio, progress, exportedAt: new Date().toISOString() },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thriv-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Background Overlay - Desktop only */}
      <button
        type="button"
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm hidden md:block animate-in fade-in duration-200"
        aria-label="Close settings"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-[90] w-full h-full flex flex-col overflow-hidden bg-surface-900 animate-slide-in-right md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[calc(100%-2rem)] md:max-w-[1002px] md:h-[730px] md:max-h-[85vh] md:rounded-2xl md:border md:border-white/[0.08] md:shadow-2xl md:animate-none">
        
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4 md:px-5 md:py-4 shrink-0 bg-surface-950/40">
          <div>
            <h2 className="font-display font-semibold text-base md:text-xl tracking-tight text-white">Settings</h2>
            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">Customize your simulation profile and preferences</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg hover:bg-surface-800 transition-colors text-slate-400 hover:text-white touch-manipulation cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5 md:h-5 md:w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="hidden md:flex w-[220px] shrink-0 border-r border-white/[0.06] bg-surface-950/20 p-4 flex-col justify-between">
            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const active = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                      active
                        ? 'bg-surface-800 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-slate-400 hover:bg-surface-800/40 hover:text-slate-100'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-full bg-thriv-500" />
                    )}
                    <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
            
            <button
              type="button"
              onClick={() => {
                logout()
                onClose()
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} />
              Sign Out
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
            {activeCategory === 'profile' && (
              <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-6 md:space-y-0 animate-in fade-in duration-150">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <ProfileAvatar initial={initial} accentId={accentId} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold truncate text-white">
                        {name || 'Trader'}
                      </p>
                      {user && (
                        <p className="text-xs text-slate-500 font-mono truncate">{user.email}</p>
                      )}
                    </div>
                    {mode === 'authenticated' && (
                      <button
                        type="button"
                        onClick={handleManualSync}
                        disabled={syncStatus === 'syncing'}
                        className="flex items-center gap-1.5 text-[10px] font-semibold shrink-0 bg-surface-900/60 border border-white/[0.04] px-2.5 py-1.5 rounded-lg hover:bg-surface-800 hover:border-white/[0.08] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-80"
                      >
                        {syncStatus === 'syncing' ? (
                          <span className="flex items-center gap-1.5 text-thriv-400 font-mono">
                            <span className="h-1.5 w-1.5 rounded-full bg-thriv-400 animate-pulse" />
                            SYNCING
                          </span>
                        ) : syncStatus === 'error' ? (
                          <span className="flex items-center gap-1.5 text-amber-500 font-mono">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            RE-SYNC
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            SYNCED
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-350">
                      <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Identity details
                    </p>
                    {mode === 'authenticated' && (
                      <div>
                        <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1">
                          Display name
                        </label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-lg border border-white/[0.08] bg-surface-800 py-2 px-3 text-sm focus:outline-none focus:border-thriv-500/50"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1">
                        Motto <span className="normal-case text-slate-600">(optional)</span>
                      </label>
                      <input
                        value={motto}
                        onChange={(e) => setMotto(e.target.value.slice(0, 48))}
                        placeholder="e.g. Discipline over noise"
                        className="w-full rounded-lg border border-white/[0.08] bg-surface-800 py-2 px-3 text-sm focus:outline-none focus:border-thriv-500/50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={saveAccount}
                      disabled={saving}
                      className="w-full rounded-lg border border-thriv-600/40 bg-thriv-800/60 py-2 text-sm font-semibold hover:bg-thriv-800 transition-colors cursor-pointer text-white"
                    >
                      {saving ? 'Saving…' : 'Save profile'}
                    </button>
                    {message && <p className="text-xs text-thriv-400 mt-1">{message}</p>}
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <p className="mb-3 flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <Palette className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Accent color
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ACCENT_OPTIONS.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => applyProfile({ accentId: a.id })}
                          className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                            accentId === a.id
                              ? `${a.ring} ${a.bg} border-transparent ring-2`
                              : 'border-white/[0.06] bg-surface-900 text-slate-500 hover:border-white/10'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Social & Privacy Card */}
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Social & Privacy Settings
                    </p>
                    
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Leaderboard Privacy</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Hide initials from public leaderboards.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={leaderboardPrivacy}
                        onClick={toggleLeaderboardPrivacy}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          leaderboardPrivacy ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            leaderboardPrivacy ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Public Portfolio Share</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Allow other players to view your active holdings.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sharePortfolio}
                        onClick={toggleSharePortfolio}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          sharePortfolio ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            sharePortfolio ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5">
                        Rank Title Tag Selector
                      </label>
                      <CustomSelect
                        value={rankTitle}
                        onChange={changeRankTitle}
                        options={RANK_OPTIONS}
                      />
                    </div>
 
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5">
                        Regional Display Flag
                      </label>
                      <CustomSelect
                        value={regionFlag}
                        onChange={changeRegionFlag}
                        options={REGION_OPTIONS}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">

                  {/* Profile Layout Cosmetics Card */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4 space-y-4">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <Palette className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Profile Layout Cosmetics
                    </p>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Avatar Frame Accent
                      </label>
                      <CustomSelect
                        value={avatarFrame}
                        onChange={changeAvatarFrame}
                        options={FRAME_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Profile Header Background
                      </label>
                      <CustomSelect
                        value={profileBackground}
                        onChange={changeProfileBackground}
                        options={BG_OPTIONS}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Show Level Badge</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Display your XP Level indicator badge on your cards.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showLevelBadge}
                        onClick={toggleShowLevelBadge}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showLevelBadge ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showLevelBadge ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Profile Settings (3 New Features) */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4 space-y-4 font-sans">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <Award className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Profile Preferences
                    </p>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Trader Archetype
                      </label>
                      <CustomSelect
                        value={traderArchetype}
                        onChange={(val) => {
                          setTraderArchetype(val as 'scalper' | 'day' | 'swing' | 'position')
                          applyProfile({ traderArchetype: val as 'scalper' | 'day' | 'swing' | 'position' })
                        }}
                        options={ARCHETYPE_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Featured Showcase Badge
                      </label>
                      <CustomSelect
                        value={featuredBadge}
                        onChange={(val) => {
                          setFeaturedBadge(val)
                          applyProfile({ featuredBadge: val })
                        }}
                        options={SHOWCASE_BADGE_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Profile Card Theme
                      </label>
                      <CustomSelect
                        value={profileCardTheme}
                        onChange={(val) => {
                          setProfileCardTheme(val as 'glass' | 'terminal' | 'cyber' | 'minimal')
                          applyProfile({ profileCardTheme: val as 'glass' | 'terminal' | 'cyber' | 'minimal' })
                        }}
                        options={PROFILE_THEME_OPTIONS}
                      />
                    </div>

                    {/* Streak Protection Toggle */}
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Streak Protection</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Freeze active daily streak from expiring.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={streakFreeze}
                        onClick={() => {
                          const next = !streakFreeze
                          setStreakFreeze(next)
                          applyProfile({ streakFreeze: next })
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          streakFreeze ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            streakFreeze ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Public Social Handle */}
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Public Social Handle
                      </label>
                      <input
                        value={socialLink}
                        onChange={(e) => {
                          setSocialLink(e.target.value)
                        }}
                        placeholder="e.g. @trader_pro"
                        className="w-full rounded-lg border border-white/[0.08] bg-surface-800 py-2.5 px-3 text-xs focus:outline-none focus:border-thriv-500/50 text-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355 mb-2">
                      Keyboard Shortcuts
                    </p>
                    <ul className="text-xs text-slate-400 space-y-2">
                      <li>
                        <kbd className="rounded border border-white/10 bg-surface-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-350 mr-1.5">
                          /
                        </kbd>
                        Focus market search
                      </li>
                      <li>
                        <kbd className="rounded border border-white/10 bg-surface-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-350 mr-1.5">
                          ESC
                        </kbd>
                        Close settings panel / modals
                      </li>
                      <li>
                        <kbd className="rounded border border-white/10 bg-surface-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-350 mr-1.5">
                          H
                        </kbd>
                        Focus home view
                      </li>
                      <li>
                        <kbd className="rounded border border-white/10 bg-surface-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-350 mr-1.5">
                          P
                        </kbd>
                        Focus portfolio overview
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'trading' && (
              <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-6 md:space-y-0 animate-in fade-in duration-150">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 font-display">Order Routing</h3>
                    
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5">
                        Default Order Type
                      </label>
                      <div className="flex gap-2 p-1 rounded-lg bg-surface-900 border border-white/[0.04] w-full">
                        {(['market', 'limit'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setDefaultOrderType(type)
                              applyProfile({ defaultOrderType: type })
                            }}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                              defaultOrderType === type
                                ? 'bg-thriv-800 text-white shadow-sm ring-1 ring-white/10'
                                : 'text-slate-555 hover:text-slate-300'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-555 mt-1.5 leading-relaxed">
                        Initial selected execution type when opening the trade panel.
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Default Position Sizing Model
                      </label>
                      <CustomSelect
                        value={positionSizeModel}
                        onChange={changePositionSizeModel}
                        options={POS_SIZE_MODEL_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Fixed Order Sizing (USD Backup)
                      </label>
                      <CustomSelect
                        value={fixedQtyUsd}
                        onChange={changeFixedQtyUsd}
                        options={FIXED_SIZE_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5">
                        Default Position Sizing (% of buying power)
                      </label>
                      <div className="grid grid-cols-5 gap-1.5 p-1 rounded-lg bg-surface-900 border border-white/[0.04]">
                        {([5, 10, 25, 50, 100] as const).map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setDefaultOrderQty(pct)
                              applyProfile({ defaultOrderQty: pct })
                            }}
                            className={`py-1.5 text-xs font-mono font-semibold rounded-md transition-all ${
                              defaultOrderQty === pct
                                ? 'bg-thriv-800 text-white shadow-sm ring-1 ring-white/10'
                                : 'text-slate-555 hover:text-slate-300'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-555 mt-1.5 leading-relaxed">
                        Pre-calculates the starting number of shares to match this percentage of your available balance.
                      </p>
                    </div>
                  </div>

                  {/* Execution preferences Card */}
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 font-display">Execution Preferences</h3>
                    
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Confirm Orders</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Show confirmation prompt before trade execution.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={preTradeConfirm}
                        onClick={togglePreTradeConfirm}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          preTradeConfirm ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            preTradeConfirm ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5">
                        Default Time-In-Force (TIF)
                      </label>
                      <CustomSelect
                        value={timeInForce}
                        onChange={changeTimeInForce}
                        options={TIF_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Slippage Simulation Factor
                      </label>
                      <CustomSelect
                        value={slippageFactor}
                        onChange={changeSlippageFactor}
                        options={SLIPPAGE_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Commissions & Fees Sizing
                      </label>
                      <CustomSelect
                        value={commissionTier}
                        onChange={changeCommissionTier}
                        options={COMMISSION_OPTIONS}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4 space-y-4">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Risk management
                    </p>
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1">
                        Daily Max Loss Limit
                      </label>
                      <CustomSelect
                        value={maxLossThreshold}
                        onChange={(val) => {
                          setMaxLossThreshold(val)
                          applyProfile({ maxLossThreshold: val })
                        }}
                        options={MAX_LOSS_OPTIONS}
                      />
                      <p className="mt-1.5 text-[10px] md:text-xs text-slate-555 leading-normal">
                        Locks buy and sell orders automatically if your total portfolio equity falls below this percentage from the start of the day.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Enable Short Selling</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Allow borrowing shares to sell short.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={shortSellingEnabled}
                        onClick={toggleShortSelling}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          shortSellingEnabled ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            shortSellingEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Leverage Warning settings */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4 space-y-3">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Margin & Navigation Controls
                    </p>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Margin Borrow Warnings</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Alert when order execution triggers margin loans.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={marginWarning}
                        onClick={toggleMarginWarning}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          marginWarning ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            marginWarning ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Search Autofill Symbol</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Load symbol to trade panel instantly when selected.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoLoadSearchSymbol}
                        onClick={toggleAutoLoadSearchSymbol}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          autoLoadSearchSymbol ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            autoLoadSearchSymbol ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Trading Settings (3 New Features) */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4 space-y-4 font-sans">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <Sliders className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Trading Preferences
                    </p>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Trading Leverage Limit
                      </label>
                      <CustomSelect
                        value={leverageLimit}
                        onChange={(val) => {
                          setLeverageLimit(val)
                          applyProfile({ leverageLimit: val })
                        }}
                        options={LEVERAGE_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Auto Take-Profit Default
                      </label>
                      <CustomSelect
                        value={autoTakeProfit}
                        onChange={(val) => {
                          setAutoTakeProfit(val)
                          applyProfile({ autoTakeProfit: val })
                        }}
                        options={TAKE_PROFIT_OPTIONS}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Large Position Warning</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Alert when order size exceeds 25% of buying power.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={largePositionWarning}
                        onClick={() => {
                          const next = !largePositionWarning
                          setLargePositionWarning(next)
                          applyProfile({ largePositionWarning: next })
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          largePositionWarning ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            largePositionWarning ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* One-Click Orders Toggle */}
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">One-Click Orders</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Bypass confirmations to route order tickets instantly.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={oneClickTrading}
                        onClick={() => {
                          const next = !oneClickTrading
                          setOneClickTrading(next)
                          applyProfile({ oneClickTrading: next })
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          oneClickTrading ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            oneClickTrading ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Position Concentration limit */}
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Max Position Concentration
                      </label>
                      <CustomSelect
                        value={positionConcentrationLimit}
                        onChange={(val) => {
                          setPositionConcentrationLimit(Number(val))
                          applyProfile({ positionConcentrationLimit: Number(val) })
                        }}
                        options={CONCENTRATION_OPTIONS}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'chart' && (
              <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-6 md:space-y-0 animate-in fade-in duration-150">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 font-display">Technical Analysis Toggles</h3>
                    
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Show Volume Bar Chart</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Display volume histogram bars at the bottom of the stock chart.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showVolume}
                        onClick={() => {
                          const val = !showVolume
                          setShowVolume(val)
                          applyProfile({ showVolume: val })
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showVolume ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showVolume ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Show Moving Averages (EMA 20)</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Draw a 20-day exponential moving average trendline.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showEma}
                        onClick={toggleShowEma}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showEma ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showEma ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Show Gridlines</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Display horizontal and vertical grid lines.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showGrid}
                        onClick={toggleShowGrid}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showGrid ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showGrid ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5">
                        Default Timeframe Interval
                      </label>
                      <CustomSelect
                        value={defaultChartInterval}
                        onChange={changeDefaultChartInterval}
                        options={TIMEFRAME_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Chart Layout Style
                      </label>
                      <CustomSelect
                        value={chartLayoutStyle}
                        onChange={changeChartLayoutStyle}
                        options={CHART_LAYOUT_OPTIONS}
                      />
                    </div>
                  </div>

                  {/* Chart Rendering (3 New Features) */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4 space-y-4 font-sans">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Chart Preferences
                    </p>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Candlestick Theme (Profile Saved)
                      </label>
                      <CustomSelect
                        value={chartColorThemeProfile}
                        onChange={(val) => {
                          setChartColorThemeProfile(val as 'classic' | 'colorblind' | 'monochrome')
                          applyProfile({ chartColorTheme: val as 'classic' | 'colorblind' | 'monochrome' })
                          changeChartColorTheme(val)
                        }}
                        options={CHART_THEME_OPTIONS}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Chart Stroke Thickness
                      </label>
                      <CustomSelect
                        value={chartStrokeThickness}
                        onChange={(val) => {
                          setChartStrokeThickness(val as 'thin' | 'medium' | 'thick')
                          applyProfile({ chartStrokeThickness: val as 'thin' | 'medium' | 'thick' })
                        }}
                        options={CHART_STROKE_OPTIONS}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Show Strike Price Markers</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Draw a dashed marker line for option strike prices.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showStrikePriceMarkers}
                        onClick={() => {
                          const next = !showStrikePriceMarkers
                          setShowStrikePriceMarkers(next)
                          applyProfile({ showStrikePriceMarkers: next })
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showStrikePriceMarkers ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showStrikePriceMarkers ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Gridline Density select */}
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Gridline Density
                      </label>
                      <CustomSelect
                        value={gridlineDensity}
                        onChange={(val) => {
                          setGridlineDensity(val as 'high' | 'medium' | 'low')
                          applyProfile({ gridlineDensity: val as 'high' | 'medium' | 'low' })
                        }}
                        options={DENSITY_OPTIONS}
                      />
                    </div>

                    {/* Show MACD Indicator Toggle */}
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Show MACD Indicator</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Render MACD oscillator below the main stock price.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showMacd}
                        onClick={() => {
                          const next = !showMacd
                          setShowMacd(next)
                          applyProfile({ showMacd: next })
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showMacd ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showMacd ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4 space-y-2">
                    <p className="font-semibold text-xs md:text-sm text-slate-405 font-display uppercase tracking-wider">Pro-Trader Tip</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Volume helps confirm trend strength. A price breakout on high volume is historically more reliable than a breakout on low volume, which can be a false signal.
                    </p>
                  </div>

                  {/* Additional Technical Indicators Card */}
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 font-display">Additional Technical Indicators</h3>
                    
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Auto Pivot Support/Resistance</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Auto-draw support & resistance pivot zones.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoDrawPivotZones}
                        onClick={toggleAutoDrawPivotZones}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          autoDrawPivotZones ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            autoDrawPivotZones ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Interactive Crosshair Labels</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Display pricing scale markers along active cursor position.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showCrosshairLabels}
                        onClick={toggleShowCrosshairLabels}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showCrosshairLabels ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showCrosshairLabels ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Relative Strength Index (RSI)</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Add the 14-period relative strength oscillator below the chart.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showRsiOscillator}
                        onClick={toggleShowRsiOscillator}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showRsiOscillator ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showRsiOscillator ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">MACD Oscillator</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Add Moving Average Convergence Divergence indicators.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showMacdOscillator}
                        onClick={toggleShowMacdOscillator}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showMacdOscillator ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            showMacdOscillator ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeCategory === 'system' && (
              <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-6 md:space-y-0 animate-in fade-in duration-150">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 font-display">Simulation Config</h3>
                    
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5">
                        Market Refresh Frequency (Speed)
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-surface-900 border border-white/[0.04]">
                        {([0.5, 1, 2, 5] as const).map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => {
                              setSimulationSpeedMultiplier(speed)
                              applyProfile({ simulationSpeedMultiplier: speed })
                            }}
                            className={`py-1.5 text-xs font-mono font-semibold rounded-md transition-all ${
                              simulationSpeedMultiplier === speed
                                ? 'bg-thriv-800 text-white shadow-sm ring-1 ring-white/10'
                                : 'text-slate-555 hover:text-slate-350'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-555 mt-1.5 leading-relaxed">
                        Adjusts the simulation speed. High speeds simulate quick daily movements, while lower speeds are best for detailed pattern checking.
                      </p>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">System Notifications</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Send browser alerts when limit orders trigger or news breaks.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={pushNotificationsEnabled}
                        onClick={async () => {
                          const nextVal = !pushNotificationsEnabled
                          if (nextVal) {
                            if ('Notification' in window) {
                              const res = await Notification.requestPermission()
                              if (res === 'granted') {
                                setPushNotificationsEnabled(true)
                                applyProfile({ pushNotificationsEnabled: true })
                              } else {
                                alert('Notification permission denied by browser.')
                              }
                            } else {
                              alert('This browser does not support desktop notifications.')
                            }
                          } else {
                            setPushNotificationsEnabled(false)
                            applyProfile({ pushNotificationsEnabled: false })
                          }
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          pushNotificationsEnabled ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            pushNotificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Performance / CSS Rendering
                      </label>
                      <CustomSelect
                        value={performanceMode}
                        onChange={changePerformanceMode}
                        options={PERFORMANCE_OPTIONS}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Developer Sandbox Logs</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Output simulator ticks to browser console.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={devLogsEnabled}
                        onClick={toggleDevLogsEnabled}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          devLogsEnabled ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            devLogsEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Audio & Theme settings */}
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 font-display">Sound & UI Variant</h3>
                    
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Execution Sound Feedback</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Play visual audio chimes on active trades.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={audioEnabled}
                        onClick={toggleAudioEnabled}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          audioEnabled ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            audioEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Interactive Audio Click Cues</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Provide tick sound effects on keypress interactions.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={keyPressAudio}
                        onClick={toggleKeyPressAudio}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          keyPressAudio ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            keyPressAudio ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Mobile Haptic Vibration</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Trigger physical device haptic vibrations on trade actions.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={vibrationFeedback}
                        onClick={toggleVibrationFeedback}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          vibrationFeedback ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            vibrationFeedback ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5">
                        Dashboard Workspace Grid Layout
                      </label>
                      <CustomSelect
                        value={appThemeVariant}
                        onChange={changeAppThemeVariant}
                        options={WORKSPACE_OPTIONS}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">Database & Safety Tools</h3>
                    
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Daily Cooldown Safety Lock</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Lock account for 1 hour if drawdown hits 3% threshold.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoCooldownLock}
                        onClick={toggleAutoCooldownLock}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          autoCooldownLock ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            autoCooldownLock ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={exportData}
                        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-900 px-4 py-2.5 text-xs hover:border-white/10 transition-colors text-slate-200 cursor-pointer"
                      >
                        <Download className="h-4 w-4 text-thriv-400" strokeWidth={1.75} />
                        Backup Portfolio (JSON Export)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetModal(true)}
                        className="w-full rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-2.5 text-xs text-red-300 hover:border-red-500/40 transition-colors cursor-pointer"
                      >
                        Wipe / Reset Simulator Data
                      </button>
                    </div>
                  </div>

                  {/* Data archiving Card */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <p className="mb-2 text-xs md:text-sm font-semibold uppercase tracking-wider text-slate-400 font-display">Data Archiving</p>
                    <CustomSelect
                      value={autoArchive}
                      onChange={changeAutoArchive}
                      options={ARCHIVE_OPTIONS}
                    />
                  </div>

                  {/* System Settings (3 New Features) */}
                  <div className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4 space-y-4 font-sans">
                    <p className="flex items-center gap-2 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-slate-355">
                      <Cpu className="h-3.5 w-3.5" strokeWidth={1.75} />
                      System Preferences
                    </p>

                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        System Audio Volume
                      </label>
                      <CustomSelect
                        value={audioVolume}
                        onChange={(val) => {
                          setAudioVolume(val)
                          applyProfile({ audioVolume: val })
                        }}
                        options={VOLUME_OPTIONS}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Ambient Synth Soundtrack</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Play continuous cyberpunk synth hum in the background.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={ambientSoundtrack}
                        onClick={() => {
                          const next = !ambientSoundtrack
                          setAmbientSoundtrack(next)
                          applyProfile({ ambientSoundtrack: next })
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          ambientSoundtrack ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            ambientSoundtrack ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-200">Eco battery-saver mode</p>
                        <p className="text-[10px] md:text-xs text-slate-555 leading-normal">
                          Disables background glow and minor live-pulse animations.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={performanceModeToggle}
                        onClick={() => {
                          const next = !performanceModeToggle
                          setPerformanceModeToggle(next)
                          applyProfile({ performanceModeToggle: next })
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          performanceModeToggle ? 'bg-thriv-600' : 'bg-surface-800'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            performanceModeToggle ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Automated Profile Backup */}
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Automated Profile Backup
                      </label>
                      <CustomSelect
                        value={autoBackupSchedule}
                        onChange={(val) => {
                          setAutoBackupSchedule(val as 'off' | 'daily' | 'weekly')
                          applyProfile({ autoBackupSchedule: val as 'off' | 'daily' | 'weekly' })
                        }}
                        options={BACKUP_OPTIONS}
                      />
                    </div>

                    {/* Interface Sound Volume */}
                    <div>
                      <label className="text-[10px] md:text-xs uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
                        Sound Effects Volume
                      </label>
                      <CustomSelect
                        value={soundEffectsVolume}
                        onChange={(val) => {
                          setSoundEffectsVolume(Number(val))
                          applyProfile({ soundEffectsVolume: Number(val) })
                        }}
                        options={SFX_VOLUME_OPTIONS}
                      />
                    </div>
                  </div>

                  {mode === 'guest' && (
                    <p className="text-xs text-slate-400 rounded-xl border border-white/[0.06] bg-surface-800/50 p-4 leading-relaxed">
                      Guest mode stores customization locally. Create an account to sync across devices.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeCategory === 'legal' && (
              <>
              <div className="w-full md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-6 md:space-y-0 animate-in fade-in duration-150">
                <div className="space-y-6">
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">Compliance & Regulatory</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Thriv is an educational platform designed strictly for simulated market trading. No real capital or securities are held, and all performance is simulated. Read the formal policy documents below.
                    </p>
                  </div>

                  {/* Collapsible Integrity Details */}
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">System Integrity Details</h3>
                    <div className="space-y-2 text-xs">
                      {/* Item 1 */}
                      <button
                        type="button"
                        onClick={() => setExpandedDoc(expandedDoc === 'simulated' ? null : 'simulated')}
                        className="flex w-full items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-surface-900/40 hover:bg-surface-800 text-left text-slate-300"
                      >
                        <span className="font-medium">1. Simulated Trading Policy</span>
                        <span className="text-slate-500">{expandedDoc === 'simulated' ? '▲' : '▼'}</span>
                      </button>
                      {expandedDoc === 'simulated' && (
                        <p className="p-2.5 bg-surface-950/40 rounded-lg text-[11px] text-slate-400 leading-relaxed animate-in fade-in duration-200">
                          Thriv strictly utilizes simulated balances. No real execution is performed. All news, stock quotes, and index movements are simulated.
                        </p>
                      )}

                      {/* Item 2 */}
                      <button
                        type="button"
                        onClick={() => setExpandedDoc(expandedDoc === 'privacy' ? null : 'privacy')}
                        className="flex w-full items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-surface-900/40 hover:bg-surface-800 text-left text-slate-300"
                      >
                        <span className="font-medium">2. Data Storage Policy</span>
                        <span className="text-slate-500">{expandedDoc === 'privacy' ? '▲' : '▼'}</span>
                      </button>
                      {expandedDoc === 'privacy' && (
                        <p className="p-2.5 bg-surface-950/40 rounded-lg text-[11px] text-slate-400 leading-relaxed animate-in fade-in duration-200">
                          All local preference cookies, database tables, and portfolio histories are kept locally on this device within the browser's IndexedDB. No trading data is sold.
                        </p>
                      )}

                      {/* Item 3 */}
                      <button
                        type="button"
                        onClick={() => setExpandedDoc(expandedDoc === 'build' ? null : 'build')}
                        className="flex w-full items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-surface-900/40 hover:bg-surface-800 text-left text-slate-300"
                      >
                        <span className="font-medium">3. System Engine & Build</span>
                        <span className="text-slate-500">{expandedDoc === 'build' ? '▲' : '▼'}</span>
                      </button>
                      {expandedDoc === 'build' && (
                        <div className="p-2.5 bg-surface-950/40 rounded-lg text-[10px] font-mono text-slate-400 space-y-1 animate-in fade-in duration-200">
                          <p>Core Engine: v1.4.0-stable</p>
                          <p>Market Simulation: Speed-Locked v2.4</p>
                          <p>DB Adapter: IndexedDB Storage Adapter</p>
                          <p>Client Sync Bridge: active-save-sync</p>
                        </div>
                      )}

                      {/* Item 4 */}
                      <button
                        type="button"
                        onClick={() => setExpandedDoc(expandedDoc === 'tax' ? null : 'tax')}
                        className="flex w-full items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-surface-900/40 hover:bg-surface-800 text-left text-slate-300"
                      >
                        <span className="font-medium">4. Tax Liability Disclaimer</span>
                        <span className="text-slate-500">{expandedDoc === 'tax' ? '▲' : '▼'}</span>
                      </button>
                      {expandedDoc === 'tax' && (
                        <p className="p-2.5 bg-surface-950/40 rounded-lg text-[11px] text-slate-400 leading-relaxed animate-in fade-in duration-200">
                          Since all trades executed on Thriv are 100% simulated, profits and losses do not incur real tax liabilities. Do not report simulation gains to the IRS.
                        </p>
                      )}

                      {/* Item 5 */}
                      <button
                        type="button"
                        onClick={() => setExpandedDoc(expandedDoc === 'data' ? null : 'data')}
                        className="flex w-full items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-surface-900/40 hover:bg-surface-800 text-left text-slate-300"
                      >
                        <span className="font-medium">5. Sourcing License Disclaimer</span>
                        <span className="text-slate-500">{expandedDoc === 'data' ? '▲' : '▼'}</span>
                      </button>
                      {expandedDoc === 'data' && (
                        <p className="p-2.5 bg-surface-950/40 rounded-lg text-[11px] text-slate-400 leading-relaxed animate-in fade-in duration-200">
                          Stock data feeds, ticker charts, and news headlines are generated by a synthetic mock data engine. Values do not sync with live NYSE/NASDAQ quotes.
                        </p>
                      )}

                      {/* Item 6 */}
                      <button
                        type="button"
                        onClick={() => setExpandedDoc(expandedDoc === 'risk' ? null : 'risk')}
                        className="flex w-full items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-surface-900/40 hover:bg-surface-800 text-left text-slate-300"
                      >
                        <span className="font-medium">6. Risk Disclosure Notice</span>
                        <span className="text-slate-500">{expandedDoc === 'risk' ? '▲' : '▼'}</span>
                      </button>
                      {expandedDoc === 'risk' && (
                        <p className="p-2.5 bg-surface-950/40 rounded-lg text-[11px] text-slate-400 leading-relaxed animate-in fade-in duration-200">
                          Simulated trading carries no financial risk, but is intended to build risk-awareness. Note that simulator success does not guarantee profit in real markets due to slippage, emotions, and capital constraints.
                        </p>
                      )}

                      {/* Item 7 */}
                      <button
                        type="button"
                        onClick={() => setExpandedDoc(expandedDoc === 'edu' ? null : 'edu')}
                        className="flex w-full items-center justify-between p-2.5 rounded-lg border border-white/[0.04] bg-surface-900/40 hover:bg-surface-800 text-left text-slate-300"
                      >
                        <span className="font-medium">7. Educational Use License</span>
                        <span className="text-slate-500">{expandedDoc === 'edu' ? '▲' : '▼'}</span>
                      </button>
                      {expandedDoc === 'edu' && (
                        <p className="p-2.5 bg-surface-950/40 rounded-lg text-[11px] text-slate-400 leading-relaxed animate-in fade-in duration-200">
                          Thriv is licensed solely for personal, non-commercial educational purposes. The mock indicators, news articles, and price charts do not constitute professional investment recommendations.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">Formal Policy Documents</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => openLegalPage('terms')}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/[0.06] bg-surface-900 hover:border-white/15 transition-all text-slate-300 hover:text-white cursor-pointer"
                      >
                        <Scale className="h-6 w-6 text-slate-500 mb-2" strokeWidth={1.5} />
                        <span className="text-xs font-semibold">Terms of Service</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">Updated: May 2026</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openLegalPage('privacy')}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/[0.06] bg-surface-900 hover:border-white/15 transition-all text-slate-300 hover:text-white cursor-pointer"
                      >
                        <Shield className="h-6 w-6 text-slate-500 mb-2" strokeWidth={1.5} />
                        <span className="text-xs font-semibold">Privacy Policy</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5">Updated: May 2026</span>
                      </button>
                    </div>
                  </div>

                  {/* Simulator Understanding Certification Card */}
                  <div className="space-y-4 rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">Simulator Certification</h3>
                    
                    {certifySimulatorChecked ? (
                      <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                          <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>Certified Simulator Practitioner</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                          Digital certification status: **ACTIVE**. You have verified your understanding of the simulated trading rules and platform limitations.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setCertifySimulatorChecked(false)
                            localStorage.setItem('thriv_settings_certify_simulator', 'false')
                            setCertifyText('')
                          }}
                          className="mt-1.5 self-start text-[10px] font-semibold text-slate-400 hover:text-white bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-all cursor-pointer"
                        >
                          Reset Certification
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-lg border border-white/[0.08] bg-surface-900/60 p-3 text-xs animate-in fade-in duration-200">
                        <p className="text-[11px] text-slate-350 leading-normal font-sans">
                          Thriv is strictly a simulated trading experience. Real money is never used, earned, or lost. Type **"I UNDERSTAND"** below to certify and activate your verification badge.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={certifyText}
                            onChange={(e) => setCertifyText(e.target.value)}
                            placeholder='Type "I UNDERSTAND"'
                            className="flex-1 rounded-lg border border-white/[0.08] bg-surface-800 py-1.5 px-3 text-xs focus:outline-none focus:border-thriv-500/50 text-white font-mono"
                          />
                          <button
                            type="button"
                            disabled={certifyText.trim().toUpperCase() !== 'I UNDERSTAND'}
                            onClick={() => {
                              setCertifySimulatorChecked(true)
                              localStorage.setItem('thriv_settings_certify_simulator', 'true')
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                              certifyText.trim().toUpperCase() === 'I UNDERSTAND'
                                ? 'bg-thriv-600 border border-thriv-500/30 text-white hover:bg-thriv-500'
                                : 'bg-surface-800 border border-white/[0.04] text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Legal Footer with dynamic copyright year */}
              <div className="mt-2 pt-4 border-t border-white/[0.04] text-center">
                <p className="text-[10px] text-slate-600 font-mono">
                  &copy; {new Date().getFullYear()} Thriv. All rights reserved.
                </p>
              </div>
              </>
            )}
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-3 border-t border-white/[0.06] p-4 shrink-0 bg-surface-950/20">
          <div className="grid grid-cols-5 gap-1 bg-surface-950/40 p-1 rounded-xl border border-white/[0.04]">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const active = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors cursor-pointer ${
                    active
                      ? 'bg-surface-800 text-thriv-400 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2 : 1.75} />
                  <span className="text-[9px] mt-0.5 scale-95 tracking-tight font-medium">{cat.label}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              logout()
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-surface-800/40 hover:bg-surface-800 hover:text-white py-2.5 text-xs font-medium text-slate-300 touch-manipulation min-h-[44px]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </div>

      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-surface-900 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            {confirmResetType === null ? (
              <>
                <div className="flex items-center gap-2.5 text-amber-500">
                  <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  <h3 className="font-display font-semibold tracking-tight text-white">Reset Simulation</h3>
                </div>
                
                <p className="text-xs leading-relaxed text-slate-400">
                  Select how you want to reset your simulator experience. This action is permanent and cannot be undone.
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setConfirmResetType('balance')}
                    className="w-full text-left rounded-xl border border-thriv-500/10 bg-thriv-950/25 p-3 hover:bg-thriv-950/40 hover:border-thriv-500/30 transition-all touch-manipulation duration-150"
                  >
                    <p className="text-xs font-semibold text-thriv-300">Option 1: Reset balance only</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Resets cash to $100,000 and clears active holdings. Your Level, XP, achievements, streaks, and quest history are kept.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmResetType('full')}
                    className="w-full text-left rounded-xl border border-red-500/10 bg-red-950/15 p-3 hover:bg-red-950/25 hover:border-red-500/30 transition-all touch-manipulation duration-150"
                  >
                    <p className="text-xs font-semibold text-red-300">Option 2: Reset everything (Full wipe)</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Clears everything, including portfolio value, transaction history, watchlists, levels, XP, streaks, and quest progression.
                    </p>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full rounded-xl border border-white/[0.08] bg-surface-800 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-700 transition-colors touch-manipulation min-h-[40px]"
                >
                  Cancel
                </button>
              </>
            ) : confirmResetType === 'balance' ? (
              <>
                <div className="flex items-center gap-2.5 text-amber-500">
                  <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  <h3 className="font-display font-semibold tracking-tight text-white">Confirm Balance Reset</h3>
                </div>

                <p className="text-xs leading-relaxed text-slate-400">
                  Are you sure you want to reset your simulator balance? This will close all active holdings and reset your cash to $100,000. Your levels, XP, achievements, streaks, and quest history will NOT be affected.
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      onBalanceReset()
                      setConfirmResetType(null)
                      setShowResetModal(false)
                      onClose()
                    }}
                    className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors touch-manipulation min-h-[40px]"
                  >
                    Yes, reset my balance
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmResetType(null)}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-800 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-700 transition-colors touch-manipulation min-h-[40px]"
                  >
                    Go back
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 text-red-500 animate-pulse">
                  <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                  <h3 className="font-display font-semibold tracking-tight text-white">CRITICAL: Confirm Full Wipe</h3>
                </div>

                <p className="text-xs leading-relaxed text-slate-400">
                  This will permanently delete all of your portfolio data, levels, XP, achievements, streaks, and quest progress. This action is irreversible. Are you absolutely sure?
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      onFullReset()
                      setConfirmResetType(null)
                      setShowResetModal(false)
                      onClose()
                    }}
                    className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors touch-manipulation min-h-[40px]"
                  >
                    Yes, delete everything
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmResetType(null)}
                    className="w-full rounded-xl border border-white/[0.08] bg-surface-800 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-700 transition-colors touch-manipulation min-h-[40px]"
                  >
                    Go back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
            {/* ── TERMS OF SERVICE MODAL ─────────────────── */}
      {legalPage === 'terms' && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-[#06080c] animate-in slide-in-from-right duration-250">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-thriv-500/25 to-transparent shrink-0" />
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-4 shrink-0 bg-[#06080c]/80 backdrop-blur-md">
            <button
              type="button"
              onClick={() => closeLegalPage()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors touch-manipulation"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2">
              <div>
                <h2 className="font-display font-medium tracking-tight text-sm sm:text-lg text-slate-100">Terms of Service</h2>
                <p className="text-[10px] text-slate-500 font-mono">Last updated: May 26, 2026</p>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 scrollbar-thin bg-[#06080c]">
            <div className="mx-auto w-full max-w-3xl space-y-6 py-8 md:py-12">
              {/* Preamble */}
              <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3.5 md:p-6">
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400">
                  By accessing or using <span className="text-thriv-400 font-medium">Thriv</span>, you agree to these Terms of Service in full. If you do not agree, please discontinue use of the platform immediately.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">01</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Educational Simulation Only</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv is a <span className="text-slate-300 font-medium">strictly educational, paper-trading simulation platform</span>. It is designed solely to help users learn about financial markets, investing concepts, and trading mechanics in a risk-free environment. Nothing on this platform constitutes a real brokerage account, financial advisory service, or investment product of any kind.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  All market activity, transaction execution, portfolio tracking, and performance reports within Thriv are entirely simulated. No real securities, currencies, or commodities are bought, sold, or held on behalf of any user. Users representation of simulated holdings does not correspond to actual ownership of real-world assets.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  <span className="text-slate-300 font-medium">Age Requirement:</span> You represent and warrant that you are at least 18 years of age (or the age of majority in your jurisdiction) or possess legal parental or guardian consent to access and use the platform.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">02</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">No Real-World Monetary Value</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Virtual cash balances, simulated portfolio values, experience points (XP), player levels, achievements, streaks, and any other in-platform rewards or metrics possess <span className="text-slate-300 font-medium">absolutely no real-world monetary value</span>. They are gamified elements of the simulation and:
                </p>
                <ul className="pl-5 sm:pl-8 space-y-2">
                  {[
                    'Cannot be redeemed, liquidated, or cashed out for real currency, assets, or property.',
                    'Cannot be transferred, assigned, or gifted to other users, accounts, or external parties.',
                    'Do not constitute any form of compensation, entitlement, or legal asset.',
                    'Are subject to modification, reset, or deletion at the platform\'s sole discretion.'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[11px] sm:text-sm md:text-base text-slate-400">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">03</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">No Financial Advice or Regulation</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  <span className="text-slate-300 font-medium">No content, data feed, simulation feature, quiz question, or notification on Thriv constitutes financial, investment, tax, or legal advice.</span> All information is provided for educational and analytical purposes only.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv does not provide regulated financial services of any kind and is not registered, licensed, or regulated under any financial regulatory authority or commission in any jurisdiction. Users should consult a licensed, independent financial advisor before making any real-world investing or trading decisions.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded bg-amber-500/[0.03]">04</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Limitation of Liability</h3>
                </div>
                <div className="pl-5 sm:pl-8">
                  <div className="border-l-2 border-amber-500/30 bg-amber-500/[0.02] p-4 md:p-6 rounded-r-lg">
                    <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-300">
                      <span className="text-amber-300 font-semibold">Strict Liability Disclaimer:</span> The platform, its operators, developers, and affiliates are not responsible for any real-world financial losses, opportunity costs, damages, or adverse legal outcomes that a user may incur if they attempt to replicate, adapt, or apply simulation strategies, data points, or platform features to live real-world financial accounts.
                    </p>
                  </div>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Simulated trading performance does not correlate to real trading. Real-world trading involves financial risks, slippage, liquidity constraints, transaction fees, and emotional factors not present in this simulation.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  To the maximum extent permitted by applicable law, in no event shall the total liability of Thriv, its operators, or affiliates exceed USD $0.00.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">05</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Intellectual Property & Data Ownership</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  All real-world company names, brand logos, stock ticker symbols, indices, and financial market tickers referenced on the platform are utilized <span className="text-slate-300 font-medium">solely for educational simulation purposes</span>. All rights, title, and ownership of these marks remain the exclusive intellectual property of their respective owners.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv does not claim any affiliation with, sponsorship by, or ownership of any third-party corporate entities.
                </p>
              </div>

              {/* Section 6 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">06</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">User Conduct</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Users agree to access Thriv in good faith for personal learning. Any attempts to manipulate data feeds, reverse-engineer platform logic, launch automated scrapers, exploit bugs for virtual XP gains, or misrepresent simulated trading results as live trading results are strictly prohibited and may lead to account termination.
                </p>
              </div>

              {/* Section 7 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">07</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Changes to Terms</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv reserves the right to modify these Terms of Service at any time. Continued use of the platform following the publication of any updates constitutes complete acceptance of the revised Terms.
                </p>
              </div>

              {/* Section 8 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">08</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Disclaimer of Warranties</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8 uppercase font-mono tracking-wider text-[10px] sm:text-xs text-slate-300">
                  THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv disclaims all warranties to the fullest extent permitted by law, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, non-infringement, or accuracy of data feeds. We do not warrant that the simulation will be uninterrupted, error-free, or free of security vulnerabilities. Simulated pricing data may suffer from latencies or inaccuracies.
                </p>
              </div>

              {/* Section 9 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">09</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Indemnification</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  You agree to defend, indemnify, and hold harmless Thriv, its developers, operators, and affiliates from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable legal fees) arising out of or relating to your violation of these Terms of Service or your use of the platform.
                </p>
              </div>

              {/* Footer note */}
              <div className="pt-4 pb-2">
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed text-center font-mono">
                  These terms are governed by applicable law. If any provision is deemed unenforceable, the remaining terms shall survive in full force and effect.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky close button */}
          <div className="border-t border-white/[0.04] p-4 shrink-0 bg-[#06080c]">
            <div className="mx-auto w-full max-w-3xl">
              <button
                type="button"
                onClick={() => closeLegalPage()}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white py-3 text-xs sm:text-sm font-semibold text-slate-300 transition-colors touch-manipulation min-h-[48px]"
              >
                Acknowledge and Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRIVACY POLICY MODAL ───────────────────── */}
      {legalPage === 'privacy' && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-[#06080c] animate-in slide-in-from-right duration-250">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-thriv-500/25 to-transparent shrink-0" />
          
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-4 shrink-0 bg-[#06080c]/80 backdrop-blur-md">
            <button
              type="button"
              onClick={() => closeLegalPage()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors touch-manipulation"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2">
              <div>
                <h2 className="font-display font-medium tracking-tight text-sm sm:text-lg text-slate-100">Privacy Policy</h2>
                <p className="text-[10px] text-slate-500 font-mono">Last updated: May 26, 2026</p>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 scrollbar-thin bg-[#06080c]">
            <div className="mx-auto w-full max-w-3xl space-y-6 py-8 md:py-12">
              {/* Preamble */}
              <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3.5 md:p-6">
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400">
                  Your privacy is paramount. This policy clarifies what data <span className="text-thriv-400 font-medium">Thriv</span> processes, how it is secured, and the absolute control you retain.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">01</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Information We Process</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8 mb-2">
                  We operate on a data-minimization framework, gathering only what is required to execute the simulation:
                </p>
                <ul className="pl-5 sm:pl-8 space-y-3.5">
                  {[
                    { label: 'Account Data', desc: 'Secure email addresses and customizable display names supplied during account registration.' },
                    { label: 'Simulation Progress', desc: 'Simulated cash balances, transaction logs, XP points, achievements, and custom preferences stored to keep your data synced across devices.' },
                    { label: 'System Telemetry', desc: 'Anonymized click events or tab selections used strictly to troubleshoot issues and optimize performance.' },
                    { label: 'Technical Details', desc: 'Browser footprints, device screen categories, and high-level region metrics gathered for firewalls.' }
                  ].map(({ label, desc }) => (
                    <li key={label} className="pl-0 text-[11px] sm:text-sm md:text-base">
                      <span className="font-semibold text-slate-300">{label} — </span>
                      <span className="text-slate-400">{desc}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8 mt-3">
                  <span className="text-slate-300 font-medium">Guest Mode isolation:</span> For users running as guest, all portfolio data, transactions, and settings remain isolated entirely inside your local browser storage and are never uploaded to our servers.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">02</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">How We Use Information</h3>
                </div>
                <ul className="pl-5 sm:pl-8 space-y-2">
                  {[
                    'To render and preserve your virtual portfolio and cash balance state.',
                    'To synchronize data securely across your authorized client terminals.',
                    'To distribute system critical notices (e.g., password recovery requests).',
                    'To isolate and repair bugs or refine the user interface layout.'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[11px] sm:text-sm md:text-base text-slate-400">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  We do <span className="text-slate-300 font-medium">not</span> sell, trade, or distribute your email addresses or telemetry logs to third-party ad exchanges or brokers.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">03</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Data Security & Encryption</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  We employ standard security protocols to safeguard your account. Access to account records is strictly controlled, and we use encryption methods to protect data in transit and at rest.
                </p>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Please maintain a secure, unique password. You are responsible for ensuring the confidentiality of your account credentials.
                </p>
              </div>

              {/* Section 4 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">04</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Local Persistent Storage</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  The platform utilizes your browser's <span className="text-slate-300 font-medium">Local Storage</span> to maintain your profile selection and locally active widgets. Authenticated sessions rely on secure, encrypted tokens managed strictly by our authentication system. We do not place targeting or tracking pixels in your client.
                </p>
              </div>

              {/* Section 5 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">05</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Data Control & Portability</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  You retain complete sovereignty over your virtual profile details. You can:
                </p>
                <ul className="pl-5 sm:pl-8 space-y-2">
                  {[
                    'Export your entire database history at any time using the "Export Data" button in Settings.',
                    'Clear all local data records using the "Reset simulation data" function in Settings.',
                    'Request registered account deletion at any time by contacting us directly.'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[11px] sm:text-sm md:text-base text-slate-400">
                      <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 6 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">06</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Children's Privacy Protection</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  Thriv does not intentionally target, collect, or retain records on individuals under the age of 13. If it is discovered that a minor's information has been recorded, we will perform a total deletion from our active systems immediately.
                </p>
              </div>

              {/* Section 7 */}
              <div className="space-y-3 pb-5 border-b border-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] sm:text-xs text-thriv-400 border border-thriv-500/20 px-1.5 py-0.5 rounded bg-thriv-500/[0.03]">07</span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm md:text-base text-slate-200 tracking-wider uppercase">Revisions</h3>
                </div>
                <p className="text-[11px] sm:text-sm md:text-base leading-relaxed text-slate-400 pl-5 sm:pl-8">
                  This Privacy Policy may be updated to match platform extensions. Updated terms are indicated by the timestamp on this page. Continuing to use Thriv implies consent to the revised telemetry rules.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-4 pb-2">
                <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed text-center font-mono">
                  For questions concerning data usage or security policies, please contact us directly.
                </p>
              </div>
            </div>
          </div>

          {/* Sticky close button */}
          <div className="border-t border-white/[0.04] p-4 shrink-0 bg-[#06080c]">
            <div className="mx-auto w-full max-w-3xl">
              <button
                type="button"
                onClick={() => closeLegalPage()}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white py-3 text-xs sm:text-sm font-semibold text-slate-300 transition-colors touch-manipulation min-h-[48px]"
              >
                Acknowledge and Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
