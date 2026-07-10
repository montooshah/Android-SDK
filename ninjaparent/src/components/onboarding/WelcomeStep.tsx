import { useState } from 'react'
import { ArrowRight, Mail, Shield, Sparkles, Users } from 'lucide-react'

interface WelcomeStepProps {
  initialName?: string
  initialEmail?: string
  onNext: (name: string, email: string) => void
}

export function WelcomeStep({ initialName = '', initialEmail = '', onNext }: WelcomeStepProps) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }
    onNext(name.trim(), email.trim())
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/30">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 18V8l8-4 8 4v10l-8 4-8-4z" />
            <path d="M12 4v16M4 8l8 4 8-4" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Welcome to NinjaParent</h1>
        <p className="mt-2 text-base leading-relaxed text-ink-muted">
          School life, unified. One place for homework, payments, trips, and everything your kids&apos; schools send.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: Mail, label: 'All emails in one place' },
          { icon: Sparkles, label: 'AI priority ranking' },
          { icon: Users, label: 'Filter by child' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="rounded-xl bg-white/80 p-3 text-center ring-1 ring-slate-200/80">
            <Icon className="mx-auto h-5 w-5 text-brand-600" />
            <p className="mt-1.5 text-[11px] font-medium leading-tight text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="space-y-4">
          <div>
            <label htmlFor="parent-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Your name
            </label>
            <input
              id="parent-name"
              data-testid="onboarding-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              autoComplete="name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none ring-brand-500 focus:border-brand-500 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="parent-email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="parent-email"
              data-testid="onboarding-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none ring-brand-500 focus:border-brand-500 focus:ring-2"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          We only read school-related emails. Your data stays private and is never sold.
        </p>

        <div className="mt-auto pt-8 onboarding-safe-bottom">
          <button
            type="submit"
            data-testid="onboarding-next-welcome"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 py-4 text-base font-semibold text-white shadow-lg shadow-brand-700/25 active:scale-[0.98]"
          >
            Get started
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
