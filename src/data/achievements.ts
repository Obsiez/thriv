import type { AchievementDef } from '../types'

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'level-5', title: 'Rising Analyst', description: 'Reach level 5', icon: 'chart', xpBonus: 50 },
  { id: 'level-10', title: 'Market Fellow', description: 'Reach level 10', icon: 'trophy', xpBonus: 100 },
  { id: 'trades-10', title: 'Execution Pace', description: 'Complete 10 trades', icon: 'footprints', xpBonus: 40 },
  { id: 'trades-25', title: 'Desk Regular', description: 'Complete 25 trades', icon: 'briefcase', xpBonus: 80 },
  { id: 'streak-3', title: 'Consistency', description: '3-day login streak', icon: 'flame', xpBonus: 60 },
  { id: 'streak-7', title: 'Commitment', description: '7-day login streak', icon: 'gem', xpBonus: 150 },
  { id: 'quests-5', title: 'Mission Record', description: 'Complete 5 quests', icon: 'check', xpBonus: 70 },
  { id: 'quests-all', title: 'Full Curriculum', description: 'Complete all main quests', icon: 'award', xpBonus: 300 },
  { id: 'profit-5pct', title: 'Positive Return', description: '5%+ portfolio gain from start', icon: 'trend-up', xpBonus: 90 },
  { id: 'scenarios-5', title: 'Scenario Veteran', description: 'Finish 5 scenarios', icon: 'film', xpBonus: 100 },
  { id: 'sprint-master', title: 'Sector Specialist', description: 'Sector Sprint high score 8+', icon: 'layers', xpBonus: 85 },
  { id: 'risk-aware', title: 'Risk Framework', description: 'Use Position Sizer 3 times', icon: 'scale', xpBonus: 55 },
  { id: 'chart-explorer', title: 'Chart Cartographer', description: 'Use all four chart timeframes', icon: 'chart', xpBonus: 65 },
  { id: 'flash-hot', title: 'Quote Sharp', description: 'Flash Quotes score 7+', icon: 'zap', xpBonus: 70 },
  { id: 'lesson-first-loss', title: 'Tuition Paid', description: 'Take your first realized loss on a sell', icon: 'trend-down', xpBonus: 45 },
  { id: 'lesson-liquidated', title: 'Margin Call Survivor', description: 'Experience an auto-liquidation event', icon: 'bell', xpBonus: 65 },
  { id: 'lesson-drawdown', title: 'Drawdown Discipline', description: 'Portfolio falls 5%+ below its peak', icon: 'chart', xpBonus: 55 },
  { id: 'lesson-margin', title: 'Leverage Introduced', description: 'Use margin borrowing on a buy order', icon: 'landmark', xpBonus: 50 },
  { id: 'lesson-panic-sell', title: 'Emotional Exit', description: 'Realize a single loss over $2,000', icon: 'wallet', xpBonus: 60 },
]
