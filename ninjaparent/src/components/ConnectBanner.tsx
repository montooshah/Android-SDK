import { Mail, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ConnectBannerProps {
  configured: { gmail: boolean; outlook: boolean }
  hasConnections: boolean
  onConnectGmail: () => void
  onConnectOutlook: () => void
  onSync: () => void
  syncing: boolean
  authMessage?: string | null
}

export function ConnectBanner({
  configured,
  hasConnections,
  onConnectGmail,
  onConnectOutlook,
  onSync,
  syncing,
  authMessage,
}: ConnectBannerProps) {
  return (
    <div
      data-testid="connect-banner"
      className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-brand-900">
            {hasConnections ? 'Email accounts connected' : 'Connect your school email'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {hasConnections
              ? 'NinjaParent reads school emails from Gmail and Outlook, then extracts actions automatically.'
              : 'Link Gmail or Outlook to replace demo data with real school messages.'}
          </p>
          {authMessage && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {authMessage}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {configured.gmail && (
            <button
              type="button"
              data-testid="connect-gmail"
              onClick={onConnectGmail}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Mail className="h-4 w-4 text-red-500" />
              Connect Gmail
            </button>
          )}
          {configured.outlook && (
            <button
              type="button"
              data-testid="connect-outlook"
              onClick={onConnectOutlook}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <Mail className="h-4 w-4 text-blue-600" />
              Connect Outlook
            </button>
          )}
          {hasConnections && (
            <button
              type="button"
              data-testid="sync-emails"
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          )}
        </div>
      </div>
      {!configured.gmail && !configured.outlook && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4" />
          Add OAuth credentials to <code className="rounded bg-amber-50 px-1">.env</code> — see SETUP.md
        </p>
      )}
    </div>
  )
}
