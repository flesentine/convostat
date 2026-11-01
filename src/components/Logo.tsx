import { cn } from '../lib/utils'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative grid size-8 shrink-0 grid-cols-2 gap-[3px] rounded-[9px] bg-[#1f4f42] p-[5px] shadow-sm">
        <span className="rounded-[2px] bg-[#79b9d6]" />
        <span className="rounded-[2px] bg-[#7fd0a8]" />
        <span className="rounded-[2px] bg-[#e0776a]" />
        <span className="rounded-[2px] bg-[#e6b566]" />
      </span>
      <span
        className={cn(
          'text-[0.9375rem] font-semibold tracking-[-0.02em] text-ink',
          compact && 'text-sm',
        )}
      >
        convostat
      </span>
    </span>
  )
}
