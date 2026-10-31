import { z } from 'zod'
import { db } from './db'
import type { Comment, Person, Topic } from './types'
import { downloadFile } from '../lib/utils'

const relationshipSchema = z.enum(['work', 'family', 'friend', 'partner', 'other'])
const effectSchema = z.enum(['better', 'same', 'worse'])

const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  relationship: relationshipSchema,
  color: z.string().min(1),
  createdAt: z.number(),
  isSample: z.boolean().optional(),
})

const topicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
  createdAt: z.number(),
  isSample: z.boolean().optional(),
})

const commentSchema = z.object({
  id: z.string().min(1),
  personId: z.string().min(1),
  occurredAt: z.number(),
  createdAt: z.number(),
  text: z.string().optional(),
  topicIds: z.array(z.string()),
  content: z.number().int().min(-100).max(100),
  delivery: z.number().int().min(-100).max(100),
  intensity: z.number().int().min(1).max(5).optional(),
  effect: effectSchema.optional(),
  note: z.string().optional(),
  isSample: z.boolean().optional(),
})

const backupSchema = z.object({
  app: z.string().optional(),
  version: z.number(),
  exportedAt: z.number().optional(),
  persons: z.array(personSchema),
  topics: z.array(topicSchema),
  comments: z.array(commentSchema),
})

export interface BackupData {
  persons: Person[]
  topics: Topic[]
  comments: Comment[]
}

export function parseBackup(text: string): BackupData {
  const parsed = backupSchema.parse(JSON.parse(text))
  const personIds = new Set(parsed.persons.map((person) => person.id))
  const topicIds = new Set(parsed.topics.map((topic) => topic.id))
  // Backups from v1 used the old -2..2 scale.
  const scale = parsed.version < 2 ? 50 : 1
  return {
    persons: parsed.persons,
    topics: parsed.topics,
    comments: parsed.comments
      .filter((comment) => personIds.has(comment.personId))
      .map((comment) => ({
        ...comment,
        content: Math.max(-100, Math.min(100, Math.round(comment.content * scale))),
        delivery: Math.max(-100, Math.min(100, Math.round(comment.delivery * scale))),
        topicIds: comment.topicIds.filter((topicId) => topicIds.has(topicId)),
      })),
  }
}

export async function exportBackupJson(): Promise<number> {
  const [persons, topics, comments] = await Promise.all([
    db.persons.toArray(),
    db.topics.toArray(),
    db.comments.toArray(),
  ])
  const payload = {
    app: 'convostat',
    version: 2,
    exportedAt: Date.now(),
    persons,
    topics,
    comments,
  }
  const stamp = new Date().toISOString().slice(0, 10)
  downloadFile(
    `convostat-backup-${stamp}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )
  return comments.length
}

export async function exportCommentsCsv(): Promise<number> {
  const [persons, topics, comments] = await Promise.all([
    db.persons.toArray(),
    db.topics.toArray(),
    db.comments.toArray(),
  ])
  const personName = new Map(persons.map((person) => [person.id, person.name]))
  const topicName = new Map(topics.map((topic) => [topic.id, topic.name]))

  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`
  const header = [
    'person',
    'date',
    'text',
    'topics',
    'content',
    'delivery',
    'intensity',
    'effect',
    'note',
  ]
  const rows = [...comments]
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .map((comment) =>
      [
        personName.get(comment.personId) ?? 'Unknown',
        new Date(comment.occurredAt).toISOString(),
        comment.text ?? '',
        comment.topicIds.map((id) => topicName.get(id) ?? id).join('; '),
        String(comment.content),
        String(comment.delivery),
        comment.intensity ? String(comment.intensity) : '',
        comment.effect ?? '',
        comment.note ?? '',
      ]
        .map(escape)
        .join(','),
    )

  const stamp = new Date().toISOString().slice(0, 10)
  downloadFile(
    `convostat-comments-${stamp}.csv`,
    [header.join(','), ...rows].join('\n'),
    'text/csv',
  )
  return comments.length
}

export async function importBackup(
  text: string,
  mode: 'merge' | 'replace',
): Promise<{ persons: number; topics: number; comments: number }> {
  const data = parseBackup(text)
  await db.transaction('rw', db.persons, db.topics, db.comments, async () => {
    if (mode === 'replace') {
      await db.comments.clear()
      await db.persons.clear()
      await db.topics.clear()
    }
    await db.persons.bulkPut(data.persons)
    await db.topics.bulkPut(data.topics)
    await db.comments.bulkPut(data.comments)
  })
  return {
    persons: data.persons.length,
    topics: data.topics.length,
    comments: data.comments.length,
  }
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.persons, db.topics, db.comments, async () => {
    await db.comments.clear()
    await db.persons.clear()
    await db.topics.clear()
  })
}
