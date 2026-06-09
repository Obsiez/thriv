import { Calendar, Zap } from 'lucide-react'

interface EconomicEvent {
  name: string
  secondsLeft: number | null
  impact: 'High' | 'Medium'
  macroState: 'cooldown' | 'waiting' | 'countdown' | 'active' | 'dormant'
  todayCount: number
  isOnlineAndLoggedIn: boolean
}

interface EconomicCalendarBarProps {
  event: EconomicEvent
  pulseActive: boolean
}

export function EconomicCalendarBar({ event, pulseActive }: EconomicCalendarBarProps) {
  return (
    <div className="w-full border-b border-white/[0.04] bg-surface-900/60 px-4 py-2 transition-all">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 text-xs">
        {pulseActive ? (
          <div className="flex items-center gap-2 text-amber-400 font-medium animate-pulse">
            <Zap className="h-3.5 w-3.5" strokeWidth={2} />
            <span>
              Volatility Alert: Post-{event.name} release pricing pressure active (2.5x swing factor)
            </span>
          </div>
        ) : !event.isOnlineAndLoggedIn ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-600" strokeWidth={1.75} />
            <span>
              Macro Outlook: <span className="text-slate-600 font-normal">Offline. Telemetry paused.</span>
            </span>
          </div>
        ) : event.macroState === 'dormant' ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
            <span>
              Macro Outlook: <span className="text-slate-500 font-normal">Daily macro limit reached ({event.todayCount}/5).</span>
            </span>
          </div>
        ) : event.macroState === 'cooldown' ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
            <span>
              Macro Outlook: <span className="text-slate-500 font-normal">Cooldown active. Monitoring leading indicators... ({event.todayCount}/5 today)</span>
            </span>
          </div>
        ) : event.macroState === 'waiting' ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} />
            <span>
              Macro Outlook: <span className="text-slate-500 font-normal">Market stable. Scanning data streams... ({event.todayCount}/5 today)</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-thriv-400" strokeWidth={1.75} />
            <span className="font-medium text-slate-300">
              Next Macro Release: <span className="text-white">{event.name}</span> in{' '}
              <span className="font-mono text-thriv-400 font-semibold">{event.secondsLeft}s</span>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              pulseActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : !event.isOnlineAndLoggedIn
                  ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                  : event.macroState === 'dormant'
                    ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    : event.macroState === 'cooldown'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : event.macroState === 'waiting'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : event.impact === 'High'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-thriv-500/10 text-thriv-400 border border-thriv-500/20'
            }`}
          >
            {pulseActive
              ? 'High Volatility'
              : !event.isOnlineAndLoggedIn
                ? 'Offline'
                : event.macroState === 'dormant'
                  ? 'Limit Reached'
                  : event.macroState === 'cooldown'
                    ? 'Cooldown'
                    : event.macroState === 'waiting'
                      ? 'Stable'
                      : `${event.impact} Impact`}
          </span>
        </div>
      </div>
    </div>
  )
}
