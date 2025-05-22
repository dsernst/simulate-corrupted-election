import { TestRun } from '../utils/calculateIntersections'
import { ElectionResults } from '../utils/makeElection'
import { PreliminaryResults } from './PreliminaryResults'
import { RequestTests, TestResults } from './RequestTests'
import { RevealStartOverLine } from './RevealStartOverLine'
import { TestHistory } from './TestHistory'

export function SimulatedContent({
  compromisedShown,
  election,
  requestedTests,
  requestTests,
  seed,
  seedInputShown,
  setRequestedTests,
  startOver,
  testRuns,
  toggleCompromised,
  toggleSeedInput,
}: {
  compromisedShown: boolean
  election: ElectionResults
  requestedTests: TestResults
  requestTests: () => void
  seed: number
  seedInputShown: boolean
  setRequestedTests: (results: TestResults) => void
  startOver: (newSeed?: number) => void
  testRuns: TestRun[]
  toggleCompromised: () => void
  toggleSeedInput: () => void
}) {
  return (
    <div className="mt-8 p-6 bg-white shadow-lg rounded-lg w-full max-w-3xl">
      <PreliminaryResults {...{ election }} />

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-4">
          {/* Test History */}
          <TestHistory {...{ testRuns: [...testRuns] }} />

          {/* Test Request Form */}
          <RequestTests
            totalVotes={election.totalVotes}
            {...{ requestedTests, requestTests, setRequestedTests }}
          />

          <RevealStartOverLine
            {...{
              compromisedShown,
              election,
              seed,
              seedInputShown,
              startOver,
              toggleCompromised,
              toggleSeedInput,
            }}
          />
        </div>
      </div>
    </div>
  )
}
