import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { db } from '../db/db'
import type { Topic } from '../db/types'
import { TOPIC_COLORS } from '../domain/scoring'
import { cn, uid } from '../lib/utils'

interface TopicChipsProps {
  topics: Topic[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export function TopicChips({ topics, selected, onChange }: TopicChipsProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTopics = selected
    .map((id) => topics.find((topic) => topic.id === id))
    .filter((topic): topic is Topic => Boolean(topic))

  const normalized = query.trim().toLowerCase()
  const exact = topics.find((topic) => topic.name.toLowerCase() === normalized)
  const suggestions = topics
    .filter(
      (topic) =>
        !selected.includes(topic.id) &&
        (!normalized || topic.name.toLowerCase().includes(normalized)),
    )
    .slice(0, 6)
  const canCreate = normalized.length > 0 && !exact

  const add = (id: string) => {
    if (selected.includes(id)) return
    onChange([...selected, id])
    setQuery('')
    inputRef.current?.focus()
  }

  const create = async () => {
    const name = query.trim()
    if (!name) return
    if (exact) {
      add(exact.id)
      return
    }
    const topic: Topic = {
      id: uid(),
      name,
      color: TOPIC_COLORS[topics.length % TOPIC_COLORS.length],
      createdAt: Date.now(),
    }
    await db.topics.put(topic)
    onChange([...selected, topic.id])
    setQuery('')
    inputRef.current?.focus()
  }

  const remove = (id: string) => {
    onChange(selected.filter((value) => value !== id))
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-2 py-1.5 transition',
          'focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTopics.map((topic) => (
          <span
            key={topic.id}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 py-1 pl-2 pr-1 text-xs font-medium text-ink"
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ background: topic.color }}
            />
            {topic.name}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                remove(topic.id)
              }}
              className="rounded p-0.5 text-muted transition hover:bg-line hover:text-ink"
              aria-label={`Remove ${topic.name}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              void create()
            } else if (event.key === 'Backspace' && query === '' && selected.length > 0) {
              remove(selected[selected.length - 1])
            }
          }}
          placeholder={selected.length === 0 ? 'Add topics…' : ''}
          className="min-w-[110px] flex-1 bg-transparent px-1.5 py-1 text-sm text-ink outline-none placeholder:text-muted"
          aria-label="Add topic"
        />
      </div>

      {focused && normalized.length > 0 && (suggestions.length > 0 || canCreate) ? (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl">
          {suggestions.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add(topic.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink transition hover:bg-surface-2"
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: topic.color }}
              />
              {topic.name}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void create()}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink transition hover:bg-surface-2"
            >
              <Plus size={14} className="text-muted" />
              Create “{query.trim()}”
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
