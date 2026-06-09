import { useState } from 'react'
import {
  ArrowLeft,
  Bell,
  Star,
  Trash2,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react'
import { changePercent, formatCurrency, formatPercent } from '../lib/marketEngine'
import type { Stock, PriceAlert, TabId } from '../types'

interface WatchlistTrackerProps {
  stocks: Stock[]
  watchlist: string[]
  alerts: PriceAlert[]
  onToggleWatch: (symbol: string) => void
  onAddAlert: (symbol: string, targetPrice: number, direction: 'above' | 'below') => void
  onRemoveAlert: (id: string) => void
  onSelectStock: (symbol: string) => void
  onNavigate: (tab: TabId) => void
  pushNotificationsEnabled: boolean
  onToggleNotifications: (enabled: boolean) => void
}

export function WatchlistTracker({
  stocks,
  watchlist,
  alerts,
  onToggleWatch,
  onAddAlert,
  onRemoveAlert,
  onSelectStock,
  onNavigate,
  pushNotificationsEnabled,
  onToggleNotifications,
}: WatchlistTrackerProps) {
  const [addingAlertFor, setAddingAlertFor] = useState<string | null>(null)
  const [alertPrice, setAlertPrice] = useState<string>('')
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above')

  const watchlistStocks = watchlist
    .map((sym) => stocks.find((s) => s.symbol === sym))
    .filter((s): s is Stock => !!s)

  const handleTogglePush = async () => {
    if (!pushNotificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          onToggleNotifications(true)
        } else {
          onToggleNotifications(false)
        }
      }
    } else {
      onToggleNotifications(false)
    }
  }

  const handleCreateAlert = (symbol: string) => {
    const priceNum = parseFloat(alertPrice)
    if (isNaN(priceNum) || priceNum <= 0) {
      return
    }

    onAddAlert(symbol, priceNum, alertDirection)
    setAlertPrice('')
    setAddingAlertFor(null)
  }

  return (
    <div className="space-y-6">
      {/* Header section with back button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('market')}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-surface-900 text-slate-400 hover:text-white hover:border-thriv-700 transition-all cursor-pointer"
            aria-label="Back to market"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight">
              Watchlist Tracker
            </h1>
            <p className="text-xs text-slate-500">
              Track stock price thresholds and manage system notifications
            </p>
          </div>
        </div>

        {/* Global Notification Controls */}
        <div className="glass rounded-lg px-3 py-2 flex items-center gap-3 border border-white/[0.04] bg-surface-850/50">
          <button
            type="button"
            onClick={handleTogglePush}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              pushNotificationsEnabled ? 'bg-thriv-500' : 'bg-surface-700'
            }`}
            role="switch"
            aria-checked={pushNotificationsEnabled}
            aria-label="Toggle push notifications"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                pushNotificationsEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-medium text-slate-300">
            Enable alerts push notifications
          </span>
        </div>
      </div>

      {/* Empty State */}
      {watchlistStocks.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center rounded-lg p-10 text-center max-w-md mx-auto">
          <Star className="h-8 w-8 text-slate-600 mb-3" />
          <h2 className="text-sm font-bold text-white">Your Watchlist is empty</h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm">
            Add stocks in the Live Market tab to track active thresholds and price alerts.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('market')}
            className="mt-5 rounded-lg bg-thriv-700 hover:bg-thriv-600 text-white px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            Browse Live Market
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {watchlistStocks.map((s) => {
            const ch = changePercent(s)
            const up = ch >= 0
            const stockAlerts = alerts.filter((a) => a.symbol === s.symbol)

            return (
              <div
                key={s.symbol}
                className="glass rounded-lg border border-white/[0.06] p-4 flex flex-col justify-between hover:border-white/10 transition-all"
              >
                <div>
                  {/* Top: Symbol, Name, Price & Change */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectStock(s.symbol)}
                          className="font-mono font-bold text-thriv-300 hover:underline cursor-pointer"
                        >
                          {s.symbol}
                        </button>
                        <span className="text-[10px] text-slate-500">
                          {s.sector}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{s.name}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-bold text-sm">{formatCurrency(s.price)}</p>
                        <p
                          className={`font-mono text-xs flex items-center gap-0.5 justify-end font-medium ${
                            up ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatPercent(ch)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleWatch(s.symbol)}
                        className="p-1 text-slate-500 hover:text-thriv-400 transition-colors cursor-pointer"
                        title="Remove from watchlist"
                      >
                        <Star className="h-4 w-4 fill-thriv-400 text-thriv-400" />
                      </button>
                    </div>
                  </div>

                  {/* Active Alert management section */}
                  <div className="mt-4 border-t border-white/[0.04] pt-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-slate-500" />
                        Price Alerts ({stockAlerts.length})
                      </span>

                      {addingAlertFor !== s.symbol && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingAlertFor(s.symbol)
                            setAlertPrice(s.price.toFixed(2))
                          }}
                          className="text-[11px] font-semibold text-thriv-400 hover:underline cursor-pointer"
                        >
                          + Set Alert
                        </button>
                      )}
                    </div>

                    {/* Alerts creation form inline */}
                    {addingAlertFor === s.symbol && (
                      <div className="rounded-lg border border-white/10 bg-surface-900 p-3 space-y-2.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAlertDirection('above')}
                            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                              alertDirection === 'above'
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                                : 'bg-surface-850 border-white/5 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Goes Above
                          </button>
                          <button
                            type="button"
                            onClick={() => setAlertDirection('below')}
                            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                              alertDirection === 'below'
                                ? 'bg-red-950/20 border-red-500/40 text-red-400'
                                : 'bg-surface-850 border-white/5 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            Goes Below
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={alertPrice}
                            onChange={(e) => setAlertPrice(e.target.value)}
                            placeholder="Target Price ($)"
                            className="w-full rounded-lg border border-white/10 bg-[#0b1016] text-white px-2.5 py-1.5 text-xs font-mono focus:border-thriv-700 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleCreateAlert(s.symbol)}
                            className="rounded-lg bg-thriv-700 hover:bg-thriv-600 text-white px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingAlertFor(null)}
                            className="rounded-lg border border-white/10 hover:bg-surface-800 text-slate-400 px-3 py-1.5 text-xs transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Active price alert list */}
                    {stockAlerts.length > 0 ? (
                      <div className="space-y-1">
                        {stockAlerts.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between rounded-lg bg-surface-900 border border-white/[0.04] px-2.5 py-1.5"
                          >
                            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                              <span>crossing</span>
                              <span className={a.direction === 'above' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                                {a.direction === 'above' ? 'above' : 'below'}
                              </span>
                              <span>{formatCurrency(a.targetPrice)}</span>
                              {a.triggered && (
                                <span className="ml-1 text-[8px] bg-slate-800 px-1 py-0.2 rounded text-slate-500 uppercase font-bold">
                                  Triggered
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveAlert(a.id)}
                              className="text-slate-650 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                              title="Delete alert"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 italic">No threshold alerts set.</p>
                    )}
                  </div>
                </div>

                {/* Card actions bottom */}
                <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectStock(s.symbol)}
                    className="rounded-lg border border-white/10 hover:bg-surface-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                  >
                    View Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStock(s.symbol)
                      onNavigate('trade')
                    }}
                    className="rounded-lg bg-thriv-700 hover:bg-thriv-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Trade
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info banner details */}
      <div className="rounded-lg border border-white/[0.04] bg-surface-900/30 p-3 flex items-start gap-2.5 text-slate-500">
        <Info className="h-4 w-4 shrink-0 text-slate-600 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-slate-400">Understanding Price Alerts</h4>
          <p className="text-[11px] leading-relaxed">
            Threshold alerts trigger automatically when the live market price reaches or crosses your specified target.
            If push notifications are active, you will receive desktop system notifications even when Thriv is running in the background.
          </p>
        </div>
      </div>
    </div>
  )
}
