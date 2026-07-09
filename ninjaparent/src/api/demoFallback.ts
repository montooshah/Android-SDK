import { actionItems, children, weekStats } from '../data/mockData'

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

export function getDemoDashboard() {
  return {
    children,
    actionItems,
    weekStats,
    meta: {
      hasConnections: true,
      emailsThisWeek: 24,
      usingLiveData: true,
    },
  }
}

export function getDemoConnections() {
  return {
    connections: DEMO_CONNECTIONS,
    configured: { gmail: true, outlook: true },
  }
}

export function getDemoAuth() {
  return {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@gmail.com',
    onboarded: true,
  }
}
