import { AlertTriangle, BookOpen, Calendar, CreditCard } from 'lucide-react'
import { weekStats } from '../data/mockData'

const iconMap = {
  alert: AlertTriangle,
  payment: CreditCard,
  homework: BookOpen,
  event: Calendar,
}

export function WeekOverview() {
  return (
    <div data-testid="week-overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {weekStats.map((stat) => {
        const Icon = iconMap[stat.icon as keyof typeof iconMap]
        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <Icon className="h-5 w-5 text-brand-600" />
              {stat.trend && (
                <span className="text-xs text-slate-400">{stat.trend}</span>
              )}
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        )
      })}
    </div>
  )
}
