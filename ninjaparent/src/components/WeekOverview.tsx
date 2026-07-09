import type { WeekStat } from '../types'

interface WeekOverviewProps {
  stats: WeekStat[]
}

export function WeekOverview({ stats }: WeekOverviewProps) {
  return (
    <div data-testid="week-overview" className="grid grid-cols-2 gap-2.5 px-5">
      {stats.map((stat) => (
        <div key={stat.label} className="card-elevated px-4 py-3.5">
          <p className="font-display text-2xl font-semibold tabular-nums text-ink">{stat.value}</p>
          <p className="mt-0.5 text-xs font-medium text-ink-muted">{stat.label}</p>
          {stat.trend && (
            <p className="mt-1 truncate text-[10px] text-ink-faint">{stat.trend}</p>
          )}
        </div>
      ))}
    </div>
  )
}
