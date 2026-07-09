import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useConnections } from '../../hooks/useDashboard'
import {
  completeOnboarding,
  getProfile,
  getSavedStep,
  isOAuthReturnOnboarding,
  saveProfile,
  saveStep,
  setOAuthReturnOnboarding,
  clearOAuthReturn,
  type ParentProfile,
} from '../../lib/onboarding'
import { WelcomeStep } from './WelcomeStep'
import { KidsStep } from './KidsStep'
import { IntegrationsStep } from './IntegrationsStep'

const STEPS = ['Welcome', 'Children', 'Connect']

interface OnboardingFlowProps {
  onComplete: (sessionToken?: string) => void
  authMessage?: string | null
  onAuthMessageClear?: () => void
}

export function OnboardingFlow({ onComplete, authMessage, onAuthMessageClear }: OnboardingFlowProps) {
  const saved = getProfile()
  const oauthReturn = isOAuthReturnOnboarding()
  const [step, setStep] = useState(oauthReturn ? 2 : getSavedStep())
  const [profile, setProfile] = useState<Partial<ParentProfile>>(saved ?? {})
  const [syncing, setSyncing] = useState(false)

  const { connections, refresh: refreshConnections } = useConnections()

  useEffect(() => {
    saveStep(step)
  }, [step])

  useEffect(() => {
    if (oauthReturn) {
      setStep(2)
      clearOAuthReturn()
    }
  }, [oauthReturn])

  const handleWelcome = (name: string, email: string) => {
    setProfile((p) => ({ ...p, name, email }))
    setStep(1)
  }

  const handleKids = async (children: ParentProfile['children']) => {
    const next: ParentProfile = {
      name: profile.name ?? '',
      email: profile.email ?? '',
      childCount: children.length,
      children,
    }
    setProfile(next)
    saveProfile(next)

    try {
      await api.saveOnboarding(next)
    } catch {
      // offline / API down — local profile still saved
    }

    setStep(2)
  }

  const handleConnectGmail = () => {
    setOAuthReturnOnboarding()
    api.connectGmail()
  }

  const handleConnectOutlook = () => {
    setOAuthReturnOnboarding()
    api.connectOutlook()
  }

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      await api.sync()
      await refreshConnections()
    } finally {
      setSyncing(false)
    }
  }, [refreshConnections])

  const finish = useCallback(async () => {
    if (connections?.connections.length) {
      try {
        await api.sync()
      } catch {
        // continue
      }
    }
    let sessionToken: string | undefined
    try {
      const result = await api.completeOnboarding()
      sessionToken = result.sessionToken
    } catch {
      // local complete still works
    }
    completeOnboarding()
    onComplete(sessionToken)
    onAuthMessageClear?.()
  }, [connections, onComplete, onAuthMessageClear])

  return (
    <div
      data-testid="onboarding-flow"
      className="flex min-h-dvh flex-col bg-[#f4f2ed]"
    >
      {/* Progress header */}
      <header className="px-6 pt-6 onboarding-safe-top">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-bold text-brand-700">NinjaParent</span>
          <span className="text-xs font-medium text-slate-400">
            Step {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  i <= step ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
              <p className={`mt-1.5 text-[10px] font-medium ${i <= step ? 'text-brand-700' : 'text-slate-400'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 py-6">
        {step === 0 && (
          <WelcomeStep
            initialName={profile.name}
            initialEmail={profile.email}
            onNext={handleWelcome}
          />
        )}
        {step === 1 && (
          <KidsStep
            initialChildren={profile.children}
            onBack={() => setStep(0)}
            onNext={handleKids}
          />
        )}
        {step === 2 && (
          <IntegrationsStep
            configured={connections?.configured ?? { gmail: false, outlook: false }}
            connections={connections?.connections ?? []}
            onConnectGmail={handleConnectGmail}
            onConnectOutlook={handleConnectOutlook}
            onSync={handleSync}
            syncing={syncing}
            authMessage={authMessage}
            onBack={() => setStep(1)}
            onNext={finish}
            onSkip={finish}
          />
        )}
      </main>
    </div>
  )
}
