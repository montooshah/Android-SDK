import type { Child } from '../types'

interface ChildBadgeProps {
  child: Child
  size?: 'sm' | 'md'
}

export function ChildBadge({ child, size = 'sm' }: ChildBadgeProps) {
  const sizeClasses = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm'

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
        style={{ backgroundColor: child.color }}
      >
        {child.avatar}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{child.name}</p>
        {size === 'md' && (
          <p className="truncate text-xs text-slate-500">
            {child.year} · {child.school}
          </p>
        )}
      </div>
    </div>
  )
}
