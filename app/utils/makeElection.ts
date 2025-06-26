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

  // Calculate the margin needed to flip the election
  // Each compromised vote represents a net swing of 2 votes (-1 from winner, +1 to runner-up)
  const marginOfVictory = winnerVotes - runnerUpVotes
  const marginToFlip = marginOfVictory / 2

  // Generate compromised votes to have 50/50 odds to flip election
  // The compromised votes will be between 0 and 2x the margin needed to flip
  const maxCompromisedVotes = marginToFlip * 2
  const compromisedVotes = Math.floor(mt.random() * maxCompromisedVotes)
  const compromisedPercentage = (compromisedVotes / totalVotes) * 100

  return {
    compromisedPercentage,
    compromisedVotes,
    otherVotes,
    runnerUpVotes,
    totalVotes,
    winnerVotes,
  }
}
