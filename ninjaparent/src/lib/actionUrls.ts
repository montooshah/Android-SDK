import type { ActionItem } from '../types'

const SOURCE_URLS: Record<string, string> = {
  parentpay: 'https://www.parentpay.com',
  spider: 'https://www.spidercomms.co.uk',
  sims: 'https://www.sims-parent.co.uk',
  email: 'https://mail.google.com',
  calendar: 'https://calendar.google.com',
}

export function getActionUrl(item: ActionItem): string | null {
  if (item.actionUrl) return item.actionUrl
  return SOURCE_URLS[item.source] ?? null
}
