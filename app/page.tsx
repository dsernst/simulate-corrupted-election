'use client'

import { useState } from 'react'
import { NumberInput } from './components/NumberInput'
import { Button } from './components/Button'

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
      {!showSimulation ? (
        <Button onClick={handleSimulate}>Simulate new Election</Button>
      ) : (
        <div className="mt-8 p-6 bg-white shadow-lg rounded-lg w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Preliminary Results</h2>
            <Button
              onClick={handleSimulate}
              variant="outline"
              className="text-sm py-2 px-4"
            >
              Start Over
            </Button>
          </div>
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
            <NumberInput
              id="gatherA"
              label="Gather A test results:"
              value={testResults.gatherA}
              onChange={(value) => handleTestResultChange('gatherA', value)}
            />

            <NumberInput
              id="gatherB"
              label="Gather B test results:"
              value={testResults.gatherB}
              onChange={(value) => handleTestResultChange('gatherB', value)}
            />

            <NumberInput
              id="gatherC"
              label="Gather C test results:"
              value={testResults.gatherC}
              onChange={(value) => handleTestResultChange('gatherC', value)}
            />

            <Button onClick={handleSubmit} variant="success" fullWidth>
              Submit Request
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
