import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  CornerDownLeft,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react'
import { db } from '../db/db'
import type { Effect, Person } from '../db/types'
import {
  CONTENT_LABELS,
  DELIVERY_LABELS,
  QUADRANTS,
  formatSigned,
  quadrantOf,
} from '../domain/scoring'
import { cn, uid } from '../lib/utils'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/Primitives'
import { PersonFormModal } from '../components/PersonFormModal'
import { QuadrantPad } from '../components/QuadrantPad'
import { RatingSlider } from '../components/RatingSlider'
import { TopicChips } from '../components/TopicChips'

const EFFECT_OPTIONS: Array<{ value: Effect; label: string; className: string }> = [
  { value: 'worse', label: 'Worse', className: 'border-hostile/40 text-hostile' },
  { value: 'same', label: 'Same', className: 'border-line-strong text-ink-soft' },
  { value: 'better', label: 'Better', className: 'border-warm/40 text-warm' },
]

export function Capture() {
  const persons = useLiveQuery(() => db.persons.orderBy('createdAt').toArray(), [], [])
  const topics = useLiveQuery(() => db.topics.orderBy('name').toArray(), [], [])
  const recentComments = useLiveQuery(
    () => db.comments.orderBy('occurredAt').reverse().limit(300).toArray(),
    [],
    [],
  )

  const [personId, setPersonId] = useState('')
  const [searchParams] = useSearchParams()
  const requestedPersonId = searchParams.get('person')
  const appliedRequest = useRef<string | null>(null)
  const [text, setText] = useState('')
  const [topicIds, setTopicIds] = useState<string[]>([])
  const [content, setContent] = useState(0)
  const [delivery, setDelivery] = useState(0)
  const [intensity, setIntensity] = useState(3)
  const [effect, setEffect] = useState<Effect | ''>('')
  const [note, setNote] = useState('')
  const [showDetail, setShowDetail] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<number | undefined>(undefined)

  const recentPersons = useMemo(() => {
    const byId = new Map(persons.map((person) => [person.id, person]))
    const ordered: Person[] = []
    const seen = new Set<string>()
    for (const comment of recentComments) {
      if (seen.has(comment.personId)) continue
      seen.add(comment.personId)
      const person = byId.get(comment.personId)
      if (person) ordered.push(person)
      if (ordered.length >= 8) break
    }
    if (ordered.length < 8) {
      const byCreated = [...persons].sort((a, b) => b.createdAt - a.createdAt)
      for (const person of byCreated) {
        if (ordered.some((entry) => entry.id === person.id)) continue
        ordered.push(person)
        if (ordered.length >= 8) break
      }
    }
    return ordered
  }, [persons, recentComments])

  useEffect(() => {
    if (persons.length === 0) {
      setPersonId('')
      return
    }
    if (
      requestedPersonId &&
      appliedRequest.current !== requestedPersonId &&
      persons.some((person) => person.id === requestedPersonId)
    ) {
      appliedRequest.current = requestedPersonId
      setPersonId(requestedPersonId)
      return
    }
    if (!persons.some((person) => person.id === personId)) {
      setPersonId(recentPersons[0]?.id ?? persons[0].id)
    }
  }, [persons, recentPersons, personId, requestedPersonId])

  useEffect(() => {
    return () => window.clearTimeout(savedTimer.current)
  }, [])

  const quadrant = quadrantOf(content, delivery)
  const meta = QUADRANTS[quadrant]
  const selectedPerson = persons.find((person) => person.id === personId)

  const submit = async () => {
    if (!personId) return
    const now = Date.now()
    await db.comments.add({
      id: uid(),
      personId,
      occurredAt: now,
      createdAt: now,
      text: text.trim() || undefined,
      topicIds,
      content,
      delivery,
      intensity: showDetail ? intensity : undefined,
      effect: effect || undefined,
      note: note.trim() || undefined,
    })
    setText('')
    setTopicIds([])
    setContent(0)
    setDelivery(0)
    setIntensity(3)
    setEffect('')
    setNote('')
    setSaved(true)
    window.clearTimeout(savedTimer.current)
    savedTimer.current = window.setTimeout(() => setSaved(false), 1800)
  }

  if (persons.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeading />
        <EmptyState
          icon={<Users size={28} />}
          title="Add someone to start logging"
          body="Convostat tracks how a person's comments land with you — what they said, how they said it, and how it left you feeling."
          action={
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={16} />
              Add someone
            </Button>
          }
        />
        <PersonFormModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSaved={(person) => setPersonId(person.id)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading />

      <Card className="p-5 sm:p-6">
        <div>
          <SectionLabel>Who said it</SectionLabel>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {recentPersons.map((person) => {
              const selected = person.id === personId
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setPersonId(person.id)}
                  className={cn(
                    'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition',
                    selected
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line-strong text-ink-soft hover:bg-surface-2',
                  )}
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: person.color }}
                  />
                  {person.name}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full border border-dashed border-line-strong px-3.5 py-2 text-[13px] font-medium text-muted transition hover:border-accent/50 hover:text-accent"
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel>What did they say?</SectionLabel>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                void submit()
              }
            }}
            rows={3}
            placeholder="Paste the gist of it — or leave this blank if you just want to rate the feeling."
            className="w-full resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-base leading-relaxed text-ink outline-none transition placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20 sm:text-sm"
          />
        </div>

        <div className="mt-5">
          <SectionLabel>Topics</SectionLabel>
          <TopicChips topics={topics} selected={topicIds} onChange={setTopicIds} />
        </div>

        <div className="mt-7 grid gap-7 md:grid-cols-[minmax(0,1fr)_230px]">
          <div className="order-1 space-y-7">
            <RatingSlider
              label="Content"
              hint="what was said"
              value={content}
              onChange={setContent}
              labels={CONTENT_LABELS}
              color="var(--content)"
            />
            <RatingSlider
              label="Delivery"
              hint="how it was said"
              value={delivery}
              onChange={setDelivery}
              labels={DELIVERY_LABELS}
              color="var(--delivery)"
            />
          </div>

          <div className="order-2">
            <div className="mx-auto w-full max-w-[250px] md:max-w-[230px]">
              <QuadrantPad
                content={content}
                delivery={delivery}
                onChange={(nextContent, nextDelivery) => {
                  setContent(nextContent)
                  setDelivery(nextDelivery)
                }}
              />
              <div className="mt-2 text-center">
                <p className="text-sm font-semibold" style={{ color: meta.color }}>
                  {meta.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">
                  {meta.description}
                </p>
                <p className="mt-1 text-[11px] font-medium tabular-nums text-muted">
                  Content {formatSigned(content, 0)} · Delivery{' '}
                  {formatSigned(delivery, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setShowDetail((value) => !value)}
            className="flex min-h-10 items-center gap-1.5 py-2 text-xs font-medium text-muted transition hover:text-ink"
            aria-expanded={showDetail}
          >
            <ChevronDown
              size={14}
              className={cn('transition-transform', showDetail && 'rotate-180')}
            />
            Add detail — intensity, how it landed, a private note
          </button>

          {showDetail ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <SectionLabel>Intensity</SectionLabel>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setIntensity(value)}
                      aria-pressed={intensity === value}
                      className={cn(
                        'size-10 rounded-lg border text-xs font-semibold transition',
                        intensity === value
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line-strong text-muted hover:bg-surface-2',
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>How it landed</SectionLabel>
                <div className="flex gap-1.5">
                  {EFFECT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setEffect((current) =>
                          current === option.value ? '' : option.value,
                        )
                      }
                      aria-pressed={effect === option.value}
                      className={cn(
                        'min-h-10 rounded-lg border px-3.5 py-2.5 text-xs font-medium transition',
                        effect === option.value
                          ? option.className
                          : 'border-line-strong text-muted hover:bg-surface-2',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="sm:col-span-2">
                <SectionLabel>Private note</SectionLabel>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Anything you want to remember about the moment."
                  className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-base text-ink outline-none transition placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20 sm:text-sm"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden items-center gap-1.5 text-[11px] text-muted sm:flex">
            <CornerDownLeft size={12} />
            <kbd className="rounded border border-line bg-surface-2 px-1 py-0.5 font-sans text-[10px]">
              ⌘
            </kbd>
            <span>+</span>
            <kbd className="rounded border border-line bg-surface-2 px-1 py-0.5 font-sans text-[10px]">
              Enter
            </kbd>
            to save
          </p>
          <Button
            variant="primary"
            className="w-full sm:w-auto sm:min-w-40"
            onClick={() => void submit()}
            disabled={!selectedPerson}
          >
            {saved ? (
              <>
                <Check size={16} />
                Saved
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Log comment
              </>
            )}
          </Button>
        </div>
      </Card>

      <p className="mt-3 text-center text-[11px] text-muted">
        {selectedPerson
          ? `Adding to ${selectedPerson.name}'s log. Everything stays on this device.`
          : 'Choose a person to log a comment.'}
      </p>

      <PersonFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(person) => setPersonId(person.id)}
      />
    </div>
  )
}

function PageHeading() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
        Log a comment
      </h1>
      <p className="mt-1 text-sm text-muted">
        Capture how it landed while it&apos;s still fresh. Ten seconds is enough.
      </p>
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </span>
  )
}
