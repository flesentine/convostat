import type { CSSProperties } from 'react'
import {
  SCORE_MAX,
  SCORE_MIN,
  formatSigned,
  labelIndex,
  scoreLabel,
} from '../domain/scoring'
import { cn } from '../lib/utils'

interface RatingSliderProps {
  label: string
  hint?: string
  value: number
  onChange: (value: number) => void
  labels: readonly string[]
  color: string
}

export function RatingSlider({
  label,
  hint,
  value,
  onChange,
  labels,
  color,
}: RatingSliderProps) {
  const percent = ((value - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * 100
  const style = {
    '--pct': `${percent}%`,
    '--slider-color': color,
  } as CSSProperties
  const activeLabel = labelIndex(value)
  const descriptor = scoreLabel(value, labels)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {label}
          </span>
          {hint ? <span className="text-xs text-muted sm:text-xs">{hint}</span> : null}
        </div>
        <span className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold" style={{ color }}>
            {descriptor}
          </span>
          <span className="text-xs font-medium tabular-nums text-muted">
            {formatSigned(value, 0)}
          </span>
        </span>
      </div>

      <input
        type="range"
        className="rating-slider mt-3"
        min={SCORE_MIN}
        max={SCORE_MAX}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={style}
        aria-label={label}
        aria-valuetext={`${descriptor}, ${formatSigned(value, 0)}`}
      />

      <div className="mt-2 grid grid-cols-5 gap-1">
        {labels.map((entry, index) => (
          <span
            key={entry}
            className={cn(
              'text-center text-xs leading-tight sm:text-2xs',
              index === activeLabel ? 'font-semibold text-ink' : 'text-muted',
            )}
          >
            {entry}
          </span>
        ))}
      </div>
    </div>
  )
}
