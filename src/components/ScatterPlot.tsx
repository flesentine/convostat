import { QUADRANTS, quadrantOf } from '../domain/scoring'
import type { Comment } from '../db/types'
import { jitter } from '../lib/utils'

const SIZE = 360
const PAD = 38
const PLOT = SIZE - PAD * 2
const HALF = PLOT / 2

interface ScatterPlotProps {
  comments: Comment[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function ScatterPlot({ comments, selectedId, onSelect }: ScatterPlotProps) {
  const xFor = (content: number) => PAD + ((content + 2) / 4) * PLOT
  const yFor = (delivery: number) => PAD + ((2 - delivery) / 4) * PLOT

  const quadrants = [
    { key: 'honest' as const, x: PAD, y: PAD },
    { key: 'warm' as const, x: PAD + HALF, y: PAD },
    { key: 'hostile' as const, x: PAD, y: PAD + HALF },
    { key: 'backhanded' as const, x: PAD + HALF, y: PAD + HALF },
  ]

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Scatter plot of comments by content and delivery"
      onClick={() => onSelect(null)}
    >
      <rect
        x={PAD}
        y={PAD}
        width={PLOT}
        height={PLOT}
        rx={14}
        fill="var(--surface-2)"
        stroke="var(--line)"
      />

      {quadrants.map((quad) => (
        <rect
          key={quad.key}
          x={quad.x}
          y={quad.y}
          width={HALF}
          height={HALF}
          rx={10}
          style={{ fill: QUADRANTS[quad.key].color }}
          opacity={0.08}
        />
      ))}

      <text
        x={PAD + 9}
        y={PAD + 15}
        textAnchor="start"
        className="fill-[var(--muted)] text-[10px] font-medium uppercase tracking-[0.12em]"
      >
        Caring
      </text>
      <text
        x={PAD + PLOT - 9}
        y={PAD + 15}
        textAnchor="end"
        className="fill-[var(--muted)] text-[10px] font-medium uppercase tracking-[0.12em]"
      >
        Warm
      </text>
      <text
        x={PAD + 9}
        y={PAD + PLOT - 10}
        textAnchor="start"
        className="fill-[var(--muted)] text-[10px] font-medium uppercase tracking-[0.12em]"
      >
        Hostile
      </text>
      <text
        x={PAD + PLOT - 9}
        y={PAD + PLOT - 10}
        textAnchor="end"
        className="fill-[var(--muted)] text-[10px] font-medium uppercase tracking-[0.12em]"
      >
        Backhanded
      </text>

      {[-1, 0, 1].map((tick) => (
        <g key={tick}>
          <line
            x1={xFor(tick)}
            y1={PAD + 4}
            x2={xFor(tick)}
            y2={PAD + PLOT - 4}
            stroke="var(--line-strong)"
            strokeWidth={tick === 0 ? 1.2 : 1}
            strokeDasharray={tick === 0 ? undefined : '3 4'}
          />
          <line
            x1={PAD + 4}
            y1={yFor(tick)}
            x2={PAD + PLOT - 4}
            y2={yFor(tick)}
            stroke="var(--line-strong)"
            strokeWidth={tick === 0 ? 1.2 : 1}
            strokeDasharray={tick === 0 ? undefined : '3 4'}
          />
        </g>
      ))}

      <text
        x={SIZE / 2}
        y={15}
        textAnchor="middle"
        className="fill-[var(--muted)] text-[9px] tracking-[0.16em]"
      >
        KIND
      </text>
      <text
        x={SIZE / 2}
        y={SIZE - 5}
        textAnchor="middle"
        className="fill-[var(--muted)] text-[9px] tracking-[0.16em]"
      >
        HARSH
      </text>
      <text
        x={11}
        y={SIZE / 2}
        textAnchor="middle"
        transform={`rotate(-90 11 ${SIZE / 2})`}
        className="fill-[var(--muted)] text-[9px] tracking-[0.16em]"
      >
        NEGATIVE
      </text>
      <text
        x={SIZE - 11}
        y={SIZE / 2}
        textAnchor="middle"
        transform={`rotate(90 ${SIZE - 11} ${SIZE / 2})`}
        className="fill-[var(--muted)] text-[9px] tracking-[0.16em]"
      >
        POSITIVE
      </text>

      {comments.map((comment) => {
        const quadrant = quadrantOf(comment.content, comment.delivery)
        const radius = 4.5 + (comment.intensity ?? 2) * 1.15
        const cx = xFor(comment.content) + jitter(comment.id, 3.4)
        const cy = yFor(comment.delivery) + jitter(`${comment.id}y`, 3.4)
        const selected = selectedId === comment.id

        return (
          <g key={comment.id}>
            {selected ? (
              <circle
                cx={cx}
                cy={cy}
                r={radius + 5}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={1.4}
                opacity={0.55}
              />
            ) : null}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              style={{ fill: QUADRANTS[quadrant].color }}
              stroke={selected ? 'var(--ink)' : 'var(--surface)'}
              strokeWidth={selected ? 2 : 1.5}
              opacity={0.9}
              className="cursor-pointer"
              onClick={(event) => {
                event.stopPropagation()
                onSelect(selected ? null : comment.id)
              }}
            >
              <title>{comment.text ?? QUADRANTS[quadrant].label}</title>
            </circle>
          </g>
        )
      })}
    </svg>
  )
}
