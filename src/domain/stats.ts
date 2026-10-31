import type { Comment, Quadrant, Topic } from '../db/types'
import { commentQuadrant } from './scoring'

export interface PersonStats {
  count: number
  avgContent: number | null
  avgDelivery: number | null
  effectCount: number
  betterRate: number | null
  worseRate: number | null
  counts: Record<Quadrant, number>
  dominant: Quadrant | null
  lastAt: number | null
}

export interface TopicStat {
  topic: Topic
  count: number
  avgContent: number | null
  avgDelivery: number | null
  dominant: Quadrant | null
  worseRate: number | null
  lastAt: number
}

const QUADRANT_ORDER: Quadrant[] = [
  'warm',
  'honest',
  'backhanded',
  'hostile',
  'neutral',
]

export function average(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function dominantQuadrant(counts: Record<Quadrant, number>): Quadrant | null {
  const withData = QUADRANT_ORDER.filter((key) => counts[key] > 0 && key !== 'neutral')
  const pool = withData.length > 0 ? withData : QUADRANT_ORDER.filter((key) => counts[key] > 0)
  if (pool.length === 0) return null
  return pool.reduce((best, key) => (counts[key] > counts[best] ? key : best), pool[0])
}

export function personStats(comments: Comment[]): PersonStats {
  const counts: Record<Quadrant, number> = {
    warm: 0,
    honest: 0,
    hostile: 0,
    backhanded: 0,
    neutral: 0,
  }
  for (const comment of comments) {
    counts[commentQuadrant(comment)] += 1
  }

  const withEffect = comments.filter((comment) => comment.effect)
  const better = withEffect.filter((comment) => comment.effect === 'better').length
  const worse = withEffect.filter((comment) => comment.effect === 'worse').length

  return {
    count: comments.length,
    avgContent: average(comments.map((comment) => comment.content)),
    avgDelivery: average(comments.map((comment) => comment.delivery)),
    effectCount: withEffect.length,
    betterRate: withEffect.length ? better / withEffect.length : null,
    worseRate: withEffect.length ? worse / withEffect.length : null,
    counts,
    dominant: dominantQuadrant(counts),
    lastAt:
      comments.length > 0
        ? Math.max(...comments.map((comment) => comment.occurredAt))
        : null,
  }
}

export function topicStats(comments: Comment[], topics: Topic[]): TopicStat[] {
  const byTopic = new Map<string, Comment[]>()
  for (const comment of comments) {
    for (const topicId of comment.topicIds) {
      const list = byTopic.get(topicId)
      if (list) list.push(comment)
      else byTopic.set(topicId, [comment])
    }
  }

  const stats: TopicStat[] = []
  for (const topic of topics) {
    const list = byTopic.get(topic.id)
    if (!list || list.length === 0) continue
    const withEffect = list.filter((comment) => comment.effect)
    const worse = withEffect.filter((comment) => comment.effect === 'worse').length
    stats.push({
      topic,
      count: list.length,
      avgContent: average(list.map((comment) => comment.content)),
      avgDelivery: average(list.map((comment) => comment.delivery)),
      dominant: dominantQuadrant(
        list.reduce(
          (counts, comment) => {
            counts[commentQuadrant(comment)] += 1
            return counts
          },
          { warm: 0, honest: 0, hostile: 0, backhanded: 0, neutral: 0 },
        ),
      ),
      worseRate: withEffect.length ? worse / withEffect.length : null,
      lastAt: Math.max(...list.map((comment) => comment.occurredAt)),
    })
  }

  return stats.sort((a, b) => b.count - a.count || a.topic.name.localeCompare(b.topic.name))
}

export interface TrendPoint {
  at: number
  content: number
  delivery: number
}

/**
 * Rolling average of the last `window` comments, in chronological order.
 * Raw values are kept alongside so charts can draw both.
 */
export function rollingSeries(comments: Comment[], window = 5): TrendPoint[] {
  const sorted = [...comments].sort((a, b) => a.occurredAt - b.occurredAt)
  return sorted.map((comment, index) => {
    const slice = sorted.slice(Math.max(0, index - window + 1), index + 1)
    return {
      at: comment.occurredAt,
      content: average(slice.map((item) => item.content)) ?? 0,
      delivery: average(slice.map((item) => item.delivery)) ?? 0,
    }
  })
}

export function commentsSince(comments: Comment[], days: number | null): Comment[] {
  if (days === null) return comments
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return comments.filter((comment) => comment.occurredAt >= cutoff)
}

export function filterByTopic(comments: Comment[], topicId: string | null): Comment[] {
  if (!topicId) return comments
  return comments.filter((comment) => comment.topicIds.includes(topicId))
}
