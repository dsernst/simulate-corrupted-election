import { MT19937 } from './mt19937'

export interface TestDetectionResults {
  testBreakdown: {
    testA: TestResult
    testB: TestResult
    testC: TestResult
  }
}

export interface VoteTestResult {
  isActuallyCompromised: boolean
  testResults: {
    testA?: boolean // true if detected as compromised
    testB?: boolean
    testC?: boolean
  }
  voteId: number
}

interface Effectiveness {
  falseCleanRate: number
  falseCompromisedRate: number
}

interface TestEffectiveness {
  testA: Effectiveness
  testB: Effectiveness
  testC: Effectiveness
}

interface TestResult {
  count: number
  detectedCompromised: number
  voteResults: VoteTestResult[]
}

export function simTests(
  testCounts: { testA: string; testB: string; testC: string },
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
    testA: {
      count: 0,
      detectedCompromised: 0,
      voteResults: [] as VoteTestResult[],
    },
    testB: {
      count: 0,
      detectedCompromised: 0,
      voteResults: [] as VoteTestResult[],
    },
    testC: {
      count: 0,
      detectedCompromised: 0,
      voteResults: [] as VoteTestResult[],
    },
  }

  // Helper to run a test on a single vote and update state
  function runTestOnVote(
    voteId: number,
    testType: 'A' | 'B' | 'C',
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

  // Generic batch runner for a test type
  function runTestBatch(
    testType: 'A' | 'B' | 'C',
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

  // Run A tests
  runTestBatch('A', counts.testA, effectiveness.testA, () => {
    const eligible: number[] = []
    for (let i = 1; i <= totalVotes; i++) {
      const voteResult = voteMap.get(i)
      if (voteResult?.testResults.testA !== undefined) continue
      eligible.push(i)
    }
    return eligible
  })

  // Run B tests (50/50 split between A-tested and A-untested)
  runTestBatch('B', counts.testB, effectiveness.testB, () => {
    const aTested: number[] = []
    const aUntested: number[] = []
    for (let i = 1; i <= totalVotes; i++) {
      const voteResult = voteMap.get(i)
      if (voteResult?.testResults.testB !== undefined) continue
      if (voteResult?.testResults.testA !== undefined) {
        aTested.push(i)
      } else {
        aUntested.push(i)
      }
    }
    // 50/50 split logic
    const halfCount = Math.floor(counts.testB / 2)
    const aTestedCount = Math.min(halfCount, aTested.length)
    const aUntestedCount = Math.min(halfCount, aUntested.length)
    const remainingCount = counts.testB - aTestedCount - aUntestedCount
    const selected: number[] = []
    selected.push(...getRandomSample(aTested, aTestedCount, mt))
    selected.push(...getRandomSample(aUntested, aUntestedCount, mt))
    if (remainingCount > 0) {
      const remainingGroup =
        aTested.length > aUntested.length ? aTested : aUntested
      const alreadySelected = new Set(selected)
      const remainingPool = remainingGroup.filter(
        (id) => !alreadySelected.has(id)
      )
      selected.push(...getRandomSample(remainingPool, remainingCount, mt))
    }
    return selected
  })

  // Run C tests (even split across A/B quadrants)
  runTestBatch('C', counts.testC, effectiveness.testC, () => {
    const quadrants: { [key: string]: number[] } = {
      '!A&!B': [],
      '!A&B': [],
      'A&!B': [],
      'A&B': [],
    }
    for (let i = 1; i <= totalVotes; i++) {
      const voteResult = voteMap.get(i)
      if (voteResult?.testResults.testC !== undefined) continue
      const aTested = voteResult?.testResults.testA !== undefined
      const bTested = voteResult?.testResults.testB !== undefined
      const key = `${aTested ? 'A' : '!A'}&${bTested ? 'B' : '!B'}`
      quadrants[key].push(i)
    }
    let availableQuadrants = Object.entries(quadrants).filter(
      ([, votes]) => votes.length > 0
    )
    const numQuadrants = availableQuadrants.length
    if (numQuadrants === 0) return []
    if (counts.testC <= numQuadrants) {
      // Shuffle quadrants for fairness
      const shuffled = getRandomSample(
        availableQuadrants,
        availableQuadrants.length,
        mt
      )
      const selected: number[] = []
      for (let i = 0; i < counts.testC; i++) {
        const [, votes] = shuffled[i]
        if (votes.length > 0) {
          selected.push(...getRandomSample(votes, 1, mt))
        }
      }
      return selected
    }
    // Calculate base number of tests per quadrant
    const basePerQuadrant = Math.floor(counts.testC / numQuadrants)
    let remainder = counts.testC - basePerQuadrant * numQuadrants
    const testsToAssign: { [key: string]: number } = {}
    for (const [key, votes] of availableQuadrants) {
      testsToAssign[key] = Math.min(basePerQuadrant, votes.length)
    }
    // Distribute the remainder one by one to quadrants with most available votes left
    while (remainder > 0) {
      availableQuadrants = availableQuadrants.filter(
        ([key, votes]) => votes.length > testsToAssign[key]
      )
      if (availableQuadrants.length === 0) break
      availableQuadrants.sort(
        ([, aVotes], [, bVotes]) => bVotes.length - aVotes.length
      )
      const [key] = availableQuadrants[0]
      testsToAssign[key]++
      remainder--
    }
    // Now actually assign the tests
    const selected: number[] = []
    for (const [key, votes] of Object.entries(quadrants)) {
      const n = testsToAssign[key] || 0
      if (n > 0 && votes.length > 0) {
        selected.push(...getRandomSample(votes, n, mt))
      }
    }
    return selected
  })

  // Update test breakdown with all votes that have been tested
  for (const [voteId, voteResult] of voteMap.entries()) {
    for (const testType of ['A', 'B', 'C'] as const) {
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
  for (const testType of ['A', 'B', 'C'] as const) {
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

function getRandomSample<T>(arr: T[], n: number, mt: MT19937): T[] {
  // Fisher-Yates shuffle for reproducible random sampling
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(mt.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function parseCount(val: string, label: string): number {
  const n = parseInt(val || '0', 10)
  if (isNaN(n) || n < 0)
    throw new Error(`Invalid test count for ${label}: ${val}`)
  return n
}

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

function sampleVote(
  compromisedVotes: number,
  totalVotes: number,
  mt: MT19937
): boolean {
  // Randomly select a vote and determine if it's compromised
  return mt.random() < compromisedVotes / totalVotes
}
