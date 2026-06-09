import type { Portfolio, PlayerProgress } from '../types'
import {
  getApiBase,
  initApiBase,
  isApiConfigured,
  isBrowserOnline,
  usesSameOriginApi,
} from './apiConfig'

export interface AuthUser {
  id: string
  email: string
  displayName: string
}

export interface GameStateResponse {
  userId: string
  portfolio: Portfolio
  progress: PlayerProgress
  updatedAt: string
}

const TOKEN_KEY = 'thriv-auth-token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const base = getApiBase()
  if (base) return `${base}${p}`
  if (usesSameOriginApi() || import.meta.env.DEV) return p
  return p
}

function formatApiError(status: number, data: unknown): string {
  const msg = (data as { error?: string })?.error
  if (msg) return msg
  if (status === 405) {
    return usesSameOriginApi() || import.meta.env.PROD
      ? 'Sign-in is currently unavailable (405). Please contact support or try again later.'
      : 'Sign-in blocked (405). API URL may be wrong — set VITE_API_URL and redeploy, or use thriv-config.json apiUrl.'
  }
  return `Request failed (${status}).`
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  await initApiBase()

  if (!isBrowserOnline()) {
    throw new Error('No internet connection. Connect to the network and try again.')
  }

  if (!isApiConfigured()) {
    throw new Error(
      import.meta.env.PROD
        ? 'Account service is not configured. Please contact the administrator or try guest mode.'
        : 'Sign-in server is not configured. Set VITE_API_URL when building, or add your API URL to public/thriv-config.json (apiUrl).'
    )
  }

  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(apiUrl(path), { ...options, headers })
  } catch {
    throw new Error(
      isApiConfigured()
        ? 'Cannot reach the Thriv API. Check your connection and that the API is running.'
        : (import.meta.env.PROD
            ? 'Cannot reach the Thriv API. Please verify your connection or try again later.'
            : 'Cannot reach the Thriv API. Set VITE_API_URL (build) or thriv-config.json (apiUrl).')
    )
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(formatApiError(res.status, data))
  }
  return data as T
}

export async function checkApiHealth(): Promise<boolean> {
  if (!isBrowserOnline()) return false

  await initApiBase()
  if (!isApiConfigured()) return false

  try {
    const res = await fetch(apiUrl('/api/health'), { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return false
    const data = await res.json().catch(() => ({}))
    return (data as { ok?: boolean }).ok === true
  } catch {
    return false
  }
}

export function getApiStatusMessage(): string {
  if (!isBrowserOnline()) {
    return 'You appear to be offline. Connect to the internet to sign in or sync progress.'
  }
  if (!isApiConfigured()) {
    return import.meta.env.PROD
      ? 'Account server is not configured. Please contact the administrator or try guest mode.'
      : 'Start the API with npm run dev:server, or run npm run dev:all. Guest mode works without the API.'
  }
  if (usesSameOriginApi()) {
    return import.meta.env.PROD
      ? 'Cannot reach the account server. Please verify your connection or try again later.'
      : 'Cannot reach the account server through /api proxy. Confirm VITE_API_URL points to your live API and redeploy the frontend.'
  }
  return import.meta.env.PROD
    ? 'Cannot reach the account server. Please verify your connection or try again later.'
    : 'Cannot reach the account server. Check that your API is running and CORS allows this site.'
}

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: AuthUser; token: string }> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  })
}

export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  return request('/api/auth/me')
}

export async function updateProfile(displayName: string): Promise<{ user: AuthUser }> {
  return request('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  })
}

export async function fetchGameState(): Promise<GameStateResponse> {
  return request('/api/game-state')
}

export async function saveGameState(
  portfolio: Portfolio,
  progress: PlayerProgress
): Promise<{ ok: boolean; updatedAt: string }> {
  return request('/api/game-state', {
    method: 'PUT',
    body: JSON.stringify({ portfolio, progress }),
  })
}
