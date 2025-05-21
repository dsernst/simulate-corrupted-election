import { describe, expect, test } from 'bun:test'
import { SimulationOrchestrator } from '../orchestrator'
import { testSet } from '../testSet'

/** This seed has 45k votes: relatively small, for faster tests. */
export const SMALL_SEED = 54801

describe('Even test distribution', () => {
  test('B tests should be split 50/50 between A and !A tested votes', () => {
    let orchestrator = new SimulationOrchestrator(SMALL_SEED)

    // Run A tests first
    orchestrator = orchestrator.runTests(testSet('a1000'))
    // Then run B tests
    orchestrator = orchestrator.runTests(testSet('b1000'))

    const intersections = orchestrator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)

    // Get the intersection counts
    const bAndA = get('AB')?.tested ?? 0
    const bAndNotA = get('B!A')?.tested ?? 0
    const totalB = bAndA + bAndNotA

    // Verify B tests are split roughly 50/50
    expect(Math.abs(bAndA - bAndNotA)).toBeLessThanOrEqual(totalB * 0.1) // Allow 10% deviation
  })

  test('C tests should be split 25/25/25/25 across A/B combinations', () => {
    let orchestrator = new SimulationOrchestrator(SMALL_SEED)

    // Run tests in sequence
    orchestrator = orchestrator.runTests(testSet('a100'))
    orchestrator = orchestrator.runTests(testSet('b100'))
    orchestrator = orchestrator.runTests(testSet('c100'))

    const intersections = orchestrator.getIntersections()
    const get = (label: string) => intersections.find((g) => g.label === label)

    // Get the intersection counts for C tests
    const ABC = get('ABC')?.tested ?? 0
    const AC = get('AC!B')?.tested ?? 0
    const BC = get('BC!A')?.tested ?? 0
    const C = get('C!A!B')?.tested ?? 0
    const totalC = ABC + AC + BC + C

    // Confirm tests ran
    expect(totalC).toBeGreaterThan(75)

    // Each quadrant should be roughly 25%
    const expected = totalC * 0.25
    const tolerance = totalC / 10 // Allow 10% deviation
    ;[ABC, AC, BC, C].forEach((subset) => {
      expect(Math.abs(subset - expected)).toBeLessThanOrEqual(tolerance)
    })
  })
})

describe('C test distribution edge cases', () => {
  test('should not throw or hang when testC is not divisible by 4', () => {
    // Try a range of C test counts not divisible by 4
    for (let c = 1; c <= 5; c++) {
      let orchestrator = new SimulationOrchestrator(SMALL_SEED)
      expect(() => {
        orchestrator = orchestrator.runTests(testSet(`a10b10c${c}`))
        const state = orchestrator.getState()
        const lastRun = state.testRuns[state.testRuns.length - 1]
        // The total number of C tests should match the request or be capped by available votes
        expect(lastRun.results.testBreakdown.testC.count).toBeLessThanOrEqual(c)
      }).not.toThrow()
    }
  })

  test('should distribute all C tests even if not divisible by 4', () => {
    let orchestrator = new SimulationOrchestrator(SMALL_SEED)
    orchestrator = orchestrator.runTests(testSet('a30b30c19'))

    const state = orchestrator.getState()
    const lastRun = state.testRuns[state.testRuns.length - 1]
    // Should not hang and should assign all 19 C tests
    expect(lastRun.results.testBreakdown.testC.count).toBe(19)
  })
})
