import { useState, useEffect } from 'react'
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'
import { LogoAuth } from '../LogoAuth'
import { useAuth } from '../../contexts/AuthContext'
import { auth as fbAuth } from '../../lib/firebase'

type Tab = 'login' | 'register' | 'forgot-password'

function getFriendlyErrorMessage(errorMsg: string): string {
  const code = errorMsg.toLowerCase()
  if (code.includes('auth/unverified-email') || code.includes('unverified-email')) {
    return 'Please verify your email. A link was sent to your inbox.'
  }
  if (code.includes('auth/invalid-credential') || 
      code.includes('auth/wrong-password') || 
      code.includes('auth/user-not-found') ||
      code.includes('invalid-credential') ||
      code.includes('wrong-password') ||
      code.includes('user-not-found')) {
    return 'Incorrect email or password.'
  }
  if (code.includes('auth/email-already-in-use') || code.includes('email-already-in-use')) {
    return 'Email already registered. Sign in instead.'
  }
  if (code.includes('auth/invalid-email') || code.includes('invalid-email')) {
    return 'Invalid email address.'
  }
  if (code.includes('auth/weak-password') || code.includes('weak-password')) {
    return 'Password must be at least 6 characters.'
  }
  if (code.includes('auth/too-many-requests') || code.includes('too-many-requests')) {
    return 'Too many failed attempts. Try again later.'
  }
  if (code.includes('auth/user-disabled') || code.includes('user-disabled')) {
    return 'Account suspended. Contact support.'
  }
  if (
    code.includes('popup-closed') || 
    code.includes('popup_closed') ||
    code.includes('cancelled-popup') || 
    code.includes('cancelled_popup') ||
    code.includes('closed-by-user') ||
    code.includes('closed_by_user') ||
    code.includes('popup blocked') ||
    code.includes('popup-blocked') ||
    code.includes('popup closed')
  ) {
    return 'Sign-in cancelled. Try again.'
  }
  
  return errorMsg.replace(/^Firebase:\s*/i, '')
}

export function AuthPage() {
  const {
    login,
    register,
    forgotPassword,
    resendVerification,
    checkVerificationStatus,
    loginWithGoogle,
    continueAsGuest,
    browserOnline,
    loading,
    isFirebaseActive,
    logout,
  } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

  const [forceHideUnverified, setForceHideUnverified] = useState(false)

  // Enforce validation status (excluding Google Auth users, which automatically have emailVerified = true)
  const isUnverifiedUser = 
    fbAuth?.currentUser && !fbAuth.currentUser.emailVerified && !forceHideUnverified

  // Background polling for automatic email verification login
  useEffect(() => {
    if (isUnverifiedUser) {
      const interval = setInterval(async () => {
        try {
          await checkVerificationStatus()
        } catch (e) {
          console.warn('[Auth] Verification status check failed:', e)
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isUnverifiedUser, checkVerificationStatus])

  const canSubmit = !submitting

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!browserOnline) {
      setError('No internet connection. Connect to the network and try again.')
      return
    }
    setError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      if (tab === 'login') {
        await login(email, password)
        // Login succeeded, do NOT call setSubmitting(false)! Let the button spin until page transition!
        return
      } else if (tab === 'register') {
        await register(email, password, displayName)
        // Registration succeeded, do NOT call setSubmitting(false)! Let the button spin until the unverified landing screen mounts!
        return
      } else if (tab === 'forgot-password') {
        await forgotPassword(email)
        setSuccessMessage('Password reset link sent successfully. Please check your inbox.')
        setSubmitting(false)
      }
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(getFriendlyErrorMessage(rawMsg))
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    if (!browserOnline) {
      setError('No internet connection. Connect to the network and try again.')
      return
    }
    setError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      if (loginWithGoogle) {
        await loginWithGoogle()
        // Google Sign-in succeeded, do NOT call setSubmitting(false)! Let the button spin until page transition!
        return
      }
    } catch (err) {
      const errCode = (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string') ? err.code : ''
      const rawMsg = err instanceof Error ? err.message : 'Google sign in failed.'
      setError(getFriendlyErrorMessage(errCode || rawMsg))
      setSubmitting(false)
    }
  }

  async function handleResendVerification() {
    setError(null)
    setResendStatus(null)
    setResending(true)
    try {
      await resendVerification()
      setResendStatus('Verification link resent successfully.')
    } catch (err) {
      setResendStatus(err instanceof Error ? err.message : 'Resend failed.')
    } finally {
      setResending(false)
    }
  }

  async function handleSignOut() {
    setForceHideUnverified(true)
    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    setPassword('')
    setDisplayName('')
    
    logout()
    
    setTimeout(() => {
      setSubmitting(false)
      setForceHideUnverified(false)
    }, 2000)
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
        <LogoAuth size="lg" />
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

      {/* Right Column Panel Container (Relative, Center centered layout with padding-bottom conditional) */}
      <div className={`relative flex flex-1 flex-col justify-center px-4 py-8 sm:px-8 lg:px-16 min-h-[100dvh] ${isUnverifiedUser ? 'pb-8' : 'pb-24'}`}>
        
        {isUnverifiedUser ? (
          /* Premium Automatic Verification Polling Interface (Perfect vertical center layout) */
          <div className="mx-auto w-full max-w-md my-auto text-center space-y-6">
            <div className="flex justify-center">
              <ShieldCheck className="h-12 w-12 text-thriv-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Verify your email address</h2>
              <p className="text-sm text-slate-300 mt-2">
                We sent a secure verification link to:
                <br />
                <span className="font-semibold text-thriv-400">{fbAuth?.currentUser?.email}</span>
              </p>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed max-w-sm mx-auto">
                Please check your inbox (and spam folder) and click the link to activate your account. 
                This screen will automatically transition once verified.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-surface-900/60 p-4 max-w-sm mx-auto flex items-center justify-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-thriv-500 shrink-0" />
              <span className="text-xs font-medium text-slate-400 animate-pulse">
                Awaiting email verification...
              </span>
            </div>

            {resendStatus && (
              <p className="text-xs font-semibold text-emerald-400 max-w-xs mx-auto">
                {resendStatus}
              </p>
            )}

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto pt-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full rounded-xl border border-thriv-600/50 bg-thriv-700/80 py-3 text-xs font-semibold text-white transition-all hover:bg-thriv-600 disabled:opacity-50 touch-manipulation min-h-[44px]"
              >
                {resending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : 'Resend Verification Email'}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors py-1.5 touch-manipulation focus:outline-none"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          /* Standard Sign In / Create Account Interface (Perfect vertical center layout) */
          <div className="mx-auto w-full max-w-md my-auto">
            <div className="mb-8 lg:hidden">
              <LogoAuth size="md" />
            </div>



            {tab !== 'forgot-password' ? (
              <div className="flex rounded-lg border border-white/[0.06] bg-surface-800/80 p-1">
                {(['login', 'register'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setTab(t)
                      setError(null)
                      setSuccessMessage(null)
                    }}
                    className={`flex-1 rounded-md py-2.5 text-sm font-medium capitalize transition-colors ${
                      tab === t
                        ? 'bg-thriv-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    } disabled:opacity-50`}
                  >
                    {t === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-left mb-2">
                <h2 className="text-xl font-bold text-white">Reset your password</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your email address below, and we will email you a secure link to reset your credentials.
                </p>
              </div>
            )}

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
                  disabled={submitting}
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
                disabled={submitting}
              />
              {tab !== 'forgot-password' && (
                <div>
                  <Field
                    icon={Lock}
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder={tab === 'register' ? 'Min. 8 characters' : '••••••••'}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    required
                    showPasswordToggle
                    passwordVisible={showPassword}
                    onTogglePassword={() => setShowPassword((prev) => !prev)}
                    disabled={submitting}
                  />
                  {tab === 'login' && (
                    <div className="flex justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTab('forgot-password')
                          setError(null)
                          setSuccessMessage(null)
                        }}
                        className="text-xs text-thriv-400 hover:text-thriv-300 font-medium transition-colors focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              {successMessage && (
                <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
                  {successMessage}
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
                    {tab === 'login' && 'Sign in'}
                    {tab === 'register' && 'Create account'}
                    {tab === 'forgot-password' && 'Send reset link'}
                    <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                  </>
                )}
              </button>
            </form>

            {tab === 'forgot-password' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login')
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors focus:outline-none font-medium"
                >
                  Back to Sign in
                </button>
              </div>
            )}

            {isFirebaseActive && tab !== 'forgot-password' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-surface-900 px-3 text-slate-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-surface-800 py-3 text-sm font-semibold text-white transition-all hover:bg-surface-700 hover:border-white/12 touch-manipulation min-h-[48px]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}
          </div>
        )}

        {/* Bottom Guest Action Container (Absolute positioned to stay completely out of regular layout centering) */}
        {tab !== 'forgot-password' && !isUnverifiedUser && (
          <div className="absolute bottom-2 left-4 right-4 text-center">
            <button
              type="button"
              onClick={continueAsGuest}
              disabled={submitting}
              className="w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors touch-manipulation min-h-[36px] py-1.5 opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue as Guest
            </button>
            <p className="text-[10px] text-slate-600 opacity-90 mt-0.5">
              Progress stays on this device.
            </p>
          </div>
        )}
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
  showPasswordToggle,
  onTogglePassword,
  passwordVisible,
  disabled,
}: {
  icon: typeof Mail
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  showPasswordToggle?: boolean
  onTogglePassword?: () => void
  passwordVisible?: boolean
  disabled?: boolean
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
          disabled={disabled}
          className={`w-full rounded-lg border border-white/[0.08] bg-surface-900/80 py-3 pl-10 pr-4 text-sm focus:border-thriv-600/50 focus:outline-none focus:ring-1 focus:ring-thriv-600/30 min-h-[48px] ${
            showPasswordToggle ? 'pr-10' : ''
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            disabled={disabled}
            className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none touch-manipulation disabled:opacity-50"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            {passwordVisible ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
