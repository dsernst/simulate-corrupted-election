import { ElectionResults } from '../utils/engine'
import { RevealStartOverLine } from './RevealStartOverLine'
import { RequestTests, TestResults } from './RequestTests'
import { TestHistory } from './TestHistory'
import { TestRun } from '../utils/calculateIntersections'
import { PreliminaryResults } from './PreliminaryResults'

interface SimulationResultsProps {
  results: ElectionResults
  showCompromised: boolean
  onToggleCompromised: () => void
  onStartOver: (newSeed?: number) => void
  testResults: TestResults
  onTestResultsChange: (results: TestResults) => void
  onRunTests: () => void
  testRuns: TestRun[]
  seed: number
  showSeedInput: boolean
  onToggleSeedInput: () => void
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
  seed,
  showSeedInput,
  onToggleSeedInput,
}: SimulationResultsProps) {
  return (
    <div className="mt-8 p-6 bg-white shadow-lg rounded-lg w-full max-w-3xl">
      <PreliminaryResults results={results} />

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-4">
          {/* Test History */}
          <TestHistory testRuns={testRuns} />

          {/* Test Request Form */}
          <RequestTests
            testResults={testResults}
            totalVotes={results.totalVotes}
            onTestResultsChange={onTestResultsChange}
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
