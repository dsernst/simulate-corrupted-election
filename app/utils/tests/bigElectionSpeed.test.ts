import { describe, expect, it } from 'bun:test'

import { Simulator } from '../simulator'

const BIG_SEED = 790006 // 2m total_votes

const msSince = (startDate: Date) => new Date().getTime() - startDate.getTime()

describe('speed tests', () => {
  it('quickly simulates big election + a1k', () => {
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

  it('quickly simulates big election + a50k b1k c50', () => {
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
    expect(testSetDuration).toBeGreaterThan(5) // getting ~200ms
    expect(testSetDuration).toBeLessThan(350)
    // console.log({ testSetDuration })
  })

  const moreTestCases: [string, number, number][] = [
    ['b2000', 50, 1473], // B only
    ['c50000', 130, 39572], // Quadrant logic edge case
    ['a10 b10 c10', 140, 22], // Light load sanity check
    ['a50000 b1000 c1000', 300, 26_211], // Higher C test volume
    ['a2000000', 6000, 991_039], // Stress test run A perf & sampler
    ['a1000000 b1000000 c1000000', 9000, 2_009_191], // Max concurrency potential
  ]

  moreTestCases.forEach(([testCase, expectedTime, expectedCompromises]) => {
    it(`quickly simulates ${testCase}`, () => {
      // Set up election
      const initStart = new Date()
      const s = new Simulator(BIG_SEED)
      const { totalVotes } = s.election
      const initDuration = msSince(initStart)

      expect(totalVotes).toBe(2_028_787)
      // Initializes in less than 5ms
      expect(initDuration).toBeLessThan(10)

      // Confirm tests run fast enough
      const testSetStart = new Date()
      s.test(testCase)
      const testSetDuration = msSince(testSetStart)
      expect(testSetDuration).toBeLessThan(+expectedTime)

      // And confirm expected compromises #s
      expect(s.totalCompromisesSeen).toBe(expectedCompromises)
    })
  })
})
