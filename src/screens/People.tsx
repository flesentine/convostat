import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, Search, Users } from 'lucide-react'
import { db } from '../db/db'
import type { Comment, Person } from '../db/types'
import { personStats } from '../domain/stats'
import { RELATIONSHIP_LABELS } from '../domain/scoring'
import { relativeDay } from '../lib/utils'
import { Button } from '../components/Button'
import { EmptyState, QuadrantBadge } from '../components/Primitives'
import { PersonFormModal } from '../components/PersonFormModal'
import { Sparkline } from '../components/Sparkline'

export function People() {
  const persons = useLiveQuery(() => db.persons.orderBy('name').toArray(), [], [])
  const comments = useLiveQuery(() => db.comments.toArray(), [], [])
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const byPerson = useMemo(() => {
    const map = new Map<string, Comment[]>()
    for (const comment of comments) {
      const list = map.get(comment.personId)
      if (list) list.push(comment)
      else map.set(comment.personId, [comment])
    }
    return map
  }, [comments])

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return persons
      .map((person) => ({
        person,
        stats: personStats(byPerson.get(person.id) ?? []),
        comments: byPerson.get(person.id) ?? [],
      }))
      .filter(
        ({ person }) =>
          !normalized ||
          person.name.toLowerCase().includes(normalized) ||
          RELATIONSHIP_LABELS[person.relationship].toLowerCase().includes(normalized),
      )
      .sort(
        (a, b) =>
          (b.stats.lastAt ?? 0) - (a.stats.lastAt ?? 0) ||
          a.person.name.localeCompare(b.person.name),
      )
  }, [persons, byPerson, query])

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const thisWeek = comments.filter((comment) => comment.occurredAt >= weekAgo).length

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">People</h1>
          <p className="mt-1 text-sm text-muted">
            {persons.length} {persons.length === 1 ? 'person' : 'people'} ·{' '}
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'} ·{' '}
            {thisWeek} this week
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Add person
        </Button>
      </div>

      {persons.length > 0 ? (
        <div className="relative mb-5 max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people or relationships"
            className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
          />
        </div>
      ) : null}

      {persons.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No one here yet"
          body="Add the people whose comments you want to track. You can start with one."
          action={
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              Add someone
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="No matches"
          body="Try a different name or relationship."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ person, stats, comments: personComments }) => (
            <PersonCard
              key={person.id}
              person={person}
              stats={stats}
              comments={personComments}
            />
          ))}
        </div>
      )}

      <PersonFormModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}

function PersonCard({
  person,
  stats,
  comments,
}: {
  person: Person
  stats: ReturnType<typeof personStats>
  comments: Comment[]
}) {
  return (
    <Link
      to={`/people/${person.id}`}
      className="group block rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:border-line-strong"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: person.color }}
        >
          {person.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
              <p className="text-[11px] text-muted">
                {RELATIONSHIP_LABELS[person.relationship]}
              </p>
            </div>
            {stats.dominant ? (
              <QuadrantBadge quadrant={stats.dominant} size="sm" />
            ) : null}
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted">
                {stats.count} {stats.count === 1 ? 'comment' : 'comments'}
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                {stats.lastAt ? `Last ${relativeDay(stats.lastAt)}` : 'Nothing logged yet'}
              </p>
            </div>
            <Sparkline comments={comments} color={person.color} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] font-medium text-muted transition group-hover:text-accent">
        View pattern
        <ArrowRight
          size={13}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  )
}
