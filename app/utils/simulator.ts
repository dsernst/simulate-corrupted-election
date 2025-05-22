import { LRUCache } from 'lru-cache'

import {
  calculateLayeredStats,
  LayeredStat,
  TestRun,
} from './calculateIntersections'
import {
  calculateTestResults,
  ElectionResults,
  makeElection,
  VoteTestResult,
} from './engine'
import { MT19937 } from './mt19937'
import { TestSet, testSet, TestsShorthand, toTestSetString } from './testSet'

type CacheKey = `${Seed}.${TestsShorthand}`
type Seed = number
type SimulatorState = {
  _testRuns: TestRun[]
  mt: MT19937
}

const _electionCache = new LRUCache<Seed, ElectionResults>({ max: 50 })
const _intersectionCache = new LRUCache<CacheKey, LayeredStat[]>({ max: 20 })

const makeCacheKey = (seed: Seed, tests: TestsShorthand): CacheKey =>
  `${seed}.${tests}`

export class Simulator {
  public seed: number
  public tests: TestsShorthand = ''

  /** Memoized election results from seed */
  public get election(): ElectionResults {
    // Create cached copy on first access
    if (!_electionCache.has(this.seed))
      _electionCache.set(this.seed, makeElection(new MT19937(this.seed)))

    // Always return cached copy
    return _electionCache.get(this.seed)!
  }

  // public get testRuns(): TestRun[] {
  //   return this.testSets.map((testSet) => ({
  //     id: this.tests.split('-').length,
  //     results: calculateTestResults(
  //       testSet,
  //       this.election.compromisedVotes,
  //       this.election.totalVotes,
  //       this.state.mt,
  //       this.state.voteMap
  //     ),
  //     timestamp: new Date(),
  //   }))
  // }
  public get testRuns(): TestRun[] {
    return this.state._testRuns
  }

  public get testSets(): TestSet[] {
    if (!this.tests) return []
    return this.tests.split('-').map(testSet)
  }

  public get voteMap(): Map<number, VoteTestResult> {
    return this._voteMap
  }
  private _voteMap: Map<number, VoteTestResult>

  private state: SimulatorState

  constructor(seed?: number, tests?: TestsShorthand) {
    const initialSeed = seed ?? generateRandomSeed()
    const mt = new MT19937(initialSeed)
    this._voteMap = new Map<number, VoteTestResult>()
    this.state = {
      _testRuns: [],
      mt,
    }
    this.tests = tests ?? ''
    this.seed = initialSeed
  }

  getIntersections(): LayeredStat[] {
    // Calc cache key from `seed` & `tests`
    const cacheKey = makeCacheKey(this.seed, this.tests)

    // Create cached copy on first access
    if (!_intersectionCache.has(cacheKey))
      _intersectionCache.set(cacheKey, calculateLayeredStats(this.testRuns))

    // Always return cached copy
    return _intersectionCache.get(cacheKey)!
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
      this.voteMap
    )

    const newTests = toTestSetString(testCounts)
    this.tests += (this.tests ? `-` : '') + newTests

    const testRun: TestRun = {
      id: this.tests.split('-').length,
      results,
      timestamp: new Date(),
    }

    const newSimulator = new Simulator(this.seed, this.tests)
    newSimulator.state = {
      ...this.state,
      _testRuns: [...this.testRuns, testRun],
    }
    newSimulator._voteMap = this._voteMap

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
