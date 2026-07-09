import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { clearSessionToken, getSessionToken } from '../lib/session'

export function useAuth() {
  const [user, setUser] = useState<{ name: string; email: string; onboarded: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const me = await api.getMe()
      setUser({ name: me.name, email: me.email, onboarded: me.onboarded })
      return me
    } catch {
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
