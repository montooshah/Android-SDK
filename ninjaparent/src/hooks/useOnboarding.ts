import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { getSessionToken, saveSessionToken } from '../lib/session'
import { isOnboardingComplete, completeOnboarding as markLocalComplete } from '../lib/onboarding'
import {
  enableDemoMode,
  isApiUnreachableError,
  isDemoQuery,
  isForceDemoMode,
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
        enableDemoMode()
        setShowOnboarding(true)
        return
      }

      if (isDemoQuery()) {
        enableDemoMode()
        markLocalComplete()
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
          if (hasLocal || hasToken) {
            setShowOnboarding(false)
          } else if (!isForceDemoMode()) {
            markLocalComplete()
            setShowOnboarding(false)
          } else {
            setShowOnboarding(true)
          }
          return
        }

        if (hasLocal || hasToken) {
          setShowOnboarding(false)
        } else {
          setShowOnboarding(true)
        }
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
