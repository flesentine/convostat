import type { CSSProperties } from 'react'
import { cn } from '../lib/utils'

interface RatingSliderProps {
  label: string
  hint?: string
  value: number
  onChange: (value: number) => void
  labels: string[]
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
  const min = -2
  const max = 2
  const percent = ((value - min) / (max - min)) * 100
  const style = {
    '--pct': `${percent}%`,
    '--slider-color': color,
  } as CSSProperties

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {label}
          </span>
          {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
        </div>
        <span className="text-sm font-semibold" style={{ color }}>
          {labels[value + 2]}
        </span>
      </div>

      <input
        type="range"
        className="rating-slider mt-3"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={style}
        aria-label={`${label}: ${labels[value + 2]}`}
        aria-valuetext={labels[value + 2]}
      />

      <div className="mt-2 grid grid-cols-5 gap-1">
        {labels.map((entry, index) => (
          <span
            key={entry}
            className={cn(
              'text-center text-[10px] leading-tight',
              index === value + 2 ? 'font-semibold text-ink' : 'text-muted',
            )}
          >
            {entry}
          </span>
        ))}
      </div>
    </div>
  )
}
