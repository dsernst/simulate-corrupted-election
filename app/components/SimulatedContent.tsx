import { TestRun } from '../utils/calculateIntersections'
import { ElectionResults } from '../utils/engine'
import { PreliminaryResults } from './PreliminaryResults'
import { RequestTests, TestResults } from './RequestTests'
import { RevealStartOverLine } from './RevealStartOverLine'
import { TestHistory } from './TestHistory'

export function SimulatedContent({
  results,
  showCompromised,
  onToggleCompromised,
  onStartOver,
  requestedTests,
  setRequestedTests,
  onRunTests,
  testRuns,
  seed,
  showSeedInput,
  onToggleSeedInput,
}: {
  results: ElectionResults
  showCompromised: boolean
  onToggleCompromised: () => void
  onStartOver: (newSeed?: number) => void
  requestedTests: TestResults
  setRequestedTests: (results: TestResults) => void
  onRunTests: () => void
  testRuns: TestRun[]
  seed: number
  showSeedInput: boolean
  onToggleSeedInput: () => void
}) {
  return (
    <div className="mt-8 p-6 bg-white shadow-lg rounded-lg w-full max-w-3xl">
      <PreliminaryResults results={results} />

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-4">
          {/* Test History */}
          <TestHistory testRuns={testRuns} />

          {/* Test Request Form */}
          <RequestTests
            requestedTests={requestedTests}
            totalVotes={results.totalVotes}
            setRequestedTests={setRequestedTests}
            onSubmit={onRunTests}
          />

          <RevealStartOverLine
            {...{
              results,
              showCompromised,
              onToggleCompromised,
              onStartOver,
              seed,
              showSeedInput,
              onToggleSeedInput,
            }}
          />
        </div>
      </div>
    </div>
  )
}
