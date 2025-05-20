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
})
