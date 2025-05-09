export interface SimulationResults {
  winnerVotes: number
  runnerUpVotes: number
  otherVotes: number
  totalVotes: number
  compromisedVotes: number
  compromisedPercentage: number
}

export function calculatePercentage(votes: number, total: number): string {
  return ((votes / total) * 100).toFixed(1)
}

export function generateSimulation(): SimulationResults {
  const winnerVotes = Math.floor(Math.random() * 1000000)
  const runnerUpVotes = Math.floor(Math.random() * winnerVotes)
  const otherVotes = Math.floor(Math.random() * (winnerVotes * 0.2)) // Other votes up to 20% of winner's votes
  const totalVotes = winnerVotes + runnerUpVotes + otherVotes

  // Generate random compromised percentage between 0 and 100
  const compromisedPercentage = Math.random() * 100
  const compromisedVotes = Math.floor(
    (compromisedPercentage / 100) * totalVotes
  )

  return {
    winnerVotes,
    runnerUpVotes,
    otherVotes,
    totalVotes,
    compromisedVotes,
    compromisedPercentage,
  }
}
