import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import type { AuthUser } from './types.js'
import { createUser, findUserByEmail, findUserById } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'thriv-dev-secret-change-in-production'
const JWT_EXPIRES = '30d'

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token: string): { sub: string; email: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string }
    return payload
  } catch {
    return null
  }
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: AuthUser; token: string } | { error: string }> {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: 'Enter a valid email address.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (findUserByEmail(normalized)) {
    return { error: 'An account with this email already exists.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = createUser({
    id: randomUUID(),
    email: normalized,
    passwordHash,
    displayName: displayName.trim() || normalized.split('@')[0],
    createdAt: new Date().toISOString(),
  })

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  }
  return { user: authUser, token: signToken(authUser) }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string } | { error: string }> {
  const normalized = email.trim().toLowerCase()
  const record = findUserByEmail(normalized)
  if (!record) return { error: 'Invalid email or password.' }

  const ok = await bcrypt.compare(password, record.passwordHash)
  if (!ok) return { error: 'Invalid email or password.' }

  const authUser: AuthUser = {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
  }
  return { user: authUser, token: signToken(authUser) }
}

export function getUserFromId(id: string): AuthUser | null {
  const record = findUserById(id)
  if (!record) return null
  return { id: record.id, email: record.email, displayName: record.displayName }
}
