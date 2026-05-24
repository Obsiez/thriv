import { useState } from 'react'
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  User,
  WifiOff,
} from 'lucide-react'
import { Logo } from '../Logo'
import { getApiStatusMessage } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

type Tab = 'login' | 'register'

export function AuthPage() {
  const { login, register, continueAsGuest, apiOnline, browserOnline, refreshApiStatus, loading } =
    useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkingApi, setCheckingApi] = useState(false)

  const showApiWarning = browserOnline && !apiOnline
  const showOfflineWarning = !browserOnline
  const canSubmit = browserOnline && !submitting

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!browserOnline) {
      setError('No internet connection. Connect to the network and try again.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(email, password, displayName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  async function retryApi() {
    setCheckingApi(true)
    setError(null)
    await refreshApiStatus()
    setCheckingApi(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-900">
        <Loader2 className="h-8 w-8 animate-spin text-thriv-500" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-900 lg:flex-row">
      <div className="relative hidden lg:flex lg:w-[44%] flex-col justify-between border-r border-white/[0.06] bg-gradient-to-br from-surface-800 via-surface-900 to-thriv-950 p-12">
        <Logo size="lg" />
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white leading-tight">
            Learn markets.
            <br />
            <span className="text-thriv-400">Trade with confidence.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm text-slate-400 leading-relaxed">
            Thriv is a professional-grade paper trading simulator. Create an account to
            save progress, sync across devices, and track your analyst rank.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-500">
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-thriv-500" />
              Live-style simulated markets
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-thriv-500" />
              Missions, credentials & activities
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-thriv-500" />
              Cloud-synced portfolio & progress
            </li>
          </ul>
        </div>
        <p className="text-[10px] text-slate-600 uppercase tracking-wider">
          Educational use only · Not financial advice
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          {showOfflineWarning && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-950/20 px-4 py-3 text-sm text-red-200/90">
              <WifiOff className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <p className="font-medium">You&apos;re offline</p>
                <p className="text-xs text-red-200/70 mt-0.5">
                  Connect to the internet to sign in or create an account. Guest mode works on this
                  device without an account.
                </p>
              </div>
            </div>
          )}

          {showApiWarning && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-600/25 bg-amber-950/20 px-4 py-3 text-sm text-amber-200/90">
              <WifiOff className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Account server unreachable</p>
                <p className="text-xs text-amber-200/70 mt-0.5">{getApiStatusMessage()}</p>
                <button
                  type="button"
                  onClick={() => void retryApi()}
                  disabled={checkingApi}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-thriv-400 hover:text-thriv-300"
                >
                  <RefreshCw className={`h-3 w-3 ${checkingApi ? 'animate-spin' : ''}`} />
                  Check again
                </button>
              </div>
            </div>
          )}

          <div className="flex rounded-lg border border-white/[0.06] bg-surface-800/80 p-1">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t)
                  setError(null)
                }}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? 'bg-thriv-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {tab === 'register' && (
              <Field
                icon={User}
                label="Display name"
                type="text"
                value={displayName}
                onChange={setDisplayName}
                placeholder="Alex Chen"
                autoComplete="name"
              />
            )}
            <Field
              icon={Mail}
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@school.edu"
              autoComplete="email"
              required
            />
            <Field
              icon={Lock}
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={tab === 'register' ? 'Min. 8 characters' : '••••••••'}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              required
            />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-thriv-600/50 bg-thriv-700 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-thriv-600 disabled:opacity-50 touch-manipulation min-h-[48px]"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {tab === 'login' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-surface-900 px-3 text-slate-600">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={continueAsGuest}
            className="w-full rounded-xl border border-white/[0.08] bg-surface-800/60 py-3 text-sm font-medium text-slate-300 hover:border-white/12 hover:text-white touch-manipulation min-h-[48px]"
          >
            Continue as guest
          </button>
          <p className="mt-2 text-center text-[10px] text-slate-600">
            Guest progress stays on this browser only.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  icon: typeof Mail
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div className="relative mt-1.5">
        <Icon
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          strokeWidth={1.75}
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full rounded-lg border border-white/[0.08] bg-surface-900/80 py-3 pl-10 pr-4 text-sm focus:border-thriv-600/50 focus:outline-none focus:ring-1 focus:ring-thriv-600/30 min-h-[48px]"
        />
      </div>
    </div>
  )
}
