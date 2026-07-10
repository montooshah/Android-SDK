import {
  AlertCircle,
  BookOpen,
  Calendar,
  CreditCard,
  LayoutGrid,
} from 'lucide-react'
import type { FilterType } from '../Sidebar'

const filters: { id: FilterType; label: string; icon: typeof AlertCircle }[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'payment', label: 'Pay', icon: CreditCard },
  { id: 'homework', label: 'Homework', icon: BookOpen },
  { id: 'event', label: 'Events', icon: Calendar },
  { id: 'overdue', label: 'Overdue', icon: AlertCircle },
]

interface FilterPillsProps {
  active: FilterType
  onChange: (filter: FilterType) => void
}

export function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div className="chip-scroll flex gap-2 overflow-x-auto px-5 py-3" data-testid="filter-pills">
      {filters.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          data-testid={`filter-type-${id}`}
          onClick={() => onChange(id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
            active === id
              ? 'bg-brand-700 text-white'
              : 'bg-brand-50 text-brand-800 ring-1 ring-brand-200/80'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  )
}

export type { FilterType }
