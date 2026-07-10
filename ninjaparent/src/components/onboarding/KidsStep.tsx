import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react'
import { DEFAULT_CHILDREN } from '../../lib/onboarding'

interface ChildForm {
  name: string
  year: string
  school: string
}

interface KidsStepProps {
  initialChildren?: ChildForm[]
  onBack: () => void
  onNext: (children: ChildForm[]) => void
}

const COLORS = ['#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B']

export function KidsStep({ initialChildren, onBack, onNext }: KidsStepProps) {
  const [children, setChildren] = useState<ChildForm[]>(
    initialChildren?.length
      ? initialChildren
      : DEFAULT_CHILDREN.slice(0, 2).map((c) => ({ ...c })),
  )

  const updateChild = (index: number, field: keyof ChildForm, value: string) => {
    setChildren((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  const addChild = () => {
    if (children.length >= 4) return
    setChildren((prev) => [...prev, { name: '', year: '', school: '' }])
  }

  const removeChild = (index: number) => {
    if (children.length <= 1) return
    setChildren((prev) => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    const valid = children.filter((c) => c.name.trim())
    if (valid.length === 0) return
    onNext(valid)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-slate-900">Your children</h2>
        <p className="mt-1 text-sm text-slate-600">
          We&apos;ll match school emails to the right child automatically.
        </p>
      </div>

      <div className="space-y-4 overflow-y-auto">
        {children.map((child, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            style={{ borderLeftWidth: 4, borderLeftColor: COLORS[index % COLORS.length] }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Child {index + 1}</span>
              {children.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeChild(index)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label="Remove child"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <input
                data-testid={`child-name-${index}`}
                type="text"
                value={child.name}
                onChange={(e) => updateChild(index, 'name', e.target.value)}
                placeholder="Name"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={child.year}
                  onChange={(e) => updateChild(index, 'year', e.target.value)}
                  placeholder="Year 4"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <input
                  type="text"
                  value={child.school}
                  onChange={(e) => updateChild(index, 'school', e.target.value)}
                  placeholder="School name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>
        ))}

        {children.length < 4 && (
          <button
            type="button"
            onClick={addChild}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3.5 text-sm font-medium text-slate-600 active:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Add another child
          </button>
        )}
      </div>

      <div className="mt-6 flex gap-3 onboarding-safe-bottom">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 active:bg-slate-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          data-testid="onboarding-next-kids"
          onClick={handleNext}
          disabled={!children.some((c) => c.name.trim())}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 disabled:opacity-50 active:scale-[0.98]"
        >
          Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
