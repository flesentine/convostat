import { useEffect, useState } from 'react'
import { db } from '../db/db'
import type { Person, Relationship } from '../db/types'
import { PERSON_COLORS, RELATIONSHIP_LABELS } from '../domain/scoring'
import { cn, uid } from '../lib/utils'
import { Button } from './Button'
import { Modal } from './Modal'

const RELATIONSHIPS: Relationship[] = ['work', 'family', 'friend', 'partner', 'other']

interface PersonFormModalProps {
  open: boolean
  onClose: () => void
  person?: Person
  onSaved?: (person: Person) => void
  onDeleted?: () => void
}

export function PersonFormModal({
  open,
  onClose,
  person,
  onSaved,
  onDeleted,
}: PersonFormModalProps) {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState<Relationship>('work')
  const [color, setColor] = useState(PERSON_COLORS[0])

  useEffect(() => {
    if (!open) return
    setName(person?.name ?? '')
    setRelationship(person?.relationship ?? 'work')
    setColor(person?.color ?? PERSON_COLORS[Math.floor(Math.random() * PERSON_COLORS.length)])
  }, [open, person])

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (person) {
      const updated = { ...person, name: trimmed, relationship, color }
      await db.persons.put(updated)
      onSaved?.(updated)
    } else {
      const created: Person = {
        id: uid(),
        name: trimmed,
        relationship,
        color,
        createdAt: Date.now(),
      }
      await db.persons.add(created)
      onSaved?.(created)
    }
    onClose()
  }

  const remove = async () => {
    if (!person) return
    if (!window.confirm(`Delete ${person.name} and every comment from them?`)) return
    await db.transaction('rw', db.persons, db.comments, async () => {
      await db.comments.where('personId').equals(person.id).delete()
      await db.persons.delete(person.id)
    })
    onClose()
    onDeleted?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={person ? 'Edit person' : 'Add someone'}
      description={
        person
          ? 'Update their details or remove them from your log.'
          : 'Who is this about? You can change this later.'
      }
      footer={
        <>
          {person ? (
            <Button variant="danger" className="mr-auto" onClick={() => void remove()}>
              Delete
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={!name.trim()}>
            {person ? 'Save' : 'Add person'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Name
          </span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void save()
            }}
            placeholder="e.g. Maya Chen"
            className="h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-base text-ink outline-none transition placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20 sm:text-sm"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Relationship
          </span>
          <div className="flex flex-wrap gap-1.5">
            {RELATIONSHIPS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRelationship(option)}
                className={cn(
                  'min-h-10 rounded-lg border px-3.5 py-2 text-xs font-medium transition',
                  relationship === option
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line-strong text-ink-soft hover:bg-surface-2',
                )}
              >
                {RELATIONSHIP_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Color
          </span>
          <div className="flex flex-wrap gap-2">
            {PERSON_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Use color ${option}`}
                aria-pressed={color === option}
                className={cn(
                  'size-9 rounded-full border-2 transition sm:size-7',
                  color === option ? 'border-ink' : 'border-transparent',
                )}
                style={{ background: option }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
