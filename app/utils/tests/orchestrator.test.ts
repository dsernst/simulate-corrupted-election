import { describe, expect, it } from 'bun:test'
import { SimulationOrchestrator } from '../orchestrator'
import { testSet } from '../testSet'

describe('SimulationOrchestrator', () => {
  it('should maintain state between test runs', () => {
    let orchestrator = new SimulationOrchestrator(42)

    // Run first test
    orchestrator = orchestrator.runTests(testSet('a100'))
    const run1 = orchestrator.getState().testRuns[0]
    expect(run1.id).toBe(1)
    expect(run1.results.testBreakdown.testA.count).toBe(100)

    // Run second test
    orchestrator = orchestrator.runTests(testSet('b100'))
    const run2 = orchestrator.getState().testRuns[1]
    expect(run2.id).toBe(2)
    expect(run2.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = orchestrator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)
    expect(get('AB')?.tested).toBeGreaterThan(0)
  })

  it('should handle reset correctly', () => {
    let orchestrator = new SimulationOrchestrator(42)

    // Run some tests
    orchestrator = orchestrator.runTests(testSet('a100'))
    orchestrator = orchestrator.runTests(testSet('b100'))

    // Reset with same seed
    orchestrator = orchestrator.reset(42)
    const state = orchestrator.getState()
    expect(state.testRuns).toHaveLength(0)
    expect(state.nextRunId).toBe(1)

    // Run tests again
    orchestrator = orchestrator.runTests(testSet('a100'))
    const run = orchestrator.getState().testRuns[0]
    expect(run.id).toBe(1)
  })

  it('should maintain consistent results with same seed', () => {
    const SEED = 42

    // Create first orchestrator and run some tests
    let orchestrator1 = new SimulationOrchestrator(SEED)
    orchestrator1 = orchestrator1.runTests(testSet('a100'))
    orchestrator1 = orchestrator1.runTests(testSet('b100'))
    const state1 = orchestrator1.getState()

    // Create second orchestrator with same seed and run same tests
    let orchestrator2 = new SimulationOrchestrator(SEED)
    orchestrator2 = orchestrator2.runTests(testSet('a100'))
    orchestrator2 = orchestrator2.runTests(testSet('b100'))
    const state2 = orchestrator2.getState()

    // Results should be identical
    expect(state1.simulation).toEqual(state2.simulation)

    const compareWithoutTimestamp = (runs: typeof state1.testRuns) =>
      runs.map(({ id, results }) => ({ id, results }))

    // Compare test runs without timestamps
    expect(compareWithoutTimestamp(state1.testRuns)).toEqual(
      compareWithoutTimestamp(state2.testRuns)
    )
  })

  it('should maintain vote consistency across tests', () => {
    let orchestrator = new SimulationOrchestrator(42)

    // Run multiple tests on the same votes
    orchestrator = orchestrator.runTests(testSet('a100b100c100'))
    const state = orchestrator.getState()

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
    let orchestrator = new SimulationOrchestrator(389518)

    // First test set: A=1000
    orchestrator = orchestrator.runTests(testSet('a1000'))

    // Second test set: A=500 (A again)
    orchestrator = orchestrator.runTests(testSet('a500'))

    // Get the vote map from state
    const state = orchestrator.getState()
    let testedA = 0
    for (const v of state.voteMap.values()) {
      if (v.testResults.testA !== undefined) testedA++
    }
    expect(testedA).toBe(1500)
  })

  it('should handle small number of test C after A and B tests', () => {
    let orchestrator = new SimulationOrchestrator(42)

    // First run A and B tests
    orchestrator = orchestrator.runTests(testSet('a1000b1000'))

    // Then run a small number of C tests
    orchestrator = orchestrator.runTests(testSet('c3'))
    const state = orchestrator.getState()
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
    let orchestrator = new SimulationOrchestrator(42)
    orchestrator = orchestrator.runTests({ testA: '', testB: '', testC: '' })
    const state = orchestrator.getState()
    const run = state.testRuns[0]

    expect(run.results.testBreakdown.testA.count).toBe(0)
    expect(run.results.testBreakdown.testB.count).toBe(0)
    expect(run.results.testBreakdown.testC.count).toBe(0)
  })

  it('should throw on invalid test counts', () => {
    const orchestrator = new SimulationOrchestrator(42)

    // Invalid A count: 'invalid'
    expect(() =>
      orchestrator.runTests({ testA: 'invalid', testB: '0', testC: '0' })
    ).toThrow()

    // Invalid B count: '-1'
    expect(() =>
      orchestrator.runTests({ testA: '0', testB: '-1', testC: '0' })
    ).toThrow()

    // Invalid C count: 'abc'
    expect(() =>
      orchestrator.runTests({ testA: '0', testB: '0', testC: 'abc' })
    ).toThrow()
  })

  it('should calculate intersections correctly across multiple runs', () => {
    let orchestrator = new SimulationOrchestrator(42)

    // Run tests in sequence
    orchestrator = orchestrator.runTests(testSet('a100'))
    orchestrator = orchestrator.runTests(testSet('b100'))
    orchestrator = orchestrator.runTests(testSet('c50'))

    const intersections = orchestrator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)

    // Should have AB, AC, BC, ABC intersections
    ;['AB', 'AC', 'BC', 'ABC'].forEach((label) => {
      expect(get(label)?.tested).toBeGreaterThan(10)
    })
  })

  it('should calculate intersections correctly when tests are run sequentially', () => {
    let orchestrator = new SimulationOrchestrator(42)

    // First run only test A
    orchestrator = orchestrator.runTests(testSet('a100'))
    const run1 = orchestrator.getState().testRuns[0]
    expect(run1.results.testBreakdown.testA.count).toBe(100)
    expect(run1.results.testBreakdown.testB.count).toBe(0)

    // Then run only test B
    orchestrator = orchestrator.runTests(testSet('b100'))
    const run2 = orchestrator.getState().testRuns[1]
    expect(run2.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = orchestrator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)

    // We should have some A∩B intersections
    expect(get('AB')?.tested).toBeGreaterThan(20)
  })

  it('should calculate intersections correctly when tests are run simultaneously', () => {
    let orchestrator = new SimulationOrchestrator(42)

    // Run both tests at once
    orchestrator = orchestrator.runTests(testSet('a100b100'))
    const run = orchestrator.getState().testRuns[0]

    // Verify that we have results for both tests
    expect(run.results.testBreakdown.testA.count).toBe(100)
    expect(run.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = orchestrator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)

    // We should have some A∩B intersections
    expect(get('AB')?.tested).toBeGreaterThan(20)
  })

  it('should track accumulating MT state between test runs', () => {
    let orchestrator = new SimulationOrchestrator(42)
    const SAME_TEST_SET = testSet('a100')

    // Run some tests
    orchestrator = orchestrator.runTests(SAME_TEST_SET)
    const state1 = orchestrator.getState()
    expect(state1.testRuns.length).toBe(1)

    // Run the same tests again
    orchestrator = orchestrator.runTests(SAME_TEST_SET)
    const state2 = orchestrator.getState()
    expect(state2.testRuns.length).toBe(2)

    // The first test run should still be the same
    expect(state1.testRuns[0]).toEqual(state2.testRuns[0])

    // But the same test run again should get different results
    // (because the underlying MT state has advanced)
    expect(state2.testRuns[0]).not.toEqual(state2.testRuns[1])
  })
})
