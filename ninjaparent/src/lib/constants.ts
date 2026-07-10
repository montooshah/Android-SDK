import {
  AlertCircle,
  BookOpen,
  Calendar,
  CreditCard,
  Mail,
  Bus,
  ClipboardList,
  Newspaper,
  Users,
  Sparkles,
} from 'lucide-react'
import type { ItemType, Source, Urgency } from '../types'

export const typeConfig: Record<
  ItemType,
  { label: string; icon: typeof AlertCircle; color: string }
> = {
  payment: { label: 'Payment', icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
  registration: { label: 'Registration', icon: ClipboardList, color: 'text-violet-600 bg-violet-50' },
  homework: { label: 'Homework', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
  deadline_missed: { label: 'Overdue', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
  event: { label: 'Event', icon: Calendar, color: 'text-emerald-600 bg-emerald-50' },
  club_interest: { label: 'Club', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
  trip: { label: 'Trip', icon: Bus, color: 'text-orange-600 bg-orange-50' },
  newsletter: { label: 'Newsletter', icon: Newspaper, color: 'text-slate-600 bg-slate-50' },
}

export const sourceLabels: Record<Source, string> = {
  email: 'Email',
  spider: 'Spider',
  parentpay: 'Parent Pay',
  sims: 'SIMS Parent',
  calendar: 'Calendar',
}

export const urgencyConfig: Record<
  Urgency,
  { dot: string; border: string; badge: string }
> = {
  critical: {
    dot: 'bg-red-500',
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  high: {
    dot: 'bg-orange-500',
    border: 'border-l-orange-500',
    badge: 'bg-orange-100 text-orange-700',
  },
  medium: {
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
  low: {
    dot: 'bg-slate-400',
    border: 'border-l-slate-300',
    badge: 'bg-slate-100 text-slate-600',
  },
}

export { Sparkles, Mail }
