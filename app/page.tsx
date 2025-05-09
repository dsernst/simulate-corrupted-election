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

export default function Home() {
  const [simulation, setSimulation] = useState<SimulationResults | null>(null)
  const [showCompromised, setShowCompromised] = useState(false)
  const [testResults, setTestResults] = useState<TestResults>({
    testA: '',
    testB: '',
    testC: '',
  })
  const [detectionResults, setDetectionResults] =
    useState<TestDetectionResults | null>(null)

  const handleSimulate = () => {
    setSimulation(generateSimulation())
    setShowCompromised(false)
    setDetectionResults(null)
  }

  const handleRunTests = () => {
    if (!simulation) return

    const results = calculateTestResults(
      testResults,
      simulation.compromisedVotes,
      simulation.totalVotes
    )
    setDetectionResults(results)
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
          detectionResults={detectionResults}
        />
      )}
    </main>
  )
}
