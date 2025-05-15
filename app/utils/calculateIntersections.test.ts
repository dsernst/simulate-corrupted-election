import { expect, describe, test } from 'bun:test'
import { calculateLayeredStats, TestRun } from './calculateIntersections'

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
