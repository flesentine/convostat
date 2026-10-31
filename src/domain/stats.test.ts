import { describe, expect, it } from 'vitest'
import type { Comment, Topic } from '../db/types'
import {
  commentsSince,
  dominantQuadrant,
  personStats,
  rollingSeries,
  topicStats,
} from './stats'

function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: Math.random().toString(36).slice(2),
    personId: 'p1',
    occurredAt: 1_700_000_000_000,
    createdAt: 1_700_000_000_000,
    topicIds: [],
    content: 1,
    delivery: 1,
    ...overrides,
  }
}

describe('dominantQuadrant', () => {
  it('returns null with no data', () => {
    expect(
      dominantQuadrant({ warm: 0, honest: 0, hostile: 0, backhanded: 0, neutral: 0 }),
    ).toBeNull()
  })

  it('ignores neutral when a directional quadrant exists', () => {
    expect(
      dominantQuadrant({ warm: 1, honest: 2, hostile: 0, backhanded: 0, neutral: 9 }),
    ).toBe('honest')
  })

  it('returns neutral when it is all there is', () => {
    expect(
      dominantQuadrant({ warm: 0, honest: 0, hostile: 0, backhanded: 0, neutral: 3 }),
    ).toBe('neutral')
  })
})

describe('personStats', () => {
  it('summarizes counts, averages and effect rates', () => {
    const stats = personStats([
      comment({ content: 2, delivery: 2, effect: 'better' }),
      comment({ content: -2, delivery: 2, effect: 'worse' }),
      comment({ content: 0, delivery: 0, effect: 'same' }),
    ])
    expect(stats.count).toBe(3)
    expect(stats.avgContent).toBe(0)
    expect(stats.avgDelivery).toBeCloseTo(4 / 3)
    expect(stats.counts.warm).toBe(1)
    expect(stats.counts.honest).toBe(1)
    expect(stats.counts.neutral).toBe(1)
    expect(stats.effectCount).toBe(3)
    expect(stats.betterRate).toBeCloseTo(1 / 3)
    expect(stats.worseRate).toBeCloseTo(1 / 3)
  })

  it('returns null rates when nothing has an effect', () => {
    const stats = personStats([comment()])
    expect(stats.worseRate).toBeNull()
    expect(stats.betterRate).toBeNull()
  })
})

describe('rollingSeries', () => {
  it('averages the last five comments in chronological order', () => {
    const comments = [
      comment({ occurredAt: 6, content: -2, delivery: -2 }),
      comment({ occurredAt: 1, content: 2, delivery: 2 }),
      comment({ occurredAt: 2, content: 2, delivery: 2 }),
      comment({ occurredAt: 3, content: 2, delivery: 2 }),
      comment({ occurredAt: 4, content: 2, delivery: 2 }),
      comment({ occurredAt: 5, content: 2, delivery: 2 }),
    ]
    const series = rollingSeries(comments, 5)
    expect(series.map((point) => point.at)).toEqual([1, 2, 3, 4, 5, 6])
    expect(series[3].content).toBe(2)
    expect(series[5].content).toBeCloseTo((2 + 2 + 2 + 2 - 2) / 5)
  })
})

describe('topicStats', () => {
  it('aggregates per topic and sorts by count', () => {
    const topics: Topic[] = [
      { id: 'work', name: 'Work', color: '#000', createdAt: 0 },
      { id: 'home', name: 'Home', color: '#111', createdAt: 0 },
    ]
    const comments = [
      comment({ topicIds: ['work'], content: -2, delivery: 1 }),
      comment({ topicIds: ['work'], content: -1, delivery: 2 }),
      comment({ topicIds: ['home'], content: 2, delivery: 2 }),
    ]
    const rows = topicStats(comments, topics)
    expect(rows.map((row) => row.topic.id)).toEqual(['work', 'home'])
    expect(rows[0].count).toBe(2)
    expect(rows[0].avgContent).toBe(-1.5)
    expect(rows[0].dominant).toBe('honest')
  })
})

describe('commentsSince', () => {
  it('filters by age and returns everything for null', () => {
    const now = Date.now()
    const comments = [
      comment({ occurredAt: now - 2 * 24 * 60 * 60 * 1000 }),
      comment({ occurredAt: now - 40 * 24 * 60 * 60 * 1000 }),
    ]
    expect(commentsSince(comments, 30)).toHaveLength(1)
    expect(commentsSince(comments, null)).toHaveLength(2)
  })
})
