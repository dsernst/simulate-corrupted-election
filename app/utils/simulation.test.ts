import { describe, expect, it } from 'bun:test'
import { generateSimulation, calculateTestResults } from './simulation'
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

  it('should handle invalid test counts', () => {
    const mt = new MT19937(42)
    const testCounts = { testA: 'invalid', testB: '-1', testC: 'abc' }
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
})
