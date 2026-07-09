import { useEffect, useState } from 'react'
import { api } from './api/client'
import { saveSessionToken } from './lib/session'
import { isDemoMode } from './lib/demoMode'
import { useAuth } from './hooks/useAuth'
import { useConnections, useDashboard } from './hooks/useDashboard'
import { useOnboardingGate } from './hooks/useOnboarding'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { BottomNav, type AppTab } from './components/layout/BottomNav'
import { MobileHeader } from './components/layout/MobileHeader'
import { ChildChips } from './components/layout/ChildChips'
import { FilterPills, type FilterType } from './components/layout/FilterPills'
import { PriorityFeed } from './components/PriorityFeed'
import { WeekOverview } from './components/WeekOverview'
import { SettingsView } from './components/SettingsView'
import { Sidebar } from './components/Sidebar'
import type { ActionItem, Child, WeekStat } from './types'

function LoadingScreen() {
  return (
    <div className="app-canvas flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-2xl bg-brand-700 skeleton" />
      <p className="text-sm text-ink-muted">Loading…</p>
    </div>
  )
}

function App() {
  const [tab, setTab] = useState<AppTab>('today')
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  const { user, loading: authLoading, logout, refresh: refreshAuth } = useAuth()
  const { showOnboarding, complete: completeOnboardingGate, loading: onboardingLoading } = useOnboardingGate()
  const { data, loading, syncing, error, sync, completeItem, refresh } = useDashboard()
  const { connections, refresh: refreshConnections } = useConnections()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    const provider = params.get('provider')
    const email = params.get('email')
    const message = params.get('message')

    if (auth === 'success' && provider && email) {
      setAuthMessage(`${provider === 'gmail' ? 'Gmail' : 'Outlook'} connected`)
      refresh()
      refreshConnections()
      refreshAuth()
      window.history.replaceState({}, '', window.location.pathname)
    } else if (auth === 'error') {
      setAuthMessage(`Connection failed: ${message || 'unknown error'}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [refresh, refreshConnections, refreshAuth])

  const children: Child[] = data?.children ?? []
  const actionItems: ActionItem[] = (data?.actionItems ?? []) as ActionItem[]
  const weekStats: WeekStat[] = data?.weekStats ?? [
    { label: 'Due soon', value: 0, icon: 'alert' },
    { label: 'Payments', value: 0, icon: 'payment' },
    { label: 'Homework', value: 0, icon: 'homework' },
    { label: 'Events', value: 0, icon: 'event' },
  ]

  const criticalCount = actionItems.filter((i) => i.urgency === 'critical').length

  const handleOnboardingComplete = async (sessionToken?: string) => {
    if (sessionToken) saveSessionToken(sessionToken)
    await completeOnboardingGate(sessionToken)
    await refreshAuth()
  }

  const handleDisconnect = async (id: string) => {
    if (isDemoMode()) {
      await refreshConnections()
      return
    }
    await api.disconnect(id)
    await refresh()
    await refreshConnections()
  }

  if (onboardingLoading || authLoading) return <LoadingScreen />

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        authMessage={authMessage}
        onAuthMessageClear={() => setAuthMessage(null)}
      />
    )
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="app-canvas min-h-dvh">
      {/* Mobile layout */}
      <div className="lg:hidden">
        <MobileHeader
          parentName={user?.name}
          syncing={syncing}
          onSync={data?.meta.hasConnections ? sync : undefined}
        />

        {tab === 'today' && (
          <div className="content-safe-bottom space-y-4 pt-2">
            {error && (
              <p className="mx-5 rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>
            )}
            <WeekOverview stats={weekStats} />
            <ChildChips children={children} selected={selectedChild} onSelect={setSelectedChild} />
            <FilterPills active={activeFilter} onChange={setActiveFilter} />
            <div className="px-5">
              <PriorityFeed
                items={actionItems}
                children={children}
                selectedChild={selectedChild}
                activeFilter={activeFilter}
                onComplete={completeItem}
                hasConnections={data?.meta.hasConnections ?? false}
                compact
              />
            </div>
          </div>
        )}

        {tab === 'kids' && (
          <div className="content-safe-bottom space-y-4 pt-4">
            <ChildChips children={children} selected={selectedChild} onSelect={setSelectedChild} />
            <div className="px-5">
              {children.filter((c) => c.id !== 'unassigned').map((child) => {
                const count = actionItems.filter((i) => i.childId === child.id).length
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      setSelectedChild(child.id)
                      setTab('today')
                    }}
                    className="card-elevated mb-3 flex w-full items-center gap-4 p-4 text-left active:scale-[0.99]"
                  >
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-lg font-semibold text-white"
                      style={{ backgroundColor: child.color }}
                    >
                      {child.avatar}
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-lg font-semibold text-ink">{child.name}</p>
                      <p className="text-sm text-ink-muted">{child.year} · {child.school}</p>
                    </div>
                    {count > 0 && (
                      <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-800">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="content-safe-bottom pt-2">
            <SettingsView
              parentName={user?.name}
              parentEmail={user?.email}
              connections={connections?.connections ?? []}
              configured={connections?.configured ?? { gmail: false, outlook: false }}
              onConnectGmail={() => api.connectGmail()}
              onConnectOutlook={() => api.connectOutlook()}
              onDisconnect={handleDisconnect}
              onSync={sync}
              onLogout={logout}
              syncing={syncing}
            />
          </div>
        )}

        <BottomNav active={tab} onChange={setTab} criticalCount={criticalCount} />
      </div>

      {/* Desktop layout */}
      <div className="hidden min-h-dvh lg:flex lg:flex-col">
        <header className="glass-header border-b border-black/5 px-8 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div>
              <p className="text-sm text-ink-muted">NinjaParent</p>
              <h1 className="font-display text-2xl font-semibold text-ink">
                {user?.name ? `${user.name.split(' ')[0]}'s dashboard` : 'Dashboard'}
              </h1>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-ink-muted hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0">
          <Sidebar
            children={children}
            selectedChild={selectedChild}
            activeFilter={activeFilter}
            onSelectChild={setSelectedChild}
            onSelectFilter={setActiveFilter}
          />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="space-y-6">
              <WeekOverview stats={weekStats} />
              <PriorityFeed
                items={actionItems}
                children={children}
                selectedChild={selectedChild}
                activeFilter={activeFilter}
                onComplete={completeItem}
                hasConnections={data?.meta.hasConnections ?? false}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
