import { describe, expect, it } from 'vitest'
import { commentQuadrant, quadrantOf } from './scoring'

describe('quadrantOf', () => {
  it('maps positive content and kind delivery to warm', () => {
    expect(quadrantOf(1, 1)).toBe('warm')
    expect(quadrantOf(2, 2)).toBe('warm')
  })

  it('maps negative content and kind delivery to honest', () => {
    expect(quadrantOf(-1, 1)).toBe('honest')
    expect(quadrantOf(-2, 2)).toBe('honest')
  })

  it('maps negative content and harsh delivery to hostile', () => {
    expect(quadrantOf(-1, -1)).toBe('hostile')
    expect(quadrantOf(-2, -2)).toBe('hostile')
  })

  it('maps positive content and harsh delivery to backhanded', () => {
    expect(quadrantOf(1, -1)).toBe('backhanded')
    expect(quadrantOf(2, -2)).toBe('backhanded')
  })

  it('treats a zero axis as neutral', () => {
    expect(quadrantOf(0, 2)).toBe('neutral')
    expect(quadrantOf(2, 0)).toBe('neutral')
    expect(quadrantOf(0, 0)).toBe('neutral')
  })
})

describe('commentQuadrant', () => {
  it('reads scores from a comment', () => {
    expect(commentQuadrant({ content: -2, delivery: 1 })).toBe('honest')
  })
})
