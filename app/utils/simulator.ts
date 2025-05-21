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

export interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

interface SimulatorState {
  mt: MT19937
  testRuns: TestRun[]
  voteMap: Map<number, VoteTestResult>
}

type TestsShorthand = string

export class Simulator {
  public seed: number
  public tests: TestsShorthand = ''

  public get election(): ElectionResults {
    return makeElection(new MT19937(this.seed))
  }

  public get testSets(): TestSet[] {
    if (!this.tests) return []
    return this.tests.split('-').map(testSet)
  }

  private state: SimulatorState

  constructor(seed?: number, tests?: TestsShorthand) {
    const initialSeed = seed ?? generateRandomSeed()
    const mt = new MT19937(initialSeed)
    this.state = {
      mt,
      testRuns: [],
      voteMap: new Map<number, VoteTestResult>(),
    }
    this.tests = tests ?? ''
    this.seed = initialSeed
  }

  getIntersections(): ReturnType<typeof calculateLayeredStats> {
    return calculateLayeredStats(this.state.testRuns)
  }

  getState(): SimulatorState {
    return { ...this.state }
  }

  runTests(testCounts: {
    testA: string
    testB: string
    testC: string
  }): Simulator {
    const results = calculateTestResults(
      testCounts,
      this.election.compromisedVotes,
      this.election.totalVotes,
      this.state.mt,
      this.state.voteMap
    )

    const testRun: TestRun = {
      id: this.state.testRuns.length + 1,
      results,
      timestamp: new Date(),
    }

    const newSimulator = new Simulator(this.seed)
    newSimulator.state = {
      ...this.state,
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
