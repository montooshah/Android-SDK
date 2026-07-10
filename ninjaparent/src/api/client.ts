const API_BASE = import.meta.env.VITE_API_URL || ''

import { getSessionToken } from '../lib/session'

export interface DashboardData {
  children: Array<{
    id: string
    name: string
    year: string
    school: string
    color: string
    avatar: string
  }>
  actionItems: Array<{
    id: string
    childId: string
    type: string
    title: string
    description: string
    source: string
    dueDate: string
    dueLabel: string
    urgency: string
    priorityScore: number
    priorityReason: string
    amount?: string
    actionLabel: string
    emailUrl?: string
    completed?: boolean
  }>
  weekStats: Array<{ label: string; value: number; icon: string; trend?: string }>
  meta: {
    hasConnections: boolean
    emailsThisWeek: number
    usingLiveData: boolean
    aiBrief?: string | null
    llmEnabled?: boolean
  }
}

export interface ConnectionInfo {
  id: string
  provider: string
  name: string
  email: string
  status: 'connected'
  items: number
}

export interface ParentProfile {
  name: string
  email: string
  childCount: number
  children: Array<{ name: string; year: string; school: string }>
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    headers['X-Session-Token'] = token
  }

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error ${res.status}`)
  }
  return res.json()
}

export const api = {
  getMe: () => apiFetch<{ name: string; email: string; onboarded: boolean; sessionToken?: string }>('/api/auth/me'),
  logout: () => apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  getDashboard: () => apiFetch<DashboardData>('/api/dashboard'),
  getConnections: () => apiFetch<{ connections: ConnectionInfo[]; configured: { gmail: boolean; outlook: boolean } }>('/api/connections'),
  getOnboardingStatus: () => apiFetch<{ onboarded: boolean; authenticated: boolean; profile: { name: string; email: string } | null }>('/api/onboarding/status'),
  saveOnboarding: (profile: ParentProfile) =>
    apiFetch<{ ok: boolean }>('/api/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        name: profile.name,
        email: profile.email,
        children: profile.children,
      }),
    }),
  completeOnboarding: () => apiFetch<{ ok: boolean; sessionToken?: string }>('/api/onboarding/complete', { method: 'POST' }),
  sync: () => apiFetch<{ synced: number; itemsCreated: number }>('/api/sync', { method: 'POST' }),
  completeItem: (id: string) => apiFetch<{ ok: boolean }>(`/api/action-items/${id}/complete`, { method: 'POST' }),
  disconnect: (id: string) => apiFetch<{ ok: boolean }>(`/api/connections/${id}`, { method: 'DELETE' }),
  saveChildren: (children: ParentProfile['children']) =>
    apiFetch<{ ok: boolean }>('/api/children', {
      method: 'PUT',
      body: JSON.stringify({ children }),
    }),
  connectGmail: () => { window.location.href = `${API_BASE}/api/auth/google` },
  connectOutlook: () => { window.location.href = `${API_BASE}/api/auth/microsoft` },
}
