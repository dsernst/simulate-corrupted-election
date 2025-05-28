import { getRandomSample } from './getRandomSample'
import { mapObject } from './misc'
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
type TestBreakdown = { [key in LongKey]: TestResult }
type TestEffectiveness = { [key in LongKey]: Effectiveness }
type TestResult = {
  count: number
  detectedCompromised: number
  voteResults: VoteTestResult[]
}
/** Types of tests available. */
type TestType = 'A' | 'B' | 'C'

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
  const counts = mapObject(testCounts, parseCount)

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
    if (isDetectedCompromised)
      testBreakdown[`test${testType}`].detectedCompromised++
    testBreakdown[`test${testType}`].voteResults.push(voteResult)
  }

  /** Generic batch runner for a test type */
  function runTestBatch(
    testType: TestType,
    count: number,
    effectiveness: Effectiveness,
    getEligibleVotes: () => number[]
  ) {
    if (!count) return
    const eligible = getEligibleVotes()
    const samples = Math.min(count, eligible.length)
    const sampleIds = getRandomSample(eligible, samples, mt)
    for (const id of sampleIds) {
      runTestOnVote(id, testType, effectiveness)
    }
  }

  // Run A tests on never-before-tested by A
  runTestBatch('A', counts.testA, effectiveness.testA, () => {
    const neverTested = getNeverTested('A', totalVotes, voteMap)
    return getRandomSample(
      neverTested,
      Math.min(counts.testA, neverTested.length),
      mt
    )
  })

  // Stop early if no more tests needed
  if (counts.testB + counts.testC === 0) return { testBreakdown }

  // Cache A-tested vote IDs
  const aTestedIds = new Set<number>()
  for (const [id, result] of voteMap.entries()) {
    if (result.testResults.testA !== undefined) aTestedIds.add(id)
  }

  // Run B tests on never-before-tested by B, then even split between A & !A
  runTestBatch('B', counts.testB, effectiveness.testB, () => {
    const neverTested = getNeverTested('B', totalVotes, voteMap)

    const aTested = new Array<number>()
    const aUntested = new Array<number>()
    for (let i = 0; i < neverTested.length; i++) {
      const id = neverTested[i]
      if (aTestedIds.has(id)) {
        aTested.push(id)
      } else {
        aUntested.push(id)
      }
    }
    const groups = { aTested, aUntested }

    const result = groupedSample(groups, counts.testB, mt)
    return result
  })

  // Stop early if no more tests needed
  if (counts.testC === 0) return { testBreakdown }

  // Cache B-tested vote IDs
  const bTestedIds = new Set<number>()
  for (const [id, result] of voteMap.entries()) {
    if (result.testResults.testB !== undefined) bTestedIds.add(id)
  }

  // Run C tests on never-before-tested by C, then group for even distribution
  runTestBatch('C', counts.testC, effectiveness.testC, () => {
    // Group all eligible votes into quadrants first
    const quadrants: { [key: string]: number[] } = {
      '!A&!B': [],
      '!A&B': [],
      'A&!B': [],
      'A&B': [],
    }
    for (const id of getNeverTested('C', totalVotes, voteMap)) {
      const aTested = aTestedIds.has(id)
      const bTested = bTestedIds.has(id)
      const key = `${aTested ? 'A' : '!A'}&${bTested ? 'B' : '!B'}`
      quadrants[key].push(id)
    }
    return groupedSample(quadrants, counts.testC, mt)
  })

  return { testBreakdown }
}

/** Get never-before-tested votes for a test type */
function getNeverTested(
  testType: TestType,
  totalVotes: number,
  voteMap: Map<number, VoteTestResult>
): number[] {
  // First, build quick lookup for already-tested IDs
  const testedIds = new Set<number>()
  for (const [id, result] of voteMap.entries()) {
    if (result.testResults[`test${testType}`] !== undefined) testedIds.add(id)
  }

  // Then, everything else, up to `totalVotes`, is never-tested
  const neverTested = new Array<number>()
  for (let i = 1; i <= totalVotes; i++) {
    if (!testedIds.has(i)) neverTested.push(i)
  }

  return neverTested
}

/** Utility: sample from already-tested groups evenly */
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
function parseCount(val: string): number {
  const n = parseInt(val || '0', 10)
  if (isNaN(n) || n < 0) throw new Error(`Invalid test count: ${val}`)
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
