import { ElectionResults } from '../utils/makeElection'

export function PreliminaryResults({
  election: { runnerUpVotes, totalVotes, winnerVotes },
}: {
  election: ElectionResults
}) {
  return (
    <div className="space-y-2 mb-8">
      <h2 className="text-2xl font-bold mb-4">Preliminary Results</h2>

      <p className="text-lg">
        Winner&apos;s Votes: {winnerVotes.toLocaleString()}
        <span className="text-gray-600 ml-2">
          ({calculatePercentage(winnerVotes, totalVotes)}%)
        </span>
      </p>
      <p className="text-lg">
        Runner&apos;s Up Votes: {runnerUpVotes.toLocaleString()}
        <span className="text-gray-600 ml-2">
          ({calculatePercentage(runnerUpVotes, totalVotes)}%)
        </span>
      </p>
      <p className="text-lg font-semibold">
        Total Votes Cast: {totalVotes.toLocaleString()}
      </p>
    </div>
  )
}

function calculatePercentage(votes: number, total: number): string {
  if (!total) return '0'
  return ((votes / total) * 100).toFixed(1)
}
