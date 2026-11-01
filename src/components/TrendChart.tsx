import { formatDayShort } from '../lib/utils'
import type { Comment } from '../db/types'
import { SCORE_MAX, SCORE_MIN, SCORE_SPAN } from '../domain/scoring'
import { rollingSeries } from '../domain/stats'

const WIDTH = 720
const HEIGHT = 250
const PAD_LEFT = 56
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 28

interface TrendChartProps {
  comments: Comment[]
}

export function TrendChart({ comments }: TrendChartProps) {
  if (comments.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        No comments in this range.
      </div>
    )
  }

  const series = rollingSeries(comments)
  const sorted = [...comments].sort((a, b) => a.occurredAt - b.occurredAt)

  let minAt = sorted[0].occurredAt
  let maxAt = sorted[sorted.length - 1].occurredAt
  if (minAt === maxAt) {
    minAt -= 12 * 60 * 60 * 1000
    maxAt += 12 * 60 * 60 * 1000
  }

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM

  const xFor = (at: number) => PAD_LEFT + ((at - minAt) / (maxAt - minAt)) * plotWidth
  const yFor = (value: number) =>
    PAD_TOP + ((SCORE_MAX - value) / SCORE_SPAN) * plotHeight

  const linePath = (key: 'content' | 'delivery') =>
    series
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(point.at)} ${yFor(point[key])}`)
      .join(' ')

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Average content (solid) and delivery (dashed) over time"
    >
      {[SCORE_MIN, SCORE_MIN / 2, 0, SCORE_MAX / 2, SCORE_MAX].map((tick) => (
        <g key={tick}>
          <line
            x1={PAD_LEFT}
            y1={yFor(tick)}
            x2={WIDTH - PAD_RIGHT}
            y2={yFor(tick)}
            stroke="var(--line)"
            strokeWidth={tick === 0 ? 1.2 : 1}
            strokeDasharray={tick === 0 ? undefined : '3 5'}
          />
          <text
            x={PAD_LEFT - 8}
            y={yFor(tick) + 3}
            textAnchor="end"
            className="fill-[var(--muted)] text-[20px] font-medium sm:text-xs"
          >
            {tick > 0 ? `+${tick}` : tick}
          </text>
        </g>
      ))}

      {sorted.map((comment) => (
        <circle
          key={`raw-${comment.id}`}
          cx={xFor(comment.occurredAt)}
          cy={yFor(comment.content)}
          r={2.2}
          style={{ fill: 'var(--content)' }}
          opacity={0.25}
        />
      ))}
      {sorted.map((comment) => (
        <circle
          key={`raw-d-${comment.id}`}
          cx={xFor(comment.occurredAt)}
          cy={yFor(comment.delivery)}
          r={2.2}
          style={{ fill: 'var(--delivery)' }}
          opacity={0.25}
        />
      ))}

      <path
        d={linePath('content')}
        fill="none"
        style={{ stroke: 'var(--content)' }}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={linePath('delivery')}
        fill="none"
        style={{ stroke: 'var(--delivery)' }}
        strokeWidth={2.4}
        strokeDasharray="6 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <text
        x={PAD_LEFT}
        y={HEIGHT - 8}
        className="fill-[var(--muted)] text-[20px] font-medium sm:text-xs"
      >
        {formatDayShort(minAt)}
      </text>
      <text
        x={WIDTH - PAD_RIGHT}
        y={HEIGHT - 8}
        textAnchor="end"
        className="fill-[var(--muted)] text-[20px] font-medium sm:text-xs"
      >
        {formatDayShort(maxAt)}
      </text>
    </svg>
  )
}
