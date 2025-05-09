import { useMemo } from 'react'
import { TestRun } from '../utils/calculateIntersections'
import {
  TEST_TYPES,
  calculateIntersections,
} from '../utils/calculateIntersections'
import { TestResultCard } from './TestResultCard'
import { IntersectionResults } from './IntersectionResults'

const TestRunDisplay = ({ run }: { run: TestRun }) => (
  <div className="p-4 bg-blue-50 rounded-lg">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-lg font-semibold text-blue-800">
        Test Set #{run.id}
      </h3>
      <span className="text-sm text-gray-500">
        {run.timestamp.toLocaleTimeString()}
      </span>
    </div>

    <div className="grid grid-cols-3 gap-4">
      {TEST_TYPES.map((testType) => {
        const test = run.results.testBreakdown[`test${testType}`]
        return (
          <TestResultCard
            key={testType}
            testType={testType}
            count={test.count}
            detectedCompromised={test.detectedCompromised}
          />
        )
      })}
    </div>
  </div>
)

export const TestHistory = ({ testRuns }: { testRuns: TestRun[] }) => {
  const finalIntersections = useMemo(
    () => calculateIntersections(testRuns),
    [testRuns]
  )

  return (
    <div className="space-y-6">
      {testRuns.map((run) => (
        <TestRunDisplay key={run.id} run={run} />
      ))}
      <IntersectionResults intersections={finalIntersections} />
    </div>
  )
}
