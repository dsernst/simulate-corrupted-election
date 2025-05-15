import { expect, describe, test } from 'bun:test'
import { calculateLayeredStats, TestRun } from './calculateIntersections'

describe('calculateLayeredStats', () => {
  test('correctly groups votes for A, B, B & A, and B & not A', () => {
    // Simulate votes with different test coverage
    const testRuns = [
      // Vote 1: tested by A and B
      {
        results: {
          testBreakdown: {
            testA: {
              voteResults: [{ voteId: 1, testResults: { testA: true } }],
            },
            testB: {
              voteResults: [{ voteId: 1, testResults: { testB: false } }],
            },
          },
        },
      },
      // Vote 2: tested by B only
      {
        results: {
          testBreakdown: {
            testB: {
              voteResults: [{ voteId: 2, testResults: { testB: true } }],
            },
          },
        },
      },
      // Vote 3: tested by A only
      {
        results: {
          testBreakdown: {
            testA: {
              voteResults: [{ voteId: 3, testResults: { testA: false } }],
            },
          },
        },
      },
      // Vote 4: tested by neither
      {
        results: {
          testBreakdown: {},
        },
      },
    ]

    const stats = calculateLayeredStats(testRuns as unknown as TestRun[])
    // Find groups by label
    const get = (label: string) => stats.find((g) => g.label === label)

    // A: vote 1 and 3
    expect(get('A')?.tested).toBe(2)
    // B: vote 1 and 2
    expect(get('B')?.tested).toBe(2)
    // B & A: vote 1
    expect(get('B & A')?.tested).toBe(1)
    // B & not A: vote 2
    expect(get('B & not A')?.tested).toBe(1)
  })
})
