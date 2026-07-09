import { useCallback, useEffect, useState } from 'react'
import { api, type DashboardData } from '../api/client'

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const dashboard = await api.getDashboard()
      setData(dashboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sync = useCallback(async () => {
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
  const [connections, setConnections] = useState<Awaited<ReturnType<typeof api.getConnections>> | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await api.getConnections()
      setConnections(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { connections, loading, refresh }
}
