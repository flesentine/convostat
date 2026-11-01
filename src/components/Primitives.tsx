import type { ReactNode } from 'react'
import { QUADRANTS } from '../domain/scoring'
import type { Quadrant } from '../db/types'
import { cn } from '../lib/utils'

export function QuadrantBadge({
  quadrant,
  size = 'md',
  className,
}: {
  quadrant: Quadrant
  size?: 'sm' | 'md'
  className?: string
}) {
  const meta = QUADRANTS[quadrant]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2/70 font-medium text-ink-soft',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: meta.color }}
      />
      {meta.short}
    </span>
  )
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2 shrink-0 rounded-full', className)}
      style={{ background: color }}
    />
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-body leading-relaxed text-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
