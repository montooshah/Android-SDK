/** Demo mode: works without API server (Netlify static hosting, investor demos). */

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

/** Sample Sarah Johnson data — only while URL has ?demo=1 */
export function isForceDemoMode(): boolean {
  return isDemoQuery()
}

/** Demo or offline fallback data */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return isForceDemoMode() || fallbackDemo
}

export function setFallbackDemo(active: boolean): void {
  fallbackDemo = active
}

/** Clear legacy demo flag from older builds */
export function disableDemoMode(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ninjaparent_demo_mode')
  }
  fallbackDemo = false
}

export function isApiUnreachableError(err: unknown): boolean {
  if (err instanceof TypeError) return true
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('API error') || msg.includes('Failed to fetch') || msg.includes('NetworkError')
}
