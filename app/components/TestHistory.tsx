import { TestDetectionResults } from '../utils/simulation'
import { useMemo } from 'react'

export interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

interface IntersectionCounts {
  'A ∩ B': number
  'A ∩ C': number
  'B ∩ C': number
  'A ∩ B ∩ C': number
  'A only': number
  'B only': number
  'C only': number
}

function calculateIntersections(testRuns: TestRun[]): IntersectionCounts {
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
    { testA?: boolean; testB?: boolean; testC?: boolean }
  >()

  // First pass: collect all test results for each vote across all runs
  testRuns.forEach((run) => {
    Object.entries(run.results.testBreakdown).forEach(([testKey, test]) => {
      const testType = testKey.slice(-1) as 'A' | 'B' | 'C'
      test.voteResults.forEach((vote) => {
        const existing = voteMap.get(vote.voteId) || {}
        voteMap.set(vote.voteId, {
          ...existing,
          [`test${testType}`]: vote.testResults[`test${testType}`],
        })
      })
    })
  })

  // Second pass: calculate intersections
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

const TestRunDisplay = ({
  run,
  isLastRun,
  finalIntersections,
}: {
  run: TestRun
  isLastRun: boolean
  finalIntersections?: IntersectionCounts
}) => {
  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-blue-800">
          Test Set #{run.id}
        </h3>
        <span className="text-sm text-gray-500">
          {run.timestamp.toLocaleTimeString()}
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {(['A', 'B', 'C'] as const).map((testType) => {
            const test = run.results.testBreakdown[`test${testType}`]
            const percentage =
              test.count > 0
                ? ((test.detectedCompromised / test.count) * 100).toFixed(1)
                : '0.0'

            return (
              <div
                key={testType}
                className={`bg-white p-3 rounded-lg shadow-sm ${
                  !test.count && 'opacity-0'
                }`}
              >
                <h4 className="font-medium text-blue-800 mb-2">
                  Test {testType}
                </h4>
                <p className="text-sm text-gray-600">
                  Tests Run: {test.count.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Detected Compromised:{' '}
                  {test.detectedCompromised.toLocaleString()}
                  <span className="text-gray-500 ml-1">({percentage}%)</span>
                </p>
              </div>
            )
          })}
        </div>

        {/* Intersection Results - only show in the last run */}
        {isLastRun && finalIntersections && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3">
              Final Results: Votes Detected as Compromised by Multiple Tests
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(finalIntersections)
                .filter(([, value]) => value > 0)
                .map(([key, value]) => ({
                  label: key.replaceAll(' ∩ ', ' & ').replace(' only', ''),
                  value,
                  description: key.includes('only')
                    ? `Detected only by Test ${key[0]}`
                    : `Detected by both Test ${key[0]} and Test ${key[4]}${
                        key.includes('∩ C') ? ' and Test C' : ''
                      }`,
                }))
                .map(({ label, value, description }) => (
                  <div key={label} className="bg-white p-3 rounded shadow-sm">
                    <p className="text-sm font-medium text-blue-800">{label}</p>
                    <p className="text-sm text-gray-600">
                      {value.toLocaleString()} votes
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const TestHistory = ({ testRuns }: { testRuns: TestRun[] }) => {
  // Calculate intersections only once for the final state
  const finalIntersections = useMemo(
    () => calculateIntersections(testRuns),
    [testRuns]
  )

  return (
    <>
      {testRuns.map((run, index) => (
        <TestRunDisplay
          key={run.id}
          run={run}
          isLastRun={index === testRuns.length - 1}
          finalIntersections={finalIntersections}
        />
      ))}
    </>
  )
}
