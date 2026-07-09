import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { getSessionToken, saveSessionToken } from '../lib/session'
import { isOnboardingComplete, completeOnboarding as markLocalComplete } from '../lib/onboarding'

export function useOnboardingGate() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
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
      } catch {
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
