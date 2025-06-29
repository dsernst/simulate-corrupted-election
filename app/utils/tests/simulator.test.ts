import { describe, expect, it } from 'bun:test'

import { Simulator } from '../simulator'
import { SMALL_SEED } from './evenTestDistribution.test'

describe('Simulator', () => {
  it('should maintain state between test runs', () => {
    const simulator = new Simulator(SMALL_SEED)

    // Run first test
    simulator.test('a100')
    const run1 = simulator.testRuns[0]
    expect(run1.id).toBe(1)
    expect(run1.results.testBreakdown.testA.count).toBe(100)

    // Run second test
    simulator.test('b100')
    const run2 = simulator.testRuns[1]
    expect(run2.id).toBe(2)
    expect(run2.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    expect(simulator.get('AB').tested).toBeGreaterThan(0)
  })

  it('should maintain consistent results with same seed', () => {
    const SEED = SMALL_SEED

    // Create first simulator and run some tests
    const simulator1 = new Simulator(SEED)
    simulator1.test('a100')
    simulator1.test('b100')

    // Create second simulator with same seed and run same tests
    const simulator2 = new Simulator(SEED)
    simulator2.test('a100')
    simulator2.test('b100')

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
    const simulator = new Simulator(SMALL_SEED)

    // Run multiple tests on the same votes
    simulator.test('a100b100c100')

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
    const simulator = new Simulator(SMALL_SEED)

    // First test set: A=1000
    simulator.test('a1000')

    // Second test set: A=500 (A again)
    simulator.test('a500')

    let testedA = 0
    // Count testedA in the vote map
    for (const v of simulator.voteMap.values()) {
      if (v.testResults.testA !== undefined) testedA++
    }
    expect(testedA).toBe(1500)
  })

  it('should handle small number of test C after A and B tests', () => {
    const simulator = new Simulator(SMALL_SEED)

    // First run A and B tests
    simulator.test('a1000b1000')

    // Then run a small number of C tests
    simulator.test('c3')
    const lastRun = simulator.testRuns.at(-1)!

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
    const simulator = new Simulator(SMALL_SEED)
    simulator.test('')
    const run = simulator.testRuns[0]

    expect(run.results.testBreakdown.testA.count).toBe(0)
    expect(run.results.testBreakdown.testB.count).toBe(0)
    expect(run.results.testBreakdown.testC.count).toBe(0)
  })

  it('should throw on invalid test counts', () => {
    const simulator = new Simulator(SMALL_SEED)

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
    const simulator = new Simulator(SMALL_SEED)

    // Run tests in sequence
    simulator.test('a100')
    simulator.test('b100')
    simulator.test('c50')

    // Should have AB, AC, BC, ABC intersections
    ;['AB', 'AC', 'BC', 'ABC'].forEach((label) => {
      expect(simulator.get(label).tested).toBeGreaterThan(10)
    })
  })

  it('should calculate intersections correctly when tests are run sequentially', () => {
    const simulator = new Simulator(SMALL_SEED)

    // First run only test A
    simulator.test('a100')
    const run1 = simulator.testRuns[0]
    expect(run1.results.testBreakdown.testA.count).toBe(100)
    expect(run1.results.testBreakdown.testB.count).toBe(0)

    // Then run only test B
    simulator.test('b100')
    const run2 = simulator.testRuns[1]
    expect(run2.results.testBreakdown.testB.count).toBe(100)

    // We should have some A∩B intersections
    expect(simulator.get('AB').tested).toBeGreaterThan(20)
  })

  it('should calculate intersections correctly when tests are run simultaneously', () => {
    const simulator = new Simulator(SMALL_SEED)

    // Run both tests at once
    simulator.test('a100b100')
    const run = simulator.testRuns[0]

    // Verify that we have results for both tests
    expect(run.results.testBreakdown.testA.count).toBe(100)
    expect(run.results.testBreakdown.testB.count).toBe(100)

    // We should have some A∩B intersections
    expect(simulator.get('AB').tested).toBeGreaterThan(20)
  })

  it('should track accumulating MT state between test runs', () => {
    const simulator = new Simulator(SMALL_SEED)
    const SAME_TEST_SET = 'a100'

    // Run some tests
    simulator.test(SAME_TEST_SET)
    const testRuns1 = [...simulator.testRuns]
    expect(testRuns1.length).toBe(1)

    // Run the same tests again
    simulator.test(SAME_TEST_SET)
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
    // We don't really want to do stuff like this,
    // just want to test & debug accessing the underlying private state.

    const sim = new Simulator(SMALL_SEED)
    sim.voteMap.set(1, {
      isActuallyCompromised: true,
      testResults: {},
      voteId: 1,
    })

    expect(sim.voteMap.get(1)?.isActuallyCompromised).toBe(true)
    // @ts-expect-error - intentionally accessing private state
    expect(sim._voteMap).toBe(sim.voteMap)
  })

  it('should have intersection shorthand getter', () => {
    let sim = new Simulator(SMALL_SEED)
    sim = sim.test('a10')

    // Manual way:
    const stats = sim.getIntersections()
    const get = (key: string) => stats.find((g) => g.key === key)
    expect(get('A')?.tested).toBe(10)
    expect(get('B')?.tested).toBe(0)
    expect(get('AB')?.tested).toBe(0)

    // New shorthand:
    expect(sim.get('A').tested).toBe(10)
    expect(sim.get('B').tested).toBe(0)
    expect(sim.get('AB').tested).toBe(0)

    // And with a 2nd test set:
    sim = sim.test('b10')
    expect(sim.get('A').tested).toBe(10)
    expect(sim.get('B').tested).toBe(10)
    expect(sim.get('AB').tested).toBe(5)
  })

  it('should get the same results for the same seed & tests', () => {
    // A single seed & test:
    const sim1 = new Simulator(SMALL_SEED, 'a10')
    const voteMap1 = new Map(sim1.voteMap)
    const sim2 = new Simulator(SMALL_SEED, 'a10')
    const voteMap2 = new Map(sim2.voteMap)
    expect(sim1.seed).toEqual(sim2.seed)
    expect(sim1.tests).toEqual(sim2.tests)
    expect(voteMap1).toEqual(voteMap2)
    expect(sim1.get('A').tested).toBe(10)

    // Multiple seeds & tests:
    const sim3 = new Simulator(SMALL_SEED, 'a10-b5-c10')
    const voteMap3 = new Map(sim3.voteMap)
    const sim4 = new Simulator(SMALL_SEED, 'a10-b5-c10')
    const voteMap4 = new Map(sim4.voteMap)
    expect(sim3.seed).toEqual(sim4.seed)
    expect(sim3.tests).toEqual(sim4.tests)
    expect(voteMap3).toEqual(voteMap4)

    // Or written sequentially as:
    const sim5 = new Simulator(SMALL_SEED, 'a10')
    sim5.test('b5')
    sim5.test('c10')
    const voteMap5 = new Map(sim5.voteMap)
    expect(sim5.seed).toEqual(sim3.seed)
    expect(sim5.tests).toEqual(sim3.tests)
    expect(voteMap5).toEqual(voteMap3)
  })

  it('should get the same results for a10-b10-c10 as a10b10c10', () => {
    const sim1 = new Simulator(SMALL_SEED, 'a10-b10-c10')
    const sim2 = new Simulator(SMALL_SEED, 'a10b10c10')

    // Spot check it ran the right tests
    ;['A', 'B', 'C'].forEach((test) => {
      expect(sim1.get(test).tested).toBe(10)
      expect(sim2.get(test).tested).toBe(10)
    })

    // And that they got the same deterministic results
    expect(sim1.getIntersections()).toEqual(sim2.getIntersections())
  })

  it('should mutate in place', () => {
    const sim = new Simulator(SMALL_SEED)
    expect(sim.testRuns.length).toBe(0)

    const result = sim.test('a10')
    expect(result).toBe(sim)
    expect(sim.testRuns.length).toBe(1)
  })
})
