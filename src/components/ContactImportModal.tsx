import { useEffect, useRef, useState } from 'react'
import { ContactRound, Loader2, Plus, Upload, Users } from 'lucide-react'
import { db } from '../db/db'
import type { Relationship } from '../db/types'
import { PERSON_COLORS } from '../domain/scoring'
import { cn, uid } from '../lib/utils'
import { namesFromVCards } from '../lib/vcard'
import {
  pickContactNames,
  supportsContactPicker,
} from '../lib/contacts'
import { Button } from './Button'
import { Modal } from './Modal'

interface ContactImportModalProps {
  open: boolean
  onClose: () => void
}

type Message = { tone: 'ok' | 'error'; text: string }

const NORMALIZE = (name: string) => name.replace(/\s+/g, ' ').trim()

export function ContactImportModal({ open, onClose }: ContactImportModalProps) {
  const [pasted, setPasted] = useState('')
  const [message, setMessage] = useState<Message | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const pickerAvailable = supportsContactPicker()

  useEffect(() => {
    if (!open) {
      setPasted('')
      setMessage(null)
      setBusy(false)
    }
  }, [open])

  const runImport = async (names: string[]) => {
    const existing = await db.persons.toArray()
    const seen = new Set(
      existing.map((person) => person.name.toLowerCase()).filter(Boolean),
    )
    const unique: string[] = []
    let skipped = 0

    for (const raw of names) {
      const name = NORMALIZE(raw)
      if (!name) continue
      const key = name.toLowerCase()
      if (seen.has(key)) {
        skipped += 1
        continue
      }
      seen.add(key)
      unique.push(name)
    }

    if (unique.length === 0) {
      setMessage({
        tone: 'ok',
        text:
          skipped > 0
            ? 'No new people added — those names are already in your log.'
            : 'No names found. Try another file or paste one name per line.',
      })
      return 0
    }

    const now = Date.now()
    const relationship: Relationship = 'other'
    await db.persons.bulkAdd(
      unique.map((name, index) => ({
        id: uid(),
        name,
        relationship,
        color: PERSON_COLORS[(existing.length + index) % PERSON_COLORS.length],
        createdAt: now + index,
      })),
    )

    const added = unique.length
    setMessage({
      tone: 'ok',
      text: `Added ${added} ${added === 1 ? 'person' : 'people'}${
        skipped > 0
          ? `. ${skipped} ${skipped === 1 ? 'duplicate was' : 'duplicates were'} skipped.`
          : '.'
      }`,
    })
    return added
  }

  const handle = async (names: string[]) => {
    setBusy(true)
    setMessage(null)
    try {
      return await runImport(names)
    } catch (error) {
      setMessage({
        tone: 'error',
        text: `Could not import contacts: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      })
      return 0
    } finally {
      setBusy(false)
    }
  }

  const chooseFromPhone = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const names = await pickContactNames()
      if (names.length === 0) {
        setMessage({ tone: 'ok', text: 'No contacts selected.' })
        return
      }
      await runImport(names)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setMessage({
        tone: 'error',
        text: 'Could not open the contact picker. Check contact permissions and try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  const chooseFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      const names = namesFromVCards(await file.text())
      if (names.length === 0) {
        setMessage({
          tone: 'error',
          text: 'No names found in that file. Make sure it is a .vcf contact export.',
        })
        return
      }
      await runImport(names)
    } catch {
      setMessage({ tone: 'error', text: 'Could not read that file.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import contacts"
      description="Add people from your phone. Only names are stored — phone numbers and emails never leave your device."
      width="max-w-lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-5">
        {pickerAvailable ? (
          <section className="rounded-xl border border-line p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <ContactRound size={17} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Choose from contacts</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">
                  Select one or more people. Only their names are shared.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-3 w-full sm:w-auto"
              onClick={() => void chooseFromPhone()}
              disabled={busy}
            >
              <Users size={15} />
              Choose contacts
            </Button>
          </section>
        ) : (
          <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
            <p className="text-xs leading-relaxed text-muted">
              <strong className="font-semibold text-ink-soft">
                No contact picker in this browser.
              </strong>{' '}
              On iPhone, open a contact and tap Share → Save to Files, or export
              several from iCloud Contacts. You can also import a .vcf or paste names
              below.
            </p>
          </div>
        )}

        <section className="rounded-xl border border-line p-4">
          <p className="text-sm font-semibold text-ink">Import a .vcf file</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted">
            Export one or more contacts from the Contacts app, then choose the file
            here.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".vcf,text/vcard,text/x-vcard,text/plain"
            className="hidden"
            onChange={(event) => {
              void chooseFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <Button
            variant="secondary"
            className="mt-3 w-full sm:w-auto"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            <Upload size={15} />
            Choose .vcf file
          </Button>
        </section>

        <section>
          <label
            htmlFor="contact-names"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Or paste names
          </label>
          <textarea
            id="contact-names"
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            rows={4}
            placeholder={'Maya Chen\nDaniel Okafor'}
            className="w-full resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-base leading-relaxed text-ink outline-none transition placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20 sm:text-sm"
          />
          <Button
            variant="primary"
            className="mt-2 w-full sm:w-auto"
            disabled={!pasted.trim() || busy}
            onClick={() => {
              void (async () => {
                const added = await handle(pasted.split(/\n+/))
                if (added > 0) setPasted('')
              })()
            }}
          >
            <Plus size={15} />
            Add names
          </Button>
        </section>

        {message ? (
          <p
            role="status"
            className={cn(
              'rounded-xl border px-3.5 py-2.5 text-sm',
              message.tone === 'error'
                ? 'border-hostile/40 text-hostile'
                : 'border-warm/40 text-ink-soft',
            )}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Importing…
              </span>
            ) : (
              message.text
            )}
          </p>
        ) : busy ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-sm text-muted"
          >
            <Loader2 size={14} className="animate-spin" />
            Importing…
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
