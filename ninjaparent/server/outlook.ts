import { ConfidentialClientApplication } from '@azure/msal-node'
import { Client } from '@microsoft/microsoft-graph-client'
import 'isomorphic-fetch'
import { db } from './db.js'
import type { ConnectionRow } from './types.js'
import type { FetchedEmail } from './gmail.js'

const SCOPES = ['Mail.Read', 'User.Read', 'offline_access']

function getMsalClient(tokenCache?: string) {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common'

  if (!clientId || !clientSecret) {
    throw new Error('MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET are required')
  }

  const msal = new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`,
    },
  })

  if (tokenCache) {
    msal.getTokenCache().deserialize(tokenCache)
  }

  return msal
}

export async function getMicrosoftAuthUrl(state: string): Promise<string> {
  const msal = getMsalClient()
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/microsoft/callback'
  return msal.getAuthCodeUrl({
    scopes: SCOPES,
    redirectUri,
    prompt: 'consent',
    state,
  })
}

export async function exchangeMicrosoftCode(code: string) {
  const msal = getMsalClient()
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/api/auth/microsoft/callback'

  const result = await msal.acquireTokenByCode({
    code,
    scopes: SCOPES,
    redirectUri,
  })

  if (!result?.accessToken) throw new Error('Microsoft token exchange failed')

  const client = Client.init({
    authProvider: (done) => done(null, result.accessToken),
  })

  const profile = await client.api('/me').select('mail,userPrincipalName').get()
  const email = profile.mail || profile.userPrincipalName
  if (!email) throw new Error('Could not read Outlook profile email')

  const tokenCache = msal.getTokenCache().serialize()

  return {
    email,
    tokens: {
      access_token: result.accessToken,
      refresh_token: tokenCache,
      expires_at: result.expiresOn ? result.expiresOn.getTime() : null,
    },
  }
}

async function getOutlookAccessToken(connection: ConnectionRow): Promise<string> {
  const expiresAt = connection.expires_at ?? 0
  if (expiresAt > Date.now() + 60_000) {
    return connection.access_token
  }

  if (!connection.refresh_token) {
    return connection.access_token
  }

  const msal = getMsalClient(connection.refresh_token)
  const accounts = await msal.getTokenCache().getAllAccounts()

  if (accounts.length === 0) {
    throw new Error('No Microsoft account in token cache — reconnect Outlook')
  }

  const result = await msal.acquireTokenSilent({
    scopes: SCOPES,
    account: accounts[0],
  })

  if (!result?.accessToken) throw new Error('Failed to refresh Outlook token')

  const tokenCache = msal.getTokenCache().serialize()

  db.prepare(`
    UPDATE connections
    SET access_token = ?, refresh_token = ?,
        expires_at = ?, updated_at = unixepoch()
    WHERE id = ?
  `).run(
    result.accessToken,
    tokenCache,
    result.expiresOn ? result.expiresOn.getTime() : null,
    connection.id,
  )

  return result.accessToken
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchOutlookMessages(connection: ConnectionRow, maxResults = 40): Promise<FetchedEmail[]> {
  const accessToken = await getOutlookAccessToken(connection)
  const client = Client.init({
    authProvider: (done) => done(null, accessToken),
  })

  const filter = "receivedDateTime ge " + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const response = await client
    .api('/me/messages')
    .filter(filter)
    .top(maxResults)
    .select('id,subject,bodyPreview,body,from,receivedDateTime')
    .orderby('receivedDateTime DESC')
    .get()

  const messages = response.value ?? []
  const results: FetchedEmail[] = []

  for (const msg of messages) {
    const bodyText = msg.body?.contentType === 'html'
      ? stripHtml(msg.body?.content ?? '')
      : (msg.body?.content ?? msg.bodyPreview ?? '')

    results.push({
      messageId: msg.id,
      subject: msg.subject ?? '(No subject)',
      snippet: msg.bodyPreview ?? '',
      bodyText: bodyText.slice(0, 8000),
      fromAddress: msg.from?.emailAddress?.address ?? '',
      receivedAt: msg.receivedDateTime
        ? Math.floor(new Date(msg.receivedDateTime).getTime() / 1000)
        : Math.floor(Date.now() / 1000),
    })
  }

  return results
}
