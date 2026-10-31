import Dexie, { type Table } from 'dexie'
import type { Comment, Person, Topic } from './types'

const LEGACY_SCORE_SCALE = 50

function scaleLegacyScore(value: number): number {
  return Math.max(-100, Math.min(100, Math.round(value * LEGACY_SCORE_SCALE)))
}

class ConvostatDB extends Dexie {
  persons!: Table<Person, string>
  comments!: Table<Comment, string>
  topics!: Table<Topic, string>

  constructor() {
    super('convostat')
    this.version(1).stores({
      persons: 'id, name, createdAt',
      comments: 'id, personId, occurredAt, *topicIds',
      topics: 'id, name, createdAt',
    })
    // v2 widens both axes from -2..2 to -100..100.
    this.version(2)
      .stores({
        persons: 'id, name, createdAt',
        comments: 'id, personId, occurredAt, *topicIds',
        topics: 'id, name, createdAt',
      })
      .upgrade((tx) =>
        tx
          .table<Comment, string>('comments')
          .toCollection()
          .modify((comment) => {
            comment.content = scaleLegacyScore(comment.content)
            comment.delivery = scaleLegacyScore(comment.delivery)
          }),
      )
  }
}

export const db = new ConvostatDB()

export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) {
      await navigator.storage.persist()
    }
  } catch {
    /* best effort */
  }
}
