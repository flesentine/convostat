import Dexie, { type Table } from 'dexie'
import type { Comment, Person, Topic } from './types'

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
