import { Sparkles } from 'lucide-react'
import type { ActionItem } from '../types'

interface AIInsightProps {
  items: ActionItem[]
}

export function AIInsight({ items }: AIInsightProps) {
  const critical = items.filter((i) => i.urgency === 'critical')
  const payments = items.filter((i) => i.type === 'payment')
  const top = items[0]

  const summary = top
    ? critical.length > 0
      ? `You have ${critical.length} critical item${critical.length > 1 ? 's' : ''} today. Top priority: "${top.title}".`
      : `Your queue has ${items.length} school action${items.length !== 1 ? 's' : ''}. Next up: "${top.title}".`
    : 'Connect Gmail or Outlook and sync to see AI-prioritized school actions here.'

  const tip = payments.length >= 2
    ? `Consider batching ${payments.length} Parent Pay items together.`
    : items.length > 0
      ? `Est. ${Math.max(3, Math.ceil(items.length * 2.5))} min to clear your queue.`
      : undefined

  return (
    <div
      data-testid="ai-insight"
      className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-brand-900">AI Priority Insight</p>
          <p className="text-xs text-brand-600">From your real school emails</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {critical.length > 0 && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
            {critical.length} critical today
          </span>
        )}
        {tip && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            {tip}
          </span>
        )}
      </div>
    </div>
  )
}
