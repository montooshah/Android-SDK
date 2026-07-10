import { google } from 'googleapis'
import { db } from './db.js'
import type { ConnectionRow } from './types.js'

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getGoogleAuthUrl(): string {
  const client = getGoogleOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

export async function exchangeGoogleCode(code: string) {
  const client = getGoogleOAuthClient()
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  const gmail = google.gmail({ version: 'v1', auth: client })
  const profile = await gmail.users.getProfile({ userId: 'me' })
  const email = profile.data.emailAddress
  if (!email) throw new Error('Could not read Gmail profile email')

  return { email, tokens }
}

export function getGmailClient(connection: ConnectionRow) {
  const client = getGoogleOAuthClient()
  client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token ?? undefined,
    expiry_date: connection.expires_at ?? undefined,
  })

  client.on('tokens', (tokens) => {
    if (tokens.access_token) {
      db.prepare(`
        UPDATE connections
        SET access_token = ?, refresh_token = COALESCE(?, refresh_token),
            expires_at = ?, updated_at = unixepoch()
        WHERE id = ?
      `).run(
        tokens.access_token,
        tokens.refresh_token ?? null,
        tokens.expiry_date ?? null,
        connection.id,
      )
    }
  })

  return google.gmail({ version: 'v1', auth: client })
}

export interface FetchedEmail {
  messageId: string
  threadId?: string
  subject: string
  snippet: string
  bodyText: string
  fromAddress: string
  receivedAt: number
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized, 'base64').toString('utf-8')
}

function extractBody(payload: { mimeType?: string | null; body?: { data?: string | null }; parts?: Array<{ mimeType?: string | null; body?: { data?: string | null }; parts?: unknown[] }> } | null | undefined): string {
  if (!payload) return ''

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part as typeof payload)
      if (text) return text
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64Url(part.body.data).replace(/<[^>]+>/g, ' ')
      }
    }
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data).replace(/<[^>]+>/g, ' ')
  }

  return ''
}

export async function fetchGmailMessages(connection: ConnectionRow, maxResults = 40): Promise<FetchedEmail[]> {
  const gmail = getGmailClient(connection)

  const query = [
    'newer_than:30d',
    '(school OR homework OR parentpay OR "parent pay" OR trip OR newsletter OR bulletin OR registration OR permission OR club OR payment OR sims)',
  ].join(' ')

  const list = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  })

  const messages = list.data.messages ?? []
  const results: FetchedEmail[] = []

  for (const msg of messages) {
    if (!msg.id) continue
    const full = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' })
    const headers = full.data.payload?.headers ?? []
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? '(No subject)'
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value ?? ''
    const dateHeader = headers.find((h) => h.name?.toLowerCase() === 'date')?.value
    const receivedAt = dateHeader ? Math.floor(new Date(dateHeader).getTime() / 1000) : Math.floor(Date.now() / 1000)
    const bodyText = extractBody(full.data.payload).replace(/\s+/g, ' ').trim()

    results.push({
      messageId: msg.id,
      threadId: full.data.threadId ?? undefined,
      subject,
      snippet: full.data.snippet ?? '',
      bodyText: bodyText.slice(0, 8000),
      fromAddress: from,
      receivedAt,
    })
  }

  return results
}
