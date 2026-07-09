import { api } from '../api/client'
import { isLiveApiAvailable, isOAuthConfigured, getCachedApiHealth } from './apiStatus'
import { isDemoMode } from './demoMode'

export function connectGmail(onDemoConnect?: () => void): void {
  if (isDemoMode() || !isLiveApiAvailable()) {
    onDemoConnect?.()
    return
  }
  const health = getCachedApiHealth()
  if (!health?.integrations.gmail) {
    onDemoConnect?.()
    return
  }
  api.connectGmail()
}

export function connectOutlook(onDemoConnect?: () => void): void {
  if (isDemoMode() || !isLiveApiAvailable()) {
    onDemoConnect?.()
    return
  }
  const health = getCachedApiHealth()
  if (!health?.integrations.outlook) {
    onDemoConnect?.()
    return
  }
  api.connectOutlook()
}

export function canConnectLive(): boolean {
  return isLiveApiAvailable() && isOAuthConfigured() && !isDemoMode()
}
