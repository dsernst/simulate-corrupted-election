import { TestRun, type TestType } from '../utils/calculateIntersections'
import { TestResultCard } from './TestResultCard'
import { IntersectionResults } from './IntersectionResults'
import {
  calculateTotalTestRunsCost,
  formatCost,
} from '../utils/costCalculation'

export const TestHistory = ({ testRuns }: { testRuns: TestRun[] }) => {
  if (!testRuns.length) return null

  const totalCost = calculateTotalTestRunsCost(testRuns)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Test History</h3>
        <div className="text-sm text-gray-600">
          Total Cost:{' '}
          <span className="font-semibold">{formatCost(totalCost)}</span>
        </div>
      </div>
      {testRuns.map((run) => (
        <TestRunDisplay key={run.id} run={run} />
      ))}
      <IntersectionResults testRuns={testRuns} />
    </div>
  )
}

const TEST_TYPES: TestType[] = ['A', 'B', 'C']
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
