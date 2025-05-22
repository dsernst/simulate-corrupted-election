import { MT19937 } from './mt19937'

export type TestDetectionResults = { testBreakdown: TestBreakdown }
export type VoteTestResult = {
  isActuallyCompromised: boolean
  testResults: {
    [key in LongKey]?: boolean // true if detected as compromised
  }
  voteId: number
}

type Effectiveness = { falseCleanRate: number; falseCompromisedRate: number }
type LongKey = `test${TestType}`
type TestBreakdown = {
  [key in LongKey]: TestResult
}
type TestEffectiveness = {
  [key in LongKey]: Effectiveness
}
type TestResult = {
  count: number
  detectedCompromised: number
  voteResults: VoteTestResult[]
}
/** Types of tests available. */
type TestType = 'A' | 'B' | 'C'
const TEST_TYPES: TestType[] = ['A', 'B', 'C']

/** Simulates running tests on votes to detect compromised votes. */
export function simTests(
  testCounts: { [key in LongKey]: string },
  compromisedVotes: number,
  totalVotes: number,
  mt: MT19937,
  voteMap: Map<number, VoteTestResult>
): TestDetectionResults {
  const effectiveness: TestEffectiveness = {
    testA: {
      falseCleanRate: 0.4, // 40% chance of missing a compromised vote
      falseCompromisedRate: 0.1, // 10% chance of false alarm
    },
    testB: {
      falseCleanRate: 0.1, // 10% chance of missing a compromised vote
      falseCompromisedRate: 0.05, // 5% chance of false alarm
    },
    testC: {
      falseCleanRate: 0, // Perfect detection of compromised votes
      falseCompromisedRate: 0, // Perfect detection of clean votes
    },
  }

  // Convert string inputs to numbers, default to 0
  const counts = {
    testA: parseCount(testCounts.testA, 'testA'),
    testB: parseCount(testCounts.testB, 'testB'),
    testC: parseCount(testCounts.testC, 'testC'),
  }

  // Initialize test breakdown with vote tracking
  const testBreakdown = {
    testA: { count: 0, detectedCompromised: 0, voteResults: [] },
    testB: { count: 0, detectedCompromised: 0, voteResults: [] },
    testC: { count: 0, detectedCompromised: 0, voteResults: [] },
  } as TestBreakdown

  /** Helper: run a test on a single vote and update state */
  function runTestOnVote(
    voteId: number,
    testType: TestType,
    effectiveness: Effectiveness
  ) {
    let voteResult = voteMap.get(voteId)
    if (!voteResult) {
      const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes, mt)
      voteResult = {
        isActuallyCompromised,
        testResults: {},
        voteId,
      }
      voteMap.set(voteId, voteResult)
    }
    const isDetectedCompromised = runTest(
      effectiveness,
      voteResult.isActuallyCompromised,
      mt
    )
    voteResult.testResults[`test${testType}`] = isDetectedCompromised
    testBreakdown[`test${testType}`].count++
    if (isDetectedCompromised) {
      testBreakdown[`test${testType}`].detectedCompromised++
    }
    testBreakdown[`test${testType}`].voteResults.push(voteResult)
  }

  /** Generic batch runner for a test type */
  function runTestBatch(
    testType: TestType,
    count: number,
    effectiveness: Effectiveness,
    getEligibleVotes: () => number[]
  ) {
    const eligible = getEligibleVotes()
    const samples = Math.min(count, eligible.length)
    const sampleIds = getRandomSample(eligible, samples, mt)
    for (const id of sampleIds) {
      runTestOnVote(id, testType, effectiveness)
    }
  }

  /** Helper: sample only from never-before-tested votes */
  function sampleNeverTested(
    neverTested: number[],
    n: number,
    mt: MT19937
  ): number[] {
    return getRandomSample(neverTested, Math.min(n, neverTested.length), mt)
  }

  /** Helper: even split samples for B tests */
  function evenSplitSample(
    groups: { [key: string]: number[] },
    total: number,
    mt: MT19937
  ): number[] {
    const keys = Object.keys(groups)
    let result: number[] = []
    let remaining = total
    const half = Math.floor(total / 2)
    for (const key of keys) {
      const n = Math.min(half, groups[key].length)
      const sampledFromThisGroup = getRandomSample(groups[key], n, mt)
      result = result.concat(sampledFromThisGroup)
      groups[key] = groups[key].filter(
        (id) => !sampledFromThisGroup.includes(id)
      )
      remaining -= n
    }
    while (remaining > 0) {
      const available = keys.filter((key) => groups[key].length > 0)
      if (available.length === 0) break
      available.sort((a, b) => groups[b].length - groups[a].length)
      const key = available[0]
      const [sampledId] = getRandomSample(groups[key], 1, mt)
      result = result.concat(sampledId)
      groups[key] = groups[key].filter((id) => id !== sampledId)
      remaining--
    }
    return result
  }

  // Run A tests on never-before-tested by A
  runTestBatch('A', counts.testA, effectiveness.testA, () => {
    return sampleNeverTested(getNeverTested('A'), counts.testA, mt)
  })

  // Run B tests on never-before-tested by B, then even split between A & !A
  runTestBatch('B', counts.testB, effectiveness.testB, () => {
    const neverTested = getNeverTested('B')
    const groups = { aTested: [], aUntested: [] } as { [key: string]: number[] }
    for (const id of neverTested) {
      const voteResult = voteMap.get(id)
      if (voteResult?.testResults.testA !== undefined) {
        groups.aTested.push(id)
      } else {
        groups.aUntested.push(id)
      }
    }
    return evenSplitSample(groups, counts.testB, mt)
  })

  // Run C tests on never-before-tested by C, then group for even distribution
  runTestBatch('C', counts.testC, effectiveness.testC, () => {
    // Group all eligible votes into quadrants first
    const quadrants: { [key: string]: number[] } = {
      '!A&!B': [],
      '!A&B': [],
      'A&!B': [],
      'A&B': [],
    }
    for (const id of getNeverTested('C')) {
      const voteResult = voteMap.get(id)
      const aTested = voteResult?.testResults.testA !== undefined
      const bTested = voteResult?.testResults.testB !== undefined
      const key = `${aTested ? 'A' : '!A'}&${bTested ? 'B' : '!B'}`
      quadrants[key].push(id)
    }
    return groupedSample(quadrants, counts.testC, mt)
  })

  /** Get never-before-tested votes for a test type */
  function getNeverTested(testType: TestType): number[] {
    const testKey = `test${testType}` as const
    const neverTested: number[] = []
    for (let i = 1; i <= totalVotes; i++) {
      const voteResult = voteMap.get(i)
      if (voteResult?.testResults[testKey] === undefined) {
        neverTested.push(i)
      }
    }
    return neverTested
  }

  // Update test breakdown with all votes that have been tested
  for (const [voteId, voteResult] of voteMap.entries()) {
    for (const testType of TEST_TYPES) {
      const testKey = `test${testType}` as const
      // Only include results for tests actually requested in this run
      if (
        counts[testKey] > 0 &&
        voteResult.testResults[testKey] !== undefined
      ) {
        if (
          !testBreakdown[testKey].voteResults.some((v) => v.voteId === voteId)
        ) {
          testBreakdown[testKey].voteResults.push(voteResult)
        }
      }
    }
  }

  // Update counts based on vote results
  for (const testType of TEST_TYPES) {
    const testKey = `test${testType}` as const
    // Only count votes for tests actually requested in this run
    if (counts[testKey] > 0) {
      testBreakdown[testKey].count = testBreakdown[testKey].voteResults.length
      testBreakdown[testKey].detectedCompromised = testBreakdown[
        testKey
      ].voteResults.filter((v) => v.testResults[testKey] === true).length
    } else {
      testBreakdown[testKey].count = 0
      testBreakdown[testKey].detectedCompromised = 0
      testBreakdown[testKey].voteResults = []
    }
  }

  return { testBreakdown }
}

/** Returns a random sample of n elements from arr using the provided PRNG. */
function getRandomSample<T>(arr: T[], n: number, mt: MT19937): T[] {
  // Fisher-Yates shuffle for reproducible random sampling
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(mt.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

/** Utility: sample from groups evenly, for C votes */
function groupedSample<T>(
  groups: { [key: string]: T[] },
  total: number,
  mt: MT19937
): T[] {
  const groupKeys = Object.keys(groups).filter((k) => groups[k].length > 0)
  const nGroups = groupKeys.length
  if (nGroups === 0) return []
  const base = Math.floor(total / nGroups)
  let assignedTotal = 0
  const toAssign: { [key: string]: number } = {}
  for (const key of groupKeys) {
    toAssign[key] = Math.min(base, groups[key].length)
    assignedTotal += toAssign[key]
  }
  let remainder = total - assignedTotal
  // Distribute remainder to any group with available votes
  while (remainder > 0) {
    // Sort groups by available votes descending
    groupKeys.sort(
      (a, b) =>
        groups[b].length - toAssign[b] - (groups[a].length - toAssign[a])
    )
    let assigned = false
    for (const key of groupKeys) {
      if (groups[key].length > toAssign[key]) {
        toAssign[key]++
        remainder--
        assigned = true
        if (remainder === 0) break
      }
    }
    if (!assigned) break // No more available votes in any group
  }
  let result: T[] = []
  for (const key of groupKeys) {
    if (toAssign[key] > 0) {
      result = result.concat(getRandomSample(groups[key], toAssign[key], mt))
    }
  }
  return result
}

/** Parses a string count, throws if invalid. */
function parseCount(val: string, label: string): number {
  const n = parseInt(val || '0', 10)
  if (isNaN(n) || n < 0)
    throw new Error(`Invalid test count for ${label}: ${val}`)
  return n
}

/** Simulates running a test on a vote, returns true if detected as compromised. */
function runTest(
  effectiveness: Effectiveness,
  isActuallyCompromised: boolean,
  mt: MT19937
): boolean {
  const random = mt.random()

  if (isActuallyCompromised) {
    // For actually compromised votes, we have a false clean rate
    return random >= effectiveness.falseCleanRate
  } else {
    // For actually clean votes, we have a false compromised rate
    return random < effectiveness.falseCompromisedRate
  }
}

/** Randomly determines if a vote is compromised. */
function sampleVote(
  compromisedVotes: number,
  totalVotes: number,
  mt: MT19937
): boolean {
  // Randomly select a vote and determine if it's compromised
  return mt.random() < compromisedVotes / totalVotes
}
