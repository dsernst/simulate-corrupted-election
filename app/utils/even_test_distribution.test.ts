import { describe, expect, test } from 'bun:test'
import { calculateTestResults } from './simulation'
import { calculateLayeredStats } from './calculateIntersections'
import { MT19937 } from './mt19937'

describe('Even test distribution', () => {
  test('B tests should be split 50/50 between A and !A tested votes', () => {
    const seed = 12345
    const totalVotes = 100_000
    const compromisedVotes = 5_000
    const mt = new MT19937(seed)
    const globalVoteMap = new Map()

    // First run A tests on 1000 votes
    const aResults = calculateTestResults(
      { testA: '1000', testB: '0', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )

    // Then run B tests on 1000 votes
    const bResults = calculateTestResults(
      { testA: '0', testB: '1000', testC: '0' },
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
      { testA: '1000', testB: '0', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )

    // Then run B tests on 1000 votes
    const bResults = calculateTestResults(
      { testA: '0', testB: '1000', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )

    // Finally run C tests on 1000 votes
    const cResults = calculateTestResults(
      { testA: '0', testB: '0', testC: '1000' },
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
