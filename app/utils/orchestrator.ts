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
  voteMap: Map<number, VoteTestResult>
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
      voteMap: new Map<number, VoteTestResult>(),
    }
  }

  getState(): SimulationState {
    return { ...this.state }
  }

  reset(seed?: number): SimulationOrchestrator {
    const newSeed = seed ?? generateRandomSeed()
    return new SimulationOrchestrator(newSeed)
  }

  runTests(testCounts: {
    testA: string
    testB: string
    testC: string
  }): SimulationOrchestrator {
    const results = calculateTestResults(
      testCounts,
      this.state.simulation.compromisedVotes,
      this.state.simulation.totalVotes,
      this.state.mt,
      this.state.voteMap
    )

    const testRun: TestRun = {
      id: this.state.nextRunId,
      results,
      timestamp: new Date(),
    }

    const newOrchestrator = new SimulationOrchestrator(this.state.seed)
    newOrchestrator.state = {
      ...this.state,
      testRuns: [...this.state.testRuns, testRun],
      nextRunId: this.state.nextRunId + 1,
      voteMap: new Map(this.state.voteMap),
    }

    return newOrchestrator
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
        const key = tests
          .sort()
          .map((test) => `test${test.slice(-1)}`)
          .join('∩')
        intersections.set(key, (intersections.get(key) ?? 0) + 1)
      }
    }

    return intersections
  }
}
