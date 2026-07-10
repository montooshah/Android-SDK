import type { ActionItem, Child } from '../types'
import type { DashboardData } from '../api/client'

/** Client-side daily brief — updates as items are completed. */
export function computeDailyBrief(items: ActionItem[], children: Child[]): string {
  const sorted = [...items].sort((a, b) => b.priorityScore - a.priorityScore)

  if (sorted.length === 0) {
    return 'All clear for now — enjoy the calm before the next school email wave.'
  }

  const critical = sorted.filter((i) => i.urgency === 'critical' || i.urgency === 'high')
  const top = sorted[0]
  const child = children.find((c) => c.id === top.childId)

  if (critical.length > 1) {
    return `${critical.length} urgent items today — start with ${child?.name ?? 'your child'}'s "${top.title}". ${top.dueLabel}.`
  }

  const amountPart = top.amount ? `${top.amount} due. ` : ''
  const reason = top.priorityReason.split('·')[0]?.trim() ?? ''
  return `${child?.name ?? 'Your child'}'s "${top.title}" is priority one — ${top.dueLabel.toLowerCase()}. ${amountPart}${reason}`
}

export function patchDashboardAfterComplete(dashboard: DashboardData, completedId: string): DashboardData {
  const actionItems = dashboard.actionItems.filter((item) => item.id !== completedId) as DashboardData['actionItems']
  return {
    ...dashboard,
    actionItems,
    weekStats: computeWeekStats(actionItems as ActionItem[]),
    meta: {
      ...dashboard.meta,
      aiBrief: computeDailyBrief(actionItems as ActionItem[], dashboard.children as Child[]),
    },
  }
}

function computeWeekStats(items: ActionItem[]) {
  const dueCount = items.filter((i) => i.urgency === 'critical' || i.urgency === 'high').length
  const paymentCount = items.filter((i) => i.type === 'payment').length
  const homeworkCount = items.filter((i) => i.type === 'homework' || i.type === 'deadline_missed').length
  const eventCount = items.filter((i) => i.type === 'event' || i.type === 'trip').length
  const paymentTotal = items
    .filter((i) => i.amount)
    .reduce((sum, i) => sum + parseFloat(i.amount?.replace(/[£,]/g, '') || '0'), 0)

  return [
    {
      label: 'Actions due',
      value: dueCount,
      icon: 'alert',
      trend: items.length ? `${items.length} total` : undefined,
    },
    {
      label: 'Payments pending',
      value: paymentCount,
      icon: 'payment',
      trend: paymentTotal ? `£${paymentTotal.toFixed(0)} total` : undefined,
    },
    {
      label: 'Homework items',
      value: homeworkCount,
      icon: 'homework',
      trend: items.some((i) => i.type === 'deadline_missed') ? 'overdue detected' : undefined,
    },
    { label: 'Events this week', value: eventCount, icon: 'event' },
  ]
}
