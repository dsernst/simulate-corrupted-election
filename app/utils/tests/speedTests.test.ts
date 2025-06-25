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
    s.test('a1k')
    const firstSetDuration = msSince(firstSetStart)
    expect(s.totalCompromisesSeen).toBe(501) // Confirm it ran, checking against known compromises

    // Web GUI does it in ~25ms
    expect(firstSetDuration).toBeGreaterThan(5)
    expect(firstSetDuration).toBeLessThan(35) // getting ~15ms
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
    s.test('a50k b1k c50')
    const testSetDuration = msSince(testSetStart)
    expect(s.totalCompromisesSeen).toBe(25516) // Confirm it ran, checking against known compromises

    // Web GUI does it in ~450ms
    expect(testSetDuration).toBeGreaterThan(5)
    expect(testSetDuration).toBeLessThan(650) // getting ~170ms
    // console.log({ testSetDuration })
  })

  const moreTestCases: [string, number, number][] = [
    ['b2k', 50, 1450], // B only
    ['c50k', 130, 39_670], // Quadrant logic edge case
    ['a10 b10 c10', 160, 15], // Light load sanity check
    ['a50k b1k c1k', 250, 26_269], // Higher C test volume
    // ['a2m', 750, 991_232], // Stress test run A perf & sampler
    // ['a1m b1m c1m', 3000, 2_008_765], // Max concurrency potential
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
      expect(initDuration).toBeLessThan(20)

      // Confirm tests run fast enough
      const testSetStart = new Date()
      s.test(testCase)
      const testSetDuration = msSince(testSetStart)
      expect(testSetDuration).toBeLessThan(+expectedTime)

      // And confirm expected compromises #s
      expect(s.totalCompromisesSeen).toBe(expectedCompromises)
    })
  })

  it('quickly calculates intersections too', () => {
    const s = new Simulator(BIG_SEED)
    s.test('a300k b1k c50')

    // Calc intersections
    const startTime = new Date()
    const intersections = s.getIntersections()
    const duration = msSince(startTime)

    // Confirm it calc'd intersections properly
    expect(intersections.length).toBe(19)
    expect(intersections[0].compromises[0]).toBe(148319)

    // And that it was fast
    expect(duration).toBeLessThan(500) // Getting ~1000ms
  })
})
