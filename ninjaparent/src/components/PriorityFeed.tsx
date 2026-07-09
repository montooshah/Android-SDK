import { useMemo, useState } from 'react'
import { actionItems as initialItems } from '../data/mockData'
import { ActionCard } from './ActionCard'
import { AIInsight } from './AIInsight'

interface PriorityFeedProps {
  selectedChild: string | null
  activeFilter: string
}

export function PriorityFeed({ selectedChild, activeFilter }: PriorityFeedProps) {
  const [items] = useState(initialItems)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => !completedIds.has(item.id))

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

    return [...result].sort((a, b) => b.priorityScore - a.priorityScore)
  }, [items, selectedChild, activeFilter, completedIds])

  const handleComplete = (id: string) => {
    setCompletedIds((prev) => new Set([...prev, id]))
  }

  const criticalCount = filteredItems.filter((i) => i.urgency === 'critical').length

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
          AI-ranked actions across all your kids and school apps
        </p>
      </div>

      <AIInsight />

      <div data-testid="action-feed" className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <p className="font-medium text-slate-600">All caught up!</p>
            <p className="mt-1 text-sm text-slate-400">No actions match your current filters.</p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <ActionCard
              key={item.id}
              item={item}
              index={index}
              onComplete={handleComplete}
            />
          ))
        )}
      </div>
    </div>
  )
}
