export type ItemType =
  | 'payment'
  | 'registration'
  | 'homework'
  | 'deadline_missed'
  | 'event'
  | 'club_interest'
  | 'trip'
  | 'newsletter'

export type Urgency = 'critical' | 'high' | 'medium' | 'low'

export type Source = 'email' | 'spider' | 'parentpay' | 'sims' | 'calendar'

export interface Child {
  id: string
  name: string
  year: string
  school: string
  color: string
  avatar: string
}

export interface ActionItem {
  id: string
  childId: string
  type: ItemType
  title: string
  description: string
  source: Source
  dueDate: string
  dueLabel: string
  urgency: Urgency
  priorityScore: number
  priorityReason: string
  amount?: string
  actionLabel: string
  actionUrl?: string
  emailUrl?: string
  completed?: boolean
}

export interface WeekStat {
  label: string
  value: number
  icon: string
  trend?: string
}
