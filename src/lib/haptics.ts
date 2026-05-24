/** Minimal vibration (mobile / supported browsers). No-op elsewhere. */

export type HapticKind = 'success' | 'alert'

const PATTERNS: Record<HapticKind, number | number[]> = {
  success: 14,
  alert: [18, 55, 22],
}

export function haptic(kind: HapticKind): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(PATTERNS[kind])
  } catch {
    /* blocked or unsupported */
  }
}
