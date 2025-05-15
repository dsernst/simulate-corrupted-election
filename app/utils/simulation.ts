export interface SimulationResults {
  winnerVotes: number
  runnerUpVotes: number
  otherVotes: number
  totalVotes: number
  compromisedVotes: number
  compromisedPercentage: number
}

interface VoteTestResult {
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

export function generateSimulation(): SimulationResults {
  const winnerVotes = Math.floor(Math.random() * 1000000)
  const runnerUpVotes = Math.floor(Math.random() * winnerVotes)
  const otherVotes = Math.floor(Math.random() * (winnerVotes * 0.2)) // Other votes up to 20% of winner's votes
  const totalVotes = winnerVotes + runnerUpVotes + otherVotes

  // Generate random compromised percentage between 0 and 100
  const compromisedPercentage = Math.random() * 100
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

function sampleVote(compromisedVotes: number, totalVotes: number): boolean {
  // Randomly select a vote and determine if it's compromised
  return Math.random() < compromisedVotes / totalVotes
}

function runTest(
  effectiveness: {
    falseCleanRate: number
    falseCompromisedRate: number
  },
  isActuallyCompromised: boolean
): boolean {
  const random = Math.random()

  if (isActuallyCompromised) {
    // For actually compromised votes, we have a false clean rate
    return random >= effectiveness.falseCleanRate
  } else {
    // For actually clean votes, we have a false compromised rate
    return random < effectiveness.falseCompromisedRate
  }
}

export function calculateTestResults(
  testCounts: { testA: string; testB: string; testC: string },
  compromisedVotes: number,
  totalVotes: number
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

  // Convert string inputs to numbers, defaulting to 0 if empty or invalid
  const counts = {
    testA: parseInt(testCounts.testA) || 0,
    testB: parseInt(testCounts.testB) || 0,
    testC: parseInt(testCounts.testC) || 0,
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

  // Create a map to track votes across tests
  const voteMap = new Map<number, VoteTestResult>()

  // Helper function to get a random vote that hasn't been tested by a specific test
  function getUntestedVote(testType: 'A' | 'B' | 'C'): number {
    const untestedVotes = Array.from(voteMap.entries())
      .filter(([, vote]) => !vote.testResults[`test${testType}`])
      .map(([id]) => id)

    if (untestedVotes.length > 0) {
      return untestedVotes[Math.floor(Math.random() * untestedVotes.length)]
    }
    return Math.floor(Math.random() * totalVotes)
  }

  // Helper function to get a random vote that has been tested by a specific test
  function getTestedVote(testType: 'A' | 'B' | 'C'): number {
    const testedVotes = Array.from(voteMap.entries())
      .filter(([, vote]) => vote.testResults[`test${testType}`] !== undefined)
      .map(([id]) => id)

    if (testedVotes.length > 0) {
      return testedVotes[Math.floor(Math.random() * testedVotes.length)]
    }
    return Math.floor(Math.random() * totalVotes)
  }

  // Run test A first
  for (let i = 0; i < counts.testA; i++) {
    const voteId = Math.floor(Math.random() * totalVotes)
    let voteResult = voteMap.get(voteId)
    if (!voteResult) {
      const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes)
      voteResult = {
        voteId,
        isActuallyCompromised,
        testResults: {},
      }
      voteMap.set(voteId, voteResult)
    }

    const isDetectedCompromised = runTest(
      effectiveness.testA,
      voteResult.isActuallyCompromised
    )
    voteResult.testResults.testA = isDetectedCompromised

    testBreakdown.testA.count++
    if (isDetectedCompromised) testBreakdown.testA.detectedCompromised++
    testBreakdown.testA.voteResults.push(voteResult)
  }

  // Run test B with a mix of A and not A
  for (let i = 0; i < counts.testB; i++) {
    // Alternate between tested and untested votes
    const voteId = i % 2 === 0 ? getTestedVote('A') : getUntestedVote('A')

    let voteResult = voteMap.get(voteId)
    if (!voteResult) {
      const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes)
      voteResult = {
        voteId,
        isActuallyCompromised,
        testResults: {},
      }
      voteMap.set(voteId, voteResult)
    }

    const isDetectedCompromised = runTest(
      effectiveness.testB,
      voteResult.isActuallyCompromised
    )
    voteResult.testResults.testB = isDetectedCompromised

    testBreakdown.testB.count++
    if (isDetectedCompromised) testBreakdown.testB.detectedCompromised++
    testBreakdown.testB.voteResults.push(voteResult)
  }

  // Run test C with a mix of B, not B, A, and not A
  for (let i = 0; i < counts.testC; i++) {
    // Cycle through different combinations
    const voteId = (() => {
      switch (i % 4) {
        case 0: // B & A
          return getTestedVote('B')
        case 1: // B & not A
          return getTestedVote('B')
        case 2: // not B & A
          return getUntestedVote('B')
        case 3: // not B & not A
          return getUntestedVote('B')
        default:
          return Math.floor(Math.random() * totalVotes)
      }
    })()

    let voteResult = voteMap.get(voteId)
    if (!voteResult) {
      const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes)
      voteResult = {
        voteId,
        isActuallyCompromised,
        testResults: {},
      }
      voteMap.set(voteId, voteResult)
    }

    const isDetectedCompromised = runTest(
      effectiveness.testC,
      voteResult.isActuallyCompromised
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
