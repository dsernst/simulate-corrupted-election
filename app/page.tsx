'use client'

import { useState } from 'react'

export default function Home() {
  const [showSimulation, setShowSimulation] = useState(false)
  const [simulationResults, setSimulationResults] = useState({
    winnerVotes: 0,
    runnerUpVotes: 0,
    totalVotes: 0,
  })

  const handleSimulate = () => {
    // For now, just generate random numbers for demonstration
    const winnerVotes = Math.floor(Math.random() * 1000000)
    const runnerUpVotes = Math.floor(Math.random() * winnerVotes)
    const totalVotes = winnerVotes + runnerUpVotes

    setSimulationResults({
      winnerVotes,
      runnerUpVotes,
      totalVotes,
    })
    setShowSimulation(true)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <button
        onClick={handleSimulate}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xl font-semibold"
      >
        Simulate new Election
      </button>

      {showSimulation && (
        <div className="mt-8 p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Simulation Results</h2>
          <div className="space-y-2">
            <p className="text-lg">
              Winner&apos;s Votes:{' '}
              {simulationResults.winnerVotes.toLocaleString()}
            </p>
            <p className="text-lg">
              Runner&apos;s Up Votes:{' '}
              {simulationResults.runnerUpVotes.toLocaleString()}
            </p>
            <p className="text-lg">
              Total Votes Cast: {simulationResults.totalVotes.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
