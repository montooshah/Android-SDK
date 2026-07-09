import { CheckCircle2, Mail, Wifi } from 'lucide-react'
import { connectedSources } from '../data/mockData'

export function ConnectedSources() {
  return (
    <div
      data-testid="connected-sources"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-slate-900">Connected sources</h2>
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <Wifi className="h-3.5 w-3.5" />
          All syncing
        </span>
      </div>
      <div className="space-y-3">
        {connectedSources.map((source) => (
          <div key={source.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Mail className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{source.name}</p>
                <p className="text-xs text-slate-400">{source.items} items this week</p>
              </div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        ))}
      </div>
    </div>
  )
}
