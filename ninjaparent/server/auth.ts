import { randomUUID, createHash } from 'crypto'
import type { Request, Response, NextFunction } from 'express'
import { db } from './db.js'

const SESSION_COOKIE = 'np_session'
const SESSION_DAYS = 90

export interface SessionUser {
  sessionId: string
  name: string
  email: string
  onboarded: boolean
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createSession(res: Response, profile: { name: string; email: string }): string {
  const token = randomUUID() + randomUUID()
  const tokenHash = hashToken(token)
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60

  db.prepare(`
    INSERT INTO sessions (id, token_hash, parent_name, parent_email, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(randomUUID(), tokenHash, profile.name, profile.email, expiresAt)

  const isProd = process.env.NODE_ENV === 'production'
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })

  return token
}

export function getTokenFromRequest(req: Request): string | null {
  const cookieToken = req.cookies?.[SESSION_COOKIE]
  if (cookieToken) return cookieToken

  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7)
  }

  const headerToken = req.headers['x-session-token']
  if (typeof headerToken === 'string') return headerToken

  return null
}

export function getSessionUser(req: Request): SessionUser | null {
  const token = getTokenFromRequest(req)
  if (!token) return null

  const tokenHash = hashToken(token)
  const row = db.prepare(`
    SELECT id, parent_name, parent_email, expires_at FROM sessions
    WHERE token_hash = ? AND expires_at > unixepoch()
  `).get(tokenHash) as { id: string; parent_name: string; parent_email: string; expires_at: number } | undefined

  if (!row) return null

  const profile = db.prepare('SELECT onboarded FROM profile WHERE id = 1').get() as { onboarded: number } | undefined

  return {
    sessionId: row.id,
    name: row.parent_name,
    email: row.parent_email,
    onboarded: profile?.onboarded === 1,
  }
}

export function destroySession(req: Request, res: Response): void {
  const token = getTokenFromRequest(req)
  if (token) {
    const tokenHash = hashToken(token)
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash)
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}

export function touchSession(req: Request): void {
  const user = getSessionUser(req)
  if (!user) return
  db.prepare(`
    UPDATE sessions SET last_seen_at = unixepoch() WHERE id = ?
  `).run(user.sessionId)
}

export function requireSession(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req)
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  ;(req as Request & { user: SessionUser }).user = user
  next()
}

export { SESSION_COOKIE }
