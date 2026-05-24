import { X } from 'lucide-react'
import { useState } from 'react'

interface GuestBannerProps {
  onSignUp: () => void
}

export function GuestBanner({ onSignUp }: GuestBannerProps) {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('thriv-guest-banner') === '1'
  )

  if (dismissed) return null

  return (
    <div className="border-b border-amber-600/20 bg-amber-950/25 px-3 py-2 sm:px-4">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 text-xs sm:text-sm">
        <p className="text-amber-200/90">
          <span className="font-medium">Guest session</span>
          <span className="hidden sm:inline text-amber-200/70">
            {' '}
            — progress is stored only on this device.
          </span>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSignUp}
            className="rounded-md border border-amber-500/40 px-2.5 py-1 font-semibold text-amber-100 hover:bg-amber-900/40 touch-manipulation"
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('thriv-guest-banner', '1')
              setDismissed(true)
            }}
            className="p-1 text-amber-200/60 hover:text-amber-100"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
