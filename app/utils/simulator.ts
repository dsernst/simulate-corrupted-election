import { calculateLayeredStats } from './calculateIntersections'
import {
  ElectionResults,
  VoteTestResult,
  TestDetectionResults,
  makeElection,
  calculateTestResults,
} from './engine'
import { MT19937 } from './mt19937'
import { testSet } from './testSet'

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
  election: ElectionResults
  testRuns: TestRun[]
  nextRunId: number
  mt: MT19937
  voteMap: Map<number, VoteTestResult>
}

export class Simulator {
  private state: SimulationState

  constructor(seed?: number) {
    const initialSeed = seed ?? generateRandomSeed()
    const mt = new MT19937(initialSeed)
    this.state = {
      seed: initialSeed,
      election: makeElection(mt),
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
  }): Simulator {
    const results = calculateTestResults(
      testCounts,
      this.state.election.compromisedVotes,
      this.state.election.totalVotes,
      this.state.mt,
      this.state.voteMap
    )

    const testRun: TestRun = {
      id: this.state.nextRunId,
      results,
      timestamp: new Date(),
    }

    const newSimulator = new Simulator()
    newSimulator.state = {
      ...this.state,
      testRuns: [...this.state.testRuns, testRun],
      nextRunId: this.state.nextRunId + 1,
      voteMap: new Map(this.state.voteMap),
    }

    return newSimulator
  }

  /** Syntactic sugar for .runTests(testSet('a500b100')) */
  test(testSetShorthand: string): Simulator {
    const testCounts = testSet(testSetShorthand)
    return this.runTests(testCounts)
  }

  getIntersections(): ReturnType<typeof calculateLayeredStats> {
    return calculateLayeredStats(this.state.testRuns)
  }
}
