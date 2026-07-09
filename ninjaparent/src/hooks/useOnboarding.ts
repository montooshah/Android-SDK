import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { isOnboardingComplete } from '../lib/onboarding'

export function useOnboardingGate() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      if (isOnboardingComplete()) {
        setShowOnboarding(false)
        return
      }
      try {
        const status = await api.getOnboardingStatus()
        if (status.onboarded) {
          setShowOnboarding(false)
        } else {
          setShowOnboarding(true)
        }
      } catch {
        // API down — use local flag only
        setShowOnboarding(!isOnboardingComplete())
      }
    }
    check()
  }, [])

  const complete = () => setShowOnboarding(false)

  return { showOnboarding, complete, loading: showOnboarding === null }
}
