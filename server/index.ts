import express from 'express'
import cors from 'cors'
import {
  getUserFromId,
  loginUser,
  registerUser,
  verifyToken,
} from './auth.js'
import { getGameState, readDb, saveGameState, writeDb } from './db.js'
import { defaultGameState } from './defaults.js'
import type { GameStatePayload } from './types.js'

const PORT = Number(process.env.PORT) || 3001
const isProd = process.env.NODE_ENV === 'production'

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('FATAL: Set JWT_SECRET (32+ chars) in production.')
  process.exit(1)
}

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  })
)
app.use(express.json({ limit: '2mb' }))

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' })
    return
  }
  const payload = verifyToken(header.slice(7))
  if (!payload) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' })
    return
  }
  const user = getUserFromId(payload.sub)
  if (!user) {
    res.status(401).json({ error: 'User not found.' })
    return
  }
  req.user = user
  next()
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; displayName: string }
    }
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'thriv-api' })
})

app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body ?? {}
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' })
    return
  }
  const result = await registerUser(email, password, displayName ?? '')
  if ('error' in result) {
    res.status(400).json({ error: result.error })
    return
  }
  const state = defaultGameState()
  saveGameState({
    userId: result.user.id,
    portfolio: state.portfolio,
    progress: state.progress,
    updatedAt: new Date().toISOString(),
  })
  res.json(result)
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' })
    return
  }
  const result = await loginUser(email, password)
  if ('error' in result) {
    res.status(401).json({ error: result.error })
    return
  }
  res.json(result)
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})

app.patch('/api/auth/profile', authMiddleware, (req, res) => {
  const { displayName } = req.body ?? {}
  if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
    res.status(400).json({ error: 'Display name must be at least 2 characters.' })
    return
  }
  const db = readDb()
  const idx = db.users.findIndex((u) => u.id === req.user!.id)
  if (idx < 0) {
    res.status(404).json({ error: 'User not found.' })
    return
  }
  db.users[idx].displayName = displayName.trim().slice(0, 48)
  writeDb(db)
  res.json({
    user: {
      id: db.users[idx].id,
      email: db.users[idx].email,
      displayName: db.users[idx].displayName,
    },
  })
})

app.get('/api/game-state', authMiddleware, (req, res) => {
  const existing = getGameState(req.user!.id)
  if (!existing) {
    const state = defaultGameState()
    const record = {
      userId: req.user!.id,
      portfolio: state.portfolio,
      progress: state.progress,
      updatedAt: new Date().toISOString(),
    }
    saveGameState(record)
    res.json(record)
    return
  }
  res.json(existing)
})

app.put('/api/game-state', authMiddleware, (req, res) => {
  const body = req.body as GameStatePayload
  if (!body?.portfolio || !body?.progress) {
    res.status(400).json({ error: 'Invalid game state payload.' })
    return
  }
  const record = {
    userId: req.user!.id,
    portfolio: body.portfolio,
    progress: body.progress,
    updatedAt: new Date().toISOString(),
  }
  saveGameState(record)
  res.json({ ok: true, updatedAt: record.updatedAt })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Thriv API running on port ${PORT}`)
})
