import type { Comment, Quadrant, Topic } from '../db/types'
import {
  formatSigned,
  QUADRANTS,
} from './scoring'
import { topicStats, type PersonStats } from './stats'

export interface PersonInsight {
  headline: string
  notes: string[]
}

function quadrantPhrase(quadrant: Quadrant | null): string {
  if (!quadrant) return 'not enough data'
  return QUADRANTS[quadrant].label.toLowerCase()
}

export function buildPersonInsight(
  comments: Comment[],
  topics: Topic[],
  stats: PersonStats,
): PersonInsight {
  if (stats.count === 0) {
    return {
      headline: 'No comments logged yet.',
      notes: ['Log the next thing they say to start seeing a pattern.'],
    }
  }

  const topCount = stats.dominant ? stats.counts[stats.dominant] : 0
  const topShare = stats.count ? topCount / stats.count : 0
  const avgContent = stats.avgContent ?? 0
  const avgDelivery = stats.avgDelivery ?? 0

  let headline: string
  if (stats.count >= 3 && topShare >= 0.5) {
    headline = `Mostly ${quadrantPhrase(stats.dominant)}.`
  } else if (avgDelivery >= 25) {
    headline = 'Consistently kind delivery.'
  } else if (avgDelivery <= -25) {
    headline = 'Consistently harsh delivery.'
  } else if (avgContent >= 25) {
    headline = 'Mostly affirming content.'
  } else {
    headline = 'Mixed signals so far.'
  }

  const notes: string[] = []

  if (avgContent < -15 && avgDelivery > 15) {
    notes.push(
      'Hard topics tend to arrive gently — the pattern of constructive feedback.',
    )
  } else if (avgContent > 15 && avgDelivery < -15) {
    notes.push(
      'Affirming words tend to arrive cold — watch for backhanded praise.',
    )
  } else if (avgContent < -15 && avgDelivery < -15) {
    notes.push('Critical content and harsh delivery dominate the log.')
  } else if (avgContent > 15 && avgDelivery > 15) {
    notes.push('Affirming content and kind delivery dominate the log.')
  }

  if (stats.worseRate !== null && stats.effectCount >= 2) {
    notes.push(
      `${Math.round(stats.worseRate * 100)}% of rated comments left you feeling worse.`,
    )
  }

  const topicRows = topicStats(comments, topics)
    .filter((row) => row.count >= 2)
    .slice(0, 3)

  for (const row of topicRows) {
    notes.push(
      `${row.topic.name}: ${quadrantPhrase(row.dominant)} (content ${formatSigned(
        row.avgContent,
      )}, delivery ${formatSigned(row.avgDelivery)}).`,
    )
  }

  if (comments.length >= 6) {
    const sorted = [...comments].sort((a, b) => a.occurredAt - b.occurredAt)
    const midpoint = Math.floor(sorted.length / 2)
    const first = sorted.slice(0, midpoint)
    const second = sorted.slice(midpoint)
    const mean = (list: Comment[]) =>
      list.reduce((sum, comment) => sum + comment.delivery, 0) / list.length
    const shift = mean(second) - mean(first)
    if (shift > 15) {
      notes.push('Delivery has warmed since you started logging.')
    } else if (shift < -15) {
      notes.push('Delivery has cooled since you started logging.')
    }
  }

  return { headline, notes }
}
