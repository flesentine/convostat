import type { Comment } from '../db/types'
import { SCORE_MAX, SCORE_SPAN } from '../domain/scoring'

interface SparklineProps {
  comments: Comment[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({
  comments,
  color = 'var(--accent)',
  width = 96,
  height = 28,
}: SparklineProps) {
  const sorted = [...comments]
    .sort((a, b) => a.occurredAt - b.occurredAt)
    .slice(-12)

  if (sorted.length === 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden>
        <line
          x1={2}
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke="var(--line-strong)"
          strokeDasharray="3 4"
        />
      </svg>
    )
  }

  const pad = 4
  const xFor = (index: number) =>
    pad + (sorted.length === 1 ? (width - pad * 2) / 2 : (index / (sorted.length - 1)) * (width - pad * 2))
  const yFor = (value: number) =>
    pad + ((SCORE_MAX - value) / SCORE_SPAN) * (height - pad * 2)

  const points = sorted
    .map((comment, index) => `${xFor(index)},${yFor(comment.delivery)}`)
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden
      className="overflow-visible"
    >
      <line
        x1={pad}
        y1={yFor(0)}
        x2={width - pad}
        y2={yFor(0)}
        stroke="var(--line-strong)"
        strokeDasharray="3 4"
        opacity={0.7}
      />
      <polyline
        points={points}
        fill="none"
        style={{ stroke: color }}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {sorted.map((comment, index) => (
        <circle
          key={comment.id}
          cx={xFor(index)}
          cy={yFor(comment.delivery)}
          r={1.8}
          style={{ fill: color }}
        />
      ))}
    </svg>
  )
}
