import { useCallback, useEffect, useState } from 'react'
import { api, type ConnectionInfo, type DashboardData } from '../api/client'
import {
  DEMO_CONNECTIONS,
  getDemoConnections,
  getDemoDashboard,
  getEmptyConnections,
  getProfileDashboard,
} from '../api/demoFallback'
import { isApiUnreachableError, isDemoMode, isForceDemoMode, setFallbackDemo } from '../lib/demoMode'

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (isForceDemoMode()) {
      setData(getDemoDashboard())
      setLoading(false)
      return
    }

    if (isDemoMode()) {
      setData(getProfileDashboard())
      setLoading(false)
      return
    }

    try {
      setError(null)
      const dashboard = await api.getDashboard()
      setData(dashboard)
      setFallbackDemo(false)
    } catch (err) {
      if (isApiUnreachableError(err)) {
        setFallbackDemo(true)
        setData(getProfileDashboard())
        setError(null)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sync = useCallback(async () => {
    if (isDemoMode()) {
      setSyncing(true)
      await new Promise((r) => setTimeout(r, 1200))
      if (isForceDemoMode()) {
        setData(getDemoDashboard())
      }
      setSyncing(false)
      return
    }

    setSyncing(true)
    try {
      await api.sync()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [refresh])

  const completeItem = useCallback(async (id: string) => {
    if (isDemoMode()) {
      setData((prev) =>
        prev
          ? { ...prev, actionItems: prev.actionItems.filter((item) => item.id !== id) }
          : prev,
      )
      return
    }

    await api.completeItem(id)
    setData((prev) =>
      prev
        ? { ...prev, actionItems: prev.actionItems.filter((item) => item.id !== id) }
        : prev,
    )
  }, [])

  return { data, loading, syncing, error, refresh, sync, completeItem }
}

export function useConnections() {
  const [connections, setConnections] = useState<{
    connections: ConnectionInfo[]
    configured: { gmail: boolean; outlook: boolean }
  } | null>(null)
  const [demoConnections, setDemoConnections] = useState<ConnectionInfo[]>(() =>
    isForceDemoMode() ? getDemoConnections().connections : [],
  )
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (isForceDemoMode()) {
      setConnections(getDemoConnections())
      setLoading(false)
      return
    }

    if (isDemoMode()) {
      setConnections({
        connections: demoConnections,
        configured: getEmptyConnections().configured,
      })
      setLoading(false)
      return
    }

    try {
      const result = await api.getConnections()
      setConnections(result)
      setFallbackDemo(false)
    } catch (err) {
      if (isApiUnreachableError(err)) {
        setFallbackDemo(true)
        setConnections({
          connections: demoConnections,
          configured: getEmptyConnections().configured,
        })
      }
    } finally {
      setLoading(false)
    }
  }, [demoConnections])

  useEffect(() => {
    refresh()
  }, [refresh])

  const connectDemo = useCallback((provider: 'gmail' | 'outlook') => {
    const template = DEMO_CONNECTIONS.find((c) => c.provider === provider)
    if (!template) return
    setDemoConnections((prev) =>
      prev.some((c) => c.provider === provider) ? prev : [...prev, template],
    )
  }, [])

  const disconnectDemo = useCallback((id: string) => {
    setDemoConnections((prev) => prev.filter((c) => c.id !== id))
  }, [])

  useEffect(() => {
    if (isDemoMode() && !isForceDemoMode()) {
      setConnections({
        connections: demoConnections,
        configured: getEmptyConnections().configured,
      })
    }
  }, [demoConnections])

  return { connections, loading, refresh, connectDemo, disconnectDemo }
}
