import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { randomUUID } from 'crypto'
import { db } from './db.js'
import { getGoogleAuthUrl, exchangeGoogleCode } from './gmail.js'
import { getMicrosoftAuthUrl, exchangeMicrosoftCode } from './outlook.js'
import { saveConnection, syncAllConnections } from './sync.js'
import type { ActionItemRow, ChildRow, ConnectionRow } from './types.js'

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

export function createApp() {
  const app = express()

  app.use(cors({ origin: FRONTEND_URL, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  const oauthStates = new Map<string, { provider: 'gmail' | 'outlook'; created: number }>()

  function createState(provider: 'gmail' | 'outlook') {
    const state = randomUUID()
    oauthStates.set(state, { provider, created: Date.now() })
    // Cleanup old states
    for (const [key, val] of oauthStates) {
      if (Date.now() - val.created > 10 * 60 * 1000) oauthStates.delete(key)
    }
    return state
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, integrations: { gmail: !!process.env.GOOGLE_CLIENT_ID, outlook: !!process.env.MICROSOFT_CLIENT_ID } })
  })

  app.get('/api/auth/google', (_req, res) => {
    try {
      const state = createState('gmail')
      const url = getGoogleAuthUrl() + `&state=${state}`
      res.redirect(url)
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Google OAuth not configured' })
    }
  })

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const code = req.query.code as string
      const state = req.query.state as string
      if (!code || !state || oauthStates.get(state)?.provider !== 'gmail') {
        return res.redirect(`${FRONTEND_URL}?auth=error&message=invalid_state`)
      }
      oauthStates.delete(state)

      const { email, tokens } = await exchangeGoogleCode(code)
      saveConnection('gmail', email, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ?? null,
      })

      // Auto-sync on connect
      syncAllConnections().catch(console.error)

      res.redirect(`${FRONTEND_URL}?auth=success&provider=gmail&email=${encodeURIComponent(email)}`)
    } catch (err) {
      console.error(err)
      res.redirect(`${FRONTEND_URL}?auth=error&message=${encodeURIComponent(err instanceof Error ? err.message : 'oauth_failed')}`)
    }
  })

  app.get('/api/auth/microsoft', async (_req, res) => {
    try {
      const state = createState('outlook')
      const url = await getMicrosoftAuthUrl(state)
      res.redirect(url)
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Microsoft OAuth not configured' })
    }
  })

  app.get('/api/auth/microsoft/callback', async (req, res) => {
    try {
      const code = req.query.code as string
      const state = req.query.state as string
      if (!code || !state || oauthStates.get(state)?.provider !== 'outlook') {
        return res.redirect(`${FRONTEND_URL}?auth=error&message=invalid_state`)
      }
      oauthStates.delete(state)

      const { email, tokens } = await exchangeMicrosoftCode(code)
      saveConnection('outlook', email, tokens)

      syncAllConnections().catch(console.error)

      res.redirect(`${FRONTEND_URL}?auth=success&provider=outlook&email=${encodeURIComponent(email)}`)
    } catch (err) {
      console.error(err)
      res.redirect(`${FRONTEND_URL}?auth=error&message=${encodeURIComponent(err instanceof Error ? err.message : 'oauth_failed')}`)
    }
  })

  app.get('/api/connections', (_req, res) => {
    const connections = db.prepare('SELECT id, provider, email, created_at, updated_at FROM connections ORDER BY provider').all() as Array<Pick<ConnectionRow, 'id' | 'provider' | 'email'>>
    const weekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60

    const enriched = connections.map((c) => {
      const items = db.prepare(`
        SELECT COUNT(*) as c FROM emails e
        JOIN action_items a ON a.email_id = e.id
        WHERE e.connection_id = ? AND e.received_at >= ?
      `).get(c.id, weekAgo) as { c: number }

      return {
        id: c.id,
        provider: c.provider,
        name: c.provider === 'gmail' ? 'Gmail' : 'Outlook',
        email: c.email,
        status: 'connected' as const,
        items: items.c,
      }
    })

    res.json({ connections: enriched, configured: { gmail: !!process.env.GOOGLE_CLIENT_ID, outlook: !!process.env.MICROSOFT_CLIENT_ID } })
  })

  app.delete('/api/connections/:id', (req, res) => {
    db.prepare('DELETE FROM connections WHERE id = ?').run(req.params.id)
    res.json({ ok: true })
  })

  app.post('/api/sync', async (_req, res) => {
    try {
      const result = await syncAllConnections()
      res.json(result)
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Sync failed' })
    }
  })

  app.get('/api/dashboard', (_req, res) => {
    const children = (db.prepare('SELECT * FROM children ORDER BY name').all() as ChildRow[]).map((c) => ({
      id: c.id,
      name: c.name,
      year: c.year,
      school: c.school,
      color: c.color,
      avatar: c.avatar,
    }))

    const items = (db.prepare(`
      SELECT * FROM action_items WHERE completed = 0 ORDER BY priority_score DESC
    `).all() as ActionItemRow[]).map(mapActionItem)

    if (items.some((i) => i.childId === 'unassigned')) {
      children.push({
        id: 'unassigned',
        name: 'Unassigned',
        year: 'Needs review',
        school: 'Match child in settings',
        color: '#94a3b8',
        avatar: '?',
      })
    }

    const weekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
    const dueCount = items.filter((i) => i.urgency === 'critical' || i.urgency === 'high').length
    const paymentCount = items.filter((i) => i.type === 'payment').length
    const homeworkCount = items.filter((i) => i.type === 'homework' || i.type === 'deadline_missed').length
    const eventCount = items.filter((i) => i.type === 'event' || i.type === 'trip').length
    const paymentTotal = items
      .filter((i) => i.amount)
      .reduce((sum, i) => sum + parseFloat(i.amount?.replace(/[£,]/g, '') || '0'), 0)

    const weekStats = [
      { label: 'Actions due', value: dueCount, icon: 'alert', trend: items.length ? `${items.length} total` : undefined },
      { label: 'Payments pending', value: paymentCount, icon: 'payment', trend: paymentTotal ? `£${paymentTotal.toFixed(0)} total` : undefined },
      { label: 'Homework items', value: homeworkCount, icon: 'homework', trend: items.some((i) => i.type === 'deadline_missed') ? 'overdue detected' : undefined },
      { label: 'Events this week', value: eventCount, icon: 'event' },
    ]

    const connections = db.prepare('SELECT COUNT(*) as c FROM connections').get() as { c: number }
    const emailCount = db.prepare('SELECT COUNT(*) as c FROM emails WHERE received_at >= ?').get(weekAgo) as { c: number }

    res.json({
      children,
      actionItems: items,
      weekStats,
      meta: {
        hasConnections: connections.c > 0,
        emailsThisWeek: emailCount.c,
        usingLiveData: connections.c > 0,
      },
    })
  })

  app.post('/api/action-items/:id/complete', (req, res) => {
    db.prepare('UPDATE action_items SET completed = 1 WHERE id = ?').run(req.params.id)
    res.json({ ok: true })
  })

  return app
}

function mapActionItem(row: ActionItemRow) {
  return {
    id: row.id,
    childId: row.child_id || 'unassigned',
    type: row.type,
    title: row.title,
    description: row.description,
    source: row.source,
    dueDate: row.due_date || '',
    dueLabel: row.due_label || 'Review',
    urgency: row.urgency,
    priorityScore: row.priority_score,
    priorityReason: row.priority_reason,
    amount: row.amount || undefined,
    actionLabel: row.action_label,
    completed: !!row.completed,
  }
}
