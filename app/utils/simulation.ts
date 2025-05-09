export interface SimulationResults {
  winnerVotes: number
  runnerUpVotes: number
  otherVotes: number
  totalVotes: number
  compromisedVotes: number
  compromisedPercentage: number
}

interface TestResult {
  count: number
  detectedCompromised: number
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
  totalTests: number
  testBreakdown: {
    testA: TestResult
    testB: TestResult
    testC: TestResult
  }
}

export function calculatePercentage(votes: number, total: number): string {
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

  // Initialize test breakdown
  const testBreakdown = {
    testA: { count: 0, detectedCompromised: 0 },
    testB: { count: 0, detectedCompromised: 0 },
    testC: { count: 0, detectedCompromised: 0 },
  }

  // Run tests for each type
  const testTypes = ['A', 'B', 'C']
  testTypes.forEach((testType) => {
    const testKey = `test${testType}` as keyof typeof testBreakdown
    for (let i = 0; i < counts[testKey]; i++) {
      const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes)
      const isDetectedCompromised = runTest(
        effectiveness[testKey],
        isActuallyCompromised
      )
      testBreakdown[testKey].count++
      if (isDetectedCompromised) testBreakdown[testKey].detectedCompromised++
    }
  })

  return {
    totalTests: Object.values(counts).reduce((sum, count) => sum + count, 0),
    testBreakdown,
  }
}
