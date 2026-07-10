import type { Child } from '../../types'

interface ChildChipsProps {
  children: Child[]
  selected: string | null
  onSelect: (id: string | null) => void
}

export function ChildChips({ children, selected, onSelect }: ChildChipsProps) {
  return (
    <div className="chip-scroll flex gap-2 overflow-x-auto px-5 pb-1" data-testid="child-chips">
      <button
        type="button"
        data-testid="filter-all-kids"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
          selected === null
            ? 'bg-ink text-white shadow-md'
            : 'bg-white text-ink-muted ring-1 ring-black/6'
        }`}
      >
        All
      </button>
      {children.filter((c) => c.id !== 'unassigned').map((child) => (
        <button
          key={child.id}
          type="button"
          data-testid={`filter-child-${child.id}`}
          onClick={() => onSelect(child.id)}
          className={`flex shrink-0 items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm font-medium transition-all ${
            selected === child.id
              ? 'bg-ink text-white shadow-md'
              : 'bg-white text-ink-muted ring-1 ring-black/6'
          }`}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: selected === child.id ? 'rgba(255,255,255,0.25)' : child.color }}
          >
            {child.avatar}
          </span>
          {child.name}
        </button>
      ))}
    </div>
  )
}
