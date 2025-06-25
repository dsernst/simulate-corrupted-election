import { LRUCache } from 'lru-cache'

import {
  getFilterFromKey,
  getTestsFromKey,
  intersectionGroups,
} from './createIntersections'
import { TestDetectionResults } from './simTests'

export type ConfusionMatrices = {
  first: TestType
  matrix: ConfusionMatrix
  second: TestType
}[]

export interface LayeredStat {
  compromises: (number | undefined)[]
  key: string
  label: string
  percentages: (number | undefined)[]
  tested: number
}

export interface TestRun {
  id: number
  results: TestDetectionResults
  testTime: number
  timestamp: Date
}

export type TestType = 'A' | 'B' | 'C'

// Define a type for the vote object in voteMap
export interface VoteResult {
  testA: boolean | undefined
  testB: boolean | undefined
  testC: boolean | undefined
  testedA: boolean | undefined
  testedB: boolean | undefined
  testedC: boolean | undefined
}

type ConfusionMatrix = {
  clean_clean: number
  clean_compromised: number
  compromised_clean: number
  compromised_compromised: number
  total: number
}

export function calculateAllConfusionMatrices(
  testRuns: TestRun[]
): ConfusionMatrices {
  const pairs = [
    { first: 'A', second: 'B' },
    { first: 'A', second: 'C' },
    { first: 'B', second: 'C' },
  ] as const

  return pairs.map(({ first, second }) => ({
    first,
    matrix: calculateConfusionMatrix(testRuns, first, second),
    second,
  }))
}

export function calculateLayeredStats(testRuns: TestRun[]): LayeredStat[] {
  // Build voteMap
  // console.time('build voteMap')
  const voteMap = buildVoteMapMemoized(testRuns)
  // console.timeEnd('build voteMap')

  // Create results object for each group
  // console.time('create groups')
  const groups = intersectionGroups.map((key) => ({
    includes: getFilterFromKey(key),
    key,
    tests: getTestsFromKey(key),
    votes: [] as VoteResult[],
  }))
  // console.timeEnd('create groups')

  // Test each vote for membership in each group
  // console.time('assign votes to groups')
  for (const vote of voteMap.values()) {
    for (const group of groups) {
      if (group.includes(vote)) group.votes.push(vote)
    }
  }
  // console.timeEnd('assign votes to groups')

  // Calculate stats for each group
  return groups.map(({ key, tests, votes }) => {
    // For single-test groups, compromised is just that test; for intersections, use marginal counts
    // console.time(key + ': getMarginalCompromisedCounts')
    const compromises = getMarginalCompromisedCounts(votes, tests)
    // console.timeEnd(key + ': getMarginalCompromisedCounts')

    return {
      compromises,
      key,
      label: key, // For now, label is an alias to key
      percentages: getMarginalCompromisedPercents(votes, compromises),
      tested: votes.length,
    }
  })
}

// Utility: Marginal count for each test (votes where test detected compromise, regardless of others)
export function getMarginalCompromisedCounts(
  votes: VoteResult[],
  tests: ('A' | 'B' | 'C')[]
) {
  return tests.map((t) => votes.filter((v) => v[`test${t}`] === true).length)
}

export function getMarginalCompromisedPercents(
  votes: VoteResult[],
  compromises: number[]
) {
  const total = votes.length
  if (total === 0) return compromises.map(() => undefined)
  return compromises.map((count) => Math.round((count / total) * 1000) / 10)
}

/** Utility: Convert canonical group key to display label */
export function toDisplayLabelFromKey(key: string): string {
  // Match either ![A-Z] or [A-Z]
  const parts = key.match(/!?[A-Z]/g) || []
  return parts
    .map((part) => (part.startsWith('!') ? `not ${part[1]}` : part))
    .join(' & ')
}

const _voteMapCache = new LRUCache<string, Map<number, VoteResult>>({ max: 10 })
const makeVoteMapCacheKey = (testRuns: TestRun[]) =>
  testRuns.map((run) => `${run.id}-${run.timestamp.getTime()}`).join('|')

function buildVoteMapMemoized(testRuns: TestRun[]) {
  const cacheKey = makeVoteMapCacheKey(testRuns)

  // Use cache if available
  if (_voteMapCache.has(cacheKey)) return _voteMapCache.get(cacheKey)!

  const voteMap = new Map<number, VoteResult>()
  testRuns.forEach((run) => {
    Object.entries(run.results.testBreakdown).forEach(([testKey, test]) => {
      const testType = testKey.slice(-1) as TestType
      test.voteResults.forEach((vote) => {
        const existing = voteMap.get(vote.voteId) || {
          testA: undefined,
          testB: undefined,
          testC: undefined,
          testedA: false,
          testedB: false,
          testedC: false,
        }
        voteMap.set(vote.voteId, {
          ...existing,
          [`test${testType}`]: vote.testResults[`test${testType}`],
          [`tested${testType}`]: true,
        })
      })
    })
  })

  // Cache the result
  _voteMapCache.set(cacheKey, voteMap)

  return voteMap
}

function calculateConfusionMatrix(
  testRuns: TestRun[],
  testType1: TestType,
  testType2: TestType
): ConfusionMatrix {
  const voteMap = buildVoteMapMemoized(testRuns)

  let clean_clean = 0
  let clean_compromised = 0
  let compromised_clean = 0
  let compromised_compromised = 0
  let total = 0

  voteMap.forEach((v) => {
    const tested1 = v[`tested${testType1}`]
    const tested2 = v[`tested${testType2}`]
    if (tested1 && tested2) {
      const result1 = v[`test${testType1}`]
      const result2 = v[`test${testType2}`]
      // true = compromised, false = clean
      if (!result1 && !result2) clean_clean++
      else if (!result1 && result2) clean_compromised++
      else if (result1 && !result2) compromised_clean++
      else if (result1 && result2) compromised_compromised++
      total++
    }
  })

  return {
    clean_clean,
    clean_compromised,
    compromised_clean,
    compromised_compromised,
    total,
  }
}
