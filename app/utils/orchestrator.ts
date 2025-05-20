import { MT19937 } from './mt19937'
import {
  SimulationResults,
  VoteTestResult,
  TestDetectionResults,
  generateSimulation,
  calculateTestResults,
} from './simulation'

function generateRandomSeed(): number {
  return Math.floor(Math.random() * 0x100000000)
}

export interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

export interface SimulationState {
  seed: number
  simulation: SimulationResults
  testRuns: TestRun[]
  nextRunId: number
  mt: MT19937
}

export class SimulationOrchestrator {
  private state: SimulationState

  constructor(seed?: number) {
    const initialSeed = seed ?? generateRandomSeed()
    this.state = {
      seed: initialSeed,
      simulation: generateSimulation(initialSeed),
      testRuns: [],
      nextRunId: 1,
      mt: new MT19937(initialSeed),
    }
  }

  getState(): SimulationState {
    return { ...this.state }
  }

  reset(seed?: number): void {
    const newSeed = seed ?? generateRandomSeed()
    this.state = {
      seed: newSeed,
      simulation: generateSimulation(newSeed),
      testRuns: [],
      nextRunId: 1,
      mt: new MT19937(newSeed),
    }
  }

  runTests(testCounts: {
    testA: string
    testB: string
    testC: string
  }): TestRun {
    const results = calculateTestResults(
      testCounts,
      this.state.simulation.compromisedVotes,
      this.state.simulation.totalVotes,
      this.state.mt
    )

    const testRun: TestRun = {
      id: this.state.nextRunId,
      results,
      timestamp: new Date(),
    }

    this.state.testRuns.push(testRun)
    this.state.nextRunId++

    return testRun
  }

  getTestResults(): TestDetectionResults[] {
    return this.state.testRuns.map((run) => run.results)
  }

  getIntersections(): Map<string, number> {
    const intersections = new Map<string, number>()
    const voteMap = new Map<number, VoteTestResult>()

    // Collect all test results into a single vote map
    for (const run of this.state.testRuns) {
      for (const testType of ['A', 'B', 'C'] as const) {
        const testResults =
          run.results.testBreakdown[`test${testType}`].voteResults
        for (const vote of testResults) {
          let existingVote = voteMap.get(vote.voteId)
          if (!existingVote) {
            existingVote = {
              voteId: vote.voteId,
              isActuallyCompromised: vote.isActuallyCompromised,
              testResults: {},
            }
            voteMap.set(vote.voteId, existingVote)
          }
          existingVote.testResults[`test${testType}`] =
            vote.testResults[`test${testType}`]
        }
      }
    }

    // Calculate intersections
    for (const vote of voteMap.values()) {
      const tests = Object.keys(vote.testResults)
      if (tests.length > 1) {
        const key = tests.sort().join('∩')
        intersections.set(key, (intersections.get(key) ?? 0) + 1)
      }
    }

    return intersections
  }
}
