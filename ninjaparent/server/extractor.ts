import { randomUUID } from 'crypto'
import type { ChildRow } from './types.js'

export type ItemType =
  | 'payment'
  | 'registration'
  | 'homework'
  | 'deadline_missed'
  | 'event'
  | 'club_interest'
  | 'trip'
  | 'newsletter'

export type Urgency = 'critical' | 'high' | 'medium' | 'low'

interface ExtractInput {
  subject: string
  snippet: string
  bodyText: string
  receivedAt: number
}

interface ExtractedItem {
  type: ItemType
  title: string
  description: string
  dueDate: string | null
  dueLabel: string
  urgency: Urgency
  priorityScore: number
  priorityReason: string
  amount?: string
  actionLabel: string
  childId: string | null
}

const TYPE_RULES: Array<{
  type: ItemType
  patterns: RegExp[]
  actionLabel: string
  baseScore: number
  reason: string
}> = [
  { type: 'payment', patterns: [/parent\s*pay/i, /payment due/i, /£\d+/i, /\bpay\b/i, /top.?up/i, /deposit/i], actionLabel: 'Pay now', baseScore: 85, reason: 'Payment-related email detected' },
  { type: 'deadline_missed', patterns: [/overdue/i, /missed deadline/i, /not submitted/i, /reminder.*homework/i], actionLabel: 'Mark done', baseScore: 90, reason: 'Overdue or missed deadline mentioned' },
  { type: 'homework', patterns: [/homework/i, /assignment/i, /spellings/i, /times tables/i, /worksheet/i, /reading log/i], actionLabel: 'View homework', baseScore: 75, reason: 'Homework or assignment detected' },
  { type: 'registration', patterns: [/register(?:ation)?/i, /sign\s*up/i, /book\s*(?:a\s*)?slot/i, /booking/i, /closes?\s+(?:on|friday|monday)/i], actionLabel: 'Register', baseScore: 80, reason: 'Registration or booking required' },
  { type: 'trip', patterns: [/school trip/i, /permission slip/i, /consent form/i, /visit/i, /excursion/i], actionLabel: 'Sign form', baseScore: 78, reason: 'Trip or permission form detected' },
  { type: 'club_interest', patterns: [/after.?school club/i, /coding club/i, /sports camp/i, /expression of interest/i], actionLabel: 'Express interest', baseScore: 60, reason: 'Club or activity interest' },
  { type: 'event', patterns: [/parents['']?\s*evening/i, /sports day/i, /open day/i, /assembly/i, /concert/i], actionLabel: 'View event', baseScore: 65, reason: 'School event mentioned' },
  { type: 'newsletter', patterns: [/newsletter/i, /weekly bulletin/i, /this week at/i, /school update/i], actionLabel: 'Read summary', baseScore: 35, reason: 'Newsletter or bulletin — review when time allows' },
]

function parseDueDate(text: string, receivedAt: number): { dueDate: string | null; dueLabel: string; urgencyBoost: number } {
  const now = new Date()
  const lower = text.toLowerCase()

  if (/due tomorrow|by tomorrow/i.test(lower)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return { dueDate: d.toISOString().slice(0, 10), dueLabel: 'Due tomorrow', urgencyBoost: 20 }
  }

  if (/due today|by today|closes today/i.test(lower)) {
    return { dueDate: now.toISOString().slice(0, 10), dueLabel: 'Due today', urgencyBoost: 25 }
  }

  if (/overdue|missed/i.test(lower)) {
    const d = new Date(receivedAt * 1000)
    return { dueDate: d.toISOString().slice(0, 10), dueLabel: 'Overdue', urgencyBoost: 22 }
  }

  const dayMatch = lower.match(/(?:due|by|before|closes?)\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)
  if (dayMatch) {
    return { dueDate: null, dueLabel: `Due ${dayMatch[1]}`, urgencyBoost: 12 }
  }

  const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (dateMatch) {
    const [, a, b, c] = dateMatch
    const year = c.length === 2 ? `20${c}` : c
    const dueDate = `${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`
    return { dueDate, dueLabel: `Due ${a}/${b}`, urgencyBoost: 10 }
  }

  if (/this week|end of week|by friday/i.test(lower)) {
    return { dueDate: null, dueLabel: 'Due this week', urgencyBoost: 8 }
  }

  return { dueDate: null, dueLabel: 'Review soon', urgencyBoost: 0 }
}

function parseAmount(text: string): string | undefined {
  const match = text.match(/£\s?(\d+(?:\.\d{2})?)/i)
  return match ? `£${match[1]}` : undefined
}

function matchChild(text: string, children: ChildRow[]): string | null {
  const lower = text.toLowerCase()
  let best: { id: string; score: number } | null = null

  for (const child of children) {
    let score = 0
    if (lower.includes(child.name.toLowerCase())) score += 3
    const keywords: string[] = JSON.parse(child.keywords || '[]')
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) score += 1
    }
    if (child.year && lower.includes(child.year.toLowerCase())) score += 2
    if (child.school && lower.includes(child.school.toLowerCase())) score += 2

    if (score > 0 && (!best || score > best.score)) {
      best = { id: child.id, score }
    }
  }

  return best && best.score >= 2 ? best.id : null
}

function scoreToUrgency(score: number): Urgency {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

export function extractActionItem(input: ExtractInput, children: ChildRow[]): ExtractedItem | null {
  const combined = `${input.subject}\n${input.snippet}\n${input.bodyText}`
  const lower = combined.toLowerCase()

  // Skip obvious non-school noise
  if (/unsubscribe|marketing|promotional/i.test(lower) && !/school|parent|homework/i.test(lower)) {
    return null
  }

  let matchedRule = TYPE_RULES.find((rule) => rule.patterns.some((p) => p.test(combined)))
  if (!matchedRule) {
    // Generic school email fallback
    if (!/school|academy|primary|college|parent|pta|governor/i.test(lower)) {
      return null
    }
    matchedRule = {
      type: 'newsletter',
      patterns: [],
      actionLabel: 'Read email',
      baseScore: 30,
      reason: 'School-related email — review for actions',
    }
  }

  const { dueDate, dueLabel, urgencyBoost } = parseDueDate(combined, input.receivedAt)
  const amount = matchedRule.type === 'payment' ? parseAmount(combined) : undefined
  const childId = matchChild(combined, children)

  let priorityScore = matchedRule.baseScore + urgencyBoost
  if (childId) priorityScore += 5
  if (amount) priorityScore += 5
  priorityScore = Math.min(99, priorityScore)

  const urgency = scoreToUrgency(priorityScore)
  let priorityReason = matchedRule.reason
  if (dueLabel === 'Due tomorrow' || dueLabel === 'Due today') {
    priorityReason = `${dueLabel} · ${matchedRule.reason}`
  }
  if (childId) {
    const child = children.find((c) => c.id === childId)
    if (child) priorityReason += ` · matched to ${child.name}`
  }

  return {
    type: matchedRule.type,
    title: input.subject.slice(0, 120),
    description: (input.snippet || input.bodyText).slice(0, 280),
    dueDate,
    dueLabel,
    urgency,
    priorityScore,
    priorityReason,
    amount,
    actionLabel: matchedRule.actionLabel,
    childId,
  }
}

export function newActionItemId(): string {
  return randomUUID()
}
