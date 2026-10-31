import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns'

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function formatDay(timestamp: number): string {
  return format(timestamp, 'MMM d, yyyy')
}

export function formatDayShort(timestamp: number): string {
  return format(timestamp, 'MMM d')
}

export function formatTime(timestamp: number): string {
  return format(timestamp, 'h:mm a')
}

export function relativeDay(timestamp: number): string {
  if (isToday(timestamp)) return 'Today'
  if (isYesterday(timestamp)) return 'Yesterday'
  return formatDistanceToNowStrict(timestamp, { addSuffix: true })
}

export function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Deterministic value in [-amount, amount] derived from a string. */
export function jitter(seed: string, amount: number): number {
  const hash = hashString(seed)
  return ((hash % 1000) / 1000 - 0.5) * 2 * amount
}
