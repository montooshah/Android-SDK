import {
  AlertCircle,
  BookOpen,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Settings,
  Link2,
} from 'lucide-react'
import type { Child } from '../types'

type FilterType = 'all' | 'payment' | 'homework' | 'event' | 'overdue'

interface SidebarProps {
  children: Child[]
  selectedChild: string | null
  activeFilter: FilterType
  onSelectChild: (id: string | null) => void
  onSelectFilter: (filter: FilterType) => void
}

const filters: { id: FilterType; label: string; icon: typeof AlertCircle }[] = [
  { id: 'all', label: 'All actions', icon: LayoutDashboard },
  { id: 'payment', label: 'Payments', icon: CreditCard },
  { id: 'homework', label: 'Homework', icon: BookOpen },
  { id: 'event', label: 'Events', icon: Calendar },
  { id: 'overdue', label: 'Overdue', icon: AlertCircle },
]

export function Sidebar({
  children,
  selectedChild,
  activeFilter,
  onSelectChild,
  onSelectFilter,
}: SidebarProps) {
  return (
    <aside
      data-testid="sidebar"
      className="flex w-full flex-col border-r border-slate-200 bg-white lg:w-64 lg:shrink-0"
    >
      <div className="border-b border-slate-100 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Your children
        </p>
        <div className="space-y-1">
          <button
            type="button"
            data-testid="filter-all-kids"
            onClick={() => onSelectChild(null)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              selectedChild === null
                ? 'bg-brand-50 text-brand-800'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
              All
            </div>
            All kids
          </button>
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              data-testid={`filter-child-${child.id}`}
              onClick={() => onSelectChild(child.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                selectedChild === child.id
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: child.color }}
              >
                {child.avatar}
              </div>
              <div>
                <p className="font-medium">{child.name}</p>
                <p className="text-xs text-slate-400">{child.year}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Filter by type
        </p>
        <div className="space-y-1">
          {filters.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              data-testid={`filter-type-${id}`}
              onClick={() => onSelectFilter(id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeFilter === id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
        >
          <Link2 className="h-4 w-4" />
          Connected apps
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  )
}

export type { FilterType }
