import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { getDemoAuth, getProfileAuth } from '../api/demoFallback'
import { clearSessionToken, getSessionToken } from '../lib/session'
import { isApiUnreachableError, isDemoMode, isForceDemoMode, setFallbackDemo } from '../lib/demoMode'
import { useSignOut } from './useOnboarding'

export function useAuth() {
  const [user, setUser] = useState<{ name: string; email: string; onboarded: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const signOut = useSignOut()

  const refresh = useCallback(async () => {
    if (isForceDemoMode()) {
      setUser(getDemoAuth())
      setLoading(false)
      return getDemoAuth()
    }

    if (isDemoMode()) {
      const profile = getProfileAuth()
      setUser(profile)
      setLoading(false)
      return profile
    }

    try {
      const me = await api.getMe()
      setUser({ name: me.name, email: me.email, onboarded: me.onboarded })
      setFallbackDemo(false)
      return me
    } catch (err) {
      if (isApiUnreachableError(err)) {
        setFallbackDemo(true)
        const profile = getProfileAuth()
        setUser(profile)
        return profile
      }
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await signOut(async () => {
      await api.logout()
      clearSessionToken()
      setUser(null)
    })
  }, [signOut])

  return { user, loading, refresh, logout, hasStoredSession: !!getSessionToken() }
}
