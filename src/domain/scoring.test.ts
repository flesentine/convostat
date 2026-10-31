import { describe, expect, it } from 'vitest'
import {
  commentQuadrant,
  contentLabel,
  deliveryLabel,
  formatSigned,
  quadrantOf,
} from './scoring'

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

  it('maps the full range onto the same quadrants', () => {
    expect(quadrantOf(100, 100)).toBe('warm')
    expect(quadrantOf(-100, 100)).toBe('honest')
    expect(quadrantOf(-100, -100)).toBe('hostile')
    expect(quadrantOf(100, -100)).toBe('backhanded')
    expect(quadrantOf(0, 100)).toBe('neutral')
  })
})

describe('commentQuadrant', () => {
  it('reads scores from a comment', () => {
    expect(commentQuadrant({ content: -100, delivery: 50 })).toBe('honest')
  })
})

describe('labels', () => {
  it('describes scores across the full range', () => {
    expect(contentLabel(-100)).toBe('Very negative')
    expect(contentLabel(-30)).toBe('Negative')
    expect(contentLabel(0)).toBe('Neutral')
    expect(contentLabel(30)).toBe('Positive')
    expect(contentLabel(100)).toBe('Very positive')
    expect(deliveryLabel(-100)).toBe('Harsh')
    expect(deliveryLabel(-30)).toBe('Cold')
    expect(deliveryLabel(0)).toBe('Flat')
    expect(deliveryLabel(30)).toBe('Warm')
    expect(deliveryLabel(100)).toBe('Very kind')
  })
})

describe('formatSigned', () => {
  it('keeps integer scores tidy and averages precise', () => {
    expect(formatSigned(-62)).toBe('-62')
    expect(formatSigned(0)).toBe('0')
    expect(formatSigned(25)).toBe('+25')
    expect(formatSigned(12.34)).toBe('+12.3')
  })
})
