import { describe, expect, it } from 'bun:test'

import { Simulator } from '../simulator'

const BIG_SEED = 790006 // 2m total_votes

const msSince = (startDate: Date) => new Date().getTime() - startDate.getTime()

describe('speed tests', () => {
  it('simulates a big election quickly', () => {
    const initStart = new Date()
    // Initialize election
    const s = new Simulator(BIG_SEED)
    const { totalVotes } = s.election
    const initDuration = msSince(initStart)

    expect(totalVotes).toBe(2_028_787)
    // Initializes in less than 5ms
    expect(initDuration).toBeLessThan(10)

    // Simulate 1k A tests
    const firstSetStart = new Date()
    s.test('a1000')
    const firstSetDuration = msSince(firstSetStart)
    expect(s.get('A').compromises[0]).toBe(486) // Confirm it ran, checking against known compromises

    // Web GUI does it in ~300ms
    expect(firstSetDuration).toBeGreaterThan(5) // getting ~15ms
    expect(firstSetDuration).toBeLessThan(50)
    // console.log({ firstSetDuration })
  })

  it('simulates a big election & 50k tests quickly', () => {
    const initStart = new Date()
    // Initialize election
    const s = new Simulator(BIG_SEED)
    const { totalVotes } = s.election
    const initDuration = msSince(initStart)

    expect(totalVotes).toBe(2_028_787)
    // Initializes in less than 5ms
    expect(initDuration).toBeLessThan(10)

    // Simulate: a50k b1k c50
    const testSetStart = new Date()
    s.test('a50000b1000c50')
    const testSetDuration = msSince(testSetStart)
    expect(s.get('A').compromises[0]).toBe(24701) // Confirm it ran, checking against known compromises

    // Web GUI does it in ~480ms
    expect(testSetDuration).toBeGreaterThan(5) // getting ~230ms
    expect(testSetDuration).toBeLessThan(350)
    // console.log({ testSetDuration })
  })

  const moreTestCases: [string, number][] = [
    ['b2000', 2400], // B only
    ['c50000', 130], // Quadrant logic edge case
    ['a10b10c10', 140], // Light load sanity check
    ['a50000b1000c1000', 300], // Higher C test volume
    ['a2000000', 6000], // Stress test run A perf & sampler
    ['a1000000b1000000c1000000', 9000], // Max concurrency potential
  ]

  moreTestCases.forEach(([testCase, expectedTime]) => {
    it(`simulates ${testCase} tests quickly`, () => {
      const initStart = new Date()
      const s = new Simulator(BIG_SEED)
      const { totalVotes } = s.election
      const initDuration = msSince(initStart)

      expect(totalVotes).toBe(2_028_787)
      // Initializes in less than 5ms
      expect(initDuration).toBeLessThan(10)

      const testSetStart = new Date()
      s.test(testCase)
      const testSetDuration = msSince(testSetStart)

      expect(testSetDuration).toBeLessThan(+expectedTime)
    })
  })
})
