/** Resolve API base URL: build-time env or runtime thriv-config.json */

const envApi = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '') ?? ''

let apiBase = envApi
let sameOriginApi = false

let initDone = false

export function getApiBase(): string {
  return apiBase
}

export function usesSameOriginApi(): boolean {
  return sameOriginApi
}

export function isApiConfigured(): boolean {
  return apiBase.length > 0 || import.meta.env.DEV
}

export async function initApiBase(): Promise<string> {
  if (initDone) return apiBase
  initDone = true

  if (apiBase) return apiBase

  try {
    const res = await fetch('/thriv-config.json', { cache: 'no-store' })
    if (res.ok) {
      const cfg = (await res.json()) as { apiUrl?: string }
      const url = cfg.apiUrl?.trim().replace(/\/$/, '')
      if (url) apiBase = url
    }
  } catch {
    /* offline or missing */
  }

  return apiBase
}

export function isBrowserOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}
