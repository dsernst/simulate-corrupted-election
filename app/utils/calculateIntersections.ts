import { TestDetectionResults } from './simulation'
import { intersectionGroups } from './create-intersections'

export type TestType = 'A' | 'B' | 'C'

export interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

export interface LayeredStat {
  label: string
  tested: number
  compromised: number
  percentCompromised: number
  indentLevel?: number
  bias?: string
  signatures: Record<string, number>
}

// Define a type for the vote object in voteMap
export interface VoteResult {
  testA: boolean | undefined
  testB: boolean | undefined
  testC: boolean | undefined
  testedA: boolean | undefined
  testedB: boolean | undefined
  testedC: boolean | undefined
}

export function calculateLayeredStats(testRuns: TestRun[]): LayeredStat[] {
  // Build voteMap
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

  // Helper to count compromised in a set for a given test
  function countCompromised(votes: VoteResult[], test: 'A' | 'B' | 'C') {
    // testX === true means detected compromise
    return votes.filter((v) => v[`test${test}`] === true).length
  }

  // Helper to percent
  function percent(n: number, d: number) {
    return d === 0 ? 0 : Math.round((n / d) * 1000) / 10
  }

  // Calculate stats for each group
  return intersectionGroups.map(({ key, indentLevel, tests, filter }) => {
    // Filter votes by which tests were run on them
    const votes = Array.from(voteMap.values()).filter((v) => !!v && filter(v))

    const tested = votes.length

    // For single-test groups, compromised is just that test; for intersections, we can use signatures for breakdown
    const compromised =
      tests.length === 1 ? countCompromised(votes, tests[0]) : 0

    return {
      key,
      label: key, // For now, label is the canonical key; UI can prettify
      tested,
      compromised,
      percentCompromised: percent(compromised, tested),
      indentLevel,
      signatures: countCompromisedSignatures(votes, tests),
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

// Utility: Count detection signatures for a set of votes and test types
export function countCompromisedSignatures(
  votes: VoteResult[],
  tests: ('A' | 'B' | 'C')[]
) {
  const counts: Record<string, number> = {}
  for (const v of votes) {
    const detected = tests.filter((t) => v[`test${t}`] === true)
    if (detected.length === 0) continue // skip if none detected
    const key = detected.join('')
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

/** Utility: Convert canonical group key to display label */
export function toDisplayLabelFromKey(key: string): string {
  // Match either ![A-Z] or [A-Z]
  const parts = key.match(/!?[A-Z]/g) || []
  return parts
    .map((part) => (part.startsWith('!') ? `not ${part[1]}` : part))
    .join(' & ')
}
