import { MT19937 } from './mt19937'

export interface SimulationResults {
  winnerVotes: number
  runnerUpVotes: number
  otherVotes: number
  totalVotes: number
  compromisedVotes: number
  compromisedPercentage: number
  seed: number
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

function generateRandomSeed(): number {
  return Math.floor(Math.random() * 0x100000000)
}

export function generateSimulation(seed?: number): SimulationResults {
  const mt = new MT19937(seed ?? generateRandomSeed())
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
    seed: seed ?? generateRandomSeed(), // Store the actual seed value
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
  //
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
          isActuallyCompromised,
          testResults: {},
        }
        globalVoteMap.set(voteId, voteResult)
      }
      const isDetectedCompromised = runTest(
        effectivenessRates,
        voteResult.isActuallyCompromised,
        mt
      )
      voteResult.testResults[`test${testType}`] = isDetectedCompromised
      testBreakdown[`test${testType}`].count++
      if (isDetectedCompromised)
        testBreakdown[`test${testType}`].detectedCompromised++
      testBreakdown[`test${testType}`].voteResults.push(voteResult)
    }

    // First, build an `eligible` array of all vote IDs that have NOT been tested by this type
    const eligible: number[] = []
    for (let i = 0; i < totalVotes; i++) {
      const voteResult = globalVoteMap.get(i)
      if (
        !voteResult ||
        voteResult.testResults[`test${testType}`] === undefined
      ) {
        eligible.push(i)
      }
    }

    // Shuffle eligible vote IDs using Fisher-Yates and the provided PRNG
    for (let i = eligible.length - 1; i > 0; i--) {
      const j = Math.floor(mt.random() * (i + 1))
      ;[eligible[i], eligible[j]] = [eligible[j], eligible[i]]
    }

    // For B tests, we need to split 50/50 between A-tested and A-untested votes
    if (testType === 'B') {
      const aTested: number[] = []
      const aUntested: number[] = []

      // Split eligible votes into A-tested and A-untested
      for (const voteId of eligible) {
        const voteResult = globalVoteMap.get(voteId)
        if (voteResult?.testResults.testA !== undefined) {
          aTested.push(voteId)
        } else {
          aUntested.push(voteId)
        }
      }

      // Take half from each group, but ensure we get the full count
      const halfCount = Math.floor(count / 2)
      let aTestedCount = Math.min(halfCount, aTested.length)
      let aUntestedCount = Math.min(halfCount, aUntested.length)
      let remainingCount = count - aTestedCount - aUntestedCount

      // If we couldn't get enough from either group, take more from the other group
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

      // Take votes from A-tested group
      for (let i = 0; i < aTestedCount; i++) {
        runTestOnVote(aTested[i])
      }

      // Take votes from A-untested group
      for (let i = 0; i < aUntestedCount; i++) {
        runTestOnVote(aUntested[i])
      }

      // If we still have remaining votes, take them from whichever group has more
      if (remainingCount > 0) {
        const remainingGroup =
          aTested.length > aUntested.length ? aTested : aUntested
        const startIndex =
          aTested.length > aUntested.length ? aTestedCount : aUntestedCount
        for (let i = 0; i < remainingCount; i++) {
          runTestOnVote(remainingGroup[startIndex + i])
        }
      }
    }
    // For C tests, we need to split evenly across all A/B combinations
    else if (testType === 'C') {
      const quadrants: { [key: string]: number[] } = {
        'A&B': [], // A tested, B tested
        'A&!B': [], // A tested, B untested
        '!A&B': [], // A untested, B tested
        '!A&!B': [], // A untested, B untested
      }

      // Split eligible votes into quadrants
      for (const voteId of eligible) {
        const voteResult = globalVoteMap.get(voteId)
        const aTested = voteResult?.testResults.testA !== undefined
        const bTested = voteResult?.testResults.testB !== undefined
        const key = `${aTested ? 'A' : '!A'}&${bTested ? 'B' : '!B'}`
        quadrants[key].push(voteId)
      }

      // Take equal number from each quadrant
      const perQuadrant = Math.floor(count / 4)
      const remainingCount = count - perQuadrant * 4

      // Take votes from each quadrant
      for (const quadrant of Object.values(quadrants)) {
        const quadrantCount = Math.min(perQuadrant, quadrant.length)
        for (let i = 0; i < quadrantCount; i++) {
          runTestOnVote(quadrant[i])
        }
      }

      // Distribute remaining votes across quadrants that have capacity
      if (remainingCount > 0) {
        const availableQuadrants = Object.values(quadrants).filter(
          (q) => q.length > perQuadrant
        )
        for (let i = 0; i < remainingCount; i++) {
          const quadrant = availableQuadrants[i % availableQuadrants.length]
          runTestOnVote(
            quadrant[perQuadrant + Math.floor(i / availableQuadrants.length)]
          )
        }
      }
    }
    // For A tests, just take the first N votes (random sampling)
    else {
      const samples = Math.min(count, eligible.length)
      for (let k = 0; k < samples; k++) {
        runTestOnVote(eligible[k])
      }
    }
  }

  runUniqueTests('A', counts.testA, effectiveness.testA)
  runUniqueTests('B', counts.testB, effectiveness.testB)
  runUniqueTests('C', counts.testC, effectiveness.testC)

  return {
    testBreakdown,
  }
}
