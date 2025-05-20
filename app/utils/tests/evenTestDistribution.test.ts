import { describe, expect, test } from 'bun:test'
import { calculateTestResults } from '../simulation'
import { calculateLayeredStats } from '../calculateIntersections'
import { MT19937 } from '../mt19937'
import { testSet } from '../testSet'

describe('Even test distribution', () => {
  test('B tests should be split 50/50 between A and !A tested votes', () => {
    const seed = 12345
    const totalVotes = 100_000
    const compromisedVotes = 5_000
    const mt = new MT19937(seed)
    const globalVoteMap = new Map()

    // First run A tests on 1000 votes
    const aResults = calculateTestResults(
      testSet('a1000'),
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )

    // Then run B tests on 1000 votes
    const bResults = calculateTestResults(
      testSet('b1000'),
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )

    const testRuns = [
      { id: 1, results: aResults, timestamp: new Date() },
      { id: 2, results: bResults, timestamp: new Date() },
    ]

    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)

    // Get the intersection counts
    const bAndA = get('AB')?.tested ?? 0
    const bAndNotA = get('B!A')?.tested ?? 0
    const totalB = bAndA + bAndNotA

    // Verify B tests are split roughly 50/50
    // console.log({ bAndA, bAndNotA, totalB })
    expect(Math.abs(bAndA - bAndNotA)).toBeLessThanOrEqual(totalB * 0.1) // Allow 10% deviation
  })

  test('C tests should be split 25/25/25/25 across A/B combinations', () => {
    const seed = 12345
    const totalVotes = 100_000
    const compromisedVotes = 5_000
    const mt = new MT19937(seed)
    const globalVoteMap = new Map()

    // First run A tests on 1000 votes
    const aResults = calculateTestResults(
      testSet('a1000'),
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )

    // Then run B tests on 1000 votes
    const bResults = calculateTestResults(
      testSet('b1000'),
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )

    // Finally run C tests on 1000 votes
    const cResults = calculateTestResults(
      testSet('c1000'),
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )

    const testRuns = [
      { id: 1, results: aResults, timestamp: new Date() },
      { id: 2, results: bResults, timestamp: new Date() },
      { id: 3, results: cResults, timestamp: new Date() },
    ]

    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)

    // Get the intersection counts for C tests
    const allThree = get('ABC')?.tested ?? 0
    const aAndC = get('AC!B')?.tested ?? 0
    const bAndC = get('BC!A')?.tested ?? 0
    const onlyC = get('C!A!B')?.tested ?? 0
    const totalC = allThree + aAndC + bAndC + onlyC

    // Each quadrant should be roughly 25%
    const expectedPerQuadrant = totalC * 0.25
    const tolerance = totalC * 0.1 // Allow 10% deviation
    // console.log({ allThree, aAndC, bAndC, onlyC })

    expect(Math.abs(allThree - expectedPerQuadrant)).toBeLessThanOrEqual(
      tolerance
    )
    expect(Math.abs(aAndC - expectedPerQuadrant)).toBeLessThanOrEqual(tolerance)
    expect(Math.abs(bAndC - expectedPerQuadrant)).toBeLessThanOrEqual(tolerance)
    expect(Math.abs(onlyC - expectedPerQuadrant)).toBeLessThanOrEqual(tolerance)
  })
})

describe('C test distribution edge cases', () => {
  test('should not throw or hang when testC is not divisible by 4', () => {
    const mt = new MT19937(42)
    const compromisedVotes = 100
    const totalVotes = 1000
    // Try a range of C test counts not divisible by 4
    for (let c = 1; c <= 20; c++) {
      const testCounts = { testA: '10', testB: '10', testC: String(c) }
      expect(() => {
        const result = calculateTestResults(
          testCounts,
          compromisedVotes,
          totalVotes,
          mt
        )
        // The total number of C tests should match the request or be capped by available votes
        expect(result.testBreakdown.testC.count).toBeLessThanOrEqual(c)
      }).not.toThrow()
    }
  })

  test('should distribute all C tests even if not divisible by 4', () => {
    const mt = new MT19937(123)
    const compromisedVotes = 50
    const totalVotes = 100
    const testCounts = { testA: '30', testB: '30', testC: '19' }
    const result = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      mt
    )

    // Should not hang and should assign all 7 C tests
    expect(result.testBreakdown.testC.count).toBe(19)
  })
})
