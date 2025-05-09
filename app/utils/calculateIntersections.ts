import { TestDetectionResults } from './simulation'

export type TestType = 'A' | 'B' | 'C'

export interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

export interface IntersectionCounts {
  'A ∩ B': number
  'A ∩ C': number
  'B ∩ C': number
  'A ∩ B ∩ C': number
  'A only': number
  'B only': number
  'C only': number
}

export interface TestResult {
  label: string
  value: number
  description: string
}

export interface IntersectionStats {
  label: string
  detected: number
  tested: number
}

export interface LayeredStat {
  label: string
  tested: number
  compromised: number
  percentCompromised: number
  indentLevel?: number
  bias?: string
}

export const TEST_TYPES: TestType[] = ['A', 'B', 'C']

export function calculateIntersections(
  testRuns: TestRun[]
): IntersectionCounts {
  const intersections: IntersectionCounts = {
    'A ∩ B': 0,
    'A ∩ C': 0,
    'B ∩ C': 0,
    'A ∩ B ∩ C': 0,
    'A only': 0,
    'B only': 0,
    'C only': 0,
  }

  // Create a map of vote IDs to their test results across all runs
  const voteMap = new Map<
    number,
    {
      testA: boolean | undefined
      testB: boolean | undefined
      testC: boolean | undefined
      testedA: boolean | undefined
      testedB: boolean | undefined
      testedC: boolean | undefined
    }
  >()

  // Collect all test results for each vote
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

  // Calculate intersections
  voteMap.forEach((results) => {
    const detectedByA = results.testA
    const detectedByB = results.testB
    const detectedByC = results.testC

    if (detectedByA && detectedByB && detectedByC) intersections['A ∩ B ∩ C']++
    else if (detectedByA && detectedByB) intersections['A ∩ B']++
    else if (detectedByA && detectedByC) intersections['A ∩ C']++
    else if (detectedByB && detectedByC) intersections['B ∩ C']++
    else if (detectedByA) intersections['A only']++
    else if (detectedByB) intersections['B only']++
    else if (detectedByC) intersections['C only']++
  })

  return intersections
}

export function calculateIntersectionStats(
  testRuns: TestRun[]
): IntersectionStats[] {
  // Define the desired order and labels
  const order: { key: string; label: string; tests: TestType[] }[] = [
    { key: 'A only', label: 'A', tests: ['A'] },
    { key: 'B only', label: 'B', tests: ['B'] },
    { key: 'C only', label: 'C', tests: ['C'] },
    { key: 'A ∩ B', label: 'A & B', tests: ['A', 'B'] },
    { key: 'A ∩ C', label: 'A & C', tests: ['A', 'C'] },
    { key: 'B ∩ C', label: 'B & C', tests: ['B', 'C'] },
    { key: 'A ∩ B ∩ C', label: 'A & B & C', tests: ['A', 'B', 'C'] },
  ]

  // Create a map of vote IDs to their test results across all runs
  const voteMap = new Map<
    number,
    {
      testA: boolean | undefined
      testB: boolean | undefined
      testC: boolean | undefined
      testedA: boolean | undefined
      testedB: boolean | undefined
      testedC: boolean | undefined
    }
  >()

  // Collect all test results for each vote
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

  // Helper to check if a vote was tested by a set of tests
  function wasTestedBy(
    vote: {
      testedA: boolean | undefined
      testedB: boolean | undefined
      testedC: boolean | undefined
    },
    tests: TestType[]
  ) {
    return tests.every(
      (t) => vote[`tested${t}` as 'testedA' | 'testedB' | 'testedC']
    )
  }
  // Helper to check if a vote was tested ONLY by a set of tests
  function wasTestedOnlyBy(
    vote: {
      testedA: boolean | undefined
      testedB: boolean | undefined
      testedC: boolean | undefined
    },
    tests: TestType[]
  ) {
    return (
      wasTestedBy(vote, tests) &&
      ['A', 'B', 'C'].every(
        (t) =>
          tests.includes(t as TestType) ||
          !vote[`tested${t}` as 'testedA' | 'testedB' | 'testedC']
      )
    )
  }

  // Calculate stats for each group
  return order.map(({ key, label, tests }) => {
    let detected = 0
    let tested = 0
    voteMap.forEach((results) => {
      // Detected logic (same as before)
      const detectedByA = results.testA
      const detectedByB = results.testB
      const detectedByC = results.testC
      if (
        (key === 'A ∩ B ∩ C' && detectedByA && detectedByB && detectedByC) ||
        (key === 'A ∩ B' && detectedByA && detectedByB && !detectedByC) ||
        (key === 'A ∩ C' && detectedByA && !detectedByB && detectedByC) ||
        (key === 'B ∩ C' && !detectedByA && detectedByB && detectedByC) ||
        (key === 'A only' && detectedByA && !detectedByB && !detectedByC) ||
        (key === 'B only' && !detectedByA && detectedByB && !detectedByC) ||
        (key === 'C only' && !detectedByA && !detectedByB && detectedByC)
      ) {
        detected++
      }
      // Tested logic
      if (
        key === 'A only' || key === 'B only' || key === 'C only'
          ? wasTestedOnlyBy(results, tests)
          : wasTestedBy(results, tests)
      ) {
        tested++
      }
    })
    return { label, detected, tested }
  })
}

// Define a type for the vote object in voteMap
interface VoteResult {
  testA: boolean | undefined
  testB: boolean | undefined
  testC: boolean | undefined
  testedA: boolean | undefined
  testedB: boolean | undefined
  testedC: boolean | undefined
}

export function calculateLayeredStats(testRuns: TestRun[]): LayeredStat[] {
  // Build voteMap as before
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

  // Helper to filter votes by which tests they received
  function filterVotes(filter: (v: VoteResult) => boolean) {
    return Array.from(voteMap.values()).filter(
      (v): v is VoteResult => v !== undefined && filter(v)
    )
  }

  // Helper to count compromised (failed) in a set for a given test
  function countCompromised(votes: VoteResult[], test: 'A' | 'B' | 'C') {
    // In this simulation, testX === true means detected as compromised
    return votes.filter((v) => v[`test${test}`] === true).length
  }

  // Helper to percent
  function percent(n: number, d: number) {
    return d === 0 ? 0 : Math.round((n / d) * 1000) / 10
  }

  // Define all groups
  const groups: {
    label: string
    indentLevel: number
    filter: (v: VoteResult) => boolean
    test: 'A' | 'B' | 'C' | null
  }[] = [
    // Individual
    {
      label: 'A',
      indentLevel: 0,
      filter: (v) => v.testedA === true,
      test: 'A',
    },
    {
      label: 'B',
      indentLevel: 0,
      filter: (v) => v.testedB === true,
      test: 'B',
    },
    {
      label: 'C',
      indentLevel: 0,
      filter: (v) => v.testedC === true,
      test: 'C',
    },
    // Overlaps
    {
      label: 'B & A',
      indentLevel: 1,
      filter: (v) => v.testedB === true && v.testedA === true,
      test: 'B',
    },
    {
      label: 'B & not A',
      indentLevel: 1,
      filter: (v) => v.testedB === true && v.testedA !== true,
      test: 'B',
    },
    {
      label: 'C & B',
      indentLevel: 1,
      filter: (v) => v.testedC === true && v.testedB === true,
      test: 'C',
    },
    {
      label: 'C & B & A',
      indentLevel: 2,
      filter: (v) =>
        v.testedC === true && v.testedB === true && v.testedA === true,
      test: 'C',
    },
    {
      label: 'C & B & not A',
      indentLevel: 2,
      filter: (v) =>
        v.testedC === true && v.testedB === true && v.testedA !== true,
      test: 'C',
    },
    {
      label: 'C & not B',
      indentLevel: 1,
      filter: (v) => v.testedC === true && v.testedB !== true,
      test: 'C',
    },
    {
      label: 'C & not B & A',
      indentLevel: 2,
      filter: (v) =>
        v.testedC === true && v.testedB !== true && v.testedA === true,
      test: 'C',
    },
    {
      label: 'C & not B & not A',
      indentLevel: 2,
      filter: (v) =>
        v.testedC === true && v.testedB !== true && v.testedA !== true,
      test: 'C',
    },
  ]

  // Calculate stats for each group
  return groups.map(({ label, indentLevel, filter, test }) => {
    const votes = filterVotes(filter)
    const tested = votes.length
    const compromised = test && tested > 0 ? countCompromised(votes, test) : 0
    return {
      label,
      tested,
      compromised,
      percentCompromised: percent(compromised, tested),
      indentLevel,
    }
  })
}

export function calculateConfusionMatrix(
  testRuns: TestRun[],
  testType1: TestType,
  testType2: TestType
): {
  clean_clean: number
  clean_compromised: number
  compromised_clean: number
  compromised_compromised: number
  total: number
} {
  // Build voteMap as before
  const voteMap = new Map<number, VoteResult>()
  testRuns.forEach((run) => {
    Object.entries(run.results.testBreakdown).forEach(([testKey, test]) => {
      const tType = testKey.slice(-1) as TestType
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
          [`test${tType}`]: vote.testResults[`test${tType}`],
          [`tested${tType}`]: true,
        })
      })
    })
  })

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
      if (result1 === false && result2 === false) clean_clean++
      else if (result1 === false && result2 === true) clean_compromised++
      else if (result1 === true && result2 === false) compromised_clean++
      else if (result1 === true && result2 === true) compromised_compromised++
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
