/** Demo mode: works without API server (Netlify static hosting, investor demos). */

const DEMO_KEY = 'ninjaparent_demo_mode'

let fallbackDemo = false

export function isDemoQuery(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === '1'
}

export function showDemoOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('demo') === '1' && params.get('show') === 'onboarding'
}

/** Explicit investor demo (?demo=1) — sample Sarah Johnson data */
export function isForceDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return isDemoQuery() || localStorage.getItem(DEMO_KEY) === 'true'
}

/** Demo data (forced or API unreachable after onboarding) */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return isForceDemoMode() || fallbackDemo
}

export function setFallbackDemo(active: boolean): void {
  fallbackDemo = active
}

export function enableDemoMode(): void {
  localStorage.setItem(DEMO_KEY, 'true')
  fallbackDemo = true
}

export function disableDemoMode(): void {
  localStorage.removeItem(DEMO_KEY)
  fallbackDemo = false
}

export function isApiUnreachableError(err: unknown): boolean {
  if (err instanceof TypeError) return true
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('API error') || msg.includes('Failed to fetch') || msg.includes('NetworkError')
}
