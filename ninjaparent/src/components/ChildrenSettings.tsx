import { useState } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import type { Child } from '../types'
import { getProfile, saveProfile, type ParentProfile } from '../lib/onboarding'
import { isDemoMode } from '../lib/demoMode'
import { api } from '../api/client'

interface ChildrenSettingsProps {
  children: Child[]
  onSaved: () => void
  showToast: (msg: string) => void
}

export function ChildrenSettings({ children, onSaved, showToast }: ChildrenSettingsProps) {
  const profile = getProfile()
  const initial = profile?.children?.length
    ? profile.children
    : children
        .filter((c) => c.id !== 'unassigned')
        .map((c) => ({ name: c.name, year: c.year, school: c.school }))

  const [kids, setKids] = useState(initial.length ? initial : [{ name: '', year: '', school: '' }])
  const [saving, setSaving] = useState(false)

  const update = (index: number, field: keyof ParentProfile['children'][0], value: string) => {
    setKids((prev) => prev.map((k, i) => (i === index ? { ...k, [field]: value } : k)))
  }

  const add = () => setKids((prev) => [...prev, { name: '', year: '', school: '' }])

  const remove = (index: number) => {
    setKids((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const save = async () => {
    const valid = kids.filter((k) => k.name.trim())
    if (!valid.length) {
      showToast('Add at least one child')
      return
    }

    setSaving(true)
    try {
      const p = profile ?? { name: '', email: '', childCount: valid.length, children: valid }
      saveProfile({ ...p, children: valid, childCount: valid.length })

      if (!isDemoMode()) {
        await api.saveChildren(valid)
      }

      showToast('Children saved')
      onSaved()
    } catch {
      showToast('Could not save — try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card-elevated p-4" data-testid="settings-children">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-brand-600" />
        <h2 className="font-display text-sm font-semibold text-ink">Your children</h2>
      </div>
      <p className="mb-3 text-xs text-ink-muted">
        We match school emails to kids by name, year, and school.
      </p>
      <div className="space-y-3">
        {kids.map((kid, index) => (
          <div key={index} className="rounded-xl bg-canvas p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted">Child {index + 1}</span>
              {kids.length > 1 && (
                <button type="button" onClick={() => remove(index)} className="text-ink-faint active:text-coral">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <input
              type="text"
              value={kid.name}
              onChange={(e) => update(index, 'name', e.target.value)}
              placeholder="Name"
              className="mb-2 w-full rounded-lg border border-black/8 bg-white px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={kid.year}
                onChange={(e) => update(index, 'year', e.target.value)}
                placeholder="Year group"
                className="rounded-lg border border-black/8 bg-white px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={kid.school}
                onChange={(e) => update(index, 'school', e.target.value)}
                placeholder="School"
                className="rounded-lg border border-black/8 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/12 py-2.5 text-sm font-medium text-brand-700"
      >
        <Plus className="h-4 w-4" />
        Add child
      </button>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-3 w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save children'}
      </button>
    </section>
  )
}
