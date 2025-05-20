import { MT19937 } from './mt19937'

export interface SimulationResults {
  winnerVotes: number
  runnerUpVotes: number
  otherVotes: number
  totalVotes: number
  compromisedVotes: number
  compromisedPercentage: number
}

export interface VoteTestResult {
  voteId: number
  isActuallyCompromised: boolean
  testResults: {
    testA?: boolean // true if detected as compromised
    testB?: boolean
    testC?: boolean
  }
}

interface TestResult {
  count: number
  detectedCompromised: number
  voteResults: VoteTestResult[]
}

interface TestEffectivenessRates {
  falseCleanRate: number
  falseCompromisedRate: number
}

export interface TestEffectiveness {
  testA: TestEffectivenessRates
  testB: TestEffectivenessRates
  testC: TestEffectivenessRates
}

export interface TestDetectionResults {
  testBreakdown: {
    testA: TestResult
    testB: TestResult
    testC: TestResult
  }
}

export function calculatePercentage(votes: number, total: number): string {
  if (!total) return '0'
  return ((votes / total) * 100).toFixed(1)
}

export function generateSimulation(mt: MT19937): SimulationResults {
  const winnerVotes = Math.floor(mt.random() * 1000000)
  const runnerUpVotes = Math.floor(mt.random() * winnerVotes)
  const otherVotes = Math.floor(mt.random() * (winnerVotes * 0.2)) // Other votes up to 20% of winner's votes
  const totalVotes = winnerVotes + runnerUpVotes + otherVotes

  // Generate random compromised percentage between 0 and 100
  const compromisedPercentage = mt.random() * 100
  const compromisedVotes = Math.floor(
    (compromisedPercentage / 100) * totalVotes
  )

  return {
    winnerVotes,
    runnerUpVotes,
    otherVotes,
    totalVotes,
    compromisedVotes,
    compromisedPercentage,
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

function runTest(
  effectiveness: {
    falseCleanRate: number
    falseCompromisedRate: number
  },
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

function parseCount(val: string, label: string): number {
  const n = parseInt(val || '0', 10)
  if (isNaN(n) || n < 0)
    throw new Error(`Invalid test count for ${label}: ${val}`)
  return n
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

export function calculateTestResults(
  testCounts: { testA: string; testB: string; testC: string },
  compromisedVotes: number,
  totalVotes: number,
  mt: MT19937,
  voteMap?: Map<number, VoteTestResult>
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

  // Use provided voteMap or create a new one
  const globalVoteMap = voteMap ?? new Map<number, VoteTestResult>()

  // For each test type, run tests on unique, randomly selected votes
  function runUniqueTests(
    testType: 'A' | 'B' | 'C',
    count: number,
    effectivenessRates: TestEffectivenessRates
  ) {
    // Helper function to run a test on a single vote
    function runTestOnVote(voteId: number) {
      let voteResult = globalVoteMap.get(voteId)
      if (!voteResult) {
        const isActuallyCompromised = sampleVote(
          compromisedVotes,
          totalVotes,
          mt
        )
        voteResult = {
          voteId,
          testResults: {},
          isActuallyCompromised,
        }
        globalVoteMap.set(voteId, voteResult)
      }

      // Always run the test for the current run
      const isDetectedCompromised = runTest(
        effectivenessRates,
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

    // For B tests, we need to split 50/50 between A-tested and A-untested votes
    if (testType === 'B') {
      const aTested: number[] = []
      const aUntested: number[] = []
      for (let i = 1; i <= totalVotes; i++) {
        const voteResult = globalVoteMap.get(i)
        if (voteResult?.testResults.testB !== undefined) continue
        if (voteResult?.testResults.testA !== undefined) {
          aTested.push(i)
        } else {
          aUntested.push(i)
        }
      }
      const halfCount = Math.floor(count / 2)
      let aTestedCount = Math.min(halfCount, aTested.length)
      let aUntestedCount = Math.min(halfCount, aUntested.length)
      let remainingCount = count - aTestedCount - aUntestedCount
      if (remainingCount > 0) {
        if (aTested.length > aTestedCount) {
          const additionalFromA = Math.min(
            remainingCount,
            aTested.length - aTestedCount
          )
          aTestedCount += additionalFromA
          remainingCount -= additionalFromA
        }
        if (remainingCount > 0 && aUntested.length > aUntestedCount) {
          const additionalFromNotA = Math.min(
            remainingCount,
            aUntested.length - aUntestedCount
          )
          aUntestedCount += additionalFromNotA
          remainingCount -= additionalFromNotA
        }
      }
      const aTestedSample = getRandomSample(aTested, aTestedCount, mt)
      const aUntestedSample = getRandomSample(aUntested, aUntestedCount, mt)
      for (const id of aTestedSample) runTestOnVote(id)
      for (const id of aUntestedSample) runTestOnVote(id)
      if (remainingCount > 0) {
        const remainingGroup =
          aTested.length > aUntested.length ? aTested : aUntested
        const remainingSample = getRandomSample(
          remainingGroup.filter(
            (id) => ![...aTestedSample, ...aUntestedSample].includes(id)
          ),
          remainingCount,
          mt
        )
        for (const id of remainingSample) runTestOnVote(id)
      }
    }
    // For C tests, we need to split evenly across all A/B combinations
    else if (testType === 'C') {
      const quadrants: { [key: string]: number[] } = {
        'A&B': [],
        'A&!B': [],
        '!A&B': [],
        '!A&!B': [],
      }
      for (let i = 1; i <= totalVotes; i++) {
        const voteResult = globalVoteMap.get(i)
        if (voteResult?.testResults.testC !== undefined) continue
        const aTested = voteResult?.testResults.testA !== undefined
        const bTested = voteResult?.testResults.testB !== undefined
        const key = `${aTested ? 'A' : '!A'}&${bTested ? 'B' : '!B'}`
        quadrants[key].push(i)
      }

      // Get only quadrants with available votes
      let availableQuadrants = Object.entries(quadrants).filter(
        ([, votes]) => votes.length > 0
      )
      const numQuadrants = availableQuadrants.length
      if (numQuadrants === 0) return // No votes available to test

      // Special case: if count <= numQuadrants, maximize spread
      if (count <= numQuadrants) {
        // Shuffle quadrants for fairness
        const shuffled = getRandomSample(
          availableQuadrants,
          availableQuadrants.length,
          mt
        )
        for (let i = 0; i < count; i++) {
          const [, votes] = shuffled[i]
          if (votes.length > 0) {
            const sample = getRandomSample(votes, 1, mt)
            for (const id of sample) runTestOnVote(id)
          }
        }
        return
      }

      // Calculate base number of tests per quadrant
      const basePerQuadrant = Math.floor(count / numQuadrants)
      let remainder = count - basePerQuadrant * numQuadrants

      // Track how many tests we assign to each quadrant
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
      for (const [key, votes] of Object.entries(quadrants)) {
        const n = testsToAssign[key] || 0
        if (n > 0 && votes.length > 0) {
          const sample = getRandomSample(votes, n, mt)
          for (const id of sample) runTestOnVote(id)
        }
      }
    }
    // For A tests, randomly sample from eligible votes
    else {
      const eligible: number[] = []
      for (let i = 1; i <= totalVotes; i++) {
        const voteResult = globalVoteMap.get(i)
        if (voteResult?.testResults.testA !== undefined) continue
        eligible.push(i)
      }
      const samples = Math.min(count, eligible.length)
      const sampleIds = getRandomSample(eligible, samples, mt)
      for (const id of sampleIds) runTestOnVote(id)
    }
  }

  // Run tests in order A, B, C to maintain proper distribution
  runUniqueTests('A', counts.testA, effectiveness.testA)
  runUniqueTests('B', counts.testB, effectiveness.testB)
  runUniqueTests('C', counts.testC, effectiveness.testC)

  // Update test breakdown with all votes that have been tested
  for (const [voteId, voteResult] of globalVoteMap.entries()) {
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
