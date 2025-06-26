import { describe, expect, it } from 'bun:test'

import { makeElection } from '../makeElection'
import { MT19937 } from '../mt19937'

describe('makeElection', () => {
  it('should generate consistent results with the same MT instance', () => {
    // Same MT
    const seed = 12345
    const mt1 = new MT19937(seed)
    const mt2 = new MT19937(seed)
    expect(mt1).toEqual(mt2)

    // Same results
    const result1 = makeElection(mt1)
    const result2 = makeElection(mt2)
    expect(result1).toEqual(result2)
  })

  it('should generate different results with different seeds', () => {
    // Different MT
    const mt1 = new MT19937(1)
    const mt2 = new MT19937(2)
    expect(mt1).not.toEqual(mt2)

    // Different results
    const result1 = makeElection(mt1)
    const result2 = makeElection(mt2)
    expect(result1).not.toEqual(result2)
  })

  it('should generate valid vote counts', () => {
    const result = makeElection(new MT19937(42))

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
    const result = makeElection(new MT19937(42))

    // Test that vote counts are reasonable
    expect(result.winnerVotes).toBeLessThan(1_000_000) // Max is 1M
    expect(result.runnerUpVotes).toBeGreaterThan(0)
    expect(result.otherVotes).toBeGreaterThan(0)

    // Test that percentages make sense
    const winnerPercentage = (result.winnerVotes / result.totalVotes) * 100
    expect(winnerPercentage).toBeGreaterThan(33) // Winner should have >33% of votes
  })

  it('should handle edge case seeds', () => {
    // Test with 0 seed
    const mt1 = new MT19937(0)
    const result1 = makeElection(mt1)
    expect(result1).not.toBeEmptyObject()

    // Test with max 32-bit integer seed
    const mt2 = new MT19937(0xffffffff)
    const result2 = makeElection(mt2)
    expect(result2).not.toBeEmptyObject()
  })

  it('should create roughly 50/50 odds of flipping the election', () => {
    const mt = new MT19937(42)
    let flips = 0
    const trials = 10000

    for (let i = 0; i < trials; i++) {
      const result = makeElection(mt)
      const marginOfVictory = result.winnerVotes - result.runnerUpVotes
      const marginToFlip = marginOfVictory / 2
      if (result.compromisedVotes >= marginToFlip) flips++
    }

    const flipRate = flips / trials
    // Should be roughly 50% (allowing for some variance)
    const variance = 0.02
    expect(flipRate).toBeGreaterThan(0.5 - variance)
    expect(flipRate).toBeLessThan(0.5 + variance)
    expect(flipRate).not.toBe(0.5) // But not exactly 50%
  })
})
