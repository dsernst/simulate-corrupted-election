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

  // Helper to get a shuffled array of unique vote IDs from a pool
  function getUniqueVoteIdsFromPool(pool: number[], count: number): number[] {
    const ids = [...pool]
    // Fisher-Yates shuffle using mt
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(mt.random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
    }
    return ids.slice(0, Math.min(count, ids.length))
  }

  // For each test type, build a pool of vote IDs that have NOT been tested by that type
  // Test A
  const poolA = Array.from({ length: totalVotes }, (_, i) => i).filter(
    (id) => !globalVoteMap.get(id)?.testResults.testA
  )
  const voteIdsA = getUniqueVoteIdsFromPool(poolA, counts.testA)
  for (let i = 0; i < voteIdsA.length; i++) {
    const voteId = voteIdsA[i]
    let voteResult = globalVoteMap.get(voteId)
    if (!voteResult) {
      const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes, mt)
      voteResult = {
        voteId,
        isActuallyCompromised,
        testResults: {},
      }
      globalVoteMap.set(voteId, voteResult)
    }
    const isDetectedCompromised = runTest(
      effectiveness.testA,
      voteResult.isActuallyCompromised,
      mt
    )
    voteResult.testResults.testA = isDetectedCompromised
    testBreakdown.testA.count++
    if (isDetectedCompromised) testBreakdown.testA.detectedCompromised++
    testBreakdown.testA.voteResults.push(voteResult)
  }

  // Test B
  const poolB = Array.from({ length: totalVotes }, (_, i) => i).filter(
    (id) => !globalVoteMap.get(id)?.testResults.testB
  )
  const voteIdsB = getUniqueVoteIdsFromPool(poolB, counts.testB)
  for (let i = 0; i < voteIdsB.length; i++) {
    const voteId = voteIdsB[i]
    let voteResult = globalVoteMap.get(voteId)
    if (!voteResult) {
      const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes, mt)
      voteResult = {
        voteId,
        isActuallyCompromised,
        testResults: {},
      }
      globalVoteMap.set(voteId, voteResult)
    }
    const isDetectedCompromised = runTest(
      effectiveness.testB,
      voteResult.isActuallyCompromised,
      mt
    )
    voteResult.testResults.testB = isDetectedCompromised
    testBreakdown.testB.count++
    if (isDetectedCompromised) testBreakdown.testB.detectedCompromised++
    testBreakdown.testB.voteResults.push(voteResult)
  }

  // Test C
  const poolC = Array.from({ length: totalVotes }, (_, i) => i).filter(
    (id) => !globalVoteMap.get(id)?.testResults.testC
  )
  const voteIdsC = getUniqueVoteIdsFromPool(poolC, counts.testC)
  for (let i = 0; i < voteIdsC.length; i++) {
    const voteId = voteIdsC[i]
    let voteResult = globalVoteMap.get(voteId)
    if (!voteResult) {
      const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes, mt)
      voteResult = {
        voteId,
        isActuallyCompromised,
        testResults: {},
      }
      globalVoteMap.set(voteId, voteResult)
    }
    const isDetectedCompromised = runTest(
      effectiveness.testC,
      voteResult.isActuallyCompromised,
      mt
    )
    voteResult.testResults.testC = isDetectedCompromised
    testBreakdown.testC.count++
    if (isDetectedCompromised) testBreakdown.testC.detectedCompromised++
    testBreakdown.testC.voteResults.push(voteResult)
  }

  return {
    testBreakdown,
  }
}
