import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { randomUUID } from 'crypto'
import { db } from './db.js'
import { getGoogleAuthUrl, exchangeGoogleCode } from './gmail.js'
import { getMicrosoftAuthUrl, exchangeMicrosoftCode } from './outlook.js'
import { saveConnection, syncAllConnections } from './sync.js'
import { createSession, destroySession, getSessionUser, touchSession } from './auth.js'
import { generateDailyBrief, buildEmailUrl } from './llm.js'
import type { ActionItemRow, ChildRow, ConnectionRow } from './types.js'

const FRONTEND_URLS = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || FRONTEND_URLS.includes(origin)) {
          callback(null, true)
        } else {
          callback(null, false)
        }
      },
      credentials: true,
    }),
  )
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

  app.get('/api/auth/me', (req, res) => {
    const user = getSessionUser(req)
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    touchSession(req)
    res.json({ name: user.name, email: user.email, onboarded: user.onboarded })
  })

  app.post('/api/auth/logout', (req, res) => {
    destroySession(req, res)
    res.json({ ok: true })
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

  function frontendRedirect(path: string) {
    const base = FRONTEND_URLS[0] || 'http://localhost:5173'
    return `${base}${path}`
  }

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const code = req.query.code as string
      const state = req.query.state as string
      if (!code || !state || oauthStates.get(state)?.provider !== 'gmail') {
        return res.redirect(frontendRedirect('?auth=error&message=invalid_state'))
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

      res.redirect(frontendRedirect(`?auth=success&provider=gmail&email=${encodeURIComponent(email)}`))
    } catch (err) {
      console.error(err)
      res.redirect(frontendRedirect(`?auth=error&message=${encodeURIComponent(err instanceof Error ? err.message : 'oauth_failed')}`))
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
        return res.redirect(frontendRedirect('?auth=error&message=invalid_state'))
      }
      oauthStates.delete(state)

      const { email, tokens } = await exchangeMicrosoftCode(code)
      saveConnection('outlook', email, tokens)

      syncAllConnections().catch(console.error)

      res.redirect(frontendRedirect(`?auth=success&provider=outlook&email=${encodeURIComponent(email)}`))
    } catch (err) {
      console.error(err)
      res.redirect(frontendRedirect(`?auth=error&message=${encodeURIComponent(err instanceof Error ? err.message : 'oauth_failed')}`))
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

  app.get('/api/dashboard', async (_req, res) => {
    const children = (db.prepare('SELECT * FROM children ORDER BY name').all() as ChildRow[]).map((c) => ({
      id: c.id,
      name: c.name,
      year: c.year,
      school: c.school,
      color: c.color,
      avatar: c.avatar,
    }))

    const rows = db.prepare(`
      SELECT a.*, e.message_id, conn.provider AS mail_provider
      FROM action_items a
      LEFT JOIN emails e ON a.email_id = e.id
      LEFT JOIN connections conn ON e.connection_id = conn.id
      WHERE a.completed = 0
      ORDER BY a.priority_score DESC
    `).all() as Array<ActionItemRow & { message_id?: string; mail_provider?: string }>

    const items = rows.map((row) => ({
      ...mapActionItem(row),
      emailUrl: buildEmailUrl(row.mail_provider, row.message_id) ?? undefined,
    }))

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

    const childNames = new Map(children.map((c) => [c.id, c.name]))
    const aiBrief = await generateDailyBrief(
      items.map((i) => ({
        title: i.title,
        dueLabel: i.dueLabel,
        urgency: i.urgency,
        childName: childNames.get(i.childId),
      })),
    )

    res.json({
      children,
      actionItems: items,
      weekStats,
      meta: {
        hasConnections: connections.c > 0,
        emailsThisWeek: emailCount.c,
        usingLiveData: connections.c > 0,
        aiBrief,
        llmEnabled: !!process.env.OPENAI_API_KEY,
      },
    })
  })

  app.post('/api/action-items/:id/complete', (req, res) => {
    db.prepare('UPDATE action_items SET completed = 1 WHERE id = ?').run(req.params.id)
    res.json({ ok: true })
  })

  app.get('/api/onboarding/status', (req, res) => {
    const user = getSessionUser(req)
    const profile = db.prepare('SELECT parent_name, parent_email, onboarded FROM profile WHERE id = 1').get() as
      | { parent_name: string; parent_email: string; onboarded: number }
      | undefined
    res.json({
      onboarded: user?.onboarded || profile?.onboarded === 1,
      authenticated: !!user,
      profile: profile || user
        ? { name: profile?.parent_name || user?.name || '', email: profile?.parent_email || user?.email || '' }
        : null,
    })
  })

  app.post('/api/onboarding', (req, res) => {
    const { name, email, children } = req.body as {
      name?: string
      email?: string
      children?: Array<{ name: string; year?: string; school?: string }>
    }

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    const existing = db.prepare('SELECT id FROM profile WHERE id = 1').get()
    if (existing) {
      db.prepare(`
        UPDATE profile SET parent_name = ?, parent_email = ?, updated_at = unixepoch() WHERE id = 1
      `).run(name.trim(), email.trim())
    } else {
      db.prepare(`
        INSERT INTO profile (id, parent_name, parent_email, onboarded) VALUES (1, ?, ?, 0)
      `).run(name.trim(), email.trim())
    }

    if (children?.length) {
      saveChildren(children)
    }

    res.json({ ok: true })
  })

  app.put('/api/children', (req, res) => {
    const { children } = req.body as {
      children?: Array<{ name: string; year?: string; school?: string }>
    }
    if (!children?.length) {
      return res.status(400).json({ error: 'At least one child is required' })
    }
    saveChildren(children)
    res.json({ ok: true })
  })

  app.post('/api/onboarding/complete', (req, res) => {
    const profile = db.prepare('SELECT parent_name, parent_email FROM profile WHERE id = 1').get() as
      | { parent_name: string; parent_email: string }
      | undefined

    if (profile) {
      db.prepare('UPDATE profile SET onboarded = 1, updated_at = unixepoch() WHERE id = 1').run()
    } else {
      db.prepare(`
        INSERT INTO profile (id, parent_name, parent_email, onboarded) VALUES (1, 'Parent', '', 1)
      `).run()
    }

    const p = profile || { parent_name: 'Parent', parent_email: '' }
    const sessionToken = createSession(res, { name: p.parent_name, email: p.parent_email })

    res.json({ ok: true, sessionToken })
  })

  return app
}

function saveChildren(children: Array<{ name: string; year?: string; school?: string }>) {
  const colors = ['#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B']
  db.prepare('DELETE FROM children').run()
  const insert = db.prepare(`
    INSERT INTO children (id, name, year, school, color, avatar, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  for (let i = 0; i < children.length; i++) {
    const c = children[i]
    const childName = c.name.trim()
    const keywords = JSON.stringify(
      [childName.toLowerCase(), (c.year || '').toLowerCase(), (c.school || '').toLowerCase()].filter(Boolean),
    )
    insert.run(
      randomUUID(),
      childName,
      c.year?.trim() || '',
      c.school?.trim() || '',
      colors[i % colors.length],
      childName.charAt(0).toUpperCase(),
      keywords,
    )
  }
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
