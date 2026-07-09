import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { getSessionToken, saveSessionToken } from '../lib/session'
import { isOnboardingComplete, completeOnboarding as markLocalComplete, resetOnboarding } from '../lib/onboarding'
import {
  isApiUnreachableError,
  isDemoQuery,
  setFallbackDemo,
  showDemoOnboarding,
} from '../lib/demoMode'
import { checkApiHealth } from '../lib/apiStatus'

export function useOnboardingGate() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      const health = await checkApiHealth()

      if (showDemoOnboarding()) {
        setShowOnboarding(true)
        return
      }

      // Investor sample — skip sign-up for this page load only (?demo=1)
      if (isDemoQuery()) {
        setShowOnboarding(false)
        return
      }

      if (health?.ok) {
        setFallbackDemo(false)
      }

      const hasLocal = isOnboardingComplete()
      const hasToken = !!getSessionToken()

      try {
        if (hasToken) {
          const me = await api.getMe()
          if (me.onboarded) {
            markLocalComplete()
            setShowOnboarding(false)
            return
          }
        }

        const status = await api.getOnboardingStatus()
        if (status.onboarded || status.authenticated) {
          markLocalComplete()
          setShowOnboarding(false)
          return
        }

        if (hasLocal) {
          setShowOnboarding(false)
          return
        }

        setShowOnboarding(true)
      } catch (err) {
        if (isApiUnreachableError(err) || !health?.ok) {
          setFallbackDemo(true)
          setShowOnboarding(!hasLocal && !hasToken)
          return
        }

        setShowOnboarding(!hasLocal && !hasToken)
      }
    }
    check()
  }, [])

  const complete = useCallback(async (sessionToken?: string) => {
    if (sessionToken) saveSessionToken(sessionToken)
    markLocalComplete()
    setShowOnboarding(false)
  }, [])

  return { showOnboarding, complete, loading: showOnboarding === null }
}

export function useSignOut() {
  return useCallback(async (logoutApi: () => Promise<void>) => {
    if (isDemoQuery()) {
      window.location.href = window.location.pathname
      return
    }

    try {
      await logoutApi()
    } catch {
      // API may be down
    }
    resetOnboarding()
    window.location.href = window.location.pathname
  }, [])
}
