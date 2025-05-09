'use client'

import { useState } from 'react'
import { SimulationResultsDisplay } from './components/SimulationResults'
import { TestResults } from './components/RequestTests'
import {
  SimulationResults,
  generateSimulation,
  calculateTestResults,
  TestDetectionResults,
} from './utils/simulation'
import { Button } from './components/Button'

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
      {!simulation ? (
        <Button onClick={handleSimulate}>Simulate new Election</Button>
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
