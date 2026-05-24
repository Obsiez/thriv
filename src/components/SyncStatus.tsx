import { Cloud, CloudOff, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function SyncStatus() {
  const { mode, syncStatus, lastSyncedAt } = useAuth()

  if (mode !== 'authenticated') return null

  const label =
    syncStatus === 'syncing'
      ? 'Saving…'
      : syncStatus === 'error'
        ? 'Sync issue'
        : syncStatus === 'synced'
          ? 'Saved'
          : 'Ready'

  const Icon =
    syncStatus === 'syncing'
      ? Loader2
      : syncStatus === 'error'
        ? CloudOff
        : Cloud

  return (
    <div
      className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-surface-800/80 px-2 py-1 text-[10px] text-slate-500"
      title={lastSyncedAt ? `Last saved ${new Date(lastSyncedAt).toLocaleString()}` : undefined}
    >
      <Icon
        className={`h-3 w-3 ${syncStatus === 'syncing' ? 'animate-spin text-thriv-400' : syncStatus === 'error' ? 'text-amber-500' : 'text-thriv-500/80'}`}
        strokeWidth={1.75}
      />
      <span>{label}</span>
    </div>
  )
}
