import { Check, Sparkles } from 'lucide-react'
import type { ActionItem } from '../types'
import { getChildById } from '../data/mockData'
import { ChildBadge } from './ChildBadge'
import { sourceLabels, typeConfig, urgencyConfig } from '../lib/constants'

interface ActionCardProps {
  item: ActionItem
  index: number
  onComplete: (id: string) => void
}

export function ActionCard({ item, index, onComplete }: ActionCardProps) {
  const child = getChildById(item.childId)
  const type = typeConfig[item.type]
  const urgency = urgencyConfig[item.urgency]
  const Icon = type.icon

  if (!child) return null

  return (
    <article
      data-testid={`action-card-${item.id}`}
      className={`animate-fade-up group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md border-l-4 ${urgency.border}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${type.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${urgency.badge}`}>
                {item.dueLabel}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {sourceLabels[item.source]}
              </span>
              {item.amount && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {item.amount}
                </span>
              )}
            </div>
            <h3 className="font-display text-base font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ChildBadge child={child} />
              <div className="flex items-center gap-1.5 text-xs text-brand-700">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{item.priorityReason}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-brand-700">{item.priorityScore}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Priority</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onComplete(item.id)}
          className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-emerald-600"
        >
          <Check className="h-4 w-4" />
          Mark complete
        </button>
        <button
          type="button"
          data-testid={`action-btn-${item.id}`}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow"
        >
          {item.actionLabel}
        </button>
      </div>
    </article>
  )
}
