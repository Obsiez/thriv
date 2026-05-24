export interface UserRecord {
  id: string
  email: string
  passwordHash: string
  displayName: string
  createdAt: string
}

export interface GameStateRecord {
  userId: string
  portfolio: Record<string, unknown>
  progress: Record<string, unknown>
  updatedAt: string
}

export interface Database {
  users: UserRecord[]
  gameStates: Record<string, GameStateRecord>
}

export interface AuthUser {
  id: string
  email: string
  displayName: string
}

export interface GameStatePayload {
  portfolio: Record<string, unknown>
  progress: Record<string, unknown>
}
