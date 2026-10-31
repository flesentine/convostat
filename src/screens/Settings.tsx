import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { db } from '../db/db'
import {
  clearAllData,
  exportBackupJson,
  exportCommentsCsv,
  importBackup,
} from '../db/backup'
import { seedSampleData } from '../db/sample'
import type { Topic } from '../db/types'
import { TOPIC_COLORS } from '../domain/scoring'
import { useTheme, type Theme } from '../lib/theme'
import { cn, uid } from '../lib/utils'
import { Button } from '../components/Button'
import { Card, CardHeader } from '../components/Card'
import { Modal } from '../components/Modal'

interface Status {
  tone: 'ok' | 'error'
  text: string
}

const THEMES: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
]

export function Settings() {
  const { theme, setTheme } = useTheme()
  const persons = useLiveQuery(() => db.persons.count(), [], 0)
  const comments = useLiveQuery(() => db.comments.toArray(), [], [])
  const topics = useLiveQuery(() => db.topics.orderBy('name').toArray(), [], [])
  const [status, setStatus] = useState<Status | null>(null)
  const [pendingImport, setPendingImport] = useState<{
    text: string
    name: string
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const report = (tone: Status['tone'], text: string) => setStatus({ tone, text })

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(null), 4500)
    return () => window.clearTimeout(timer)
  }, [status])

  const handleExportJson = async () => {
    const count = await exportBackupJson()
    report('ok', `Exported ${count} comments as JSON.`)
  }

  const handleExportCsv = async () => {
    const count = await exportCommentsCsv()
    report('ok', `Exported ${count} comments as CSV.`)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      setPendingImport({ text, name: file.name })
    } catch {
      report('error', 'Could not read that file.')
    }
  }

  const runImport = async (mode: 'merge' | 'replace') => {
    if (!pendingImport) return
    try {
      const result = await importBackup(pendingImport.text, mode)
      report(
        'ok',
        `${mode === 'replace' ? 'Replaced with' : 'Merged'} ${result.comments} ${
          result.comments === 1 ? 'comment' : 'comments'
        }, ${result.persons} ${result.persons === 1 ? 'person' : 'people'} and ${
          result.topics
        } ${result.topics === 1 ? 'topic' : 'topics'}.`,
      )
      setPendingImport(null)
    } catch (error) {
      report(
        'error',
        `Import failed: ${error instanceof Error ? error.message : 'invalid file'}`,
      )
    }
  }

  const handleSample = async () => {
    if (persons > 0 || comments.length > 0) {
      if (
        !window.confirm(
          'Load sample data alongside what you have? A previous sample set will be replaced.',
        )
      ) {
        return
      }
    }
    await seedSampleData()
    report('ok', 'Sample data loaded. Explore the People tab.')
  }

  const handleClear = async () => {
    if (
      !window.confirm(
        'Delete every person, topic and comment? This cannot be undone. Export a backup first if you want to keep it.',
      )
    ) {
      return
    }
    await clearAllData()
    report('ok', 'All data cleared.')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Everything here stays in this browser. No account, no server.
        </p>
      </div>

      {status ? (
        <div
          className={cn(
            'fixed inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-start gap-2 rounded-xl border px-4 py-3 text-xs shadow-lg sm:bottom-6',
            status.tone === 'ok'
              ? 'border-warm/40 bg-surface text-ink-soft'
              : 'border-hostile/40 bg-surface text-hostile',
          )}
          role="status"
        >
          <p className="flex-1 leading-relaxed">{status.text}</p>
          <button
            type="button"
            onClick={() => setStatus(null)}
            className="-m-1.5 flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink"
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Appearance"
          subtitle="Follow your system, or pin a theme."
        />
        <div className="flex flex-wrap gap-1.5 px-5 pb-5">
          {THEMES.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={theme === option.value}
                className={cn(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-xs font-medium transition',
                  theme === option.value
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line-strong text-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                <Icon size={14} />
                {option.label}
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="Your data"
          subtitle={`${persons} ${persons === 1 ? 'person' : 'people'} · ${
            comments.length
          } ${comments.length === 1 ? 'comment' : 'comments'} · ${topics.length} topics`}
        />
        <div className="space-y-4 px-5 pb-5">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => void handleExportJson()}>
              <FileJson size={14} />
              Export JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void handleExportCsv()}>
              <FileSpreadsheet size={14} />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} />
              Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                void handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>

          <div className="rounded-xl border border-line bg-surface-2/50 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <Database size={14} />
              Backups matter
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Browsers can clear local storage when space runs low. Export a JSON backup
              now and then — it is the only copy of this log.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <Button variant="secondary" size="sm" onClick={() => void handleSample()}>
              <Download size={14} />
              Load sample data
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleClear()}
              disabled={persons === 0 && comments.length === 0 && topics.length === 0}
            >
              <Trash2 size={14} />
              Clear all data
            </Button>
          </div>
        </div>
      </Card>

      <TopicManager topics={topics} comments={comments} onStatus={report} />

      <Card className="mt-4">
        <CardHeader title="About" subtitle="Convostat 0.1.0" />
        <div className="space-y-2 px-5 pb-5 text-xs leading-relaxed text-muted">
          <p>
            A local-first journal for how people talk to you. Rate what was said
            (content) and how it was said (delivery), then watch the pattern.
          </p>
          <p>
            Built as a progressive web app. Add it to your home screen for one-tap
            logging, and use Export JSON to move your data between devices.
          </p>
        </div>
      </Card>

      <Modal
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Import backup"
        description={
          pendingImport
            ? `Choose how to bring in ${pendingImport.name}.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => void runImport('merge')}>
              Merge
            </Button>
            <Button variant="danger" onClick={() => void runImport('replace')}>
              Replace everything
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-soft">
          <strong className="font-semibold text-ink">Merge</strong> keeps what you have
          and adds the backup, overwriting entries with the same ID.
          <br />
          <strong className="font-semibold text-ink">Replace</strong> deletes everything
          here first.
        </p>
      </Modal>
    </div>
  )
}

function TopicManager({
  topics,
  comments,
  onStatus,
}: {
  topics: Topic[]
  comments: Array<{ topicIds: string[] }>
  onStatus: (tone: Status['tone'], text: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newName, setNewName] = useState('')

  const counts = new Map<string, number>()
  for (const comment of comments) {
    for (const topicId of comment.topicIds) {
      counts.set(topicId, (counts.get(topicId) ?? 0) + 1)
    }
  }

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id)
    setEditingName(topic.name)
  }

  const saveEdit = async (topic: Topic) => {
    const name = editingName.trim()
    if (!name) {
      setEditingId(null)
      return
    }
    const duplicate = topics.find(
      (entry) => entry.id !== topic.id && entry.name.toLowerCase() === name.toLowerCase(),
    )
    if (duplicate) {
      onStatus('error', `A topic named “${name}” already exists.`)
      return
    }
    await db.topics.put({ ...topic, name })
    setEditingId(null)
    onStatus('ok', `Renamed to “${name}”.`)
  }

  const remove = async (topic: Topic) => {
    if (
      !window.confirm(
        `Delete the topic “${topic.name}”? It will be removed from ${counts.get(topic.id) ?? 0} comments.`,
      )
    ) {
      return
    }
    await db.transaction('rw', db.topics, db.comments, async () => {
      const all = await db.comments.toArray()
      const affected = all.filter((comment) => comment.topicIds.includes(topic.id))
      await db.comments.bulkPut(
        affected.map((comment) => ({
          ...comment,
          topicIds: comment.topicIds.filter((id) => id !== topic.id),
        })),
      )
      await db.topics.delete(topic.id)
    })
    onStatus('ok', `Deleted “${topic.name}”.`)
  }

  const add = async () => {
    const name = newName.trim()
    if (!name) return
    if (topics.some((topic) => topic.name.toLowerCase() === name.toLowerCase())) {
      onStatus('error', `A topic named “${name}” already exists.`)
      return
    }
    await db.topics.put({
      id: uid(),
      name,
      color: TOPIC_COLORS[topics.length % TOPIC_COLORS.length],
      createdAt: Date.now(),
    })
    setNewName('')
    onStatus('ok', `Added “${name}”.`)
  }

  return (
    <Card className="mt-4">
      <CardHeader
        title="Topics"
        subtitle="Rename or remove subjects. Removing a topic leaves the comments intact."
      />
      <div className="px-5 pb-5">
        {topics.length === 0 ? (
          <p className="mb-3 text-xs text-muted">
            No topics yet. Add one below, or create them while logging a comment.
          </p>
        ) : (
          <ul className="mb-4 divide-y divide-line rounded-xl border border-line">
            {topics.map((topic) => (
              <li
                key={topic.id}
                className="flex items-center gap-1 px-2 py-1.5"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: topic.color }}
                />
                {editingId === topic.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onBlur={() => void saveEdit(topic)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void saveEdit(topic)
                      if (event.key === 'Escape') setEditingId(null)
                    }}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2.5 text-base text-ink outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 sm:text-xs"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(topic)}
                    className="min-h-10 min-w-0 flex-1 truncate text-left text-[13px] font-medium text-ink"
                  >
                    {topic.name}
                  </button>
                )}
                <span className="text-[11px] tabular-nums text-muted">
                  {counts.get(topic.id) ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(topic)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink sm:size-8"
                  aria-label={`Rename ${topic.name}`}
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(topic)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-hostile/10 hover:text-hostile sm:size-8"
                  aria-label={`Delete ${topic.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void add()
            }}
            placeholder="New topic"
            className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink outline-none transition placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20 sm:text-xs"
          />
          <Button variant="secondary" size="sm" onClick={() => void add()} disabled={!newName.trim()}>
            <Plus size={14} />
            Add
          </Button>
        </div>
      </div>
    </Card>
  )
}
