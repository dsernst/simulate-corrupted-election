import { LRUCache } from 'lru-cache'

import {
  calculateAllConfusionMatrices,
  calculateLayeredStats,
  ConfusionMatrices,
  LayeredStat,
  TestRun,
} from './calculateIntersections'
import { ElectionResults, makeElection } from './makeElection'
import { MT19937 } from './mt19937'
import { simTests, VoteTestResult } from './simTests'
import { TestSet, testSet, TestsShorthand, toTestSetString } from './testSet'

type CacheKey = `${Seed}.${TestsShorthand}`
type Seed = number
type VoteMap = Map<number, VoteTestResult>

const _electionCache = new LRUCache<CacheKey, ElectionResults>({ max: 50 })
const _intersectionCache = new LRUCache<CacheKey, LayeredStat[]>({ max: 20 })
const _confusionMatricesCache = new LRUCache<CacheKey, ConfusionMatrices>({
  max: 20,
})

const makeCacheKey = (seed: Seed, tests: TestsShorthand): CacheKey =>
  `${seed}.${tests}`

export class Simulator {
  public seed: number
  public tests: TestsShorthand = ''

  /** Memoized election results from seed */
  public get election(): ElectionResults {
    return this._getCachedResult(
      _electionCache,
      () => makeElection(new MT19937(this.seed)),
      { seedOnly: true }
    )
  }

  public get testRuns(): TestRun[] {
    return this._testRuns
  }

  public get testSets(): TestSet[] {
    if (!this.tests) return []
    return this.tests.split('-').map(testSet)
  }

  public get totalCompromisesSeen(): number {
    let total = 0
    this.testRuns.forEach((run) => {
      Object.values(run.results.testBreakdown).forEach((test) => {
        total += test.detectedCompromised
      })
    })
    return total
  }

  public get voteMap(): VoteMap {
    return this._voteMap
  }
  private _mt: MT19937
  private _testRuns: TestRun[]
  private _voteMap: VoteMap

  constructor(seed?: number, tests = '') {
    const initialSeed = seed ?? generateRandomSeed()

    // Init public state
    this.seed = initialSeed
    this.tests = ''

    // Init private state
    this._mt = new MT19937(initialSeed)
    this._testRuns = []
    this._voteMap = new Map<number, VoteTestResult>()

    // If tests string was provided, replay each
    const testSets = tests.split('-').filter(Boolean)
    for (const set of testSets) this.runTests(testSet(set))
  }

  /** Syntactic sugar for .getIntersections().find(stat => stat.label === testSetShorthand) */
  get(intersectionKey: TestsShorthand): LayeredStat {
    return (
      this.getIntersections().find((stat) => stat.key === intersectionKey) || {
        compromises: [],
        key: intersectionKey,
        percentages: [],
        tested: 0,
      }
    )
  }

  getConfusionMatrices(): ConfusionMatrices {
    return this._getCachedResult(_confusionMatricesCache, () =>
      calculateAllConfusionMatrices(this.testRuns)
    )
  }

  getIntersections(): LayeredStat[] {
    return this._getCachedResult(_intersectionCache, () =>
      calculateLayeredStats(this.testRuns)
    )
  }

  runTests(testCounts: {
    testA: string
    testB: string
    testC: string
  }): Simulator {
    const startTime = new Date()
    const results = simTests(
      testCounts,
      this.election.compromisedVotes,
      this.election.totalVotes,
      this._mt,
      this.voteMap
    )

    const newTests = toTestSetString(testCounts)
    this.tests = [this.tests, newTests].filter(Boolean).join('-')
    const timestamp = new Date()

    this._testRuns.push({
      id: this.tests.split('-').length,
      results,
      testTime: timestamp.getTime() - startTime.getTime(),
      timestamp,
    })

    return this
  }

  /** Syntactic sugar for .runTests(testSet('a500b100')) */
  test(testsString: TestsShorthand): Simulator {
    return this.runTests(testSet(testsString))
  }

  /** Private helper to handle caching logic */
  private _getCachedResult<T extends object>(
    cache: LRUCache<CacheKey, T>,
    calculateFn: () => T,
    options: { seedOnly?: boolean } = {}
  ): T {
    const cacheKey = makeCacheKey(this.seed, options.seedOnly ? '' : this.tests)

    // Create cached copy on first access
    if (!cache.has(cacheKey)) cache.set(cacheKey, calculateFn())

    // Always return cached copy
    return cache.get(cacheKey)!
  }
}

function generateRandomSeed(): number {
  return Math.floor(Math.random() * 0x100000)
}
