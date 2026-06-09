import { initializeApp, getApp, getApps } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence, increment } from 'firebase/firestore'
import type { Portfolio, PlayerProgress } from '../types'

// 1. Force enable Firebase and provide fallbacks to user configuration
export const isFirebaseEnabled = true

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB3PcEOrtopE9gV2qTYxePChQ74xvTJlpY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "thriv-48e6c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "thriv-48e6c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "thriv-48e6c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1020301825204",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1020301825204:web:87456ef9ad9fb65cbbb3e1",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LH1EH122D8",
}

// 2. Initialize Firebase (strictly required)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

console.log('[Firebase] app initialized successfully')

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Enable offline cache persistence for reliable client-side capability
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[Firestore Caching] Multiple tabs open; persistence enabled in another window.')
  } else if (err.code === 'unimplemented') {
    console.warn('[Firestore Caching] Browser does not support local IndexedDB caching.')
  } else {
    console.error('[Firestore Caching] Error enabling persistence:', err)
  }
})

console.log('[Firebase] auth and db components initialized')

// 3. Define Types
export interface FirebaseGameState {
  userId: string
  portfolio: Portfolio
  progress: PlayerProgress
  updatedAt: string
  welcomeSeen?: boolean
  sessionVersion?: number
  activeSessionId?: string
}

// 4. Firestore sync helpers
function cleanUndefined(obj: any): any {
  if (obj === undefined) return null
  if (obj === null) return null
  if (Array.isArray(obj)) return obj.map(cleanUndefined)
  if (typeof obj === 'object') {
    const res: any = {}
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (val !== undefined) {
        res[key] = cleanUndefined(val)
      }
    }
    return res
  }
  return obj
}

// 4. Firestore sync helpers
export async function saveGameStateToFirestore(
  userId: string,
  portfolio: Portfolio,
  progress: PlayerProgress,
  activeSessionId?: string,
  isGameplayUpdate?: boolean
): Promise<{ ok: boolean; updatedAt: string }> {
  if (!db) throw new Error('Firestore is not initialized.')

  const userDocRef = doc(db, 'users', userId)

  // Enforce session ownership verification for gameplay writes to prevent cross-browser overwrites
  if (isGameplayUpdate && activeSessionId) {
    const snap = await getDoc(userDocRef)
    if (snap.exists()) {
      const data = snap.data()
      if (data && data.activeSessionId && data.activeSessionId !== activeSessionId) {
        console.warn('[Firestore SAVE] Aborting save due to session mismatch. Remote:', data.activeSessionId, '| Local:', activeSessionId)
        throw new Error('session_terminated')
      }
    }
  }

  const updatedAt = new Date().toISOString()

  // Recursively sanitize the payload to completely eliminate unsupported "undefined" values
  const cleanPortfolio = cleanUndefined(portfolio)
  const cleanProgress = cleanUndefined(progress)

  console.log('[Firestore SAVE] userId:', userId, '| xp:', cleanProgress.xp, '| dailyBonusDate:', cleanProgress.dailyBonusDate, '| cash:', cleanPortfolio.cash)

  const payload: any = {
    portfolio: cleanPortfolio,
    progress: cleanProgress,
    updatedAt,
  }

  if (activeSessionId) {
    payload.activeSessionId = activeSessionId
  }

  await setDoc(
    userDocRef,
    payload,
    { merge: true }
  )

  console.log('[Firestore SAVE] SUCCESS at', updatedAt)
  return { ok: true, updatedAt }
}

export async function fetchGameStateFromFirestore(userId: string): Promise<FirebaseGameState | null> {
  if (!db) throw new Error('Firestore is not initialized.')

  const userDocRef = doc(db, 'users', userId)
  console.log('[Firestore FETCH] Reading doc for userId:', userId)

  const snap = await getDoc(userDocRef)
  console.log('[Firestore FETCH] doc.exists():', snap.exists())

  if (snap.exists()) {
    const data = snap.data()
    console.log('[Firestore FETCH] data keys:', Object.keys(data), '| has portfolio:', !!data.portfolio, '| has progress:', !!data.progress)
    if (data.portfolio && data.progress) {
      const result = {
        userId,
        portfolio: data.portfolio as Portfolio,
        progress: data.progress as PlayerProgress,
        updatedAt: data.updatedAt || new Date().toISOString(),
        welcomeSeen: !!data.welcomeSeen,
        sessionVersion: data.sessionVersion ?? 0,
        activeSessionId: data.activeSessionId || '',
      }
      console.log('[Firestore FETCH] Returning state | xp:', result.progress.xp, '| dailyBonusDate:', result.progress.dailyBonusDate, '| cash:', result.portfolio.cash)
      return result
    }
  }
  console.log('[Firestore FETCH] Returning null (no state found)')
  return null
}

export async function updateDisplayNameInFirestore(userId: string, displayName: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.')
  const userDocRef = doc(db, 'users', userId)
  await setDoc(userDocRef, { displayName }, { merge: true })
}

export async function updateWelcomeSeenInFirestore(userId: string, welcomeSeen: boolean): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.')
  const userDocRef = doc(db, 'users', userId)
  await setDoc(userDocRef, { welcomeSeen }, { merge: true })
}

export async function claimSessionInFirestore(userId: string, activeSessionId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.')
  const userDocRef = doc(db, 'users', userId)
  await setDoc(userDocRef, { activeSessionId, sessionVersion: increment(1) }, { merge: true })
}


