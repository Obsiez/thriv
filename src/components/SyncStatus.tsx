import { useState, useRef, useEffect } from 'react'
import { Cloud, CloudOff, Loader2, Wifi } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function SyncStatus() {
  const { mode, syncStatus, lastSyncedAt, browserOnline, apiOnline, refreshSync } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (mode !== 'authenticated') return null

  const Icon =
    syncStatus === 'syncing'
      ? Loader2
      : syncStatus === 'error'
        ? CloudOff
        : Cloud

  const isConnected = browserOnline && apiOnline

  return (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <button
        type="button"
        onClick={async () => {
          setOpen(true)
          if (syncStatus !== 'syncing') {
            await refreshSync()
          }
        }}
        className="hidden sm:flex items-center justify-center rounded-lg border border-white/[0.08] bg-surface-800 text-slate-400 hover:text-white hover:border-thriv-500/40 hover:ring-1 hover:ring-thriv-500/20 transition-all duration-150 touch-manipulation h-10 w-10 shrink-0"
        aria-label="Cloud sync status"
        title="Sync state with cloud"
      >
        <Icon
          className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin text-thriv-400' : syncStatus === 'error' ? 'text-amber-500' : 'text-emerald-400'}`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 w-60 rounded-xl border border-white/[0.08] bg-surface-900/95 p-3.5 shadow-xl backdrop-blur-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <Wifi className={`h-3.5 w-3.5 ${isConnected ? 'text-emerald-400' : 'text-amber-500'}`} />
              <span className="text-xs font-semibold text-white">
                {isConnected ? 'Connected to Cloud' : 'Cloud Disconnected'}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
              <p className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${browserOnline ? 'bg-emerald-400' : 'bg-red-500'}`} />
                Browser: {browserOnline ? 'Online' : 'Offline'}
              </p>
              <p className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${apiOnline ? 'bg-emerald-400' : 'bg-amber-500'}`} />
                Cloud database: {apiOnline ? 'Operational' : 'Unavailable'}
              </p>
              <p className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Sync state: {
                  syncStatus === 'syncing'
                    ? 'Synchronizing...'
                    : syncStatus === 'error'
                      ? 'Sync failure'
                      : 'Synchronized'
                }
              </p>
            </div>

            {lastSyncedAt && (
              <div className="text-[10px] text-slate-500 border-t border-white/[0.06] pt-2">
                Last cloud save:
                <span className="block mt-0.5 font-mono">
                  {new Date(lastSyncedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
