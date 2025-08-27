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
    expect(s.totalCompromisesSeen).toBe(211) // Confirm it ran, checking against known compromises

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
    expect(s.totalCompromisesSeen).toBe(10001) // Confirm it ran, checking against known compromises

    // Web GUI does it in ~450ms
    expect(testSetDuration).toBeGreaterThan(5)
    expect(testSetDuration).toBeLessThan(650) // getting ~170ms
    // console.log({ testSetDuration })
  })

  const moreTestCases: [string, number, number][] = [
    ['b2k', 50, 189], // B only
    ['c50k', 140, 1484], // Quadrant logic edge case
    ['a10 b10 c10', 200, 3], // Light load sanity check
    ['a50k b1k c1k', 250, 10031], // Higher C test volume
    // ['a2m', 750, 388_721], // Stress test run A perf & sampler
    // ['a1m b1m c1m', 3000, 327_723], // Max concurrency potential
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

  const intersectionCases: [string, number, number][] = [
    ['a300k b1k c50', 58262, 150], // Getting ~90ms
    // ['a1m b1m', 194075, 1000], // Getting ~700ms
  ]

  intersectionCases.forEach(([testCase, expectedCompromises, expectedTime]) => {
    it(`quickly calcs intersections: ${testCase}`, () => {
      const s = new Simulator(BIG_SEED)
      // const initTime = new Date()
      s.test(testCase)
      // const testDuration = msSince(initTime)
      // console.log({ testDuration })

      // Calc intersections
      const startIntersections = new Date()
      const intersections = s.getIntersections()
      const intersectionsDuration = msSince(startIntersections)

      // Confirm it calc'd intersections properly
      expect(intersections.length).toBe(19)
      expect(intersections[0].compromises[0]).toBe(expectedCompromises)

      // And that it was fast
      // console.log({ intersectionsDuration })
      expect(intersectionsDuration).toBeLessThan(expectedTime)
    })
  })
})
