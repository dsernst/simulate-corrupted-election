import { calculateLayeredStats } from './calculateIntersections'
import {
  calculateTestResults,
  ElectionResults,
  makeElection,
  TestDetectionResults,
  VoteTestResult,
} from './engine'
import { MT19937 } from './mt19937'
import { TestSet, testSet } from './testSet'

export interface SimulationState {
  election: ElectionResults
  mt: MT19937
  nextRunId: number
  seed: number
  testRuns: TestRun[]
  voteMap: Map<number, VoteTestResult>
}

export type SimulatorPrivateState = Omit<SimulationState, 'seed'>

export interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

type TestsShorthand = string

export class Simulator {
  public seed: number
  public tests: TestsShorthand = ''

  public get testSets(): TestSet[] {
    if (!this.tests) return []
    return this.tests.split('-').map(testSet)
  }

  private state: SimulatorPrivateState

  constructor(seed?: number, tests?: TestsShorthand) {
    const initialSeed = seed ?? generateRandomSeed()
    const mt = new MT19937(initialSeed)
    this.state = {
      election: makeElection(mt),
      mt,
      nextRunId: 1,
      testRuns: [],
      voteMap: new Map<number, VoteTestResult>(),
    }
    this.tests = tests ?? ''
    this.seed = initialSeed
  }

  getIntersections(): ReturnType<typeof calculateLayeredStats> {
    return calculateLayeredStats(this.state.testRuns)
  }

  getState(): SimulationState {
    return { ...this.state, seed: this.seed }
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
      nextRunId: this.state.nextRunId + 1,
      testRuns: [...this.state.testRuns, testRun],
      voteMap: new Map(this.state.voteMap),
    }

    return newSimulator
  }

  /** Syntactic sugar for .runTests(testSet('a500b100')) */
  test(testSetShorthand: TestsShorthand): Simulator {
    const testCounts = testSet(testSetShorthand)
    return this.runTests(testCounts)
  }
}

function generateRandomSeed(): number {
  return Math.floor(Math.random() * 0x100000)
}
