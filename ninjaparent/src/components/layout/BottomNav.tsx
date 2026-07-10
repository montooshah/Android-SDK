import { Home, Settings, Users, Zap } from 'lucide-react'

export type AppTab = 'today' | 'kids' | 'settings'

interface BottomNavProps {
  active: AppTab
  onChange: (tab: AppTab) => void
  criticalCount?: number
}

const tabs: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Today', icon: Zap },
  { id: 'kids', label: 'Kids', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function BottomNav({ active, onChange, criticalCount = 0 }: BottomNavProps) {
  return (
    <nav
      data-testid="bottom-nav"
      className="glass-header fixed inset-x-0 bottom-0 z-50 border-t border-black/5 lg:hidden nav-safe-bottom"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              data-testid={`tab-${id}`}
              onClick={() => onChange(id)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 transition-colors ${
                isActive ? 'text-brand-700' : 'text-ink-faint'
              }`}
            >
              <div className={`relative rounded-xl p-1.5 ${isActive ? 'bg-brand-100' : ''}`}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 2} />
                {id === 'today' && criticalCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                    {criticalCount}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
