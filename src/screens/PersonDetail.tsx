import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react'
import { db } from '../db/db'
import type { Comment } from '../db/types'
import {
  EFFECT_META,
  QUADRANTS,
  RELATIONSHIP_LABELS,
  formatPercent,
  formatSigned,
  quadrantOf,
} from '../domain/scoring'
import { commentsSince, personStats, topicStats } from '../domain/stats'
import { buildPersonInsight } from '../domain/insights'
import { cn, formatDay, relativeDay } from '../lib/utils'
import { Button } from '../components/Button'
import { Card, CardHeader } from '../components/Card'
import { EmptyState, QuadrantBadge } from '../components/Primitives'
import { PersonFormModal } from '../components/PersonFormModal'
import { ScatterPlot } from '../components/ScatterPlot'
import { TrendChart } from '../components/TrendChart'

const RANGES: Array<{ label: string; value: number | null }> = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: 'All', value: null },
]

const MIX_ORDER = ['warm', 'honest', 'backhanded', 'hostile', 'neutral'] as const

function signTone(value: number | null): string {
  if (value === null || Math.abs(value) < 2) return 'text-muted'
  return value > 0 ? 'text-warm' : 'text-hostile'
}

export function PersonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const person = useLiveQuery(
    async () => (id ? ((await db.persons.get(id)) ?? null) : null),
    [id],
  )
  const allComments = useLiveQuery(
    async () =>
      id ? await db.comments.where('personId').equals(id).toArray() : [],
    [id],
    [],
  )
  const topics = useLiveQuery(() => db.topics.toArray(), [], [])

  const [range, setRange] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const comments = useMemo(
    () =>
      [...commentsSince(allComments, range)].sort((a, b) => b.occurredAt - a.occurredAt),
    [allComments, range],
  )

  const stats = useMemo(() => personStats(comments), [comments])
  const topicRows = useMemo(() => topicStats(comments, topics), [comments, topics])
  const insight = useMemo(
    () => buildPersonInsight(comments, topics, stats),
    [comments, topics, stats],
  )
  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  )

  useEffect(() => {
    setSelectedId(null)
    setShowAll(false)
  }, [range])

  if (person === undefined) {
    return <div className="mx-auto max-w-5xl py-10 text-sm text-muted">Loading…</div>
  }

  if (person === null) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState
          title="Person not found"
          body="They may have been deleted."
          action={
            <Link
              to="/people"
              className="inline-flex h-10 items-center rounded-xl border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition hover:bg-surface-2"
            >
              Back to people
            </Link>
          }
        />
      </div>
    )
  }

  const selectedComment = comments.find((comment) => comment.id === selectedId) ?? null
  const visibleComments = showAll ? comments : comments.slice(0, 6)

  const deleteComment = async (comment: Comment) => {
    if (!window.confirm('Delete this comment from the log?')) return
    await db.comments.delete(comment.id)
    if (selectedId === comment.id) setSelectedId(null)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/people"
        className="inline-flex min-h-10 items-center gap-1.5 py-2 text-xs font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={13} />
        All people
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
          style={{ background: person.color }}
        >
          {person.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] text-ink">
            {person.name}
          </h1>
          <p className="text-sm text-muted">
            {RELATIONSHIP_LABELS[person.relationship]} · {stats.count}{' '}
            {stats.count === 1 ? 'comment' : 'comments'}
            {range ? ` in the last ${range} days` : ''}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil size={14} />
          Edit
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-0.5 self-start rounded-xl border border-line bg-surface p-0.5">
          {RANGES.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setRange(option.value)}
              className={cn(
                'min-h-10 rounded-[10px] px-3.5 py-2 text-xs font-medium transition',
                range === option.value
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Link
          to={`/?person=${person.id}`}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-medium text-accent-ink transition hover:brightness-105 sm:w-auto"
        >
          <MessageSquarePlus size={14} />
          Log a comment
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Comments" value={String(stats.count)} />
        <Stat
          label="Avg content"
          value={formatSigned(stats.avgContent)}
          className={signTone(stats.avgContent)}
        />
        <Stat
          label="Avg delivery"
          value={formatSigned(stats.avgDelivery)}
          className={signTone(stats.avgDelivery)}
        />
        <Stat
          label="Felt worse"
          value={formatPercent(stats.worseRate)}
          hint={stats.effectCount ? `${stats.effectCount} rated` : 'not rated'}
          className={
            stats.worseRate !== null && stats.worseRate >= 0.5 ? 'text-hostile' : ''
          }
        />
      </div>

      {comments.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<MessageSquarePlus size={26} />}
            title={allComments.length ? 'Nothing in this range' : 'No comments yet'}
            body={
              allComments.length
                ? 'Try widening the date range.'
                : 'Log the next thing they say to start seeing a pattern.'
            }
            action={
              allComments.length ? (
                <Button variant="secondary" onClick={() => setRange(null)}>
                  Show all time
                </Button>
              ) : (
                <Link
                  to={`/?person=${person.id}`}
                  className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink"
                >
                  Log a comment
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          <Card className="mt-4 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Pattern
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.01em] text-ink">
              {insight.headline}
            </p>
            {insight.notes.length > 0 ? (
              <ul className="mt-2.5 space-y-1.5">
                {insight.notes.map((note) => (
                  <li key={note} className="flex max-w-[65ch] gap-2 text-body leading-relaxed text-ink-soft">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent/60" />
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader
                title="Where comments land"
                subtitle="Each dot is one comment. Bigger dots mean higher intensity."
              />
              <div className="px-4 pb-2">
                <ScatterPlot
                  comments={comments}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>
              <div className="border-t border-line px-5 py-3">
                {selectedComment ? (
                  <SelectedComment
                    comment={selectedComment}
                    topicNames={selectedComment.topicIds
                      .map((topicId) => topicById.get(topicId)?.name)
                      .filter((name): name is string => Boolean(name))}
                    onDelete={() => void deleteComment(selectedComment)}
                  />
                ) : (
                  <div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {MIX_ORDER.filter((key) => key !== 'neutral').map((key) => (
                        <span
                          key={key}
                          className="flex items-center gap-1.5 text-xs text-muted"
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ background: QUADRANTS[key].color }}
                          />
                          {QUADRANTS[key].label}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Tap a dot to read the comment behind it.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader
                  title="Mix"
                  subtitle={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
                />
                <div className="space-y-3.5 px-5 pb-5">
                  {MIX_ORDER.filter(
                    (key) => key !== 'neutral' || stats.counts.neutral > 0,
                  ).map((key) => {
                    const count = stats.counts[key]
                    const percent = stats.count ? (count / stats.count) * 100 : 0
                    return (
                      <div key={key}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                            <span
                              className="size-2 rounded-full"
                              style={{ background: QUADRANTS[key].color }}
                            />
                            {QUADRANTS[key].label}
                          </span>
                          <span className="text-xs tabular-nums text-muted">
                            {count} · {Math.round(percent)}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percent}%`,
                              background: QUADRANTS[key].color,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="flex-1">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-5 pb-4 pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50 [&::-webkit-details-marker]:hidden">
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-ink">
                        Quadrant guide
                      </h2>
                      <p className="mt-0.5 text-xs text-muted">
                        How content and delivery combine.
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className="mt-0.5 shrink-0 text-muted transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <ul className="space-y-2.5 px-5 pb-5">
                    {(['warm', 'honest', 'backhanded', 'hostile'] as const).map((key) => (
                      <li key={key}>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                          <span
                            className="size-2 rounded-full"
                            style={{ background: QUADRANTS[key].color }}
                          />
                          {QUADRANTS[key].label}
                        </div>
                        <p className="mt-0.5 pl-3.5 text-xs leading-snug text-ink-soft">
                          {QUADRANTS[key].description}
                        </p>
                        <p className="mt-0.5 pl-3.5 text-2xs leading-snug text-muted">
                          {QUADRANTS[key].traits.slice(0, 3).join(' · ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </details>
              </Card>
            </div>
          </div>

          <Card className="mt-5">
            <CardHeader
              title="Over time"
              subtitle="Rolling 5-comment average. Dots are individual ratings."
              action={
                <div className="flex shrink-0 gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3 rounded-full bg-[var(--content)]" />
                    Content
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 border-t-2 border-dashed border-[var(--delivery)]" />
                    Delivery
                  </span>
                </div>
              }
            />
            <div className="px-2 pb-3 sm:px-4">
              <TrendChart comments={comments} />
            </div>
          </Card>

          <Card className="mt-5">
            <CardHeader
              title="Topics"
              subtitle="How conversation subjects tend to land."
            />
            {topicRows.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted">
                Add topics when you log comments to see this breakdown.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-line border-t border-line sm:hidden">
                  {topicRows.map((row) => (
                    <li key={row.topic.id} className="flex gap-3 px-4 py-3">
                      <span
                        className="mt-1.5 size-2.5 shrink-0 rounded-full"
                        style={{ background: row.topic.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-ink">
                            {row.topic.name}
                          </p>
                          {row.dominant ? (
                            <QuadrantBadge quadrant={row.dominant} size="sm" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {row.count} {row.count === 1 ? 'comment' : 'comments'} · Content{' '}
                          <span className={signTone(row.avgContent)}>
                            {formatSigned(row.avgContent)}
                          </span>{' '}
                          · Delivery{' '}
                          <span className={signTone(row.avgDelivery)}>
                            {formatSigned(row.avgDelivery)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          Last {relativeDay(row.lastAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[520px] text-left text-xs">
                    <thead className="border-y border-line text-2xs uppercase tracking-[0.12em] text-muted">
                      <tr>
                        <th className="px-5 py-2 font-semibold">Topic</th>
                        <th className="px-3 py-2 font-semibold">Comments</th>
                        <th className="px-3 py-2 font-semibold">Content</th>
                        <th className="px-3 py-2 font-semibold">Delivery</th>
                        <th className="px-3 py-2 font-semibold">Skew</th>
                        <th className="px-5 py-2 text-right font-semibold">Last</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topicRows.map((row) => (
                        <tr
                          key={row.topic.id}
                          className="border-b border-line last:border-0"
                        >
                          <td className="px-5 py-2.5">
                            <span className="flex items-center gap-1.5 font-medium text-ink">
                              <span
                                className="size-2 rounded-full"
                                style={{ background: row.topic.color }}
                              />
                              {row.topic.name}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-muted">
                            {row.count}
                          </td>
                          <td
                            className={cn(
                              'px-3 py-2.5 font-medium tabular-nums',
                              signTone(row.avgContent),
                            )}
                          >
                            {formatSigned(row.avgContent)}
                          </td>
                          <td
                            className={cn(
                              'px-3 py-2.5 font-medium tabular-nums',
                              signTone(row.avgDelivery),
                            )}
                          >
                            {formatSigned(row.avgDelivery)}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.dominant ? (
                              <QuadrantBadge quadrant={row.dominant} size="sm" />
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5 text-right text-xs text-muted">
                            {relativeDay(row.lastAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>

          <Card className="mt-5">
            <CardHeader
              title="Comment log"
              subtitle={`${comments.length} ${
                comments.length === 1 ? 'entry' : 'entries'
              }`}
            />
            <ul className="divide-y divide-line border-t border-line">
              {visibleComments.map((comment) => {
                const quadrant = quadrantOf(comment.content, comment.delivery)
                const meta = QUADRANTS[quadrant]
                return (
                  <li key={comment.id} className="flex gap-3 px-5 py-3.5">
                    <span
                      className="mt-0.5 w-1 shrink-0 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted">
                          {relativeDay(comment.occurredAt)} ·{' '}
                          {formatDay(comment.occurredAt)}
                        </span>
                        <QuadrantBadge quadrant={quadrant} size="sm" />
                      </div>
                      <p className="mt-1 max-w-[65ch] text-body leading-relaxed text-ink">
                        {comment.text ?? (
                          <span className="italic text-muted">No text recorded</span>
                        )}
                      </p>
                      {comment.topicIds.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {comment.topicIds.map((topicId) => {
                            const topic = topicById.get(topicId)
                            if (!topic) return null
                            return (
                              <span
                                key={topicId}
                                className="rounded bg-surface-2 px-1.5 py-0.5 text-2xs text-muted"
                              >
                                {topic.name}
                              </span>
                            )
                          })}
                        </div>
                      ) : null}
                      <p className="mt-1.5 text-xs text-muted">
                        {comment.effect
                          ? `${EFFECT_META[comment.effect].label} · `
                          : ''}
                        Content {formatSigned(comment.content)} · Delivery{' '}
                        {formatSigned(comment.delivery)}
                        {comment.intensity ? ` · Intensity ${comment.intensity}` : ''}
                      </p>
                      {comment.note ? (
                        <p className="mt-1 max-w-[65ch] text-xs italic text-muted">{comment.note}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteComment(comment)}
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-hostile/10 hover:text-hostile"
                      aria-label="Delete comment"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                )
              })}
            </ul>
            {comments.length > 6 ? (
              <div className="border-t border-line px-5 py-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll((value) => !value)}
                  className="min-h-10 px-3 py-2 text-xs font-medium text-accent hover:underline"
                >
                  {showAll ? 'Show fewer' : `Show all ${comments.length}`}
                </button>
              </div>
            ) : null}
          </Card>
        </>
      )}

      <PersonFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        person={person}
        onDeleted={() => navigate('/people')}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint?: string
  className?: string
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-ink',
          className,
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </Card>
  )
}

function SelectedComment({
  comment,
  topicNames,
  onDelete,
}: {
  comment: Comment
  topicNames: string[]
  onDelete: () => void
}) {
  const quadrant = quadrantOf(comment.content, comment.delivery)
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">
            {formatDay(comment.occurredAt)}
          </span>
          <QuadrantBadge quadrant={quadrant} size="sm" />
        </div>
        <p className="mt-1 max-w-[65ch] text-body leading-relaxed text-ink">
          {comment.text ?? <span className="italic text-muted">No text recorded</span>}
        </p>
        {topicNames.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {topicNames.map((name) => (
              <span
                key={name}
                className="rounded bg-surface-2 px-1.5 py-0.5 text-2xs text-muted"
              >
                {name}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-1.5 text-xs text-muted">
          {comment.effect ? `${EFFECT_META[comment.effect].label} · ` : ''}
          Content {formatSigned(comment.content)} · Delivery {formatSigned(comment.delivery)}
          {comment.intensity ? ` · Intensity ${comment.intensity}` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-hostile/10 hover:text-hostile"
        aria-label="Delete comment"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
