export interface ApiHealth {
  ok: boolean
  integrations: { gmail: boolean; outlook: boolean }
}

let cached: ApiHealth | null = null
let checked = false

export async function checkApiHealth(): Promise<ApiHealth | null> {
  try {
    const res = await fetch('/api/health', { credentials: 'include' })
    if (!res.ok) return null
    const data = (await res.json()) as ApiHealth
    cached = data
    checked = true
    return data
  } catch {
    cached = null
    checked = true
    return null
  }
}

export function getCachedApiHealth(): ApiHealth | null {
  return cached
}

export function isApiChecked(): boolean {
  return checked
}

export function isLiveApiAvailable(): boolean {
  return !!cached?.ok
}

export function isOAuthConfigured(): boolean {
  return !!(cached?.integrations.gmail || cached?.integrations.outlook)
}
