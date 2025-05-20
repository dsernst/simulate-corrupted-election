import { describe, expect, it } from 'bun:test'
import { SimulationOrchestrator } from '../orchestrator'
import { testSet } from '../testSet'

describe('SimulationOrchestrator', () => {
  it('should maintain state between test runs', () => {
    const orchestrator = new SimulationOrchestrator(42)

    // Run first test
    const run1 = orchestrator.runTests(testSet('a100'))
    expect(run1.id).toBe(1)
    expect(run1.results.testBreakdown.testA.count).toBe(100)

    // Run second test
    const run2 = orchestrator.runTests(testSet('b100'))
    expect(run2.id).toBe(2)
    expect(run2.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = orchestrator.getIntersections()
    expect(intersections.get('testA∩testB')).toBeGreaterThan(0)
  })

  it('should handle reset correctly', () => {
    const orchestrator = new SimulationOrchestrator(42)

    // Run some tests
    orchestrator.runTests(testSet('a100'))
    orchestrator.runTests(testSet('b100'))

    // Reset with same seed
    orchestrator.reset(42)
    const state = orchestrator.getState()
    expect(state.testRuns).toHaveLength(0)
    expect(state.nextRunId).toBe(1)

    // Run tests again
    const run = orchestrator.runTests(testSet('a100'))
    expect(run.id).toBe(1)
  })

  it('should calculate intersections correctly across multiple runs', () => {
    const orchestrator = new SimulationOrchestrator(42)

    // Run tests in sequence
    orchestrator.runTests(testSet('a100'))
    orchestrator.runTests(testSet('b100'))
    orchestrator.runTests(testSet('c50'))

    const intersections = orchestrator.getIntersections()

    // Should have some A∩B intersections
    expect(intersections.get('testA∩testB')).toBeGreaterThan(0)

    // Should have some A∩C intersections
    expect(intersections.get('testA∩testC')).toBeGreaterThan(0)

    // Should have some B∩C intersections
    expect(intersections.get('testB∩testC')).toBeGreaterThan(0)

    // Should have some A∩B∩C intersections
    expect(intersections.get('testA∩testB∩testC')).toBeGreaterThan(0)
  })

  it('should calculate intersections correctly when tests are run sequentially', () => {
    const orchestrator = new SimulationOrchestrator(42)

    // First run only test A
    const run1 = orchestrator.runTests(testSet('a100'))
    expect(run1.results.testBreakdown.testA.count).toBe(100)

    // Then run only test B
    const run2 = orchestrator.runTests(testSet('b100'))
    expect(run2.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = orchestrator.getIntersections()

    // We should have some A∩B intersections
    expect(intersections.get('testA∩testB')).toBeGreaterThan(0)

    // Verify that the intersection votes have both test results
    const voteMap = new Map()
    for (const run of [run1, run2]) {
      for (const testType of ['A', 'B'] as const) {
        const testResults =
          run.results.testBreakdown[`test${testType}`].voteResults
        for (const vote of testResults) {
          let existingVote = voteMap.get(vote.voteId)
          if (!existingVote) {
            existingVote = {
              voteId: vote.voteId,
              testResults: {},
            }
            voteMap.set(vote.voteId, existingVote)
          }
          existingVote.testResults[`test${testType}`] =
            vote.testResults[`test${testType}`]
        }
      }
    }

    // Count votes that have both test results
    let intersectionCount = 0
    for (const vote of voteMap.values()) {
      if (
        vote.testResults.testA !== undefined &&
        vote.testResults.testB !== undefined
      ) {
        intersectionCount++
      }
    }
    expect(intersectionCount).toBeGreaterThan(0)
  })

  it('should calculate intersections correctly when tests are run simultaneously', () => {
    const orchestrator = new SimulationOrchestrator(42)

    // Run both tests at once
    const run = orchestrator.runTests(testSet('a100b100'))

    // Verify that we have results for both tests
    expect(run.results.testBreakdown.testA.count).toBe(100)
    expect(run.results.testBreakdown.testB.count).toBe(100)

    // Get intersections
    const intersections = orchestrator.getIntersections()

    // We should have some A∩B intersections
    expect(intersections.get('testA∩testB')).toBeGreaterThan(0)

    // Verify that the intersection votes have both test results
    const voteMap = new Map()
    for (const testType of ['A', 'B'] as const) {
      const testResults =
        run.results.testBreakdown[`test${testType}`].voteResults
      for (const vote of testResults) {
        let existingVote = voteMap.get(vote.voteId)
        if (!existingVote) {
          existingVote = {
            voteId: vote.voteId,
            testResults: {},
          }
          voteMap.set(vote.voteId, existingVote)
        }
        existingVote.testResults[`test${testType}`] =
          vote.testResults[`test${testType}`]
      }
    }

    // Count votes that have both test results
    let intersectionCount = 0
    for (const vote of voteMap.values()) {
      if (
        vote.testResults.testA !== undefined &&
        vote.testResults.testB !== undefined
      ) {
        intersectionCount++
      }
    }
    expect(intersectionCount).toBeGreaterThan(0)
  })
})
