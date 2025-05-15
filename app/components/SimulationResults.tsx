import {
  SimulationResults as SimulationResultsType,
  calculatePercentage,
} from '../utils/simulation'
import { RevealStartOverLine } from './RevealStartOverLine'
import { RequestTests, TestResults } from './RequestTests'
import { TestHistory } from './TestHistory'
import { TestRun } from '../utils/calculateIntersections'

interface SimulationResultsProps {
  results: SimulationResultsType
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
  onSeedChange: (newSeed: number) => void
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
  onSeedChange,
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
            <TestHistory testRuns={testRuns} />

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
                seed,
                showSeedInput,
                onToggleSeedInput,
                onSeedChange,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
