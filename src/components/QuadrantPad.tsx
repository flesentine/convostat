import { useRef, useState } from 'react'
import { QUADRANTS, clamp, quadrantOf } from '../domain/scoring'
import { cn } from '../lib/utils'

const SIZE = 240
const OFFSET = 28
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
      content: Math.round(nx * 4) - 2,
      delivery: 2 - Math.round(ny * 4),
    }
  }

  const update = (clientX: number, clientY: number) => {
    if (!onChange) return
    const next = toScores(clientX, clientY)
    if (!next) return
    onChange(next.content, next.delivery)
  }

  const dotX = OFFSET + ((content + 2) / 4) * PLOT
  const dotY = OFFSET + ((2 - delivery) / 4) * PLOT

  const half = PLOT / 2
  const quadRects = [
    { key: 'honest' as const, x: OFFSET, y: OFFSET },
    { key: 'warm' as const, x: OFFSET + half, y: OFFSET },
    { key: 'hostile' as const, x: OFFSET, y: OFFSET + half },
    { key: 'backhanded' as const, x: OFFSET + half, y: OFFSET + half },
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
          ? 'Rating pad. Drag or use arrow keys to set content and delivery.'
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
              if (!delta) return
              event.preventDefault()
              onChange?.(
                clamp(content + delta[0], -2, 2),
                clamp(delivery + delta[1], -2, 2),
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

      <text
        x={OFFSET + 8}
        y={OFFSET + 13}
        textAnchor="start"
        className="fill-[var(--muted)] text-[8.5px] font-medium uppercase tracking-[0.12em]"
      >
        Caring
      </text>
      <text
        x={OFFSET + PLOT - 8}
        y={OFFSET + 13}
        textAnchor="end"
        className="fill-[var(--muted)] text-[8.5px] font-medium uppercase tracking-[0.12em]"
      >
        Warm
      </text>
      <text
        x={OFFSET + 8}
        y={OFFSET + PLOT - 9}
        textAnchor="start"
        className="fill-[var(--muted)] text-[8.5px] font-medium uppercase tracking-[0.12em]"
      >
        Hostile
      </text>
      <text
        x={OFFSET + PLOT - 8}
        y={OFFSET + PLOT - 9}
        textAnchor="end"
        className="fill-[var(--muted)] text-[8.5px] font-medium uppercase tracking-[0.12em]"
      >
        Backhanded
      </text>

      <text
        x={SIZE / 2}
        y={14}
        textAnchor="middle"
        className="fill-[var(--muted)] text-[7.5px] tracking-[0.16em]"
      >
        KIND
      </text>
      <text
        x={SIZE / 2}
        y={SIZE - 4}
        textAnchor="middle"
        className="fill-[var(--muted)] text-[7.5px] tracking-[0.16em]"
      >
        HARSH
      </text>
      <text
        x={10}
        y={SIZE / 2}
        textAnchor="middle"
        transform={`rotate(-90 10 ${SIZE / 2})`}
        className="fill-[var(--muted)] text-[7.5px] tracking-[0.16em]"
      >
        NEGATIVE
      </text>
      <text
        x={SIZE - 10}
        y={SIZE / 2}
        textAnchor="middle"
        transform={`rotate(90 ${SIZE - 10} ${SIZE / 2})`}
        className="fill-[var(--muted)] text-[7.5px] tracking-[0.16em]"
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
