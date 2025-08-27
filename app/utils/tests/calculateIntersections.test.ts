import { describe, expect, it } from 'bun:test'

import { calculateLayeredStats, TestRun } from '../calculateIntersections'
import { toDisplayLabelFromKey } from '../calculateIntersections'
import { pickErrorRates } from '../dynamicErrorRates'
import { MT19937 } from '../mt19937'
import { simTests } from '../simTests'
import { testSet } from '../testSet'

// Helper to create a TestResult
function makeTestResult(
  votes: { c: boolean; id: number; r: boolean }[] = [],
  testKey: 'A' | 'B' | 'C'
) {
  return {
    count: votes.length,
    detectedCompromised: votes.filter((v) => v.r).length,
    voteResults: votes.map((v) => ({
      isActuallyCompromised: v.c,
      testResults: { [`test${testKey}`]: v.r },
      voteId: v.id,
    })),
  }
}

let id = 0

/**  Helper to create a TestRun
 * c = compromised (actual)
 * r = result (detected)
 */
function makeTestRun(run: {
  A?: { c: boolean; id: number; r: boolean }[]
  B?: { c: boolean; id: number; r: boolean }[]
  C?: { c: boolean; id: number; r: boolean }[]
}): TestRun {
  return {
    id: id++,
    results: {
      testBreakdown: {
        testA: makeTestResult(run.A, 'A'),
        testB: makeTestResult(run.B, 'B'),
        testC: makeTestResult(run.C, 'C'),
      },
    },
    testTime: 1,
    timestamp: new Date(),
  }
}

describe('calculateLayeredStats', () => {
  it('correctly groups votes for A, B, B & A, and B & not A', () => {
    const testRuns: TestRun[] = [
      { A: [{ c: false, id: 1, r: true }], B: [{ c: false, id: 1, r: false }] },
      { B: [{ c: false, id: 2, r: true }] },
      { A: [{ c: false, id: 3, r: false }] },
      {},
    ].map(makeTestRun)

    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)

    expect(get('A')?.tested).toBe(2)
    expect(get('B')?.tested).toBe(2)
    expect(get('AB')?.tested).toBe(1)
    expect(get('B!A')?.tested).toBe(1)
  })

  it('correctly groups votes for all A/B/C combinations', () => {
    const testRuns: TestRun[] = [
      {
        A: [{ c: false, id: 1, r: true }],
        B: [{ c: false, id: 1, r: false }],
        C: [{ c: false, id: 1, r: true }],
      },
      { A: [{ c: false, id: 2, r: false }], B: [{ c: false, id: 2, r: true }] },
      { B: [{ c: false, id: 3, r: true }], C: [{ c: false, id: 3, r: false }] },
      { A: [{ c: false, id: 4, r: true }] },
      { B: [{ c: false, id: 5, r: false }] },
      { C: [{ c: false, id: 6, r: true }] },
      {},
    ].map(makeTestRun)

    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)

    expect(get('A')?.tested).toBe(3) // votes 1,2,4
    expect(get('B')?.tested).toBe(4) // votes 1,2,3,5
    expect(get('C')?.tested).toBe(3) // votes 1,3,6
    expect(get('AB')?.tested).toBe(2) // votes 1,2
    expect(get('B!A')?.tested).toBe(2) // votes 3,5
    expect(get('BC')?.tested).toBe(2) // votes 1,3
    expect(get('ABC')?.tested).toBe(1) // vote 1
    expect(get('BC!A')?.tested).toBe(1) // vote 3
    expect(get('C!B')?.tested).toBe(1) // vote 6
    expect(get('AC!B')?.tested).toBe(0) // none
    expect(get('C!A!B')?.tested).toBe(1) // vote 6
  })
})

describe('calculateLayeredStats - overlap scenarios', () => {
  it('all B tests are also A tests (full overlap)', () => {
    // 400 A, 400 B, all on same votes
    const votes = Array.from({ length: 400 }, (_, i) => ({
      c: false,
      id: i + 1,
      r: true,
    }))
    const testRuns: TestRun[] = [makeTestRun({ A: votes, B: votes })]
    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)
    expect(get('A')?.tested).toBe(400)
    expect(get('B')?.tested).toBe(400)
    expect(get('AB')?.tested).toBe(400)
    expect(get('B!A')?.tested).toBe(0)
  })

  it('no overlap between A and B', () => {
    // 400 A (1-400), 400 B (401-800)
    const votesA = Array.from({ length: 400 }, (_, i) => ({
      c: false,
      id: i + 1,
      r: true,
    }))
    const votesB = Array.from({ length: 400 }, (_, i) => ({
      c: false,
      id: i + 401,
      r: true,
    }))
    const testRuns: TestRun[] = [makeTestRun({ A: votesA, B: votesB })]
    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)
    expect(get('A')?.tested).toBe(400)
    expect(get('B')?.tested).toBe(400)
    expect(get('AB')?.tested).toBe(0)
    expect(get('B!A')?.tested).toBe(400)
  })

  it('partial overlap between A and B', () => {
    // 400 A (1-400), 400 B (201-600)
    const votesA = Array.from({ length: 400 }, (_, i) => ({
      c: false,
      id: i + 1,
      r: true,
    }))
    const votesB = Array.from({ length: 400 }, (_, i) => ({
      c: false,
      id: i + 201,
      r: true,
    }))
    const testRuns: TestRun[] = [makeTestRun({ A: votesA, B: votesB })]
    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)
    expect(get('A')?.tested).toBe(400)
    expect(get('B')?.tested).toBe(400)
    expect(get('AB')?.tested).toBe(200) // 201-400
    expect(get('B!A')?.tested).toBe(200) // 401-600
  })

  it('B tests much more numerous than A, with some overlap', () => {
    // 400 A (1-400), 1194 B (201-1394)
    const votesA = Array.from({ length: 400 }, (_, i) => ({
      c: false,
      id: i + 1,
      r: true,
    }))
    const votesB = Array.from({ length: 1194 }, (_, i) => ({
      c: false,
      id: i + 201,
      r: true,
    }))
    const testRuns: TestRun[] = [makeTestRun({ A: votesA, B: votesB })]
    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)
    expect(get('A')?.tested).toBe(400)
    expect(get('B')?.tested).toBe(1194)
    // Overlap is 201-400 (200 votes)
    expect(get('AB')?.tested).toBe(200)
    // Not A is 401-1394 (994 votes)
    expect(get('B!A')?.tested).toBe(994)
    // Sum should equal total B
    expect((get('AB')?.tested ?? 0) + (get('B!A')?.tested ?? 0)).toBe(1194)
  })
})

describe('calculateLayeredStats - with simTests', () => {
  it('realistic simulation with simTests and seeded MT19937', () => {
    const totalVotes = 2000
    const compromisedVotes = 500
    const mt = new MT19937(12345)
    // Use a global voteMap
    const globalVoteMap = new Map()
    // 400 A tests, 1194 B tests (batch 1)
    const testCountsA = testSet('a400')
    const testCountsB = testSet('b1194')
    const effectiveness = pickErrorRates(mt)
    const resultsA = simTests(
      testCountsA,
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap,
      effectiveness
    )
    const resultsB = simTests(
      testCountsB,
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap,
      effectiveness
    )
    // Now run a second batch of 100 A and 100 B
    const testCountsA2 = testSet('a100')
    const testCountsB2 = testSet('b100')
    const resultsA2 = simTests(
      testCountsA2,
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap,
      effectiveness
    )
    const resultsB2 = simTests(
      testCountsB2,
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap,
      effectiveness
    )
    // Collect all test runs
    const testRuns = [
      { id: 1, results: resultsA, testTime: 1, timestamp: new Date() },
      { id: 2, results: resultsB, testTime: 1, timestamp: new Date() },
      { id: 3, results: resultsA2, testTime: 1, timestamp: new Date() },
      { id: 4, results: resultsB2, testTime: 1, timestamp: new Date() },
    ]
    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)
    // The number of unique votes tested by A should be 400 + 100 = 500
    expect(get('A')?.tested).toBe(500)
    // The number of unique votes tested by B should be 1194 + 100 = 1294
    expect(get('B')?.tested).toBe(1294)
    // The sum of B & A and B & not A should equal total unique B
    expect((get('AB')?.tested ?? 0) + (get('B!A')?.tested ?? 0)).toBe(1294)
  })

  it('accumulates unique tested votes for A across multiple test runs (A=1000, then A=500)', () => {
    const totalVotes = 2000
    const compromisedVotes = 500
    const mt = new MT19937(389518)
    const globalVoteMap = new Map()
    // First test run: A=1000
    const resultsA1 = simTests(
      testSet('a1000'),
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap,
      pickErrorRates(mt)
    )
    // Second test run: A=500 (A again)
    const resultsA2 = simTests(
      testSet('a500'),
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap,
      pickErrorRates(mt)
    )
    // Pass both runs to calculateLayeredStats
    const testRuns = [
      { id: 1, results: resultsA1, testTime: 1, timestamp: new Date() },
      { id: 2, results: resultsA2, testTime: 1, timestamp: new Date() },
    ]

    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)
    expect(get('A')?.tested).toBe(1500)
  })

  it('aggregates unique tested votes for A across independent runs (should be > 1000)', () => {
    const seed = 389518
    const totalVotes = 2000
    const compromisedVotes = 500
    const voteMap = new Map()

    // First test run: A=1000
    const results1 = simTests(
      testSet('a1000'),
      compromisedVotes,
      totalVotes,
      new MT19937(seed),
      voteMap,
      pickErrorRates(new MT19937(seed))
    )

    // Second test run: A=500
    const results2 = simTests(
      testSet('a500'),
      compromisedVotes,
      totalVotes,
      new MT19937(seed + 1),
      voteMap,
      pickErrorRates(new MT19937(seed + 1))
    )

    // Pass both runs to calculateLayeredStats
    const testRuns = [
      { id: 1, results: results1, testTime: 1, timestamp: new Date() },
      { id: 2, results: results2, testTime: 1, timestamp: new Date() },
    ]
    const stats = calculateLayeredStats(testRuns)
    const get = (key: string) => stats.find((g) => g.key === key)
    expect(get('A')?.tested).toBe(1500)
  })
})

describe('toDisplayLabelFromKey', () => {
  it('converts canonical keys to display labels', () => {
    const mappings = {
      A: 'A',
      AB: 'A & B',
      ABC: 'A & B & C',
      'AC!B': 'A & C & not B',
      B: 'B',
      'B!A': 'B & not A',
      'C!A!B': 'C & not A & not B',
    }
    for (const [key, expected] of Object.entries(mappings)) {
      expect(toDisplayLabelFromKey(key)).toBe(expected)
    }
  })
})
