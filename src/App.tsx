import { useAuth } from './contexts/AuthContext'
import { AuthPage } from './components/auth/AuthPage'
import { LoadingScreen } from './components/LoadingScreen'
import ThrivApp from './ThrivApp'

export default function App() {
  const { mode, loading, gameReady, user } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!gameReady || mode === null) {
    return <AuthPage />
  }

  const sessionKey = user?.id ?? 'guest'

  return <ThrivApp sessionKey={sessionKey} />
}
