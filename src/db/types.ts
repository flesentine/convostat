export type Relationship = 'work' | 'family' | 'friend' | 'partner' | 'other'

export type Effect = 'better' | 'same' | 'worse'

export type Quadrant =
  | 'warm'
  | 'honest'
  | 'hostile'
  | 'backhanded'
  | 'neutral'

export interface Person {
  id: string
  name: string
  relationship: Relationship
  color: string
  createdAt: number
  isSample?: boolean
}

export interface Topic {
  id: string
  name: string
  color: string
  createdAt: number
  isSample?: boolean
}

export interface Comment {
  id: string
  personId: string
  /** When the comment happened. */
  occurredAt: number
  createdAt: number
  /** Optional gist of what was said. */
  text?: string
  topicIds: string[]
  /** -100 (very critical) .. +100 (very affirming) */
  content: number
  /** -100 (harsh) .. +100 (very kind) */
  delivery: number
  /** Optional 1..5 */
  intensity?: number
  effect?: Effect
  note?: string
  isSample?: boolean
}
