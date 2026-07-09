import { Check } from 'lucide-react'
import type { ActionItem, Child } from '../types'
import { sourceLabels, typeConfig, urgencyConfig } from '../lib/constants'

interface ActionCardProps {
  item: ActionItem
  child?: Child
  index: number
  onComplete: (id: string) => void
  onPrimaryAction?: (item: ActionItem) => void
}

export function ActionCard({ item, index, onComplete, onPrimaryAction, child }: ActionCardProps) {
  const type = typeConfig[item.type]
  const urgency = urgencyConfig[item.urgency]
  const Icon = type.icon
  const isCritical = item.urgency === 'critical' || item.urgency === 'high'

  return (
    <article
      data-testid={`action-card-${item.id}`}
      className="card-elevated animate-fade-up overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {isCritical && (
        <div className={`h-1 w-full ${item.urgency === 'critical' ? 'bg-coral' : 'bg-gold'}`} />
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${type.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${urgency.badge}`}>
                {item.dueLabel}
              </span>
              {item.amount && (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                  {item.amount}
                </span>
              )}
            </div>
            <h3 className="font-display text-[1.05rem] font-semibold leading-snug text-ink">{item.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {child && (
              <>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: child.color }}
                >
                  {child.avatar}
                </span>
                <span className="truncate text-xs font-medium text-ink-muted">{child.name}</span>
                <span className="text-ink-faint">·</span>
              </>
            )}
            <span className="truncate text-xs text-ink-faint">{sourceLabels[item.source]}</span>
          </div>
          <span className="shrink-0 font-display text-sm font-bold tabular-nums text-brand-700">
            {item.priorityScore}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onComplete(item.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-canvas py-2.5 text-sm font-medium text-ink-muted active:bg-canvas-deep"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
          <button
            type="button"
            data-testid={`action-btn-${item.id}`}
            onClick={() => onPrimaryAction?.(item)}
            className="flex-[1.4] rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-700/20 active:scale-[0.98]"
          >
            {item.actionLabel}
          </button>
        </div>
      </div>
    </article>
  )
}
