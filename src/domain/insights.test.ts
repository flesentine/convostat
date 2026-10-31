import { describe, expect, it } from 'vitest'
import type { Comment } from '../db/types'
import { buildPersonInsight } from './insights'
import { personStats } from './stats'

function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: Math.random().toString(36).slice(2),
    personId: 'p1',
    occurredAt: 1_700_000_000_000,
    createdAt: 1_700_000_000_000,
    topicIds: [],
    content: 0,
    delivery: 0,
    ...overrides,
  }
}

function insight(comments: Comment[]) {
  return buildPersonInsight(comments, [], personStats(comments))
}

describe('buildPersonInsight', () => {
  it('treats small deviations as mixed signals on the -100..100 scale', () => {
    const result = insight([comment({ content: -16, delivery: 14 })])
    expect(result.headline).toBe('Mixed signals so far.')
  })

  it('recognizes strongly kind delivery', () => {
    const result = insight([comment({ content: 0, delivery: 60 })])
    expect(result.headline).toBe('Consistently kind delivery.')
  })
})
