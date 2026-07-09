import { actionItems, children, weekStats } from '../data/mockData'
import { getProfile, isOnboardingComplete } from '../lib/onboarding'

export const DEMO_CONNECTIONS = [
  {
    id: 'demo-gmail',
    provider: 'gmail',
    name: 'Gmail',
    email: 'sarah.johnson@gmail.com',
    status: 'connected' as const,
    items: 8,
  },
  {
    id: 'demo-outlook',
    provider: 'outlook',
    name: 'Outlook',
    email: 'sarah@outlook.com',
    status: 'connected' as const,
    items: 5,
  },
]

const CHILD_COLORS = ['#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B']

/** Full sample dashboard — only for ?demo=1 investor walkthrough */
export function getDemoDashboard() {
  return {
    children,
    actionItems,
    weekStats,
    meta: {
      hasConnections: true,
      emailsThisWeek: 24,
      usingLiveData: true,
      aiBrief: buildTemplateBrief(actionItems, children),
      llmEnabled: true,
    },
  }
}

/** Empty dashboard using the parent's own onboarding profile */
export function getProfileDashboard() {
  const profile = getProfile()
  const profileChildren = (profile?.children ?? []).map((c, i) => ({
    id: `profile-child-${i}`,
    name: c.name,
    year: c.year,
    school: c.school,
    color: CHILD_COLORS[i % CHILD_COLORS.length],
    avatar: c.name.charAt(0).toUpperCase() || '?',
  }))

  const firstName = profile?.name?.split(' ')[0]
  const aiBrief = profileChildren.length
    ? `${firstName ? `Hi ${firstName} — ` : ''}connect Gmail or Outlook in Settings to pull in school emails. We'll rank what needs your attention today.`
    : 'Add your children in Settings, then connect email to get started.'

  return {
    children: profileChildren,
    actionItems: [] as typeof actionItems,
    weekStats: [
      { label: 'Actions due', value: 0, icon: 'alert' },
      { label: 'Payments pending', value: 0, icon: 'payment' },
      { label: 'Homework items', value: 0, icon: 'homework' },
      { label: 'Events this week', value: 0, icon: 'event' },
    ],
    meta: {
      hasConnections: false,
      emailsThisWeek: 0,
      usingLiveData: false,
      aiBrief,
    },
  }
}

export function getDemoConnections() {
  return {
    connections: DEMO_CONNECTIONS,
    configured: { gmail: true, outlook: true },
  }
}

export function getEmptyConnections() {
  return {
    connections: [] as typeof DEMO_CONNECTIONS,
    configured: { gmail: true, outlook: true },
  }
}

/** Sarah Johnson — investor demo only */
export function getDemoAuth() {
  return {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@gmail.com',
    onboarded: true,
  }
}

/** Real parent from onboarding welcome step */
export function getProfileAuth() {
  const profile = getProfile()
  return {
    name: profile?.name || 'Parent',
    email: profile?.email || '',
    onboarded: isOnboardingComplete(),
  }
}

function buildTemplateBrief(
  items: typeof actionItems,
  kids: typeof children,
): string {
  if (items.length === 0) return 'All clear for now — enjoy the calm before the next school email wave.'

  const critical = items.filter((i) => i.urgency === 'critical' || i.urgency === 'high')
  const top = items[0]
  const child = kids.find((c) => c.id === top.childId)

  if (critical.length > 1) {
    return `${critical.length} urgent items today — start with ${child?.name ?? 'your child'}'s "${top.title}". ${top.dueLabel}.`
  }

  return `${child?.name ?? 'Your child'}'s "${top.title}" is priority one — ${top.dueLabel.toLowerCase()}. ${top.amount ? `${top.amount} due.` : ''} ${top.priorityReason.split('·')[0]?.trim() ?? ''}`
}
