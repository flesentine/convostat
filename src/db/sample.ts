import { db } from './db'
import type { Comment, Effect, Person, Quadrant, Relationship, Topic } from './types'
import { TOPIC_COLORS } from '../domain/scoring'
import { uid } from '../lib/utils'

function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TEXTS: Record<Quadrant, string[]> = {
  warm: [
    'Really appreciated your help on the launch.',
    'This is great work — thank you for pushing it over the line.',
    "I'm glad you're on this team.",
    'You handled that client call beautifully.',
    "Let's celebrate — you earned it.",
    'I love how you explained that.',
    'Proud of you for setting that boundary.',
    'Thanks for checking in. It genuinely helped.',
    "You're the reason this went smoothly.",
  ],
  honest: [
    "I want to be straight with you: the draft needs another pass, but I think it's fixable.",
    "I'm worried about the timeline. Can we talk it through?",
    "That decision didn't land well, and I want to understand your side.",
    "You missed the deadline and I need to flag it — but I'm not upset with you.",
    "I think you're taking on too much. Please protect your time.",
    "This isn't working for me, and I'd rather tell you than drift.",
    'I need to push back on that, gently.',
    "I care about you, so I'm going to say the hard thing.",
    "The plan is risky. Here's what I'd change.",
  ],
  hostile: [
    "This is the third time you've dropped the ball. Unbelievable.",
    "You clearly don't care about anyone else's time.",
    "I shouldn't have to explain this to you again.",
    'Everyone else managed this fine.',
    'Stop making excuses.',
    'You always do this.',
    "Honestly, I don't know why I bother.",
    "That's a ridiculous thing to say.",
  ],
  backhanded: [
    'Nice of you to finally join us.',
    'Must be nice to have that much free time.',
    'Well, at least you tried.',
    "I'd love to see you do it, since you know best.",
    'Your ideas are... ambitious.',
    'No offense, but this is better than I expected from you.',
    'You look tired. Long week?',
    "That's a bold choice of outfit.",
    "I'm surprised you remembered.",
  ],
  neutral: [
    'Moved the meeting to Thursday.',
    'Sent over the file.',
    'We should catch up at some point.',
    "I'll take a look when I can.",
    "Let me know what you decide.",
  ],
}

const EFFECTS: Record<Quadrant, Effect[]> = {
  warm: ['better', 'better', 'better', 'same', 'same', 'worse'],
  honest: ['same', 'same', 'better', 'worse', 'worse'],
  hostile: ['worse', 'worse', 'worse', 'worse', 'same'],
  backhanded: ['worse', 'worse', 'worse', 'same', 'same', 'better'],
  neutral: ['same', 'same', 'same', 'same', 'better'],
}

interface PersonSeed {
  name: string
  relationship: Relationship
  color: string
  topics: string[]
  mix: Partial<Record<Quadrant, number>>
  count: number
}

const PEOPLE: PersonSeed[] = [
  {
    name: 'Maya Chen',
    relationship: 'work',
    color: '#3b7f9e',
    topics: ['Work', 'Deadlines', 'Feedback', 'Praise'],
    mix: { honest: 38, warm: 27, hostile: 20, backhanded: 10, neutral: 5 },
    count: 16,
  },
  {
    name: 'Daniel Okafor',
    relationship: 'family',
    color: '#c1842e',
    topics: ['Family', 'Money', 'Personal', 'Boundaries'],
    mix: { backhanded: 38, hostile: 22, warm: 22, honest: 13, neutral: 5 },
    count: 14,
  },
  {
    name: 'Priya Raman',
    relationship: 'friend',
    color: '#3f8f6b',
    topics: ['Plans', 'Personal', 'Health', 'Praise'],
    mix: { warm: 58, honest: 20, neutral: 12, backhanded: 10 },
    count: 12,
  },
  {
    name: 'Sam Whitfield',
    relationship: 'partner',
    color: '#8a6bbf',
    topics: ['Plans', 'Money', 'Health', 'Boundaries', 'Personal'],
    mix: { warm: 42, honest: 33, neutral: 15, hostile: 10 },
    count: 14,
  },
]

const TOPIC_LIST = [
  'Work',
  'Deadlines',
  'Feedback',
  'Praise',
  'Family',
  'Money',
  'Personal',
  'Health',
  'Plans',
  'Boundaries',
]

function pick<T>(random: () => number, list: T[]): T {
  return list[Math.floor(random() * list.length)]
}

function weightedQuadrant(
  random: () => number,
  mix: Partial<Record<Quadrant, number>>,
): Quadrant {
  const entries = Object.entries(mix) as Array<[Quadrant, number]>
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = random() * total
  for (const [quadrant, weight] of entries) {
    roll -= weight
    if (roll <= 0) return quadrant
  }
  return entries[0][0]
}

function magnitude(random: () => number, min: number, max: number): number {
  return random() < 0.6 ? min : max
}

function scoresFor(quadrant: Quadrant, random: () => number): { content: number; delivery: number } {
  switch (quadrant) {
    case 'warm':
      return { content: magnitude(random, 1, 2), delivery: magnitude(random, 1, 2) }
    case 'honest':
      return { content: -magnitude(random, 1, 2), delivery: magnitude(random, 1, 2) }
    case 'hostile':
      return { content: -magnitude(random, 1, 2), delivery: -magnitude(random, 1, 2) }
    case 'backhanded':
      return { content: magnitude(random, 1, 2), delivery: -magnitude(random, 1, 2) }
    case 'neutral':
      return { content: 0, delivery: 0 }
  }
}

export async function seedSampleData(): Promise<void> {
  const now = Date.now()
  const random = mulberry32(20261031)

  /**
   * Cycle through a shuffled pool per quadrant so the same phrasing does not
   * land back-to-back. Repeats only start once the whole pool has been used.
   */
  const textPools = new Map<Quadrant, string[]>()
  const pickText = (quadrant: Quadrant): string => {
    let pool = textPools.get(quadrant)
    if (!pool || pool.length === 0) {
      pool = [...TEXTS[quadrant]]
      for (let index = pool.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(random() * (index + 1))
        ;[pool[index], pool[swap]] = [pool[swap], pool[index]]
      }
      textPools.set(quadrant, pool)
    }
    return pool.pop() as string
  }

  await db.transaction('rw', db.persons, db.topics, db.comments, async () => {
    const [oldPersons, oldTopics, oldComments] = await Promise.all([
      db.persons.toArray(),
      db.topics.toArray(),
      db.comments.toArray(),
    ])
    await db.comments.bulkDelete(
      oldComments.filter((row) => row.isSample).map((row) => row.id),
    )
    await db.persons.bulkDelete(oldPersons.filter((row) => row.isSample).map((row) => row.id))
    await db.topics.bulkDelete(oldTopics.filter((row) => row.isSample).map((row) => row.id))

    const existingTopics = new Map(
      oldTopics.map((topic) => [topic.name.toLowerCase(), topic]),
    )

    const topics: Topic[] = []
    TOPIC_LIST.forEach((name, index) => {
      const existing = existingTopics.get(name.toLowerCase())
      if (existing) {
        topics.push(existing)
        return
      }
      topics.push({
        id: uid(),
        name,
        color: TOPIC_COLORS[index % TOPIC_COLORS.length],
        createdAt: now,
        isSample: true,
      })
    })
    const topicByName = new Map(topics.map((topic) => [topic.name, topic]))
    await db.topics.bulkPut(topics.filter((topic) => topic.isSample))

    const persons: Person[] = PEOPLE.map((seed) => ({
      id: uid(),
      name: seed.name,
      relationship: seed.relationship,
      color: seed.color,
      createdAt: now - Math.floor(random() * 60 * 24 * 60 * 60 * 1000),
      isSample: true,
    }))
    await db.persons.bulkPut(persons)

    const comments: Comment[] = []
    PEOPLE.forEach((seed, personIndex) => {
      const person = persons[personIndex]
      for (let index = 0; index < seed.count; index += 1) {
        const quadrant = weightedQuadrant(random, seed.mix)
        const scores = scoresFor(quadrant, random)
        const topicCount = random() < 0.55 ? 1 : 2
        const topicIds: string[] = []
        while (topicIds.length < topicCount) {
          const topic = topicByName.get(pick(random, seed.topics))
          if (topic && !topicIds.includes(topic.id)) topicIds.push(topic.id)
        }

        const daysAgo = random() * 110
        const occurredAt = now - Math.floor(daysAgo * 24 * 60 * 60 * 1000)
        const hasText = random() > 0.14
        const intensity = Math.max(
          1,
          Math.min(
            5,
            Math.round((Math.abs(scores.content) + Math.abs(scores.delivery)) / 4 * 3) +
              1 +
              (random() < 0.3 ? 1 : 0),
          ),
        )

        comments.push({
          id: uid(),
          personId: person.id,
          occurredAt,
          createdAt: occurredAt,
          text: hasText ? pickText(quadrant) : undefined,
          topicIds,
          content: scores.content,
          delivery: scores.delivery,
          intensity,
          effect: random() < 0.85 ? pick(random, EFFECTS[quadrant]) : undefined,
          isSample: true,
        })
      }
    })

    await db.comments.bulkPut(comments)
  })
}
