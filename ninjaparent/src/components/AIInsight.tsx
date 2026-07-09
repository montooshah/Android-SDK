import { Sparkles } from 'lucide-react'

interface AIInsightProps {
  brief?: string | null
  llmEnabled?: boolean
}

export function AIInsight({ brief, llmEnabled }: AIInsightProps) {
  if (!brief) return null

  return (
    <div
      data-testid="ai-insight"
      className="mx-5 rounded-2xl bg-brand-700 px-4 py-3.5 text-white shadow-lg shadow-brand-700/25"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-brand-200" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-200">
          {llmEnabled ? 'AI daily brief' : 'Today\'s priorities'}
        </p>
      </div>
      <p className="mt-1.5 text-sm font-medium leading-relaxed text-white/95">{brief}</p>
    </div>
  )
}
