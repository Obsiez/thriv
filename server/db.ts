import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { Database, GameStateRecord, UserRecord } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DB_PATH = join(DATA_DIR, 'db.json')

const EMPTY_DB: Database = { users: [], gameStates: {} }

function ensureDb(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), 'utf-8')
  }
}

export function readDb(): Database {
  ensureDb()
  try {
    const raw = readFileSync(DB_PATH, 'utf-8')
    return { ...EMPTY_DB, ...JSON.parse(raw) } as Database
  } catch {
    return { ...EMPTY_DB }
  }
}

export function writeDb(db: Database): void {
  ensureDb()
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const db = readDb()
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function findUserById(id: string): UserRecord | undefined {
  return readDb().users.find((u) => u.id === id)
}

export function createUser(user: UserRecord): UserRecord {
  const db = readDb()
  db.users.push(user)
  writeDb(db)
  return user
}

export function getGameState(userId: string): GameStateRecord | undefined {
  return readDb().gameStates[userId]
}

export function saveGameState(state: GameStateRecord): void {
  const db = readDb()
  db.gameStates[state.userId] = state
  writeDb(db)
}
