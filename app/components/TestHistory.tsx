import { TestDetectionResults } from '../utils/simulation'

export interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

export const TestHistory = ({ testRuns }: { testRuns: TestRun[] }) => {
  return (
    <>
      {testRuns.map((run) => (
        <div key={run.id} className="p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-blue-800">
              Test Set #{run.id}
            </h3>
            <span className="text-sm text-gray-500">
              {run.timestamp.toLocaleTimeString()}
            </span>
          </div>

          <div className="space-y-4">
            {/* <p className="text-lg text-blue-700">
              Total Tests Run: {run.results.totalTests.toLocaleString()}
            </p> */}

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
                      <span className="text-gray-500 ml-1">
                        ({percentage}%)
                      </span>
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
