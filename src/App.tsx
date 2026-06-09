import { useAuth } from './contexts/AuthContext'
import { AuthPage } from './components/auth/AuthPage'
import { LoadingScreen } from './components/LoadingScreen'
import ThrivApp from './ThrivApp'
import { AlertTriangle, LogOut } from 'lucide-react'

export default function App() {
  const { mode, loading, gameReady, user, sessionTerminated, logout } = useAuth()

  if (sessionTerminated) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-900 p-6 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-950/30 border border-red-500/20 text-red-400">
              <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="font-display text-xl font-semibold tracking-tight text-white">
              Session Terminated
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              This account was logged in from another device. For security, your active session on this device has been disconnected.
            </p>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-thriv-700 hover:bg-thriv-600 px-4 py-3.5 text-sm font-semibold text-white transition-all cursor-pointer touch-manipulation min-h-[48px]"
          >
            <LogOut className="h-4 w-4" />
            Acknowledge and Exit
          </button>
        </div>
      </div>
    )
  }

  if (loading || (mode === 'authenticated' && !gameReady)) {
    return <LoadingScreen />
  }

  if (mode === null) {
    return <AuthPage />
  }

  const sessionKey = user?.id ?? 'guest'

  return <ThrivApp key={sessionKey} sessionKey={sessionKey} />
}
