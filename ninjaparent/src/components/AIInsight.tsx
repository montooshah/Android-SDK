import type { ActionItem } from '../types'

interface AIInsightProps {
  items: ActionItem[]
}

export function AIInsight({ items }: AIInsightProps) {
  if (items.length === 0) return null

  const critical = items.filter((i) => i.urgency === 'critical')
  const top = items[0]

  let message = `Next up: ${top.title}`
  if (critical.length > 0) {
    message = `${critical.length} urgent ${critical.length === 1 ? 'item' : 'items'} — start with "${top.title}"`
  }

  return (
    <div
      data-testid="ai-insight"
      className="mx-5 rounded-2xl bg-brand-700 px-4 py-3.5 text-white shadow-lg shadow-brand-700/25"
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-200">Priority insight</p>
      <p className="mt-1 text-sm font-medium leading-relaxed text-white/95">{message}</p>
    </div>
  )
}
