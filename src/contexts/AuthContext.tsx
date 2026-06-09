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
import { isBrowserOnline } from '../lib/apiConfig'
import { doc, onSnapshot } from 'firebase/firestore'
import {
  auth as fbAuth,
  googleProvider,
  saveGameStateToFirestore,
  fetchGameStateFromFirestore,
  updateDisplayNameInFirestore,
  updateWelcomeSeenInFirestore,
  claimSessionInFirestore,
  db,
} from '../lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth'
import { defaultProgress } from '../lib/progressStorage'
import { ensureWeeklyChallenge } from '../lib/retention'
import { levelFromXp } from '../lib/progression'
import { QUESTS, DAILY_QUESTS } from '../data/quests'
import { STARTING_CASH } from '../data/stocks'
import { sanitizeDisplayCredential } from '../lib/credentialBadge'
import { mergeProfilePrefs } from '../lib/profileTheme'
import { applyCloudState } from '../lib/userStorage'
import type { Portfolio as P } from '../types'

export type AuthMode = 'authenticated' | 'guest' | null

export interface AuthUser {
  id: string
  email: string
  displayName: string
}

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
  forgotPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  checkVerificationStatus: () => Promise<void>
  loginWithGoogle?: () => Promise<void>
  continueAsGuest: () => void
  logout: () => void
  updateDisplayName: (name: string) => Promise<void>
  queueCloudSave: (portfolio: Portfolio, progress: PlayerProgress, immediate?: boolean) => void
  forceSyncCloudSave: (portfolio: Portfolio, progress: PlayerProgress) => Promise<void>
  refreshSync: () => Promise<void>
  markWelcomeSeen: () => void
  welcomeSeen: boolean
  isFirebaseActive: boolean
  sessionTerminated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mergeProgress(remote: PlayerProgress): PlayerProgress {
  const defaults = defaultProgress()
  const knownIds = new Set([
    ...QUESTS.map((q) => q.id),
    ...DAILY_QUESTS.map((q) => q.id),
  ])
  let quests = [...(remote.quests ?? [])].filter((q) => knownIds.has(q.id))
  for (const q of [...QUESTS, ...DAILY_QUESTS]) {
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
    level: levelFromXp(remote.xp ?? 0),
    displayCredentialId: sanitizeDisplayCredential(
      achievements,
      remote.displayCredentialId
    ),
    stats: {
      ...defaults.stats,
      ...remote.stats,
      activitiesPlayed: remote.stats?.activitiesPlayed ?? 0,
    },
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
  const [apiOnline, setApiOnline] = useState(isBrowserOnline)
  const [browserOnline, setBrowserOnline] = useState(isBrowserOnline)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [initialPortfolio, setInitialPortfolio] = useState<Portfolio | null>(null)
  const [initialProgress, setInitialProgress] = useState<PlayerProgress | null>(null)
  const [gameReady, setGameReady] = useState(false)
  const [welcomeSeen, setWelcomeSeen] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSave = useRef<{ portfolio: Portfolio; progress: PlayerProgress } | null>(null)
  const hasUnsavedChanges = useRef(false)
  const isSavingRef = useRef(false)
  const hasSavePendingAfterCurrentRef = useRef(false)
  
  const [sessionTerminated, setSessionTerminated] = useState(false)
  const sessionTerminatedRef = useRef(false)
  const activeSessionVersionRef = useRef<number>(0)
  const sessionIdRef = useRef<string>('')
  const [sessionClaimed, setSessionClaimed] = useState(false)

  // Flush pending save before page unload to prevent data loss
  useEffect(() => {
    const onBeforeUnload = () => {
      if (pendingSave.current && user) {
        // Synchronously save to localStorage as a safety net
        applyCloudState(pendingSave.current.portfolio, pendingSave.current.progress, user.id, false)
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [user])

  const refreshApiStatus = useCallback(async () => {
    const online = isBrowserOnline()
    setBrowserOnline(online)
    setApiOnline(online)
  }, [])

  // Bootstrapping strictly based on Firebase Configuration
  useEffect(() => {
    setApiOnline(isBrowserOnline())
    const unsubscribe = onAuthStateChanged(fbAuth, async (fbUser) => {
      if (fbUser) {
        // Enforce Session ID Initialization
        if (!sessionIdRef.current) {
          const storedSessionId = sessionStorage.getItem('thriv-session-id')
          if (storedSessionId) {
            sessionIdRef.current = storedSessionId
          } else {
            const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            sessionIdRef.current = newId
            sessionStorage.setItem('thriv-session-id', newId)
          }
        }
        setSessionTerminated(false)
        sessionTerminatedRef.current = false
        setSessionClaimed(false)

        // Enforce Email Verification: if not verified and not a Google provider user, keep in pending state
        const isGoogleUser = fbUser.providerData.some((p) => p.providerId === 'google.com')
        if (!fbUser.emailVerified && !isGoogleUser) {
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
          })
          setMode(null)
          setGameReady(false)
          setLoading(false)
          return
        }

        // Set mode to authenticated instantly. Keep gameReady false to show the loading screen during fetch!
        setMode('authenticated')
        setGameReady(false)

        try {
          setSyncStatus('syncing')
          console.log('[Auth Bootstrap] Starting deterministic cloud-first bootstrap for', fbUser.uid)

          const localKey = `thriv-progress-${fbUser.uid}`
          const localPortfolioKey = `thriv-portfolio-${fbUser.uid}`

          // Fetch the current cloud state from Firestore
          let cloudState = null
          let isCloudError = false
          try {
            cloudState = await fetchGameStateFromFirestore(fbUser.uid)
          } catch (err) {
            console.error('[Auth Bootstrap] Firestore fetch failed:', err)
            isCloudError = true
          }

          // Read the local cache state
          let localPortfolio = null
          let localProgress = null
          let localLastUpdate = 0
          try {
            const rawProgress = localStorage.getItem(localKey)
            const rawPortfolio = localStorage.getItem(localPortfolioKey)
            const rawUpdate = localStorage.getItem(`thriv-last-update-${fbUser.uid}`)
            localPortfolio = rawPortfolio ? JSON.parse(rawPortfolio) as Portfolio : null
            localProgress = rawProgress ? JSON.parse(rawProgress) as PlayerProgress : null
            localLastUpdate = rawUpdate ? parseInt(rawUpdate, 10) : 0
          } catch (e) {
            console.warn('[Auth Bootstrap] Error reading local cache:', e)
          }

          const hasLocalCache = !!localPortfolio && !!localProgress

          let finalPortfolio = defaultPortfolio()
          let finalProgress = defaultProgress()
          let finalUpdateVal = Date.now()

          if (isCloudError) {
            // Cloud fetch crashed: fall back immediately to local cache if present, otherwise default
            console.log('[Auth Bootstrap] Cloud fetch error, falling back to local cache/default...')
            if (hasLocalCache) {
              finalPortfolio = localPortfolio!
              finalProgress = ensureWeeklyChallenge(mergeProgress(localProgress!))
              finalUpdateVal = localLastUpdate
            }
            setWelcomeSeen(localStorage.getItem('thriv-welcome-seen') === '1')
            setSyncStatus('error')
          } else if (cloudState) {
            // Cloud state exists
            const cloudPortfolio = cloudState.portfolio ?? defaultPortfolio()
            const cloudProgress = cloudState.progress ?? defaultProgress()
            const cloudLastUpdate = cloudState.updatedAt ? new Date(cloudState.updatedAt).getTime() : 0
            const cloudWelcomeSeen = cloudState.welcomeSeen ?? false
            const cloudSessionVer = cloudState.sessionVersion ?? 0

            if (hasLocalCache && localLastUpdate > cloudLastUpdate) {
              // Local cache is strictly newer (e.g. offline progress on this device)
              console.log('[Auth Bootstrap] Local cache is newer than cloud. Syncing local cache to Firestore...')
              finalPortfolio = localPortfolio!
              finalProgress = ensureWeeklyChallenge(mergeProgress(localProgress!))
              finalUpdateVal = localLastUpdate

              activeSessionVersionRef.current = cloudSessionVer + 1

              // Sync the local state to the cloud asynchronously
              await saveGameStateToFirestore(fbUser.uid, finalPortfolio, finalProgress, sessionIdRef.current)
                .then(async ({ updatedAt }) => {
                  setLastSyncedAt(updatedAt)
                  finalUpdateVal = new Date(updatedAt).getTime()
                  await claimSessionInFirestore(fbUser.uid, sessionIdRef.current)
                    .catch((e) => console.error('[Auth Bootstrap] Session claim write failed:', e))
                })
                .catch((e) => console.error('[Auth Bootstrap] Background sync failed:', e))
            } else {
              // Cloud state is newer or identical, or no local cache exists
              console.log('[Auth Bootstrap] Cloud state is master. Overwriting local cache...')
              finalPortfolio = cloudPortfolio
              finalProgress = ensureWeeklyChallenge(mergeProgress(cloudProgress))
              finalUpdateVal = cloudLastUpdate
              
              activeSessionVersionRef.current = cloudSessionVer + 1

              // lightweight claim active session ID in Firestore
              await claimSessionInFirestore(fbUser.uid, sessionIdRef.current)
                .catch((e) => console.error('[Auth Bootstrap] Session claim write failed:', e))
            }
            setWelcomeSeen(cloudWelcomeSeen)
            setSyncStatus('synced')
          } else {
            // No cloud state exists yet: upload local cache (or defaults) to cloud
            console.log('[Auth Bootstrap] No cloud state found. Initializing Firestore with local/default state...')
            if (hasLocalCache) {
              finalPortfolio = localPortfolio!
              finalProgress = ensureWeeklyChallenge(mergeProgress(localProgress!))
              finalUpdateVal = localLastUpdate
            }
            setWelcomeSeen(false)

            activeSessionVersionRef.current = 1

            await saveGameStateToFirestore(fbUser.uid, finalPortfolio, finalProgress, sessionIdRef.current)
              .then(async ({ updatedAt }) => {
                setLastSyncedAt(updatedAt)
                finalUpdateVal = new Date(updatedAt).getTime()
                setSyncStatus('synced')
                await claimSessionInFirestore(fbUser.uid, sessionIdRef.current)
                  .catch((e) => console.error('[Auth Bootstrap] Session claim failed:', e))
              })
              .catch((e) => {
                console.error('[Auth Bootstrap] Initial cloud write failed:', e)
                setSyncStatus('error')
              })
          }

          // Apply resolved master state
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
          })
          setInitialPortfolio(finalPortfolio)
          setInitialProgress(finalProgress)
          
          applyCloudState(finalPortfolio, finalProgress, fbUser.uid, false, finalUpdateVal)

          setSessionClaimed(true)
          setGameReady(true)
          setLoading(false)
        } catch (bootstrapErr) {
          console.error('[Auth Bootstrap] Critical processing failure:', bootstrapErr)
          setSyncStatus('error')
          setLoading(false)
          // Recovery fallback: let them access local cache anyway so the app doesn't freeze
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
          })
          setGameReady(true)
        }
      } else {
        // Firebase signed out
        const guest = sessionStorage.getItem('thriv-guest') === '1'
        if (!guest) {
          setUser(null)
          setMode(null)
          setGameReady(false)
          setInitialPortfolio(null)
          setInitialProgress(null)
        }
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Synchronize browser connection state
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

  // Cloud Save flush mechanism
  const flushCloudSave = useCallback(async () => {
    if (mode !== 'authenticated' || !user || !pendingSave.current) return
    if (sessionTerminatedRef.current) {
      console.log('[Auth Session] Save ignored because session is terminated.')
      return
    }

    if (isSavingRef.current) {
      console.log('[Auth Save Queue] Firestore write is already in progress. Enqueueing post-current flush.')
      hasSavePendingAfterCurrentRef.current = true
      return
    }

    isSavingRef.current = true
    hasSavePendingAfterCurrentRef.current = false
    setSyncStatus('syncing')

    // Capture the current state values to prevent references changing during the asynchronous write
    const currentSave = pendingSave.current

    try {
      const { updatedAt } = await saveGameStateToFirestore(
        user.id,
        currentSave.portfolio,
        currentSave.progress,
        sessionIdRef.current,
        true // isGameplayUpdate = true
      )

      setLastSyncedAt(updatedAt)
      localStorage.setItem(`thriv-last-update-${user.id}`, String(new Date(updatedAt).getTime()))
      
      // Only update in-memory initial source states and clear unsaved changes if no further save is pending.
      // This prevents race conditions where a newer local state is reverted by an older resolving save's initial state.
      if (!hasSavePendingAfterCurrentRef.current) {
        setInitialProgress(currentSave.progress)
        setInitialPortfolio(currentSave.portfolio)
        hasUnsavedChanges.current = false
        setSyncStatus('synced')
      } else {
        console.log('[Auth Save Queue] Skipping initial state alignment as a newer save is pending.')
      }
    } catch (e: any) {
      console.error('[Auth Save Queue] Firestore write failed:', e)
      if (e?.message === 'session_terminated') {
        console.warn('[Auth Session] Lockout triggered by write mismatch check.')
        setSessionTerminated(true)
        sessionTerminatedRef.current = true
        sessionStorage.removeItem('thriv-session-id')
      } else {
        setSyncStatus('error')
      }
    } finally {
      isSavingRef.current = false
      if (hasSavePendingAfterCurrentRef.current) {
        console.log('[Auth Save Queue] Flushing next queued state.')
        void flushCloudSave()
      }
    }
  }, [mode, user])

  // Cloud Save queue mechanism (debounced or immediate)
  const queueCloudSave = useCallback(
    (portfolio: Portfolio, progress: PlayerProgress, immediate = false) => {
      if (sessionTerminatedRef.current) {
        console.log('[Auth Session] Save queue ignored because session is terminated.')
        return
      }
      pendingSave.current = { portfolio, progress }
      hasUnsavedChanges.current = true
      if (mode !== 'authenticated') return

      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (immediate) {
        // For critical state changes, save synchronously to local storage first, then fire Firestore write
        if (user) {
          applyCloudState(portfolio, progress, user.id, false)
        }
        void flushCloudSave()
      } else {
        saveTimer.current = setTimeout(() => {
          flushCloudSave()
        }, 1500)
      }
    },
    [mode, user, flushCloudSave]
  )

  const forceSyncCloudSave = useCallback(
    async (portfolio: Portfolio, progress: PlayerProgress) => {
      pendingSave.current = { portfolio, progress }
      hasUnsavedChanges.current = true
      await flushCloudSave()
    },
    [flushCloudSave]
  )

  const refreshSync = useCallback(async () => {
    if (mode !== 'authenticated' || !user) return
    setSyncStatus('syncing')
    try {
      console.log('[Auth] Starting manual refresh sync...')
      
      // Fetch the latest cloud state
      const state = await fetchGameStateFromFirestore(user.id)
      if (state) {
        // Redundancy check: check session ownership
        if (state.activeSessionId && state.activeSessionId !== sessionIdRef.current) {
          console.warn('[Auth Session] Mismatch detected during refreshSync. Remote:', state.activeSessionId, '| Local:', sessionIdRef.current)
          setSessionTerminated(true)
          sessionTerminatedRef.current = true
          sessionStorage.removeItem('thriv-session-id')
          setSyncStatus('error')
          return
        }

        console.log('[Auth] Fetched cloud state:', { xp: state.progress?.xp, cash: state.portfolio?.cash })
        
        let cloudPortfolio = state.portfolio ?? defaultPortfolio()
        let cloudProgress = state.progress ?? defaultProgress()
        let finalUpdatedAt = state.updatedAt ?? new Date().toISOString()
        let cloudLastUpdate = state.updatedAt ? new Date(state.updatedAt).getTime() : 0
        let cloudWelcomeSeen = state.welcomeSeen ?? false

        const mergedProgress = ensureWeeklyChallenge(mergeProgress(cloudProgress))

        applyCloudState(cloudPortfolio, mergedProgress, user.id, false, cloudLastUpdate)

        setInitialPortfolio(cloudPortfolio)
        setInitialProgress(mergedProgress)
        setLastSyncedAt(finalUpdatedAt)
        setWelcomeSeen(cloudWelcomeSeen)
        
        setSyncStatus('synced')
        console.log('[Auth] Manual refresh sync completed successfully!')
      } else {
        console.log('[Auth] No cloud state found, creating one from current memory...')
        const localKey = `thriv-progress-${user.id}`
        const localPortfolioKey = `thriv-portfolio-${user.id}`
        const rawLocalProgress = localStorage.getItem(localKey)
        const rawLocalPortfolio = localStorage.getItem(localPortfolioKey)
        const localProgress = rawLocalProgress ? JSON.parse(rawLocalProgress) as PlayerProgress : null
        const localPortfolio = rawLocalPortfolio ? JSON.parse(rawLocalPortfolio) as Portfolio : null
        
        const finalPortfolio = localPortfolio ?? defaultPortfolio()
        const finalProgress = localProgress ?? defaultProgress()
        
        const { updatedAt } = await saveGameStateToFirestore(user.id, finalPortfolio, finalProgress, sessionIdRef.current)
        setLastSyncedAt(updatedAt)
        localStorage.setItem(`thriv-last-update-${user.id}`, String(new Date(updatedAt).getTime()))
        setSyncStatus('synced')
      }
    } catch (err) {
      console.error('[Auth] Manual refresh sync error:', err)
      setSyncStatus('error')
    }
  }, [mode, user])

  const syncStatusRef = useRef(syncStatus)
  useEffect(() => {
    syncStatusRef.current = syncStatus
  }, [syncStatus])

  // Periodic autosave interval to prevent data loss in case debounces are repeatedly postponed
  useEffect(() => {
    if (mode !== 'authenticated' || !user) return
    const interval = setInterval(() => {
      if (hasUnsavedChanges.current && pendingSave.current && syncStatusRef.current !== 'syncing') {
        console.log('[Auth] Periodic auto-sync flushing pending changes...')
        void flushCloudSave()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [mode, user, flushCloudSave])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  // Firebase Login
  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        sessionStorage.removeItem('thriv-guest')
        await signInWithEmailAndPassword(fbAuth, email, password)
      } catch (err) {
        throw err
      }
    },
    []
  )

  // Firebase Register
  const handleRegister = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        sessionStorage.removeItem('thriv-guest')
        const credential = await createUserWithEmailAndPassword(fbAuth, email, password)
        await fbUpdateProfile(credential.user, { displayName })
        await updateDisplayNameInFirestore(credential.user.uid, displayName)
        try {
          await sendEmailVerification(credential.user)
        } catch (e) {
          console.warn('[Auth] Failed to send initial verification email:', e)
        }
      } catch (err) {
        throw err
      }
    },
    []
  )

  // Firebase Forgot Password
  const handleForgotPassword = useCallback(
    async (email: string) => {
      try {
        await sendPasswordResetEmail(fbAuth, email)
      } catch (err) {
        throw err
      }
    },
    []
  )

  // Resend Email Verification link manually
  const resendVerification = useCallback(
    async () => {
      try {
        if (fbAuth?.currentUser) {
          await sendEmailVerification(fbAuth.currentUser)
        }
      } catch (err) {
        throw err
      }
    },
    []
  )

  // Standard loading block upon successful email verification
  const handleVerificationSuccess = useCallback(
    async (fbUser: any) => {
      try {
        setSyncStatus('syncing')
        let state = await fetchGameStateFromFirestore(fbUser.uid)
        
        let cloudPortfolio = state?.portfolio ?? defaultPortfolio()
        let cloudProgress = state?.progress ?? defaultProgress()
        let finalUpdatedAt = state?.updatedAt ?? new Date().toISOString()
        let cloudLastUpdate = state?.updatedAt ? new Date(state.updatedAt).getTime() : 0
        let cloudWelcomeSeen = state?.welcomeSeen ?? false

        const mergedProgress = ensureWeeklyChallenge(mergeProgress(cloudProgress))
        
        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trader',
        })
        setMode('authenticated')
        setInitialPortfolio(cloudPortfolio)
        setInitialProgress(mergedProgress)
        setLastSyncedAt(finalUpdatedAt)
        setWelcomeSeen(cloudWelcomeSeen)
        setGameReady(true)

        setSyncStatus('synced')

        applyCloudState(cloudPortfolio, mergedProgress, fbUser.uid, false, cloudLastUpdate)

        const cloudSessionVer = state?.sessionVersion ?? 0
        activeSessionVersionRef.current = cloudSessionVer + 1

        // Perform a successful sync in the background asynchronously to persist the verified state
        saveGameStateToFirestore(fbUser.uid, cloudPortfolio, mergedProgress, sessionIdRef.current)
          .then(async ({ updatedAt }) => {
            setLastSyncedAt(updatedAt)
            localStorage.setItem(`thriv-last-update-${fbUser.uid}`, String(new Date(updatedAt).getTime()))
            await claimSessionInFirestore(fbUser.uid, sessionIdRef.current)
              .catch((e) => console.error('[Auth] Verification session claim failed:', e))
          })
          .catch((e) => {
            console.error('[Auth] Verification background sync failed:', e)
            setSyncStatus('error')
          })
          .finally(() => setSessionClaimed(true))
      } catch (err) {
        console.error('[Auth] Failed to load data after verification:', err)
        setSyncStatus('error')
      }
    },
    []
  )

  // Reload the Firebase user object state to check verification status and login
  const checkVerificationStatus = useCallback(
    async () => {
      if (fbAuth?.currentUser) {
        await fbAuth.currentUser.reload()
        if (fbAuth.currentUser.emailVerified) {
          console.log('[Auth] Email verified on reload! Loading user data...')
          await handleVerificationSuccess(fbAuth.currentUser)
        }
      }
    },
    [handleVerificationSuccess]
  )

  // Google Authentication Trigger
  const handleGoogleSignIn = useCallback(async () => {
    try {
      sessionStorage.removeItem('thriv-guest')
      await signInWithPopup(fbAuth, googleProvider)
      // onAuthStateChanged takes care of state sync
    } catch (err) {
      throw err
    }
  }, [])

  // Continue as Guest (local storage)
  const continueAsGuest = useCallback(() => {
    sessionStorage.setItem('thriv-guest', '1')
    setUser(null)
    setMode('guest')
    setInitialPortfolio(null)
    setInitialProgress(null)
    setGameReady(true)
  }, [])

  // Logout from Firebase
  const logout = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)

    const pendingUID = fbAuth?.currentUser?.uid
    const hasUnsaved = hasUnsavedChanges.current && pendingSave.current

    if (hasUnsaved && pendingUID && pendingSave.current && !sessionTerminatedRef.current) {
      console.log('[Auth] Background saving pending changes before logout...')
      saveGameStateToFirestore(
        pendingUID,
        pendingSave.current.portfolio,
        pendingSave.current.progress,
        sessionIdRef.current,
        true // isGameplayUpdate = true
      ).catch((err) => {
        console.error('[Auth] Background save failed:', err)
      })
      hasUnsavedChanges.current = false
    }

    sessionStorage.removeItem('thriv-guest')
    sessionStorage.removeItem('thriv-session-id')
    sessionIdRef.current = ''
    setUser(null)
    setMode(null)
    setInitialPortfolio(null)
    setInitialProgress(null)
    setSyncStatus('idle')
    setLastSyncedAt(null)
    setGameReady(false)
    setSessionTerminated(false)
    sessionTerminatedRef.current = false

    localStorage.removeItem('thriv-welcome-seen')
    setWelcomeSeen(false)

    try {
      await signOut(fbAuth)
    } catch (e) {
      console.error('[Auth] Signout failed', e)
    }
  }, [])

  // Display Name Update
  const handleUpdateDisplayName = useCallback(async (displayName: string) => {
    if (fbAuth?.currentUser) {
      await fbUpdateProfile(fbAuth.currentUser, { displayName })
      await updateDisplayNameInFirestore(fbAuth.currentUser.uid, displayName)
      setUser((prev) => (prev ? { ...prev, displayName } : null))
    }
  }, [])

  // Synchronize welcomeSeen state with localStorage
  useEffect(() => {
    if (welcomeSeen) {
      localStorage.setItem('thriv-welcome-seen', '1')
    } else {
      localStorage.removeItem('thriv-welcome-seen')
    }
  }, [welcomeSeen])

  const markWelcomeSeen = useCallback(async () => {
    localStorage.setItem('thriv-welcome-seen', '1')
    setWelcomeSeen(true)
    if (user?.id) {
      try {
        await updateWelcomeSeenInFirestore(user.id, true)
        console.log('[Auth] Saved welcomeSeen=true to Firestore')
      } catch (e) {
        console.error('[Auth] Failed to update welcomeSeen in Firestore:', e)
      }
    }
  }, [user])

  // Listen to Firestore activeSessionId updates in real-time
  useEffect(() => {
    if (mode !== 'authenticated' || !user?.id || sessionTerminated || !sessionClaimed) return

    console.log('[Auth Session] Subscribing to document snapshot for activeSessionId check. Local session:', sessionIdRef.current)
    const docRef = doc(db, 'users', user.id)
    
    const unsubscribe = onSnapshot(
      docRef, 
      (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          const firestoreSessionId = data.activeSessionId
          const remoteVer = data.sessionVersion ?? 0
          
          if (firestoreSessionId === sessionIdRef.current) {
            if (remoteVer > activeSessionVersionRef.current) {
              activeSessionVersionRef.current = remoteVer
            }
          } else {
            // Mismatch detected! Check if the remote session is strictly newer than our local expected version.
            if (remoteVer > activeSessionVersionRef.current) {
              console.warn('[Auth Session] Active session ID changed to newer session. Local version:', activeSessionVersionRef.current, '| Remote version:', remoteVer)
              
              // Atomically lock save actions and mark session as terminated
              setSessionTerminated(true)
              sessionTerminatedRef.current = true
              
              sessionStorage.removeItem('thriv-session-id')
            } else {
              console.log('[Auth Session] Stale/older mismatch ignored. Local version:', activeSessionVersionRef.current, '| Remote version:', remoteVer)
            }
          }
        }
      },
      (err) => {
        console.error('[Auth Session] Snapshot subscription failed:', err)
      }
    )

    return () => {
      console.log('[Auth Session] Unsubscribing from snapshot listener')
      unsubscribe()
    }
  }, [mode, user?.id, sessionTerminated, sessionClaimed])


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
      forgotPassword: handleForgotPassword,
      resendVerification,
      checkVerificationStatus,
      loginWithGoogle: handleGoogleSignIn,
      continueAsGuest,
      logout,
      updateDisplayName: handleUpdateDisplayName,
      queueCloudSave,
      forceSyncCloudSave,
      refreshSync,
      markWelcomeSeen,
      welcomeSeen,
      isFirebaseActive: true,
      sessionTerminated,
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
      handleForgotPassword,
      resendVerification,
      checkVerificationStatus,
      handleGoogleSignIn,
      continueAsGuest,
      logout,
      handleUpdateDisplayName,
      queueCloudSave,
      forceSyncCloudSave,
      refreshSync,
      markWelcomeSeen,
      welcomeSeen,
      sessionTerminated,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
