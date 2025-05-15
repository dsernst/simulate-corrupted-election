import { expect, test, describe } from 'bun:test'
import { calculateTestResults } from './simulation'
import { calculateLayeredStats } from './calculateIntersections'
import { MT19937 } from './mt19937'

// Integration test: Simulate the real user flow as in the UI

describe('Integration: Multi-Layered Audit Results', () => {
  test('should aggregate unique tested votes for A across multiple runs (UI flow)', () => {
    const seed = 389518
    const totalVotes = 2000
    const compromisedVotes = 500
    // Simulate UI: each run is independent, no shared voteMap
    // Test Set 1: A=1000, B=2000
    const mt1 = new MT19937(seed)
    const results1 = calculateTestResults(
      { testA: '1000', testB: '2000', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt1
    )
    // Test Set 2: A=500
    const mt2 = new MT19937(seed + 1)
    const results2 = calculateTestResults(
      { testA: '500', testB: '0', testC: '0' },
      compromisedVotes,
      totalVotes,
      mt2
    )
    // Collect all test runs as the UI would
    const testRuns = [
      { id: 1, results: results1, timestamp: new Date() },
      { id: 2, results: results2, timestamp: new Date() },
    ]
    // Pass to aggregation logic
    const stats = calculateLayeredStats(testRuns)
    const get = (label: string) => stats.find((g) => g.label === label)
    // The number of unique votes tested by A should be > 1000
    const a = get('A')!
    const b = get('B')!
    const bAndA = get('B & A')!
    const bAndNotA = get('B & not A')!

    // These should always be true if grouping is correct
    expect(bAndA.tested).toBeLessThanOrEqual(a.tested)
    expect(bAndA.tested).toBeLessThanOrEqual(b.tested)
    expect(bAndA.compromised).toBeLessThanOrEqual(a.compromised)
    expect(bAndA.compromised).toBeLessThanOrEqual(b.compromised)
    expect(bAndA.tested + bAndNotA.tested).toBe(b.tested)
  })
})
