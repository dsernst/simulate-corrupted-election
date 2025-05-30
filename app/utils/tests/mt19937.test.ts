import { describe, expect, it } from 'bun:test'

import { MT19937 } from '../mt19937'

describe('MT19937', () => {
  it('produces reproducible sequences', () => {
    const a = new MT19937(12345)
    const b = new MT19937(12345)
    for (let i = 0; i < 10; i++) {
      expect(a.random()).toBe(b.random())
    }
  })

  it('produces different sequences for different seeds', () => {
    const a = new MT19937(12345)
    const b = new MT19937(54321)
    let different = false
    for (let i = 0; i < 10; i++) {
      if (a.random() !== b.random()) different = true
    }
    expect(different).toBe(true)
  })

  it('output is always in [0, 1)', () => {
    const mt = new MT19937(0)
    for (let i = 0; i < 1000; i++) {
      const v = mt.random()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  // Known value test (first output for seed 5489 is ~0.8147236)
  it('matches known output for seed 5489', () => {
    const mt = new MT19937(5489)
    const first = mt.random()
    expect(Math.abs(first - 0.8147236)).toBeLessThan(1e-1)
  })
})
