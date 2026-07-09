import { useEffect, useState } from 'react'
import { api } from './api/client'
import { saveSessionToken } from './lib/session'
import { disableDemoMode, isDemoMode, isForceDemoMode } from './lib/demoMode'
import { resetOnboarding } from './lib/onboarding'
import { checkApiHealth } from './lib/apiStatus'
import { getActionUrl } from './lib/actionUrls'
import { connectGmail, connectOutlook } from './lib/connect'
import { sourceLabels } from './lib/constants'
import { useAuth } from './hooks/useAuth'
import { useConnections, useDashboard } from './hooks/useDashboard'
import { useOnboardingGate } from './hooks/useOnboarding'
import { useToast } from './hooks/useToast'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { BottomNav, type AppTab } from './components/layout/BottomNav'
import { MobileHeader } from './components/layout/MobileHeader'
import { ChildChips } from './components/layout/ChildChips'
import { FilterPills, type FilterType } from './components/layout/FilterPills'
import { PriorityFeed } from './components/PriorityFeed'
import { WeekOverview } from './components/WeekOverview'
import { SettingsView } from './components/SettingsView'
import { Sidebar } from './components/Sidebar'
import { Toast } from './components/Toast'
import { DemoBanner } from './components/DemoBanner'
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
  const [apiReady, setApiReady] = useState(false)

  const { message: toastMessage, show: showToast } = useToast()
  const { user, loading: authLoading, logout, refresh: refreshAuth } = useAuth()
  const { showOnboarding, complete: completeOnboardingGate, loading: onboardingLoading } = useOnboardingGate()
  const { data, loading, syncing, error, sync, completeItem, refresh } = useDashboard()
  const { connections, refresh: refreshConnections, connectDemo, disconnectDemo } = useConnections()

  useEffect(() => {
    checkApiHealth().finally(() => setApiReady(true))
  }, [])

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

  const handleDemoConnect = (provider: 'gmail' | 'outlook') => {
    connectDemo(provider)
    refreshConnections()
    showToast(`${provider === 'gmail' ? 'Gmail' : 'Outlook'} connected (demo)`)
  }

  const handleConnectGmail = () => {
    connectGmail(() => handleDemoConnect('gmail'))
  }

  const handleConnectOutlook = () => {
    connectOutlook(() => handleDemoConnect('outlook'))
  }

  const handleDisconnect = async (id: string) => {
    if (isDemoMode()) {
      disconnectDemo(id)
      await refreshConnections()
      showToast('Account disconnected (demo)')
      return
    }
    await api.disconnect(id)
    await refresh()
    await refreshConnections()
  }

  const handleOpenEmail = (item: ActionItem) => {
    if (item.emailUrl) {
      window.open(item.emailUrl, '_blank', 'noopener,noreferrer')
      return
    }
    showToast('Email link not available')
  }

  const handlePrimaryAction = (item: ActionItem) => {
    const url = getActionUrl(item)
    const label = sourceLabels[item.source] || item.actionLabel

    if (isDemoMode()) {
      if (url) {
        showToast(`Demo: opening ${label}…`)
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        showToast(`Demo: ${item.actionLabel}`)
      }
      return
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      showToast(item.actionLabel)
    }
  }

  const switchToLiveMode = () => {
    resetOnboarding()
    disableDemoMode()
    window.location.href = window.location.pathname + '?fresh=1'
  }

  if (!apiReady || onboardingLoading || authLoading) return <LoadingScreen />

  if (showOnboarding) {
    return (
      <>
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          authMessage={authMessage}
          onAuthMessageClear={() => setAuthMessage(null)}
          onConnectGmail={handleConnectGmail}
          onConnectOutlook={handleConnectOutlook}
        />
        <Toast message={toastMessage} />
      </>
    )
  }

  if (loading) return <LoadingScreen />

  return (
    <div className="app-canvas min-h-dvh">
      <Toast message={toastMessage} />

      {/* Mobile layout */}
      <div className="lg:hidden">
        <MobileHeader
          parentName={user?.name}
          syncing={syncing}
          onSync={data?.meta.hasConnections ? sync : undefined}
        />

        {tab === 'today' && (
          <div className="content-safe-bottom space-y-4 pt-2">
            <DemoBanner onTryLive={isForceDemoMode() ? switchToLiveMode : undefined} />
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
                onPrimaryAction={handlePrimaryAction}
                onOpenEmail={handleOpenEmail}
                hasConnections={data?.meta.hasConnections ?? false}
                aiBrief={data?.meta.aiBrief}
                llmEnabled={data?.meta.llmEnabled}
                compact
              />
            </div>
          </div>
        )}

        {tab === 'kids' && (
          <div className="content-safe-bottom space-y-4 pt-4">
            <DemoBanner onTryLive={isForceDemoMode() ? switchToLiveMode : undefined} />
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
            <DemoBanner onTryLive={isForceDemoMode() ? switchToLiveMode : undefined} />
            <SettingsView
              parentName={user?.name}
              parentEmail={user?.email}
              children={children}
              connections={connections?.connections ?? []}
              configured={connections?.configured ?? { gmail: false, outlook: false }}
              onConnectGmail={handleConnectGmail}
              onConnectOutlook={handleConnectOutlook}
              onDisconnect={handleDisconnect}
              onSync={sync}
              onLogout={logout}
              onChildrenSaved={refresh}
              showToast={showToast}
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
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="" className="h-10 w-10 rounded-xl" />
              <div>
                <p className="text-sm text-ink-muted">NinjaParent</p>
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {user?.name ? `${user.name.split(' ')[0]}'s dashboard` : 'Dashboard'}
                </h1>
              </div>
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
              <DemoBanner onTryLive={isForceDemoMode() ? switchToLiveMode : undefined} />
              <WeekOverview stats={weekStats} />
              <PriorityFeed
                items={actionItems}
                children={children}
                selectedChild={selectedChild}
                activeFilter={activeFilter}
                onComplete={completeItem}
                onPrimaryAction={handlePrimaryAction}
                onOpenEmail={handleOpenEmail}
                hasConnections={data?.meta.hasConnections ?? false}
                aiBrief={data?.meta.aiBrief}
                llmEnabled={data?.meta.llmEnabled}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
