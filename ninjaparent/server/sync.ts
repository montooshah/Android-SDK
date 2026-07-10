import { randomUUID } from 'crypto'
import { db } from './db.js'
import { fetchGmailMessages } from './gmail.js'
import { fetchOutlookMessages } from './outlook.js'
import { extractActionItem, newActionItemId } from './extractor.js'
import type { ConnectionRow, ChildRow } from './types.js'
import type { FetchedEmail } from './gmail.js'

export async function syncAllConnections(): Promise<{ synced: number; itemsCreated: number }> {
  const connections = db.prepare('SELECT * FROM connections').all() as ConnectionRow[]
  const children = db.prepare('SELECT * FROM children').all() as ChildRow[]

  let synced = 0
  let itemsCreated = 0

  for (const connection of connections) {
    const result = await syncConnection(connection, children)
    synced += result.synced
    itemsCreated += result.itemsCreated
  }

  return { synced, itemsCreated }
}

async function syncConnection(connection: ConnectionRow, children: ChildRow[]) {
  let emails: FetchedEmail[] = []

  try {
    if (connection.provider === 'gmail') {
      emails = await fetchGmailMessages(connection)
    } else {
      emails = await fetchOutlookMessages(connection)
    }
  } catch (err) {
    console.error(`Sync failed for ${connection.provider}:${connection.email}`, err)
    return { synced: 0, itemsCreated: 0 }
  }

  const insertEmail = db.prepare(`
    INSERT OR IGNORE INTO emails (id, connection_id, message_id, thread_id, subject, snippet, body_text, from_address, received_at)
    VALUES (@id, @connection_id, @message_id, @thread_id, @subject, @snippet, @body_text, @from_address, @received_at)
  `)

  const findEmail = db.prepare('SELECT id FROM emails WHERE connection_id = ? AND message_id = ?')
  const hasAction = db.prepare('SELECT id FROM action_items WHERE email_id = ? LIMIT 1')

  const insertAction = db.prepare(`
    INSERT INTO action_items (id, child_id, email_id, type, title, description, source, due_date, due_label, urgency, priority_score, priority_reason, amount, action_label)
    VALUES (@id, @child_id, @email_id, @type, @title, @description, @source, @due_date, @due_label, @urgency, @priority_score, @priority_reason, @amount, @action_label)
  `)

  let itemsCreated = 0

  for (const email of emails) {
    const emailId = randomUUID()
    insertEmail.run({
      id: emailId,
      connection_id: connection.id,
      message_id: email.messageId,
      thread_id: email.threadId ?? null,
      subject: email.subject,
      snippet: email.snippet,
      body_text: email.bodyText,
      from_address: email.fromAddress,
      received_at: email.receivedAt,
    })

    const row = findEmail.get(connection.id, email.messageId) as { id: string } | undefined
    if (!row) continue

    if (hasAction.get(row.id)) continue

    const extracted = extractActionItem(
      {
        subject: email.subject,
        snippet: email.snippet,
        bodyText: email.bodyText,
        receivedAt: email.receivedAt,
      },
      children,
    )

    if (!extracted) continue

    insertAction.run({
      id: newActionItemId(),
      child_id: extracted.childId,
      email_id: row.id,
      type: extracted.type,
      title: extracted.title,
      description: extracted.description,
      source: 'email',
      due_date: extracted.dueDate,
      due_label: extracted.dueLabel,
      urgency: extracted.urgency,
      priority_score: extracted.priorityScore,
      priority_reason: extracted.priorityReason,
      amount: extracted.amount ?? null,
      action_label: extracted.actionLabel,
    })
    itemsCreated++
  }

  return { synced: emails.length, itemsCreated }
}

export function saveConnection(provider: 'gmail' | 'outlook', email: string, tokens: {
  access_token?: string | null
  refresh_token?: string | null
  expires_at?: number | null
}) {
  if (!tokens.access_token) throw new Error('Missing access token')

  const existing = db.prepare('SELECT id FROM connections WHERE provider = ? AND email = ?').get(provider, email) as { id: string } | undefined

  if (existing) {
    db.prepare(`
      UPDATE connections
      SET access_token = ?, refresh_token = COALESCE(?, refresh_token),
          expires_at = ?, updated_at = unixepoch()
      WHERE id = ?
    `).run(tokens.access_token, tokens.refresh_token ?? null, tokens.expires_at ?? null, existing.id)
    return existing.id
  }

  const id = randomUUID()
  db.prepare(`
    INSERT INTO connections (id, provider, email, access_token, refresh_token, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, provider, email, tokens.access_token, tokens.refresh_token ?? null, tokens.expires_at ?? null)

  return id
}
