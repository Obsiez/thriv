import { useEffect, useState } from 'react'
import {
  Download,
  LogOut,
  Palette,
  User,
  X,
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
  onProfileChange: (profile: ProfilePrefs) => void
}

export function SettingsPanel({
  open,
  onClose,
  portfolio,
  progress,
  onFullReset,
  onProfileChange,
}: SettingsPanelProps) {
  const { user, mode, logout, updateDisplayName } = useAuth()
  const [name, setName] = useState(user?.displayName ?? '')
  const [motto, setMotto] = useState(progress.profile?.motto ?? '')
  const [accentId, setAccentId] = useState<AccentId>(
    progress.profile?.accentId ?? DEFAULT_PROFILE.accentId
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(user?.displayName ?? '')
      setMotto(progress.profile?.motto ?? '')
      setAccentId(progress.profile?.accentId ?? DEFAULT_PROFILE.accentId)
    }
  }, [open, user?.displayName, progress.profile])

  if (!open) return null

  const initial = (name || (user?.displayName ?? 'T')).charAt(0).toUpperCase()

  function applyProfile(next: Partial<ProfilePrefs>) {
    const merged = mergeProfilePrefs({ accentId, motto, ...next })
    setAccentId(merged.accentId)
    setMotto(merged.motto)
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
      applyProfile({ motto: motto.trim(), accentId })
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
      <button
        type="button"
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-[90] flex w-full max-w-sm flex-col border-l border-white/[0.06] bg-surface-900 shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          <h2 className="font-display font-semibold tracking-tight">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-800 touch-manipulation"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
            <div className="flex items-center gap-4">
              <ProfileAvatar initial={initial} accentId={accentId} size="md" />
              <div className="min-w-0">
                <p className="font-display font-semibold truncate">
                  {name || 'Trader'}
                </p>
                {user && (
                  <p className="text-xs text-slate-500 font-mono truncate">{user.email}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <Palette className="h-3.5 w-3.5" strokeWidth={1.75} />
              Accent color
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ACCENT_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => applyProfile({ accentId: a.id })}
                  className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors touch-manipulation min-h-[44px] ${
                    accentId === a.id
                      ? `${a.ring} ${a.bg} border-transparent ring-2`
                      : 'border-white/[0.06] bg-surface-900 text-slate-500 hover:border-white/10'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <User className="h-3.5 w-3.5" strokeWidth={1.75} />
              Profile
            </p>
            {mode === 'authenticated' && (
              <>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Display name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-surface-800 py-2.5 px-3 text-sm min-h-[44px]"
                />
              </>
            )}
            <label className="mt-3 block text-[10px] uppercase tracking-wider text-slate-500">
              Motto <span className="normal-case text-slate-600">(optional)</span>
            </label>
            <input
              value={motto}
              onChange={(e) => setMotto(e.target.value.slice(0, 48))}
              placeholder="e.g. Discipline over noise"
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-surface-800 py-2.5 px-3 text-sm min-h-[44px]"
            />
            <button
              type="button"
              onClick={saveAccount}
              disabled={saving}
              className="mt-3 w-full rounded-lg border border-thriv-600/40 bg-thriv-800/60 py-3 text-sm font-semibold touch-manipulation min-h-[48px] hover:bg-thriv-800"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            {message && <p className="mt-2 text-xs text-thriv-400">{message}</p>}
          </section>

          <section className="rounded-xl border border-white/[0.06] bg-surface-800/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Shortcuts
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li>
                <kbd className="rounded border border-white/10 bg-surface-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  /
                </kbd>{' '}
                Focus market search
              </li>
            </ul>
          </section>

          {mode === 'guest' && (
            <p className="text-sm text-slate-400 rounded-xl border border-white/[0.06] bg-surface-800/50 p-4 leading-relaxed">
              Guest mode stores customization locally. Create an account to sync across devices.
            </p>
          )}

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Data
            </p>
            <button
              type="button"
              onClick={exportData}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-800/50 px-4 py-3 text-sm hover:border-white/10 touch-manipulation min-h-[48px]"
            >
              <Download className="h-4 w-4 text-thriv-400" strokeWidth={1.75} />
              Export portfolio & progress (JSON)
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Reset all portfolio data and mission progress? This cannot be undone.'
                  )
                ) {
                  onFullReset()
                  onClose()
                }
              }}
              className="mt-2 w-full rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-sm text-red-300 hover:border-red-500/40 touch-manipulation min-h-[48px]"
            >
              Reset simulation data
            </button>
          </section>
        </div>

        <div className="border-t border-white/[0.06] p-4">
          <button
            type="button"
            onClick={() => {
              logout()
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-sm font-medium text-slate-300 hover:text-white touch-manipulation min-h-[48px]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
