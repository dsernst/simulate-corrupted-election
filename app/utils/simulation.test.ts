import { describe, expect, it } from 'bun:test'
import {
  generateSimulation,
  calculateTestResults,
  type VoteTestResult,
} from './simulation'
import { MT19937 } from './mt19937'

describe('generateSimulation', () => {
  it('should generate consistent results with the same seed', () => {
    const seed = 12345
    const result1 = generateSimulation(seed)
    const result2 = generateSimulation(seed)

    expect(result1).toEqual(result2)
    expect(result1.seed).toBe(seed)
  })

  it('should generate different results with different seeds', () => {
    const result1 = generateSimulation(1)
    const result2 = generateSimulation(2)

    expect(result1).not.toEqual(result2)
  })

  it('should generate random results when no seed is provided', () => {
    const result1 = generateSimulation()
    const result2 = generateSimulation()

    expect(result1).not.toEqual(result2)
    expect(typeof result1.seed).toBe('number')
  })

  it('should generate valid vote counts', () => {
    const result = generateSimulation(42)

    expect(result.winnerVotes).toBeGreaterThan(0)
    expect(result.runnerUpVotes).toBeLessThanOrEqual(result.winnerVotes)
    expect(result.otherVotes).toBeLessThanOrEqual(result.winnerVotes * 0.2)
    expect(result.totalVotes).toBe(
      result.winnerVotes + result.runnerUpVotes + result.otherVotes
    )
    expect(result.compromisedVotes).toBeLessThanOrEqual(result.totalVotes)
    expect(result.compromisedPercentage).toBeGreaterThanOrEqual(0)
    expect(result.compromisedPercentage).toBeLessThanOrEqual(100)
  })

  it('should generate results within reasonable bounds', () => {
    const result = generateSimulation(42)

    // Test that vote counts are reasonable
    expect(result.winnerVotes).toBeLessThan(1000000) // Max is 1M
    expect(result.runnerUpVotes).toBeGreaterThan(0)
    expect(result.otherVotes).toBeGreaterThan(0)

    // Test that percentages make sense
    const winnerPercentage = (result.winnerVotes / result.totalVotes) * 100
    expect(winnerPercentage).toBeGreaterThan(33) // Winner should have >33% of votes
  })

  it('should handle edge case seeds', () => {
    // Test with 0 seed
    const result1 = generateSimulation(0)
    expect(result1.seed).toBe(0)

    // Test with max 32-bit integer seed
    const result2 = generateSimulation(0xffffffff)
    expect(result2.seed).toBe(0xffffffff)
  })
})

describe('calculateTestResults', () => {
  it('should generate consistent results with the same seed', () => {
    const mt = new MT19937(12345)
    const testCounts = { testA: '100', testB: '100', testC: '100' }
    const compromisedVotes = 1000
    const totalVotes = 10000

    const result1 = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      mt
    )
    mt.seed(12345) // Reset the PRNG to the same state
    const result2 = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      mt
    )

    expect(result1).toEqual(result2)
  })

  it('should generate different results with different seeds', () => {
    const testCounts = { testA: '100', testB: '100', testC: '100' }
    const compromisedVotes = 1000
    const totalVotes = 10000

    const result1 = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      new MT19937(1)
    )
    const result2 = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      new MT19937(2)
    )

    expect(result1).not.toEqual(result2)
  })

  it('should handle empty test counts', () => {
    const mt = new MT19937(42)
    const testCounts = { testA: '', testB: '', testC: '' }
    const compromisedVotes = 1000
    const totalVotes = 10000

    const result = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      mt
    )

    expect(result.testBreakdown.testA.count).toBe(0)
    expect(result.testBreakdown.testB.count).toBe(0)
    expect(result.testBreakdown.testC.count).toBe(0)
  })

  it('should throw on invalid test counts', () => {
    const mt = new MT19937(42)
    const compromisedVotes = 1000
    const totalVotes = 10000

    // Invalid A count: 'invalid'
    expect(() =>
      calculateTestResults(
        { testA: 'invalid', testB: '0', testC: '0' },
        compromisedVotes,
        totalVotes,
        mt
      )
    ).toThrow()

    // Invalid B count: '-1'
    expect(() =>
      calculateTestResults(
        { testA: '0', testB: '-1', testC: '0' },
        compromisedVotes,
        totalVotes,
        mt
      )
    ).toThrow()

    // Invalid C count: 'abc'
    expect(() =>
      calculateTestResults(
        { testA: '0', testB: '0', testC: 'abc' },
        compromisedVotes,
        totalVotes,
        mt
      )
    ).toThrow()
  })

  it('should maintain consistent MT19937 state between test runs', () => {
    const mt = new MT19937(12345)
    const testCounts = { testA: '10', testB: '10', testC: '10' }
    const compromisedVotes = 1000
    const totalVotes = 10000

    // Run first test
    const result1 = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      mt
    )

    // Run second test with same MT instance
    const result2 = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      mt
    )

    // Results should be different because MT state has advanced
    expect(result1).not.toEqual(result2)
  })

  it('should handle boundary test counts', () => {
    const mt = new MT19937(42)
    const testCounts = {
      testA: '0',
      testB: '1',
      testC: '1000000',
    }
    const compromisedVotes = 1000
    const totalVotes = 10000

    const result = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      mt
    )

    expect(result.testBreakdown.testA.count).toBe(0)
    expect(result.testBreakdown.testB.count).toBe(1)
    expect(result.testBreakdown.testC.count).toBe(10000)

    // Also verify the vote results arrays have the correct lengths
    expect(result.testBreakdown.testA.voteResults.length).toBe(0)
    expect(result.testBreakdown.testB.voteResults.length).toBe(1)
    expect(result.testBreakdown.testC.voteResults.length).toBe(10000)
  })

  it('should handle edge case vote counts', () => {
    const mt = new MT19937(42)
    const testCounts = { testA: '100', testB: '100', testC: '100' }

    // Test with no compromised votes
    const result1 = calculateTestResults(testCounts, 0, 10000, mt)
    // With falseCompromisedRate of 0.1 for testA, expect roughly 10% false positives
    expect(result1.testBreakdown.testA.detectedCompromised).toBe(1) // Deterministic because of seed

    // Test with all votes compromised
    const result2 = calculateTestResults(testCounts, 10000, 10000, mt)
    // With falseCleanRate of 0.4 for testA, expect roughly 60% detection
    expect(result2.testBreakdown.testA.detectedCompromised).toBeGreaterThan(50)
    expect(result2.testBreakdown.testA.detectedCompromised).toBeLessThan(70)

    // Test C should be perfect (no false positives/negatives)
    expect(result1.testBreakdown.testC.detectedCompromised).toBe(0) // No false positives
    expect(result2.testBreakdown.testC.detectedCompromised).toBe(100) // All detected
  })

  it('should maintain vote consistency across tests', () => {
    const mt = new MT19937(42)
    const testCounts = { testA: '100', testB: '100', testC: '100' }
    const compromisedVotes = 1000
    const totalVotes = 10000

    const result = calculateTestResults(
      testCounts,
      compromisedVotes,
      totalVotes,
      mt
    )

    // Check that each vote maintains consistent test results
    const voteResults = new Map<number, VoteTestResult>()

    // Collect all vote results
    for (const test of ['A', 'B', 'C'] as const) {
      for (const vote of result.testBreakdown[`test${test}`].voteResults) {
        if (!voteResults.has(vote.voteId)) {
          voteResults.set(vote.voteId, vote)
        } else {
          // If we've seen this vote before, its properties should match
          const existingVote = voteResults.get(vote.voteId)!
          expect(vote.isActuallyCompromised).toBe(
            existingVote.isActuallyCompromised
          )
        }
      }
    }
  })

  it('should accumulate tested votes for repeated test sets (A=1000, then A=500)', () => {
    const seed = 389518
    const mt = new MT19937(seed)
    // Simulate a realistic election
    const sim = {
      ...generateSimulation(seed),
      totalVotes: 2000,
      compromisedVotes: 500,
    }
    // First test set: A=1000, B=2000
    const voteMap = new Map()
    calculateTestResults(
      { testA: '1000', testB: '2000', testC: '0' },
      sim.compromisedVotes,
      sim.totalVotes,
      mt,
      voteMap
    )
    // Second test set: A=500 (A again)
    calculateTestResults(
      { testA: '500', testB: '0', testC: '0' },
      sim.compromisedVotes,
      sim.totalVotes,
      mt,
      voteMap
    )
    // Now count how many unique votes have been tested by A
    let testedA = 0
    for (const v of voteMap.values()) {
      if (v.testResults.testA !== undefined) testedA++
    }
    expect(testedA).toBe(1500)
  })

  it('should handle small number of test C after A and B tests', () => {
    const mt = new MT19937(42)
    const compromisedVotes = 1000
    const totalVotes = 10000

    // First run A and B tests to create some tested votes
    const voteMap = new Map()
    calculateTestResults(
      { testA: '1000', testB: '1000', testC: '' },
      compromisedVotes,
      totalVotes,
      mt,
      voteMap
    )

    // Then run a small number of C tests
    const result = calculateTestResults(
      { testA: '', testB: '', testC: '3' },
      compromisedVotes,
      totalVotes,
      mt,
      voteMap
    )

    // Verify C test results
    expect(result.testBreakdown.testC.count).toBe(3)
    expect(result.testBreakdown.testC.voteResults.length).toBe(3)

    // Verify that the C tests are distributed across different A/B combinations
    const combinations = new Set<string>()
    for (const vote of result.testBreakdown.testC.voteResults) {
      const aTested = vote.testResults.testA !== undefined
      const bTested = vote.testResults.testB !== undefined
      combinations.add(`${aTested ? 'A' : '!A'}&${bTested ? 'B' : '!B'}`)
    }

    // With 3 tests, we should have at least 2 different combinations
    expect(combinations.size).toBeGreaterThanOrEqual(2)
  })
})
