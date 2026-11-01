import type { Comment, Quadrant } from '../db/types'

/** Both rating axes run from -100 to +100, with 0 as neutral. */
export const SCORE_MIN = -100
export const SCORE_MAX = 100
export const SCORE_SPAN = SCORE_MAX - SCORE_MIN

export const CONTENT_LABELS = [
  'Very critical',
  'Critical',
  'Neutral',
  'Affirming',
  'Very affirming',
]

export const DELIVERY_LABELS = [
  'Harsh',
  'Cold',
  'Flat',
  'Warm',
  'Very kind',
]

export interface QuadrantMeta {
  key: Quadrant
  label: string
  short: string
  description: string
  traits: string[]
  color: string
}

export const QUADRANTS: Record<Quadrant, QuadrantMeta> = {
  warm: {
    key: 'warm',
    label: 'Supportive',
    short: 'Supportive',
    description: 'Affirming message, kind delivery',
    traits: ['encouraging', 'appreciative', 'affectionate', 'celebratory', 'reassuring'],
    color: 'var(--warm)',
  },
  honest: {
    key: 'honest',
    label: 'Constructive',
    short: 'Constructive',
    description: 'Critical message, kind delivery',
    traits: ['constructive', 'candid', 'protective', 'concerned', 'boundary-setting'],
    color: 'var(--honest)',
  },
  hostile: {
    key: 'hostile',
    label: 'Hostile',
    short: 'Hostile',
    description: 'Critical message, harsh delivery',
    traits: ['contemptuous', 'belittling', 'blaming', 'mocking', 'coercive'],
    color: 'var(--hostile)',
  },
  backhanded: {
    key: 'backhanded',
    label: 'Backhanded',
    short: 'Backhanded',
    description: 'Affirming words, cold delivery',
    traits: ['sarcastic', 'condescending', 'performative', 'faint praise', 'negging'],
    color: 'var(--backhanded)',
  },
  neutral: {
    key: 'neutral',
    label: 'Neutral',
    short: 'Neutral',
    description: 'Flat, factual, or unreadable',
    traits: ['factual', 'matter-of-fact', 'unreadable'],
    color: 'var(--muted)',
  },
}

export function quadrantOf(content: number, delivery: number): Quadrant {
  if (content > 0 && delivery > 0) return 'warm'
  if (content < 0 && delivery > 0) return 'honest'
  if (content < 0 && delivery < 0) return 'hostile'
  if (content > 0 && delivery < 0) return 'backhanded'
  return 'neutral'
}

export function commentQuadrant(comment: Pick<Comment, 'content' | 'delivery'>): Quadrant {
  return quadrantOf(comment.content, comment.delivery)
}

export function contentLabel(value: number): string {
  return scoreLabel(value, CONTENT_LABELS)
}

export function deliveryLabel(value: number): string {
  return scoreLabel(value, DELIVERY_LABELS)
}

/**
 * Five descriptive anchors spread across the -100..100 range. The numeric
 * value keeps its full resolution; the label is just a human hint.
 */
export function scoreLabel(value: number, labels: readonly string[]): string {
  return labels[labelIndex(value)]
}

export function labelIndex(value: number): number {
  const score = clamp(value, SCORE_MIN, SCORE_MAX)
  if (score <= -60) return 0
  if (score <= -10) return 1
  if (score < 10) return 2
  if (score < 60) return 3
  return 4
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatSigned(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return '—'
  const rounded = Number(value.toFixed(digits))
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits)
  return rounded > 0 ? `+${text}` : text
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

export const EFFECT_META = {
  better: { label: 'Felt better', short: 'Better' },
  same: { label: 'Felt the same', short: 'Same' },
  worse: { label: 'Felt worse', short: 'Worse' },
} as const

export const RELATIONSHIP_LABELS = {
  work: 'Work',
  family: 'Family',
  friend: 'Friend',
  partner: 'Partner',
  other: 'Other',
} as const

export const PERSON_COLORS = [
  '#3f8f6b',
  '#3b7f9e',
  '#c1842e',
  '#c14b3e',
  '#8a6bbf',
  '#2f8f7a',
  '#b0563f',
  '#5b7fa8',
]

export const TOPIC_COLORS = [
  '#5b7fa8',
  '#3f8f6b',
  '#c1842e',
  '#8a6bbf',
  '#3b7f9e',
  '#b0563f',
  '#2f8f7a',
  '#c14b3e',
]
