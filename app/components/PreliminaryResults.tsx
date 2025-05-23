import { useSimulator } from '../useSimulator'

export function percentage(count: number, total: number): string {
  return (!total ? '0' : Math.round((count / total) * 1000) / 10) + '%'
}

export function PreliminaryResults() {
  const {
    election: { runnerUpVotes, totalVotes, winnerVotes },
  } = useSimulator()

  return (
    <div className="space-y-2 mb-8">
      <h2 className="text-2xl font-bold mb-4">Preliminary Results</h2>

      <p className="text-lg">
        Winner&apos;s Votes: {winnerVotes.toLocaleString()}
        <span className="text-gray-600 ml-2">
          ({percentage(winnerVotes, totalVotes)})
        </span>
      </p>
      <p className="text-lg">
        Runner&apos;s Up Votes: {runnerUpVotes.toLocaleString()}
        <span className="text-gray-600 ml-2">
          ({percentage(runnerUpVotes, totalVotes)})
        </span>
      </p>
      <p className="text-lg font-semibold">
        Total Votes Cast: {totalVotes.toLocaleString()}
      </p>
    </div>
  )
}
