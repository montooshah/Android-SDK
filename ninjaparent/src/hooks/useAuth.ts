import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { getDemoAuth } from '../api/demoFallback'
import { clearSessionToken, getSessionToken } from '../lib/session'
import { isApiUnreachableError, isDemoMode, setFallbackDemo } from '../lib/demoMode'

export function useAuth() {
  const [user, setUser] = useState<{ name: string; email: string; onboarded: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (isDemoMode()) {
      setUser(getDemoAuth())
      setLoading(false)
      return getDemoAuth()
    }

    try {
      const me = await api.getMe()
      setUser({ name: me.name, email: me.email, onboarded: me.onboarded })
      setFallbackDemo(false)
      return me
    } catch (err) {
      if (isApiUnreachableError(err)) {
        setFallbackDemo(true)
        const demo = getDemoAuth()
        setUser(demo)
        return demo
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
    if (isDemoMode()) {
      const params = new URLSearchParams(window.location.search)
      params.delete('demo')
      const qs = params.toString()
      window.location.href = window.location.pathname + (qs ? `?${qs}` : '')
      return
    }

    try {
      await api.logout()
    } finally {
      clearSessionToken()
      setUser(null)
      window.location.reload()
    }
  }, [])

  return { user, loading, refresh, logout, hasStoredSession: !!getSessionToken() }
}
