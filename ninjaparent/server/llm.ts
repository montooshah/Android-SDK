interface BriefItem {
  title: string
  dueLabel: string
  urgency: string
  childName?: string
}

let briefCache: { key: string; text: string; at: number } | null = null
const CACHE_MS = 15 * 60 * 1000

export async function generateDailyBrief(items: BriefItem[]): Promise<string | null> {
  if (items.length === 0) return null

  const key = items.map((i) => `${i.title}:${i.urgency}`).join('|').slice(0, 500)
  if (briefCache && briefCache.key === key && Date.now() - briefCache.at < CACHE_MS) {
    return briefCache.text
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return templateBrief(items)
  }

  try {
    const list = items
      .slice(0, 8)
      .map((i) => `- ${i.childName ? `[${i.childName}] ` : ''}${i.title} (${i.dueLabel}, ${i.urgency})`)
      .join('\n')

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 100,
        messages: [
          {
            role: 'system',
            content:
              'You are NinjaParent, a concise assistant for busy parents. Write exactly 2 short sentences summarizing today\'s school priorities. Be warm, specific, and actionable. No bullet points.',
          },
          {
            role: 'user',
            content: `Today's action items:\n${list}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      console.warn('LLM brief failed:', await res.text())
      return templateBrief(items)
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = json.choices?.[0]?.message?.content?.trim()
    if (!text) return templateBrief(items)

    briefCache = { key, text, at: Date.now() }
    return text
  } catch (err) {
    console.warn('LLM brief error:', err)
    return templateBrief(items)
  }
}

function templateBrief(items: BriefItem[]): string {
  const critical = items.filter((i) => i.urgency === 'critical' || i.urgency === 'high')
  const top = items[0]
  const who = top.childName ? `${top.childName}'s` : "today's"

  if (critical.length > 1) {
    return `${critical.length} things need your attention today. Start with ${who} "${top.title}" — ${top.dueLabel.toLowerCase()}.`
  }

  return `Your top priority is ${who} "${top.title}" (${top.dueLabel.toLowerCase()}). Tackle that first, then work through the rest of the queue.`
}

export function buildEmailUrl(provider: string | null | undefined, messageId: string | null | undefined): string | null {
  if (!messageId) return null
  if (provider === 'gmail') {
    return `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(messageId)}`
  }
  if (provider === 'outlook') {
    return `https://outlook.office.com/mail/inbox/id/${encodeURIComponent(messageId)}`
  }
  return null
}
