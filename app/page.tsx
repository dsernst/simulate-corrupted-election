'use client'

import { useState, useEffect } from 'react'
import { SimulationResultsDisplay } from './components/SimulationResults'
import { TestResults } from './components/RequestTests'
import {
  SimulationResults,
  generateSimulation,
  calculateTestResults,
  TestDetectionResults,
} from './utils/simulation'

interface TestRun {
  id: number
  results: TestDetectionResults
  timestamp: Date
}

export default function Home() {
  const [simulation, setSimulation] = useState<SimulationResults | null>(null)
  const [showCompromised, setShowCompromised] = useState(false)
  const [testResults, setTestResults] = useState<TestResults>({
    testA: '',
    testB: '',
    testC: '',
  })
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [nextRunId, setNextRunId] = useState(1)

  const handleSimulate = () => {
    setSimulation(generateSimulation())
    setShowCompromised(false)
    setTestRuns([])
    setNextRunId(1)
  }

  // Simulate an election when the page first loads
  useEffect(() => handleSimulate(), [])

  const handleRunTests = () => {
    if (!simulation) return

    const results = calculateTestResults(
      testResults,
      simulation.compromisedVotes,
      simulation.totalVotes
    )

    // Add new test run to history
    setTestRuns((prev) => [
      ...prev,
      {
        id: nextRunId,
        results,
        timestamp: new Date(),
      },
    ])
    setNextRunId((prev) => prev + 1)

    // Reset the test request form
    setTestResults({
      testA: '',
      testB: '',
      testC: '',
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Simulate Corrupted Elections
        </h1>
        <p className="text-xl text-gray-600">
          How efficiently can you detect the compromised votes?
        </p>
      </div>

      {!simulation ? (
        <div className="italic animate-pulse text-black/50">
          Loading initial simulation...
        </div>
      ) : (
        <SimulationResultsDisplay
          results={simulation}
          showCompromised={showCompromised}
          onToggleCompromised={() => setShowCompromised(!showCompromised)}
          onStartOver={handleSimulate}
          testResults={testResults}
          onTestResultsChange={setTestResults}
          onRunTests={handleRunTests}
          testRuns={testRuns}
        />
      )}
    </main>
  )
}
