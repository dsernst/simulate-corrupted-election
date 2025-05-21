import { describe, expect, it } from 'bun:test'

import { Simulator } from '../simulator'
import { SMALL_SEED } from './evenTestDistribution.test'

describe('Simulator', () => {
  it('should maintain state between test runs', () => {
    let simulator = new Simulator(SMALL_SEED)

    // Run first test
    simulator = simulator.test('a100')
    const run1 = simulator.getState().testRuns[0]
    expect(run1.id).toBe(1)
    expect(run1.results.testBreakdown.testA.count).toBe(100)

    // Run second test
    simulator = simulator.test('b100')
    const run2 = simulator.getState().testRuns[1]
    expect(run2.id).toBe(2)
    expect(run2.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = simulator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)
    expect(get('AB')?.tested).toBeGreaterThan(0)
  })

  it('should maintain consistent results with same seed', () => {
    const SEED = SMALL_SEED

    // Create first simulator and run some tests
    let simulator1 = new Simulator(SEED)
    simulator1 = simulator1.test('a100')
    simulator1 = simulator1.test('b100')
    const state1 = simulator1.getState()

    // Create second simulator with same seed and run same tests
    let simulator2 = new Simulator(SEED)
    simulator2 = simulator2.test('a100')
    simulator2 = simulator2.test('b100')
    const state2 = simulator2.getState()

    // Results should be identical
    expect(state1.election).toEqual(state2.election)

    const compareWithoutTimestamp = (runs: typeof state1.testRuns) =>
      runs.map(({ id, results }) => ({ id, results }))

    // Compare test runs without timestamps
    expect(compareWithoutTimestamp(state1.testRuns)).toEqual(
      compareWithoutTimestamp(state2.testRuns)
    )
  })

  it('should maintain vote consistency across tests', () => {
    let simulator = new Simulator(SMALL_SEED)

    // Run multiple tests on the same votes
    simulator = simulator.test('a100b100c100')
    const state = simulator.getState()

    // Check that each vote maintains consistent test results
    const voteResults = new Map()

    // Collect all vote results
    for (const test of ['A', 'B', 'C'] as const) {
      for (const vote of state.testRuns[0].results.testBreakdown[`test${test}`]
        .voteResults) {
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

  it('should accumulate tested votes for repeated test sets', () => {
    let simulator = new Simulator(SMALL_SEED)

    // First test set: A=1000
    simulator = simulator.test('a1000')

    // Second test set: A=500 (A again)
    simulator = simulator.test('a500')

    // Get the vote map from state
    const state = simulator.getState()
    let testedA = 0
    for (const v of state.voteMap.values()) {
      if (v.testResults.testA !== undefined) testedA++
    }
    expect(testedA).toBe(1500)
  })

  it('should handle small number of test C after A and B tests', () => {
    let simulator = new Simulator(SMALL_SEED)

    // First run A and B tests
    simulator = simulator.test('a1000b1000')

    // Then run a small number of C tests
    simulator = simulator.test('c3')
    const state = simulator.getState()
    const lastRun = state.testRuns[state.testRuns.length - 1]

    // Verify C test results
    expect(lastRun.results.testBreakdown.testC.count).toBe(3)
    expect(lastRun.results.testBreakdown.testC.voteResults.length).toBe(3)

    // Verify that the C tests are distributed across different A/B combinations
    const combinations = new Set<string>()
    for (const vote of lastRun.results.testBreakdown.testC.voteResults) {
      const aTested = vote.testResults.testA !== undefined
      const bTested = vote.testResults.testB !== undefined
      combinations.add(`${aTested ? 'A' : '!A'}&${bTested ? 'B' : '!B'}`)
    }

    // With 3 tests, we should have at least 2 different combinations
    expect(combinations.size).toBeGreaterThanOrEqual(2)
  })

  it('should handle empty test counts', () => {
    let simulator = new Simulator(42)
    simulator = simulator.test('')
    const state = simulator.getState()
    const run = state.testRuns[0]

    expect(run.results.testBreakdown.testA.count).toBe(0)
    expect(run.results.testBreakdown.testB.count).toBe(0)
    expect(run.results.testBreakdown.testC.count).toBe(0)
  })

  it('should throw on invalid test counts', () => {
    const simulator = new Simulator(42)

    // Invalid A count: 'invalid'
    expect(() =>
      simulator.runTests({ testA: 'invalid', testB: '0', testC: '0' })
    ).toThrow()

    // Invalid B count: '-1'
    expect(() =>
      simulator.runTests({ testA: '0', testB: '-1', testC: '0' })
    ).toThrow()

    // Invalid C count: 'abc'
    expect(() =>
      simulator.runTests({ testA: '0', testB: '0', testC: 'abc' })
    ).toThrow()
  })

  it('should calculate intersections correctly across multiple runs', () => {
    let simulator = new Simulator(SMALL_SEED)

    // Run tests in sequence
    simulator = simulator.test('a100')
    simulator = simulator.test('b100')
    simulator = simulator.test('c50')

    const intersections = simulator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)

    // Should have AB, AC, BC, ABC intersections
    ;['AB', 'AC', 'BC', 'ABC'].forEach((label) => {
      expect(get(label)?.tested).toBeGreaterThan(10)
    })
  })

  it('should calculate intersections correctly when tests are run sequentially', () => {
    let simulator = new Simulator(SMALL_SEED)

    // First run only test A
    simulator = simulator.test('a100')
    const run1 = simulator.getState().testRuns[0]
    expect(run1.results.testBreakdown.testA.count).toBe(100)
    expect(run1.results.testBreakdown.testB.count).toBe(0)

    // Then run only test B
    simulator = simulator.test('b100')
    const run2 = simulator.getState().testRuns[1]
    expect(run2.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = simulator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)

    // We should have some A∩B intersections
    expect(get('AB')?.tested).toBeGreaterThan(20)
  })

  it('should calculate intersections correctly when tests are run simultaneously', () => {
    let simulator = new Simulator(SMALL_SEED)

    // Run both tests at once
    simulator = simulator.test('a100b100')
    const run = simulator.getState().testRuns[0]

    // Verify that we have results for both tests
    expect(run.results.testBreakdown.testA.count).toBe(100)
    expect(run.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = simulator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)

    // We should have some A∩B intersections
    expect(get('AB')?.tested).toBeGreaterThan(20)
  })

  it('should track accumulating MT state between test runs', () => {
    let simulator = new Simulator(SMALL_SEED)
    const SAME_TEST_SET = 'a100'

    // Run some tests
    simulator = simulator.test(SAME_TEST_SET)
    const state1 = simulator.getState()
    expect(state1.testRuns.length).toBe(1)

    // Run the same tests again
    simulator = simulator.test(SAME_TEST_SET)
    const state2 = simulator.getState()
    expect(state2.testRuns.length).toBe(2)

    // The first test run should still be the same
    expect(state1.testRuns[0]).toEqual(state2.testRuns[0])

    // But the same test run again should get different results
    // (because the underlying MT state has advanced)
    expect(state2.testRuns[0]).not.toEqual(state2.testRuns[1])
  })
})

describe('Refactored Simulator', () => {
  it('should only store seed and tests as own properties', () => {
    const sim = new Simulator(123)
    sim.test('a10')
    const ownProps = Object.keys(sim)
    expect(ownProps).toEqual(expect.arrayContaining(['seed', 'tests']))
    expect(ownProps).not.toEqual(
      expect.arrayContaining(['election', 'mt', 'voteMap', 'testRuns'])
    )
  })

  it('should decode testRunsShorthand into test run objects', () => {
    const sim = new Simulator(123)
    sim.test('a100-b50c5-a50')
    // @ts-expect-error: accessing virtual property for test
    const decoded = sim.testRuns
    expect(decoded).toEqual([
      { testA: '100' },
      { testB: '50', testC: '5' },
      { testA: '50' },
    ])
  })

  it('should memoize election based only on seed', () => {
    const sim = new Simulator(123)
    // @ts-expect-error: accessing virtual property for test
    const election1 = sim.election
    sim.test('a10')
    // @ts-expect-error: accessing virtual property for test
    const election2 = sim.election
    expect(election1).toBe(election2) // reference should not change

    // If we change the seed (simulate by creating a new Simulator), the reference should change
    const sim2 = new Simulator(456)
    // @ts-expect-error: accessing virtual property for test
    const election3 = sim2.election
    expect(election3).not.toBe(election1)
  })

  it('should memoize intersections based on tests', () => {
    const sim = new Simulator(123)
    const intersections1 = sim.getIntersections()

    // Reference should change after tests ran changes
    sim.test('a10')
    const intersections2 = sim.getIntersections()
    expect(intersections1).not.toBe(intersections2)

    // But if we call again without changing, should still be memoized reference
    const intersections3 = sim.getIntersections()
    expect(intersections2).toBe(intersections3)
  })

  it('should mutate in place', () => {
    const sim = new Simulator(123)
    expect(sim.getState().testRuns.length).toBe(0)

    const result = sim.test('a10')
    expect(result).toBe(sim)
    expect(sim.getState().testRuns.length).toBe(1)
  })
})
