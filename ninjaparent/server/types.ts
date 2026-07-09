export interface ConnectionRow {
  id: string
  provider: 'gmail' | 'outlook'
  email: string
  access_token: string
  refresh_token: string | null
  expires_at: number | null
}

export interface ChildRow {
  id: string
  name: string
  year: string
  school: string
  color: string
  avatar: string
  keywords: string
}

export interface ActionItemRow {
  id: string
  child_id: string | null
  email_id: string | null
  type: string
  title: string
  description: string
  source: string
  due_date: string | null
  due_label: string | null
  urgency: string
  priority_score: number
  priority_reason: string
  amount: string | null
  action_label: string
  completed: number
}
