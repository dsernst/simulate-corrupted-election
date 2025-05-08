'use client'

import { useState } from 'react'

export default function Home() {
  const [showSimulation, setShowSimulation] = useState(false)
  const [simulationResults, setSimulationResults] = useState({
    winnerVotes: 0,
    runnerUpVotes: 0,
    totalVotes: 0,
  })
  const [testResults, setTestResults] = useState({
    gatherA: '',
    gatherB: '',
    gatherC: '',
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

  const handleTestResultChange = (field: string, value: string) => {
    setTestResults((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = () => {
    // Here you can process the test results
    console.log('Submitting test results:', testResults)
    // TODO: Add your submission logic here
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <button
        onClick={handleSimulate}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xl font-semibold cursor-pointer"
      >
        Simulate new Election
      </button>

      {showSimulation && (
        <div className="mt-8 p-6 bg-white shadow-lg rounded-lg w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">Preliminary Results</h2>
          <div className="space-y-2 mb-6">
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

          <div className="space-y-4 mt-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="gatherA" className="text-lg font-medium">
                Gather A test results:
              </label>
              <input
                type="number"
                id="gatherA"
                value={testResults.gatherA}
                onChange={(e) =>
                  handleTestResultChange('gatherA', e.target.value)
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter quantity"
                min="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="gatherB" className="text-lg font-medium">
                Gather B test results:
              </label>
              <input
                type="number"
                id="gatherB"
                value={testResults.gatherB}
                onChange={(e) =>
                  handleTestResultChange('gatherB', e.target.value)
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter quantity"
                min="0"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="gatherC" className="text-lg font-medium">
                Gather C test results:
              </label>
              <input
                type="number"
                id="gatherC"
                value={testResults.gatherC}
                onChange={(e) =>
                  handleTestResultChange('gatherC', e.target.value)
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter quantity"
                min="0"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold cursor-pointer w-full"
            >
              Submit Request
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
