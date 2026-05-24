const KEY = 'thriv-last-symbol'

export function loadLastSymbol(fallback = 'AAPL'): string {
  try {
    const v = localStorage.getItem(KEY)
    return v && /^[A-Z]{1,5}$/.test(v) ? v : fallback
  } catch {
    return fallback
  }
}

export function saveLastSymbol(symbol: string): void {
  try {
    localStorage.setItem(KEY, symbol)
  } catch {
    /* ignore */
  }
}
