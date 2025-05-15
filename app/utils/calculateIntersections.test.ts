import { expect, describe, test } from 'bun:test'
import { calculateLayeredStats, TestRun } from './calculateIntersections'
import { calculateTestResults } from './simulation'
import { MT19937 } from './mt19937'

// Helper to create a TestResult
function makeTestResult(
  votes: { id: number; c: boolean; r: boolean }[] = [],
  testKey: 'A' | 'B' | 'C'
) {
  return {
    count: votes.length,
    detectedCompromised: votes.filter((v) => v.r).length,
    voteResults: votes.map((v) => ({
      voteId: v.id,
      isActuallyCompromised: v.c,
      testResults: { [`test${testKey}`]: v.r },
    })),
  }
}

let id = 0

// Helper to create a TestRun
function makeTestRun(run: {
  A?: { id: number; c: boolean; r: boolean }[]
  B?: { id: number; c: boolean; r: boolean }[]
  C?: { id: number; c: boolean; r: boolean }[]
}): TestRun {
  return {
    results: {
      testBreakdown: {
        testA: makeTestResult(run.A, 'A'),
        testB: makeTestResult(run.B, 'B'),
        testC: makeTestResult(run.C, 'C'),
      },
    },
    id: id++,
    timestamp: new Date(),
  }
}

describe('calculateLayeredStats', () => {
  test('correctly groups votes for A, B, B & A, and B & not A', () => {
    const testRuns: TestRun[] = [
      { A: [{ id: 1, c: false, r: true }], B: [{ id: 1, c: false, r: false }] },
      { B: [{ id: 2, c: false, r: true }] },
      { A: [{ id: 3, c: false, r: false }] },
      {},
    ].map(makeTestRun)

    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)

    expect(get('A')?.tested).toBe(2)
    expect(get('B')?.tested).toBe(2)
    expect(get('B & A')?.tested).toBe(1)
    expect(get('B & not A')?.tested).toBe(1)
  })

  test('correctly groups votes for all A/B/C combinations', () => {
    const testRuns: TestRun[] = [
      {
        A: [{ id: 1, c: false, r: true }],
        B: [{ id: 1, c: false, r: false }],
        C: [{ id: 1, c: false, r: true }],
      },
      { A: [{ id: 2, c: false, r: false }], B: [{ id: 2, c: false, r: true }] },
      { B: [{ id: 3, c: false, r: true }], C: [{ id: 3, c: false, r: false }] },
      { A: [{ id: 4, c: false, r: true }] },
      { B: [{ id: 5, c: false, r: false }] },
      { C: [{ id: 6, c: false, r: true }] },
      {},
    ].map(makeTestRun)

    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)

    expect(get('A')?.tested).toBe(3) // votes 1,2,4
    expect(get('B')?.tested).toBe(4) // votes 1,2,3,5
    expect(get('C')?.tested).toBe(3) // votes 1,3,6
    expect(get('B & A')?.tested).toBe(2) // votes 1,2
    expect(get('B & not A')?.tested).toBe(2) // votes 3,5
    expect(get('C & B')?.tested).toBe(2) // votes 1,3
    expect(get('C & B & A')?.tested).toBe(1) // vote 1
    expect(get('C & B & not A')?.tested).toBe(1) // vote 3
    expect(get('C & not B')?.tested).toBe(1) // vote 6
    expect(get('C & not B & A')?.tested).toBe(0) // none
    expect(get('C & not B & not A')?.tested).toBe(1) // vote 6
  })
})

describe('calculateLayeredStats - overlap scenarios', () => {
  test('all B tests are also A tests (full overlap)', () => {
    // 400 A, 400 B, all on same votes
    const votes = Array.from({ length: 400 }, (_, i) => ({
      id: i + 1,
      c: false,
      r: true,
    }))
    const testRuns: TestRun[] = [makeTestRun({ A: votes, B: votes })]
    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)
    expect(get('A')?.tested).toBe(400)
    expect(get('B')?.tested).toBe(400)
    expect(get('B & A')?.tested).toBe(400)
    expect(get('B & not A')?.tested).toBe(0)
  })

  test('no overlap between A and B', () => {
    // 400 A (1-400), 400 B (401-800)
    const votesA = Array.from({ length: 400 }, (_, i) => ({
      id: i + 1,
      c: false,
      r: true,
    }))
    const votesB = Array.from({ length: 400 }, (_, i) => ({
      id: i + 401,
      c: false,
      r: true,
    }))
    const testRuns: TestRun[] = [makeTestRun({ A: votesA, B: votesB })]
    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)
    expect(get('A')?.tested).toBe(400)
    expect(get('B')?.tested).toBe(400)
    expect(get('B & A')?.tested).toBe(0)
    expect(get('B & not A')?.tested).toBe(400)
  })

  test('partial overlap between A and B', () => {
    // 400 A (1-400), 400 B (201-600)
    const votesA = Array.from({ length: 400 }, (_, i) => ({
      id: i + 1,
      c: false,
      r: true,
    }))
    const votesB = Array.from({ length: 400 }, (_, i) => ({
      id: i + 201,
      c: false,
      r: true,
    }))
    const testRuns: TestRun[] = [makeTestRun({ A: votesA, B: votesB })]
    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)
    expect(get('A')?.tested).toBe(400)
    expect(get('B')?.tested).toBe(400)
    expect(get('B & A')?.tested).toBe(200) // 201-400
    expect(get('B & not A')?.tested).toBe(200) // 401-600
  })

  test('B tests much more numerous than A, with some overlap', () => {
    // 400 A (1-400), 1194 B (201-1394)
    const votesA = Array.from({ length: 400 }, (_, i) => ({
      id: i + 1,
      c: false,
      r: true,
    }))
    const votesB = Array.from({ length: 1194 }, (_, i) => ({
      id: i + 201,
      c: false,
      r: true,
    }))
    const testRuns: TestRun[] = [makeTestRun({ A: votesA, B: votesB })]
    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)
    expect(get('A')?.tested).toBe(400)
    expect(get('B')?.tested).toBe(1194)
    // Overlap is 201-400 (200 votes)
    expect(get('B & A')?.tested).toBe(200)
    // Not A is 401-1394 (994 votes)
    expect(get('B & not A')?.tested).toBe(994)
    // Sum should equal total B
    expect((get('B & A')?.tested ?? 0) + (get('B & not A')?.tested ?? 0)).toBe(
      1194
    )
  })
})

describe('calculateLayeredStats - with calculateTestResults', () => {
  test('realistic simulation with calculateTestResults and seeded MT19937', () => {
    const totalVotes = 2000
    const compromisedVotes = 500
    const mt = new MT19937(12345)
    // Use a global voteMap
    const globalVoteMap = new Map()
    // 400 A tests, 1194 B tests (batch 1)
    const testCountsA = { testA: '400', testB: '0', testC: '0' }
    const testCountsB = { testA: '0', testB: '1194', testC: '0' }
    const resultsA = calculateTestResults(
      testCountsA,
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )
    const resultsB = calculateTestResults(
      testCountsB,
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )
    // Now run a second batch of 100 A and 100 B
    const testCountsA2 = { testA: '100', testB: '0', testC: '0' }
    const testCountsB2 = { testA: '0', testB: '100', testC: '0' }
    const resultsA2 = calculateTestResults(
      testCountsA2,
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )
    const resultsB2 = calculateTestResults(
      testCountsB2,
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )
    // Collect all test runs
    const testRuns = [
      { id: 1, results: resultsA, timestamp: new Date() },
      { id: 2, results: resultsB, timestamp: new Date() },
      { id: 3, results: resultsA2, timestamp: new Date() },
      { id: 4, results: resultsB2, timestamp: new Date() },
    ]
    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)
    // The number of unique votes tested by A should be 400 + 100 = 500
    expect(get('A')?.tested).toBe(500)
    // The number of unique votes tested by B should be 1194 + 100 = 1294
    expect(get('B')?.tested).toBe(1294)
    // The sum of B & A and B & not A should equal total unique B
    expect((get('B & A')?.tested ?? 0) + (get('B & not A')?.tested ?? 0)).toBe(
      1294
    )
  })

  test('accumulates unique tested votes for A across multiple test runs (A=1000, then A=500)', () => {
    const totalVotes = 2000
    const compromisedVotes = 500
    const mt = new MT19937(389518)
    const globalVoteMap = new Map()
    // First test run: A=1000
    const resultsA1 = calculateTestResults(
      { testA: '1000', testB: '0', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )
    // Second test run: A=500 (A again)
    const resultsA2 = calculateTestResults(
      { testA: '500', testB: '0', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt,
      globalVoteMap
    )
    // Pass both runs to calculateLayeredStats
    const testRuns = [
      { id: 1, results: resultsA1, timestamp: new Date() },
      { id: 2, results: resultsA2, timestamp: new Date() },
    ]
    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)
    expect(get('A')?.tested).toBe(1500)
  })

  test('aggregates unique tested votes for A across independent runs (should be > 1000)', () => {
    const seed = 389518
    const totalVotes = 2000
    const compromisedVotes = 500
    // First test run: A=1000, B=2000
    const mt1 = new MT19937(seed)
    const results1 = calculateTestResults(
      { testA: '1000', testB: '0', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt1
    )
    // Second test run: A=500
    const mt2 = new MT19937(seed + 1)
    const results2 = calculateTestResults(
      { testA: '500', testB: '0', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt2
    )
    // Pass both runs to calculateLayeredStats
    const testRuns = [
      { id: 1, results: results1, timestamp: new Date() },
      { id: 2, results: results2, timestamp: new Date() },
    ]
    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)
    expect(get('A')?.tested).toBeGreaterThan(1000)
    expect(get('A')?.tested).toBeLessThan(1500)
  })
})
