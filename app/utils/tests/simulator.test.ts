import { describe, expect, it } from 'bun:test'

import { Simulator } from '../simulator'
import { SMALL_SEED } from './evenTestDistribution.test'

describe('Simulator', () => {
  it('should maintain state between test runs', () => {
    let simulator = new Simulator(SMALL_SEED)

    // Run first test
    simulator = simulator.test('a100')
    const run1 = simulator.testRuns[0]
    expect(run1.id).toBe(1)
    expect(run1.results.testBreakdown.testA.count).toBe(100)

    // Run second test
    simulator = simulator.test('b100')
    const run2 = simulator.testRuns[1]
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

    // Create second simulator with same seed and run same tests
    let simulator2 = new Simulator(SEED)
    simulator2 = simulator2.test('a100')
    simulator2 = simulator2.test('b100')

    // Results should be identical
    expect(simulator1.seed).toEqual(simulator2.seed)
    expect(simulator1.election).toEqual(simulator2.election)

    const compareWithoutTimestamp = (runs: typeof simulator1.testRuns) =>
      runs.map(({ id, results }) => ({ id, results }))

    // Compare test runs without timestamps
    expect(compareWithoutTimestamp(simulator1.testRuns)).toEqual(
      compareWithoutTimestamp(simulator2.testRuns)
    )
  })

  it('should maintain vote consistency across tests', () => {
    let simulator = new Simulator(SMALL_SEED)

    // Run multiple tests on the same votes
    simulator = simulator.test('a100b100c100')

    // Check that each vote maintains consistent test results
    const voteResults = new Map()

    // Collect all vote results
    for (const test of ['A', 'B', 'C'] as const) {
      for (const vote of simulator.testRuns[0].results.testBreakdown[
        `test${test}`
      ].voteResults) {
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

    let testedA = 0
    // Count testedA in the vote map
    for (const v of simulator.voteMap.values()) {
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
    const lastRun = simulator.testRuns[simulator.testRuns.length - 1]

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
    const run = simulator.testRuns[0]

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
    const run1 = simulator.testRuns[0]
    expect(run1.results.testBreakdown.testA.count).toBe(100)
    expect(run1.results.testBreakdown.testB.count).toBe(0)

    // Then run only test B
    simulator = simulator.test('b100')
    const run2 = simulator.testRuns[1]
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
    const run = simulator.testRuns[0]

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
    const testRuns1 = [...simulator.testRuns]
    expect(testRuns1.length).toBe(1)

    // Run the same tests again
    simulator = simulator.test(SAME_TEST_SET)
    const testRuns2 = [...simulator.testRuns]
    expect(testRuns2.length).toBe(2)

    // The first test run should still be the same
    expect(testRuns1[0]).toEqual(testRuns2[0])

    // But the same test run again should get different results
    // (because the underlying MT state has advanced)
    expect(testRuns2[0]).not.toEqual(testRuns2[1])
  })
})

describe('Refactored Simulator', () => {
  it('should only store seed and tests as own properties', () => {
    const sim = new Simulator(SMALL_SEED)
    sim.test('a10')
    const ownProps = Object.keys(sim)
    expect(ownProps).toEqual(expect.arrayContaining(['seed', 'tests']))
    expect(ownProps).not.toEqual(
      expect.arrayContaining(['election', 'mt', 'voteMap', 'testRuns'])
    )
  })

  it('should decode testRunsShorthand into test run objects', () => {
    const sim = new Simulator(SMALL_SEED, 'a100-b50c5-a50')

    const decoded = sim.testSets
    expect(decoded).toEqual([
      { testA: '100', testB: '', testC: '' },
      { testA: '', testB: '50', testC: '5' },
      { testA: '50', testB: '', testC: '' },
    ])
  })

  it('should maintain seed between test runs', () => {
    const SEED = SMALL_SEED

    // When used in immutable form
    let sim = new Simulator(SEED)
    sim = sim.test('a10')
    expect(sim.seed).toBe(SEED)

    // Or in mutable form
    const sim2 = new Simulator(SEED)
    sim2.test('a10')
    expect(sim2.seed).toBe(SEED)
  })

  it('should memoize election based only on seed', () => {
    const sim = new Simulator(SMALL_SEED)

    // Used mutably:
    const electionResults1 = sim.election
    sim.test('a10')
    const electionResults2 = sim.election
    // Same seed, expect same reference
    expect(electionResults1).toBe(electionResults2)

    // Used immutably:
    const sim2 = sim.test('b5')
    const electionResults3 = sim2.election
    // Same seed, expect same reference
    expect(electionResults3).toBe(electionResults1)

    // If we change the seed, expect different reference
    const sim3 = new Simulator(456)
    const electionResults4 = sim3.election
    expect(electionResults4).not.toBe(electionResults1)
  })

  it('should update .tests as tests are run', () => {
    // Mutably:
    const sim = new Simulator(SMALL_SEED)
    sim.test('a10')
    expect(sim.tests).toBe('a10')
    sim.test('b5')
    expect(sim.tests).toBe('a10-b5')
    sim.test('c10')
    expect(sim.tests).toBe('a10-b5-c10')

    // Immutably:
    let sim2 = new Simulator(SMALL_SEED)
    sim2 = sim2.test('a10')
    expect(sim2.tests).toBe('a10')
    sim2 = sim2.test('b5')
    expect(sim2.tests).toBe('a10-b5')
    sim2 = sim2.test('c10')
    expect(sim2.tests).toBe('a10-b5-c10')
  })

  it('should memoize intersections based on tests', () => {
    const sim = new Simulator(SMALL_SEED)
    const intersections1 = sim.getIntersections()

    // Reference should change after tests ran changes
    sim.test('a10')
    const intersections2 = sim.getIntersections()
    expect(intersections1).not.toBe(intersections2)

    // But if we call again without changing, should still be memoized reference
    const intersections3 = sim.getIntersections()
    expect(intersections2).toBe(intersections3)
  })

  it('should only have seed & tests as properties, the rest via getters', () => {
    const sim = new Simulator(SMALL_SEED)

    /** Checks if a property is a getter, including up the prototype chain */
    const isGetter = (obj: object, prop: string): boolean => {
      while (obj) {
        const desc = Object.getOwnPropertyDescriptor(obj, prop)
        if (desc?.get) return true
        obj = Object.getPrototypeOf(obj)
      }
      return false
    }

    // Virtual properties
    const virtualProps = ['testRuns', 'election', 'voteMap'] as const
    virtualProps.forEach((prop) => {
      expect(isGetter(sim, prop)).toBe(true)
      expect(sim[prop], prop).not.toBeUndefined()
    })

    // Direct properties, to make sure our getter is working
    const directProps = ['tests', 'seed'] as const
    directProps.forEach((prop) => {
      expect(isGetter(sim, prop)).toBe(false)
      expect(sim[prop], prop).not.toBeUndefined()
    })
  })

  it('could update internal voteMap via the getter', () => {
    // We don't really want to enable this,
    // just want to test & debug accessing the underlying private state.

    const sim = new Simulator(SMALL_SEED)
    sim.voteMap.set(1, {
      isActuallyCompromised: true,
      testResults: {},
      voteId: 1,
    })
    // console.log(sim.voteMap)
    // console.log(sim.getState()._voteMap)
    expect(sim.voteMap.get(1)?.isActuallyCompromised).toBe(true)
    expect(sim.getState()._voteMap).toBe(sim.voteMap)
  })

  it.failing('should mutate in place', () => {
    const sim = new Simulator(SMALL_SEED)
    expect(sim.testRuns.length).toBe(0)

    const result = sim.test('a10')
    expect(result).toBe(sim)
    expect(sim.testRuns.length).toBe(1)
  })
})
