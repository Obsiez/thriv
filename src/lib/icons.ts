import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Eye,
  Flame,
  Gem,
  Globe2,
  GraduationCap,
  Landmark,
  LineChart,
  Medal,
  Newspaper,
  Pencil,
  PieChart,
  Scale,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Telescope,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
  Zap,
  Layers,
  GitCompare,
  Calculator,
  LayoutGrid,
} from 'lucide-react'

export type IconName =
  | 'telescope'
  | 'star'
  | 'cart'
  | 'target'
  | 'globe'
  | 'wallet'
  | 'brain'
  | 'trend-down'
  | 'sparkles'
  | 'trend-up'
  | 'newspaper'
  | 'bell'
  | 'zap'
  | 'eye'
  | 'pencil'
  | 'chart'
  | 'trophy'
  | 'footprints'
  | 'briefcase'
  | 'flame'
  | 'gem'
  | 'check'
  | 'award'
  | 'activity'
  | 'film'
  | 'graduation'
  | 'compare'
  | 'calculator'
  | 'layers'
  | 'grid'
  | 'scale'
  | 'clipboard'
  | 'landmark'
  | 'pie'

export const ICONS: Record<IconName, LucideIcon> = {
  telescope: Telescope,
  star: Star,
  cart: ShoppingCart,
  target: Target,
  globe: Globe2,
  wallet: Wallet,
  brain: Brain,
  'trend-down': TrendingDown,
  sparkles: Sparkles,
  'trend-up': TrendingUp,
  newspaper: Newspaper,
  bell: Bell,
  zap: Zap,
  eye: Eye,
  pencil: Pencil,
  chart: BarChart3,
  trophy: Trophy,
  footprints: Activity,
  briefcase: Briefcase,
  flame: Flame,
  gem: Gem,
  check: CheckCircle2,
  award: Award,
  activity: LineChart,
  film: Medal,
  graduation: GraduationCap,
  compare: GitCompare,
  calculator: Calculator,
  layers: Layers,
  grid: LayoutGrid,
  scale: Scale,
  clipboard: ClipboardCheck,
  landmark: Landmark,
  pie: PieChart,
}

export function getIcon(name: IconName): LucideIcon {
  return ICONS[name] ?? CircleDollarSign
}
