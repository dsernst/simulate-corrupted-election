import { MT19937 } from './mt19937'
import {
  SimulationResults,
  VoteTestResult,
  TestDetectionResults,
  generateSimulation,
  calculateTestResults,
} from './simulation'
import { calculateLayeredStats } from './calculateIntersections'

function generateRandomSeed(): number {
  return Math.floor(Math.random() * 0x100000)
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
    const mt = new MT19937(initialSeed)
    this.state = {
      seed: initialSeed,
      simulation: generateSimulation(mt),
      testRuns: [],
      nextRunId: 1,
      mt,
      voteMap: new Map<number, VoteTestResult>(),
    }
  }

  getState(): SimulationState {
    return { ...this.state }
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

  getIntersections(): ReturnType<typeof calculateLayeredStats> {
    return calculateLayeredStats(this.state.testRuns)
  }
}
