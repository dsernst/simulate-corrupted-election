import { useSimulator } from '../useSimulator'
import { TestRun, type TestType } from '../utils/calculateIntersections'
import {
  calculateTotalTestRunsCost,
  formatCost,
} from '../utils/costCalculation'
import { IntersectionResults } from './IntersectionResults'
import { TestResultCard } from './TestResultCard'

export const TestHistory = () => {
  const { testRuns } = useSimulator()

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
      <div className="flex justify-start text-black/50 text-xs">
        {run.timestamp.toLocaleTimeString().toLowerCase().replace(' ', '')}
        <span className="mx-1 opacity-50">|</span>
        {Math.round(run.testTime / 100) / 10}s
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
      {TEST_TYPES.map((testType) => {
        const test = run.results.testBreakdown[`test${testType}`]
        return (
          <TestResultCard
            count={test.count}
            detectedCompromised={test.detectedCompromised}
            key={testType}
            testType={testType}
          />
        )
      })}
    </div>
  </div>
)
