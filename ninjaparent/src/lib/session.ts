const SESSION_KEY = 'ninjaparent_session_token'

export function saveSessionToken(token: string): void {
  localStorage.setItem(SESSION_KEY, token)
}

export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_KEY)
}

export interface AuthUser {
  name: string
  email: string
  onboarded: boolean
  sessionToken?: string
}
