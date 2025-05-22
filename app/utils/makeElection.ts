import { MT19937 } from './mt19937'

export interface ElectionResults {
  compromisedPercentage: number
  compromisedVotes: number
  otherVotes: number
  runnerUpVotes: number
  totalVotes: number
  winnerVotes: number
}

export function makeElection(mt: MT19937): ElectionResults {
  const winnerVotes = Math.floor(mt.random() * 1000000)
  const runnerUpVotes = Math.floor(mt.random() * winnerVotes)
  const otherVotes = Math.floor(mt.random() * (winnerVotes * 0.2)) // Other votes up to 20% of winner's votes
  const totalVotes = winnerVotes + runnerUpVotes + otherVotes

  // Generate random compromised percentage between 0 and 100
  const compromisedPercentage = mt.random() * 100
  const compromisedVotes = Math.floor(
    (compromisedPercentage / 100) * totalVotes
  )

  return {
    compromisedPercentage,
    compromisedVotes,
    otherVotes,
    runnerUpVotes,
    totalVotes,
    winnerVotes,
  }
}
