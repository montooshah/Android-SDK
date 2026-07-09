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
  compact?: boolean
}

export function PriorityFeed({
  items,
  children,
  selectedChild,
  activeFilter,
  onComplete,
  hasConnections,
  compact = false,
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

  const childMap = useMemo(() => new Map(children.map((c) => [c.id, c])), [children])

  return (
    <div className={`space-y-4 ${compact ? '' : 'space-y-6'}`}>
      {!compact && (
        <div>
          <h2 data-testid="priority-heading" className="font-display text-2xl font-semibold text-ink">
            Today&apos;s priorities
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {hasConnections ? 'From your connected email' : 'Connect email in Settings'}
          </p>
        </div>
      )}

      <AIInsight items={filteredItems} />

      <div data-testid="action-feed" className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-black/8 bg-white/50 px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              {hasConnections ? 'All clear' : 'Connect your email'}
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              {hasConnections
                ? 'Nothing matches these filters right now.'
                : 'Go to Settings to link Gmail or Outlook.'}
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
