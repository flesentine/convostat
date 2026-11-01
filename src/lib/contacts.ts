export interface PickedContact {
  name?: string[]
  tel?: string[]
  email?: string[]
  address?: string[]
  icon?: Blob[]
}

interface ContactsManager {
  getProperties(): Promise<string[]>
  select(
    properties: string[],
    options?: { multiple?: boolean },
  ): Promise<PickedContact[]>
}

declare global {
  interface Navigator {
    contacts?: ContactsManager
  }
}

export function supportsContactPicker(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window
  )
}

export async function pickContactNames(): Promise<string[]> {
  if (!navigator.contacts) return []
  const contacts = await navigator.contacts.select(['name'], { multiple: true })
  return contacts
    .map((contact) => contact.name?.[0]?.trim() ?? '')
    .filter(Boolean)
}
