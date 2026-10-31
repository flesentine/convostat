import { useRef, useState } from 'react'
import {
  QUADRANTS,
  SCORE_MAX,
  SCORE_MIN,
  SCORE_SPAN,
  clamp,
  quadrantOf,
} from '../domain/scoring'
import { cn } from '../lib/utils'

const SIZE = 240
const OFFSET = 20
const PLOT = SIZE - OFFSET * 2

interface QuadrantPadProps {
  content: number
  delivery: number
  onChange?: (content: number, delivery: number) => void
  className?: string
}

export function QuadrantPad({
  content,
  delivery,
  onChange,
  className,
}: QuadrantPadProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const [active, setActive] = useState(false)
  const quadrant = quadrantOf(content, delivery)
  const interactive = Boolean(onChange)

  const toScores = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const vbX = ((clientX - rect.left) / rect.width) * SIZE
    const vbY = ((clientY - rect.top) / rect.height) * SIZE
    const nx = clamp((vbX - OFFSET) / PLOT, 0, 1)
    const ny = clamp((vbY - OFFSET) / PLOT, 0, 1)
    return {
      content: Math.round(nx * SCORE_SPAN) + SCORE_MIN,
      delivery: SCORE_MAX - Math.round(ny * SCORE_SPAN),
    }
  }

  const update = (clientX: number, clientY: number) => {
    if (!onChange) return
    const next = toScores(clientX, clientY)
    if (!next) return
    onChange(next.content, next.delivery)
  }

  const dotX = OFFSET + ((content - SCORE_MIN) / SCORE_SPAN) * PLOT
  const dotY = OFFSET + ((SCORE_MAX - delivery) / SCORE_SPAN) * PLOT

  const half = PLOT / 2
  const quadRects = [
    { key: 'honest' as const, x: OFFSET, y: OFFSET },
    { key: 'warm' as const, x: OFFSET + half, y: OFFSET },
    { key: 'hostile' as const, x: OFFSET, y: OFFSET + half },
    { key: 'backhanded' as const, x: OFFSET + half, y: OFFSET + half },
  ]

  const cornerLabels = [
    { key: 'honest' as const, x: OFFSET + 8, y: OFFSET + 13, anchor: 'start' as const },
    {
      key: 'warm' as const,
      x: OFFSET + PLOT - 8,
      y: OFFSET + 13,
      anchor: 'end' as const,
    },
    {
      key: 'hostile' as const,
      x: OFFSET + 8,
      y: OFFSET + PLOT - 9,
      anchor: 'start' as const,
    },
    {
      key: 'backhanded' as const,
      x: OFFSET + PLOT - 8,
      y: OFFSET + PLOT - 9,
      anchor: 'end' as const,
    },
  ]

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn(
        'block h-auto w-full touch-none select-none',
        interactive && 'cursor-crosshair',
        className,
      )}
      role={interactive ? 'application' : 'img'}
      aria-label={
        interactive
          ? `Rating pad. Content ${content}, delivery ${delivery}. Drag or use arrow keys; hold shift for steps of 10.`
          : `${QUADRANTS[quadrant].label}: content ${content}, delivery ${delivery}`
      }
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              const map: Record<string, [number, number]> = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, 1],
                ArrowDown: [0, -1],
              }
              const delta = map[event.key]
              if (!delta) {
                if (event.key === '0' || event.key === 'Home') {
                  event.preventDefault()
                  onChange?.(0, 0)
                }
                return
              }
              event.preventDefault()
              const step = event.shiftKey ? 10 : 1
              onChange?.(
                clamp(content + delta[0] * step, SCORE_MIN, SCORE_MAX),
                clamp(delivery + delta[1] * step, SCORE_MIN, SCORE_MAX),
              )
            }
          : undefined
      }
      onPointerDown={
        interactive
          ? (event) => {
              dragging.current = true
              setActive(true)
              try {
                event.currentTarget.setPointerCapture(event.pointerId)
              } catch {
                /* synthetic or already-released pointer */
              }
              update(event.clientX, event.clientY)
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (event) => {
              if (!dragging.current) return
              update(event.clientX, event.clientY)
            }
          : undefined
      }
      onPointerUp={
        interactive
          ? (event) => {
              dragging.current = false
              setActive(false)
              try {
                event.currentTarget.releasePointerCapture(event.pointerId)
              } catch {
                /* pointer capture was never acquired */
              }
            }
          : undefined
      }
      onPointerCancel={
        interactive
          ? () => {
              dragging.current = false
              setActive(false)
            }
          : undefined
      }
      onFocus={interactive ? () => setActive(true) : undefined}
      onBlur={interactive ? () => setActive(false) : undefined}
    >
      <rect
        x={OFFSET}
        y={OFFSET}
        width={PLOT}
        height={PLOT}
        rx={14}
        fill="var(--surface-2)"
        stroke={active ? 'var(--accent)' : 'var(--line)'}
        strokeWidth={active ? 1.5 : 1}
      />

      {quadRects.map((quad) => (
        <rect
          key={quad.key}
          x={quad.x}
          y={quad.y}
          width={half}
          height={half}
          rx={8}
          style={{ fill: QUADRANTS[quad.key].color }}
          opacity={quadrant === quad.key ? 0.18 : 0.08}
        />
      ))}

      <line
        x1={OFFSET + half}
        y1={OFFSET + 6}
        x2={OFFSET + half}
        y2={OFFSET + PLOT - 6}
        stroke="var(--line-strong)"
        strokeWidth={1}
      />
      <line
        x1={OFFSET + 6}
        y1={OFFSET + half}
        x2={OFFSET + PLOT - 6}
        y2={OFFSET + half}
        stroke="var(--line-strong)"
        strokeWidth={1}
      />

      {cornerLabels.map((label) => (
        <text
          key={label.key}
          x={label.x}
          y={label.y}
          textAnchor={label.anchor}
          className="fill-[var(--muted)] text-[9px] font-medium uppercase tracking-[0.1em]"
        >
          {QUADRANTS[label.key].short}
        </text>
      ))}

      <text
        x={SIZE / 2}
        y={14}
        textAnchor="middle"
        className="fill-[var(--muted)] text-[8px] tracking-[0.16em]"
      >
        KIND
      </text>
      <text
        x={SIZE / 2}
        y={SIZE - 4}
        textAnchor="middle"
        className="fill-[var(--muted)] text-[8px] tracking-[0.16em]"
      >
        HARSH
      </text>
      <text
        x={10}
        y={SIZE / 2}
        textAnchor="middle"
        transform={`rotate(-90 10 ${SIZE / 2})`}
        className="fill-[var(--muted)] text-[8px] tracking-[0.16em]"
      >
        NEGATIVE
      </text>
      <text
        x={SIZE - 10}
        y={SIZE / 2}
        textAnchor="middle"
        transform={`rotate(90 ${SIZE - 10} ${SIZE / 2})`}
        className="fill-[var(--muted)] text-[8px] tracking-[0.16em]"
      >
        POSITIVE
      </text>

      <circle
        cx={dotX}
        cy={dotY}
        r={12}
        style={{ fill: QUADRANTS[quadrant].color }}
        opacity={0.18}
      />
      <circle
        cx={dotX}
        cy={dotY}
        r={7}
        style={{ fill: QUADRANTS[quadrant].color }}
        stroke="var(--surface)"
        strokeWidth={2.5}
      />
    </svg>
  )
}
