import { Sparkles } from 'lucide-react'

export function AIInsight() {
  return (
    <div
      data-testid="ai-insight"
      className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-brand-900">AI Priority Insight</p>
          <p className="text-xs text-brand-600">Updated 2 minutes ago</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">
        <strong className="text-slate-900">Busy afternoon ahead.</strong> Noah&apos;s trip payment
        is your #1 priority — deadline tomorrow and he can&apos;t attend without it. Lily&apos;s
        coding club closes Friday with limited places. Consider batching both Parent Pay items
        together to save time.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
          3 critical items today
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
          Est. 12 min to clear queue
        </span>
      </div>
    </div>
  )
}
