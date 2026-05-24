import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Portfolio, PlayerProgress } from '../types'
import { initApiBase, isBrowserOnline } from '../lib/apiConfig'
import {
  checkApiHealth,
  fetchGameState,
  fetchMe,
  getStoredToken,
  login,
  register,
  saveGameState,
  setStoredToken,
  updateProfile,
  type AuthUser,
} from '../lib/api'
import { defaultProgress } from '../lib/progressStorage'
import { ensureWeeklyChallenge } from '../lib/retention'
import { QUESTS } from '../data/quests'
import { STARTING_CASH } from '../data/stocks'
import { sanitizeDisplayCredential } from '../lib/credentialBadge'
import { mergeProfilePrefs } from '../lib/profileTheme'
import type { Portfolio as P } from '../types'

export type AuthMode = 'authenticated' | 'guest' | null

interface AuthContextValue {
  user: AuthUser | null
  mode: AuthMode
  loading: boolean
  apiOnline: boolean
  browserOnline: boolean
  refreshApiStatus: () => Promise<void>
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
  lastSyncedAt: string | null
  initialPortfolio: Portfolio | null
  initialProgress: PlayerProgress | null
  gameReady: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  continueAsGuest: () => void
  logout: () => void
  updateDisplayName: (name: string) => Promise<void>
  queueCloudSave: (portfolio: Portfolio, progress: PlayerProgress) => void
  markWelcomeSeen: () => void
  welcomeSeen: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mergeProgress(remote: PlayerProgress): PlayerProgress {
  const defaults = defaultProgress()
  const knownIds = new Set(QUESTS.map((q) => q.id))
  let quests = [...(remote.quests ?? [])].filter((q) => knownIds.has(q.id))
  for (const q of QUESTS) {
    if (!quests.some((x) => x.id === q.id)) {
      quests.push({ id: q.id, completed: false, claimed: false })
    }
  }
  const achievements = remote.achievements ?? []
  const merged = {
    ...defaults,
    ...remote,
    quests,
    achievements,
    displayCredentialId: sanitizeDisplayCredential(
      achievements,
      remote.displayCredentialId
    ),
    stats: { ...defaults.stats, ...remote.stats },
    profile: mergeProfilePrefs(remote.profile),
    dailyBonusDate: remote.dailyBonusDate ?? null,
    weeklyChallengeWeek: remote.weeklyChallengeWeek ?? null,
    weeklyChallengeId: remote.weeklyChallengeId ?? null,
    weeklyChallengeDone: remote.weeklyChallengeDone ?? false,
  }
  return ensureWeeklyChallenge(merged)
}

function defaultPortfolio(): P {
  return {
    cash: STARTING_CASH,
    holdings: [],
    orders: [],
    watchlist: ['AAPL', 'NVDA', 'MSFT'],
    alerts: [],
    marginLoan: 0,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mode, setMode] = useState<AuthMode>(null)
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(false)
  const [browserOnline, setBrowserOnline] = useState(isBrowserOnline)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [initialPortfolio, setInitialPortfolio] = useState<Portfolio | null>(null)
  const [initialProgress, setInitialProgress] = useState<PlayerProgress | null>(null)
  const [gameReady, setGameReady] = useState(false)
  const [welcomeSeen, setWelcomeSeen] = useState(
    () => localStorage.getItem('thriv-welcome-seen') === '1'
  )

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSave = useRef<{ portfolio: Portfolio; progress: PlayerProgress } | null>(null)

  const refreshApiStatus = useCallback(async () => {
    setBrowserOnline(isBrowserOnline())
    await initApiBase()
    const reachable = await checkApiHealth()
    setApiOnline(reachable)
  }, [])

  const bootstrap = useCallback(async () => {
    setBrowserOnline(isBrowserOnline())
    await initApiBase()
    const online = await checkApiHealth()
    setApiOnline(online)
    const token = getStoredToken()
    if (token && online) {
      try {
        const { user: me } = await fetchMe()
        const state = await fetchGameState()
        setUser(me)
        setMode('authenticated')
        setInitialPortfolio(state.portfolio as Portfolio)
        setInitialProgress(ensureWeeklyChallenge(mergeProgress(state.progress as PlayerProgress)))
        setLastSyncedAt(state.updatedAt)
        setSyncStatus('synced')
        setGameReady(true)
        setLoading(false)
        return
      } catch {
        setStoredToken(null)
      }
    }
    const guest = sessionStorage.getItem('thriv-guest') === '1'
    if (guest) {
      setMode('guest')
      setGameReady(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  useEffect(() => {
    const onOnline = () => {
      setBrowserOnline(true)
      void refreshApiStatus()
    }
    const onOffline = () => {
      setBrowserOnline(false)
      setApiOnline(false)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [refreshApiStatus])

  const flushCloudSave = useCallback(async () => {
    if (mode !== 'authenticated' || !user || !pendingSave.current) return
    setSyncStatus('syncing')
    try {
      const { updatedAt } = await saveGameState(
        pendingSave.current.portfolio,
        pendingSave.current.progress
      )
      setLastSyncedAt(updatedAt)
      setSyncStatus('synced')
    } catch {
      setSyncStatus('error')
    }
  }, [mode, user])

  const queueCloudSave = useCallback(
    (portfolio: Portfolio, progress: PlayerProgress) => {
      pendingSave.current = { portfolio, progress }
      if (mode !== 'authenticated') return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        flushCloudSave()
      }, 1500)
    },
    [mode, flushCloudSave]
  )

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  const finishAuth = useCallback(
    (authUser: AuthUser, token: string, state?: { portfolio: Portfolio; progress: PlayerProgress }) => {
      setStoredToken(token)
      sessionStorage.removeItem('thriv-guest')
      setUser(authUser)
      setMode('authenticated')
      setInitialPortfolio(state?.portfolio ?? defaultPortfolio())
      setInitialProgress(
        state ? mergeProgress(state.progress) : ensureWeeklyChallenge(defaultProgress())
      )
      setGameReady(true)
      setSyncStatus('synced')
    },
    []
  )

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const { user: u, token } = await login(email, password)
      setStoredToken(token)
      const state = await fetchGameState()
      finishAuth(u, token, {
        portfolio: state.portfolio as Portfolio,
        progress: ensureWeeklyChallenge(mergeProgress(state.progress as PlayerProgress)),
      })
      setLastSyncedAt(state.updatedAt)
    },
    [finishAuth]
  )

  const handleRegister = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { user: u, token } = await register(email, password, displayName)
      setStoredToken(token)
      let statePortfolio = defaultPortfolio()
      let stateProgress = defaultProgress()
      try {
        const state = await fetchGameState()
        statePortfolio = state.portfolio as Portfolio
        stateProgress = ensureWeeklyChallenge(mergeProgress(state.progress as PlayerProgress))
        setLastSyncedAt(state.updatedAt)
      } catch {
        /* server may still have saved default state on register */
      }
      finishAuth(u, token, {
        portfolio: statePortfolio,
        progress: stateProgress,
      })
      setWelcomeSeen(false)
    },
    [finishAuth]
  )

  const continueAsGuest = useCallback(() => {
    sessionStorage.setItem('thriv-guest', '1')
    setStoredToken(null)
    setUser(null)
    setMode('guest')
    setInitialPortfolio(null)
    setInitialProgress(null)
    setGameReady(true)
  }, [])

  const logout = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    if (pendingSave.current && getStoredToken()) {
      void saveGameState(pendingSave.current.portfolio, pendingSave.current.progress).catch(
        () => undefined
      )
    }
    setStoredToken(null)
    sessionStorage.removeItem('thriv-guest')
    setUser(null)
    setMode(null)
    setInitialPortfolio(null)
    setInitialProgress(null)
    setGameReady(false)
    setSyncStatus('idle')
    setLastSyncedAt(null)
  }, [])

  const handleUpdateDisplayName = useCallback(async (displayName: string) => {
    const { user: u } = await updateProfile(displayName)
    setUser(u)
  }, [])

  const markWelcomeSeen = useCallback(() => {
    localStorage.setItem('thriv-welcome-seen', '1')
    setWelcomeSeen(true)
  }, [])

  const value = useMemo(
    () => ({
      user,
      mode,
      loading,
      apiOnline,
      browserOnline,
      refreshApiStatus,
      syncStatus,
      lastSyncedAt,
      initialPortfolio,
      initialProgress,
      gameReady,
      login: handleLogin,
      register: handleRegister,
      continueAsGuest,
      logout,
      updateDisplayName: handleUpdateDisplayName,
      queueCloudSave,
      markWelcomeSeen,
      welcomeSeen,
    }),
    [
      user,
      mode,
      loading,
      apiOnline,
      browserOnline,
      refreshApiStatus,
      syncStatus,
      lastSyncedAt,
      initialPortfolio,
      initialProgress,
      gameReady,
      handleLogin,
      handleRegister,
      continueAsGuest,
      logout,
      handleUpdateDisplayName,
      queueCloudSave,
      markWelcomeSeen,
      welcomeSeen,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
