import { RefreshCw } from 'lucide-react'

interface MobileHeaderProps {
  parentName?: string
  syncing?: boolean
  onSync?: () => void
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function MobileHeader({ parentName, syncing, onSync }: MobileHeaderProps) {
  const firstName = parentName?.split(' ')[0] || 'there'
  const initial = parentName?.charAt(0).toUpperCase() || 'N'

  return (
    <header className="glass-header sticky top-0 z-40 onboarding-safe-top">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <img src="/logo.svg" alt="" className="h-10 w-10 shrink-0 rounded-xl shadow-sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-muted">{getGreeting()}</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {firstName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onSync && (
            <button
              type="button"
              onClick={onSync}
              disabled={syncing}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-50"
              aria-label="Sync emails"
            >
              <RefreshCw className={`h-4 w-4 text-brand-700 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 font-display text-sm font-semibold text-white shadow-md">
            {initial}
          </div>
        </div>
      </div>
    </header>
  )
}
