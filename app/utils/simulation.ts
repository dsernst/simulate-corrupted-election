export interface SimulationResults {
  winnerVotes: number
  runnerUpVotes: number
  otherVotes: number
  totalVotes: number
  compromisedVotes: number
  compromisedPercentage: number
}

export interface TestEffectiveness {
  testA: number // 20% effectiveness
  testB: number // 50% effectiveness
  testC: number // 100% effectiveness
}

export interface TestDetectionResults {
  totalTests: number
  testBreakdown: {
    testA: {
      count: number
      detectedCompromised: number
    }
    testB: {
      count: number
      detectedCompromised: number
    }
    testC: {
      count: number
      detectedCompromised: number
    }
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
  testType: 'A' | 'B' | 'C',
  effectiveness: number,
  isActuallyCompromised: boolean
): boolean {
  // Determine if the test result is accurate based on effectiveness
  const isAccurate = Math.random() < effectiveness

  if (isAccurate) {
    // If accurate, return the true state
    return isActuallyCompromised
  } else {
    // If inaccurate, return the opposite state
    return !isActuallyCompromised
  }
}

export function calculateTestResults(
  testCounts: { testA: string; testB: string; testC: string },
  compromisedVotes: number,
  totalVotes: number
): TestDetectionResults {
  const effectiveness: TestEffectiveness = {
    testA: 0.2, // 20% effectiveness
    testB: 0.5, // 50% effectiveness
    testC: 1.0, // 100% effectiveness
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

  // Run each test and aggregate results
  for (let i = 0; i < counts.testA; i++) {
    const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes)
    const isDetectedCompromised = runTest(
      'A',
      effectiveness.testA,
      isActuallyCompromised
    )
    testBreakdown.testA.count++
    if (isDetectedCompromised) testBreakdown.testA.detectedCompromised++
  }

  for (let i = 0; i < counts.testB; i++) {
    const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes)
    const isDetectedCompromised = runTest(
      'B',
      effectiveness.testB,
      isActuallyCompromised
    )
    testBreakdown.testB.count++
    if (isDetectedCompromised) testBreakdown.testB.detectedCompromised++
  }

  for (let i = 0; i < counts.testC; i++) {
    const isActuallyCompromised = sampleVote(compromisedVotes, totalVotes)
    const isDetectedCompromised = runTest(
      'C',
      effectiveness.testC,
      isActuallyCompromised
    )
    testBreakdown.testC.count++
    if (isDetectedCompromised) testBreakdown.testC.detectedCompromised++
  }

  return {
    totalTests: counts.testA + counts.testB + counts.testC,
    testBreakdown,
  }
}
