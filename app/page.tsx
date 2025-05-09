'use client'

import { useState } from 'react'
import { SimulationResultsDisplay } from './components/SimulationResults'
import { TestResults } from './components/RequestTests'
import { SimulationResults, generateSimulation } from './utils/simulation'
import { Button } from './components/Button'

export default function Home() {
  const [simulation, setSimulation] = useState<SimulationResults | null>(null)
  const [showCompromised, setShowCompromised] = useState(false)
  const [testResults, setTestResults] = useState<TestResults>({
    gatherA: '',
    gatherB: '',
    gatherC: '',
  })

  const handleSimulate = () => {
    setSimulation(generateSimulation())
    setShowCompromised(false)
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
          onRunTests={handleSimulate}
        />
      )}
    </main>
  )
}
