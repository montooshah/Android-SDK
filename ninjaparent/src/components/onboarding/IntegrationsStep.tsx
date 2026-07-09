import { ArrowLeft, ArrowRight, CheckCircle2, Mail, RefreshCw } from 'lucide-react'
import type { ConnectionInfo } from '../../api/client'

interface IntegrationsStepProps {
  configured: { gmail: boolean; outlook: boolean }
  connections: ConnectionInfo[]
  onConnectGmail: () => void
  onConnectOutlook: () => void
  onSync: () => void
  syncing: boolean
  authMessage?: string | null
  onBack: () => void
  onNext: () => void
  onSkip: () => void
}

export function IntegrationsStep({
  configured,
  connections,
  onConnectGmail,
  onConnectOutlook,
  onSync,
  syncing,
  authMessage,
  onBack,
  onNext,
  onSkip,
}: IntegrationsStepProps) {
  const hasConnection = connections.length > 0
  const gmailConnected = connections.some((c) => c.provider === 'gmail')
  const outlookConnected = connections.some((c) => c.provider === 'outlook')

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl font-bold text-slate-900">Connect your school email</h2>
        <p className="mt-2 text-sm text-slate-600">
          Link Gmail or Outlook — we&apos;ll pull in newsletters, homework, payments, and trip reminders automatically.
        </p>
      </div>

      {authMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {authMessage}
        </div>
      )}

      <div className="space-y-3">
        {configured.gmail && (
          <button
            type="button"
            data-testid="onboarding-connect-gmail"
            onClick={onConnectGmail}
            disabled={gmailConnected}
            className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:bg-slate-50 disabled:opacity-70"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <Mail className="h-6 w-6 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Gmail</p>
              <p className="text-sm text-slate-500">
                {gmailConnected
                  ? connections.find((c) => c.provider === 'gmail')?.email
                  : 'Connect your Google account'}
              </p>
            </div>
            {gmailConnected ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Connect</span>
            )}
          </button>
        )}

        {configured.outlook && (
          <button
            type="button"
            data-testid="onboarding-connect-outlook"
            onClick={onConnectOutlook}
            disabled={outlookConnected}
            className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:bg-slate-50 disabled:opacity-70"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Outlook</p>
              <p className="text-sm text-slate-500">
                {outlookConnected
                  ? connections.find((c) => c.provider === 'outlook')?.email
                  : 'Connect your Microsoft account'}
              </p>
            </div>
            {outlookConnected ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Connect</span>
            )}
          </button>
        )}

        {!configured.gmail && !configured.outlook && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            OAuth not configured on server. Add credentials to <code>.env</code> — see SETUP.md. You can skip and explore the app.
          </div>
        )}
      </div>

      {hasConnection && (
        <button
          type="button"
          data-testid="onboarding-sync"
          onClick={onSync}
          disabled={syncing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-3 text-sm font-semibold text-brand-800 active:bg-brand-100 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing school emails…' : 'Sync school emails now'}
        </button>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        Read-only access. We never send emails on your behalf.
      </p>

      <div className="mt-auto space-y-3 pt-6 onboarding-safe-bottom">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 active:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            data-testid="onboarding-finish"
            onClick={onNext}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
          >
            {hasConnection ? 'Go to dashboard' : 'Continue'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        {!hasConnection && (
          <button
            type="button"
            data-testid="onboarding-skip"
            onClick={onSkip}
            className="w-full py-2 text-sm font-medium text-slate-500 active:text-slate-700"
          >
            Skip for now — I&apos;ll connect later
          </button>
        )}
      </div>
    </div>
  )
}
