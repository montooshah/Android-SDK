import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { disableDemoMode, isDemoQuery } from './lib/demoMode'
import { getProfile, isOnboardingComplete, resetOnboarding } from './lib/onboarding'

function prepareAppSession(): void {
  const params = new URLSearchParams(window.location.search)
  const fresh = params.get('fresh') === '1'

  disableDemoMode()

  if (fresh || (!isDemoQuery() && isOnboardingComplete() && !getProfile())) {
    resetOnboarding()
  }

  if (fresh) {
    params.delete('fresh')
    const qs = params.toString()
    const next = window.location.pathname + (qs ? `?${qs}` : '')
    window.history.replaceState({}, '', next)
  }
}

prepareAppSession()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
