import { SimulationResults, calculatePercentage } from '../utils/simulation'
import { Button } from './Button'

interface SimulationResultsProps {
  results: SimulationResults
  showCompromised: boolean
  onToggleCompromised: () => void
  onStartOver: () => void
}

export function SimulationResultsDisplay({
  results,
  showCompromised,
  onToggleCompromised,
  onStartOver,
}: SimulationResultsProps) {
  return (
    <div className="mt-8 p-6 bg-white shadow-lg rounded-lg w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Preliminary Results</h2>
        <Button
          onClick={onStartOver}
          variant="outline"
          className="text-sm py-2 px-4"
        >
          Start Over
        </Button>
      </div>
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

        <div className="mt-4 pt-4 border-t border-gray-200 h-20">
          {!showCompromised ? (
            <Button
              onClick={onToggleCompromised}
              variant="outline"
              className="w-full"
            >
              Reveal Compromised Votes
            </Button>
          ) : (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-lg text-red-700">
                Compromised Votes: {results.compromisedVotes.toLocaleString()}
                <span className="text-red-600 ml-2">
                  ({results.compromisedPercentage.toFixed(1)}% of total)
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
