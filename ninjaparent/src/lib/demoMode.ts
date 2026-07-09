/** Demo mode: works without API server (Netlify static hosting, investor demos). */

const DEMO_KEY = 'ninjaparent_demo_mode'

export function isDemoQuery(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === '1'
}

export function showDemoOnboarding(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('demo') === '1' && params.get('show') === 'onboarding'
}

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEMO_KEY) === 'true' || isDemoQuery()
}

export function enableDemoMode(): void {
  localStorage.setItem(DEMO_KEY, 'true')
}

export function isApiUnreachableError(err: unknown): boolean {
  if (err instanceof TypeError) return true // fetch failed
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('API error') || msg.includes('Failed to fetch') || msg.includes('NetworkError')
}
