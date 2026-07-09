import { LogOut, Mail, RefreshCw, Shield, Trash2 } from 'lucide-react'
import type { ConnectionInfo } from '../api/client'

interface SettingsViewProps {
  parentName?: string
  parentEmail?: string
  connections: ConnectionInfo[]
  configured: { gmail: boolean; outlook: boolean }
  onConnectGmail: () => void
  onConnectOutlook: () => void
  onDisconnect: (id: string) => void
  onSync: () => void
  onLogout: () => void
  syncing: boolean
}

export function SettingsView({
  parentName,
  parentEmail,
  connections,
  configured,
  onConnectGmail,
  onConnectOutlook,
  onDisconnect,
  onSync,
  onLogout,
  syncing,
}: SettingsViewProps) {
  return (
    <div className="space-y-5 px-5 pb-8">
      <section className="card-elevated p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700 font-display text-xl font-semibold text-white">
            {parentName?.charAt(0).toUpperCase() || 'N'}
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-ink">{parentName || 'Parent'}</p>
            <p className="truncate text-sm text-ink-muted">{parentEmail || '—'}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 px-1 font-display text-sm font-semibold text-ink-muted">Email accounts</h2>
        <div className="card-elevated divide-y divide-black/5 overflow-hidden">
          {connections.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.provider === 'gmail' ? 'bg-red-50' : 'bg-blue-50'}`}>
                <Mail className={`h-5 w-5 ${c.provider === 'gmail' ? 'text-red-500' : 'text-blue-600'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="truncate text-xs text-ink-muted">{c.email}</p>
              </div>
              <button
                type="button"
                onClick={() => onDisconnect(c.id)}
                className="rounded-lg p-2 text-ink-faint active:bg-coral-soft active:text-coral"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {configured.gmail && !connections.some((c) => c.provider === 'gmail') && (
            <button type="button" onClick={onConnectGmail} className="flex w-full items-center gap-3 p-4 text-left active:bg-brand-50">
              <Mail className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-brand-700">Connect Gmail</span>
            </button>
          )}
          {configured.outlook && !connections.some((c) => c.provider === 'outlook') && (
            <button type="button" onClick={onConnectOutlook} className="flex w-full items-center gap-3 p-4 text-left active:bg-brand-50">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-brand-700">Connect Outlook</span>
            </button>
          )}
          {connections.length === 0 && !configured.gmail && !configured.outlook && (
            <p className="p-4 text-sm text-ink-muted">OAuth not configured on server.</p>
          )}
        </div>
        {connections.length > 0 && (
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-700/20 active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync school emails'}
          </button>
        )}
      </section>

      <section className="card-elevated p-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <p className="text-sm font-medium text-ink">Your data stays yours</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Read-only email access. We never send on your behalf. Session stays active on this device.
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/8 bg-white py-3.5 text-sm font-medium text-ink-muted active:bg-canvas-deep"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )
}
