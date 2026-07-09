import { useMemo } from 'react'
import type { ActionItem, Child } from '../types'
import { ActionCard } from './ActionCard'
import { AIInsight } from './AIInsight'

type FilterType = 'all' | 'payment' | 'homework' | 'event' | 'overdue'

interface PriorityFeedProps {
  items: ActionItem[]
  children: Child[]
  selectedChild: string | null
  activeFilter: FilterType
  onComplete: (id: string) => void
  hasConnections: boolean
}

export function PriorityFeed({
  items,
  children,
  selectedChild,
  activeFilter,
  onComplete,
  hasConnections,
}: PriorityFeedProps) {
  const filteredItems = useMemo(() => {
    let result = [...items]

    if (selectedChild) {
      result = result.filter((item) => item.childId === selectedChild)
    }

    if (activeFilter === 'payment') {
      result = result.filter((item) => item.type === 'payment')
    } else if (activeFilter === 'homework') {
      result = result.filter((item) => item.type === 'homework' || item.type === 'deadline_missed')
    } else if (activeFilter === 'event') {
      result = result.filter((item) => item.type === 'event' || item.type === 'trip')
    } else if (activeFilter === 'overdue') {
      result = result.filter((item) => item.type === 'deadline_missed')
    }

    return result.sort((a, b) => b.priorityScore - a.priorityScore)
  }, [items, selectedChild, activeFilter])

  const criticalCount = filteredItems.filter((i) => i.urgency === 'critical').length
  const childMap = useMemo(() => new Map(children.map((c) => [c.id, c])), [children])

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h2 data-testid="priority-heading" className="font-display text-2xl font-bold text-slate-900">
            Today&apos;s priorities
          </h2>
          {criticalCount > 0 && (
            <span className="animate-pulse-soft rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {criticalCount} critical
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {hasConnections
            ? 'AI-ranked actions from your connected email accounts'
            : 'Connect email to populate this feed with real school messages'}
        </p>
      </div>

      <AIInsight items={filteredItems} />

      <div data-testid="action-feed" className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <p className="font-medium text-slate-600">
              {hasConnections ? 'All caught up!' : 'No school emails synced yet'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {hasConnections
                ? 'No actions match your current filters.'
                : 'Connect Gmail or Outlook above, then click Sync now.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <ActionCard
              key={item.id}
              item={item}
              child={childMap.get(item.childId)}
              index={index}
              onComplete={onComplete}
            />
          ))
        )}
      </div>
    </div>
  )
}

export type { FilterType }
