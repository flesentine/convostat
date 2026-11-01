import { describe, expect, it } from 'vitest'
import { namesFromVCards } from './vcard'

describe('namesFromVCards', () => {
  it('reads formatted names', () => {
    const text = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Maya Chen',
      'N:Chen;Maya;;;',
      'END:VCARD',
    ].join('\r\n')
    expect(namesFromVCards(text)).toEqual(['Maya Chen'])
  })

  it('reads multiple contacts and folded lines', () => {
    const text = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Daniel Oka',
      ' for',
      'END:VCARD',
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Priya Raman',
      'END:VCARD',
    ].join('\n')
    expect(namesFromVCards(text)).toEqual(['Daniel Okafor', 'Priya Raman'])
  })

  it('falls back to the structured name', () => {
    const text = ['BEGIN:VCARD', 'N:Doe;Jane;Q;;', 'END:VCARD'].join('\n')
    expect(namesFromVCards(text)).toEqual(['Jane Q Doe'])
  })

  it('unescapes punctuation and ignores other fields', () => {
    const text = [
      'BEGIN:VCARD',
      'FN:Sam\\, Whitfield',
      'TEL:555-0100',
      'EMAIL:sam@example.com',
      'END:VCARD',
    ].join('\n')
    expect(namesFromVCards(text)).toEqual(['Sam, Whitfield'])
  })
})
