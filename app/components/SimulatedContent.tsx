import { TestRun } from '../utils/calculateIntersections'
import { ElectionResults } from '../utils/makeElection'
import { PreliminaryResults } from './PreliminaryResults'
import { RequestTests, TestResults } from './RequestTests'
import { RevealStartOverLine } from './RevealStartOverLine'
import { TestHistory } from './TestHistory'

export function SimulatedContent({
  onRunTests,
  onStartOver,
  onToggleCompromised,
  onToggleSeedInput,
  requestedTests,
  results,
  seed,
  setRequestedTests,
  showCompromised,
  showSeedInput,
  testRuns,
}: {
  onRunTests: () => void
  onStartOver: (newSeed?: number) => void
  onToggleCompromised: () => void
  onToggleSeedInput: () => void
  requestedTests: TestResults
  results: ElectionResults
  seed: number
  setRequestedTests: (results: TestResults) => void
  showCompromised: boolean
  showSeedInput: boolean
  testRuns: TestRun[]
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
            onSubmit={onRunTests}
            requestedTests={requestedTests}
            setRequestedTests={setRequestedTests}
            totalVotes={results.totalVotes}
          />

          <RevealStartOverLine
            {...{
              onStartOver,
              onToggleCompromised,
              onToggleSeedInput,
              results,
              seed,
              showCompromised,
              showSeedInput,
            }}
          />
        </div>
      </div>
    </div>
  )
}
