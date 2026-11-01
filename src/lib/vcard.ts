/**
 * Minimal vCard reader for contact import. We only need display names; phone
 * numbers, emails, and other fields are intentionally ignored and never stored.
 */
export function namesFromVCards(text: string): string[] {
  const unfolded = text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '')
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1)
  const names: string[] = []

  for (const card of cards) {
    const body = card.split(/END:VCARD/i)[0] ?? ''
    const formatted = valueOf(body, 'FN')
    if (formatted) {
      names.push(cleanName(formatted))
      continue
    }
    const structured = valueOf(body, 'N')
    if (!structured) continue
    const [family, given, additional] = structured.split(';')
    const name = [given, additional, family]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ')
    if (name) names.push(cleanName(name))
  }

  return names.filter(Boolean)
}

function valueOf(body: string, property: string): string {
  const match = body.match(new RegExp(`^${property}(?:;[^:]*)?:(.*)$`, 'im'))
  return match?.[1]?.trim() ?? ''
}

function cleanName(value: string): string {
  return value
    .replace(/\\n/gi, ' ')
    .replace(/\\([,;\\])/g, '$1')
    .replace(/^"|"$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
