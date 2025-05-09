import {
  SimulationResults as SimulationResultsType,
  calculatePercentage,
  TestDetectionResults,
} from '../utils/simulation'
import { RevealStartOverLine } from './RevealStartOverLine'
import { RequestTests, TestResults } from './RequestTests'

interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

interface SimulationResultsProps {
  results: SimulationResultsType
  showCompromised: boolean
  onToggleCompromised: () => void
  onStartOver: () => void
  testResults: TestResults
  onTestResultsChange: (results: TestResults) => void
  onRunTests: () => void
  testRuns: TestRun[]
}

export function SimulationResultsDisplay({
  results,
  showCompromised,
  onToggleCompromised,
  onStartOver,
  testResults,
  onTestResultsChange,
  onRunTests,
  testRuns,
}: SimulationResultsProps) {
  return (
    <div className="mt-8 p-6 bg-white shadow-lg rounded-lg w-full max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Preliminary Results</h2>
      <div className="space-y-2 mb-6">
        <p className="text-lg">
          Winner&apos;s Votes: {results.winnerVotes.toLocaleString()}
          <span className="text-gray-600 ml-2">
            ({calculatePercentage(results.winnerVotes, results.totalVotes)}%)
          </span>
        </p>
        <p className="text-lg">
          Runner&apos;s Up Votes: {results.runnerUpVotes.toLocaleString()}
          <span className="text-gray-600 ml-2">
            ({calculatePercentage(results.runnerUpVotes, results.totalVotes)}%)
          </span>
        </p>
        <p className="text-lg font-semibold">
          Total Votes Cast: {results.totalVotes.toLocaleString()}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            {/* Test History */}
            {testRuns.map((run) => (
              <div key={run.id} className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Test Run #{run.id}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {run.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-lg text-blue-700">
                    Total Tests Run: {run.results.totalTests.toLocaleString()}
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    {(['A', 'B', 'C'] as const).map((testType) => {
                      const test = run.results.testBreakdown[`test${testType}`]
                      const percentage =
                        test.count > 0
                          ? (
                              (test.detectedCompromised / test.count) *
                              100
                            ).toFixed(1)
                          : '0.0'

                      return (
                        <div
                          key={testType}
                          className="bg-white p-3 rounded-lg shadow-sm"
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

            {/* Test Request Form */}
            <RequestTests
              testResults={testResults}
              onTestResultsChange={onTestResultsChange}
              onSubmit={onRunTests}
            />

            <RevealStartOverLine
              {...{
                results,
                showCompromised,
                onToggleCompromised,
                onStartOver,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
