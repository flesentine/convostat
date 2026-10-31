import type { Comment, Quadrant } from '../db/types'

export const CONTENT_VALUES = [-2, -1, 0, 1, 2] as const
export const DELIVERY_VALUES = [-2, -1, 0, 1, 2] as const

export const CONTENT_LABELS = [
  'Very negative',
  'Negative',
  'Neutral',
  'Positive',
  'Very positive',
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
    label: 'Warm & supportive',
    short: 'Warm',
    description: 'Positive message, kind delivery',
    traits: ['encouraging', 'appreciative', 'affectionate', 'celebratory', 'reassuring'],
    color: 'var(--warm)',
  },
  honest: {
    key: 'honest',
    label: 'Honest & caring',
    short: 'Caring',
    description: 'Hard message, gentle delivery',
    traits: ['constructive', 'candid', 'protective', 'concerned', 'boundary-setting'],
    color: 'var(--honest)',
  },
  hostile: {
    key: 'hostile',
    label: 'Hostile',
    short: 'Hostile',
    description: 'Hard message, harsh delivery',
    traits: ['contemptuous', 'belittling', 'blaming', 'mocking', 'coercive'],
    color: 'var(--hostile)',
  },
  backhanded: {
    key: 'backhanded',
    label: 'Backhanded',
    short: 'Backhanded',
    description: 'Positive words, cold delivery',
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
  return CONTENT_LABELS[clamp(value, -2, 2) + 2]
}

export function deliveryLabel(value: number): string {
  return DELIVERY_LABELS[clamp(value, -2, 2) + 2]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatSigned(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return '—'
  const rounded = value.toFixed(digits)
  return value > 0 ? `+${rounded}` : rounded
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
