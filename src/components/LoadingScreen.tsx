import { Loader2 } from 'lucide-react'
import { Logo } from './Logo'

export function LoadingScreen({ message = 'Loading your session…' }: { message?: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-surface-900">
      <Logo size="lg" className="-ml-[11px]" />
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-thriv-500" strokeWidth={1.5} />
        {message}
      </div>
    </div>
  )
}
