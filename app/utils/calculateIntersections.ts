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
    Record<`test${TestType}`, boolean | undefined>
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
        }
        voteMap.set(vote.voteId, {
          ...existing,
          [`test${testType}`]: vote.testResults[`test${testType}`],
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
