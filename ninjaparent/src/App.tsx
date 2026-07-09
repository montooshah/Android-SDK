import { useEffect, useState } from 'react'
import { api } from './api/client'
import { useConnections, useDashboard } from './hooks/useDashboard'
import { Header } from './components/Header'
import { Sidebar, type FilterType } from './components/Sidebar'
import { PriorityFeed } from './components/PriorityFeed'
import { WeekOverview } from './components/WeekOverview'
import { ConnectedSources } from './components/ConnectedSources'
import { ConnectBanner } from './components/ConnectBanner'
import type { ActionItem, Child, WeekStat } from './types'

function App() {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  const { data, loading, syncing, error, sync, completeItem, refresh } = useDashboard()
  const { connections, refresh: refreshConnections } = useConnections()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    const provider = params.get('provider')
    const email = params.get('email')
    const message = params.get('message')

    if (auth === 'success' && provider && email) {
      setAuthMessage(`${provider === 'gmail' ? 'Gmail' : 'Outlook'} connected: ${decodeURIComponent(email)}`)
      refresh()
      refreshConnections()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (auth === 'error') {
      setAuthMessage(`Connection failed: ${message || 'unknown error'}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [refresh, refreshConnections])

  const children: Child[] = data?.children ?? []
  const actionItems: ActionItem[] = (data?.actionItems ?? []) as ActionItem[]
  const weekStats: WeekStat[] = data?.weekStats ?? [
    { label: 'Actions due', value: 0, icon: 'alert' },
    { label: 'Payments pending', value: 0, icon: 'payment' },
    { label: 'Homework items', value: 0, icon: 'homework' },
    { label: 'Events this week', value: 0, icon: 'event' },
  ]

  const handleDisconnect = async (id: string) => {
    await api.disconnect(id)
    await refresh()
    await refreshConnections()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar
          children={children}
          selectedChild={selectedChild}
          activeFilter={activeFilter}
          onSelectChild={setSelectedChild}
          onSelectFilter={setActiveFilter}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-8">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error} — is the API server running? Try <code>npm run dev:all</code>
              </div>
            )}
            <ConnectBanner
              configured={connections?.configured ?? { gmail: false, outlook: false }}
              hasConnections={data?.meta.hasConnections ?? false}
              onConnectGmail={() => api.connectGmail()}
              onConnectOutlook={() => api.connectOutlook()}
              onSync={sync}
              syncing={syncing}
              authMessage={authMessage}
            />
            <WeekOverview stats={weekStats} />
            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
              <PriorityFeed
                items={actionItems}
                children={children}
                selectedChild={selectedChild}
                activeFilter={activeFilter}
                onComplete={completeItem}
                hasConnections={data?.meta.hasConnections ?? false}
              />
              <div className="hidden lg:block">
                <ConnectedSources
                  connections={connections?.connections ?? []}
                  configured={connections?.configured ?? { gmail: false, outlook: false }}
                  onDisconnect={handleDisconnect}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
