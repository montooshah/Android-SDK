import { CheckCircle2, Mail, Wifi, WifiOff, Trash2 } from 'lucide-react'
import type { ConnectionInfo } from '../api/client'

interface ConnectedSourcesProps {
  connections: ConnectionInfo[]
  configured: { gmail: boolean; outlook: boolean }
  onDisconnect?: (id: string) => void
}

export function ConnectedSources({ connections, configured, onDisconnect }: ConnectedSourcesProps) {
  const hasAny = connections.length > 0

  return (
    <div
      data-testid="connected-sources"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-slate-900">Connected sources</h2>
        <span className={`flex items-center gap-1 text-xs ${hasAny ? 'text-emerald-600' : 'text-slate-400'}`}>
          {hasAny ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {hasAny ? 'Live sync' : 'Not connected'}
        </span>
      </div>
      <div className="space-y-3">
        {connections.length === 0 ? (
          <p className="text-sm text-slate-500">
            Connect Gmail or Outlook to ingest real school emails.
          </p>
        ) : (
          connections.map((source) => (
            <div key={source.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <Mail className={`h-4 w-4 ${source.provider === 'gmail' ? 'text-red-500' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{source.name}</p>
                  <p className="text-xs text-slate-400">{source.email}</p>
                  <p className="text-xs text-slate-400">{source.items} actions this week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {onDisconnect && (
                  <button
                    type="button"
                    onClick={() => onDisconnect(source.id)}
                    className="text-slate-400 hover:text-red-500"
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {!configured.gmail && !configured.outlook && (
          <p className="text-xs text-amber-600">OAuth not configured on server</p>
        )}
      </div>
    </div>
  )
}
