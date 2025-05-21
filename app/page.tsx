'use client'

import { useState, useEffect } from 'react'
import { SimulatedContent } from './components/SimulatedContent'
import { TestResults } from './components/RequestTests'
import { SimulationOrchestrator } from './utils/orchestrator'
import { Header } from './components/Header'
export default function Home() {
  const [orchestrator, setOrchestrator] =
    useState<SimulationOrchestrator | null>(null)
  const [showCompromised, setShowCompromised] = useState(false)
  const [showSeedInput, setShowSeedInput] = useState(false)
  const [testResults, setTestResults] = useState<TestResults>({
    testA: '',
    testB: '',
    testC: '',
  })

  const onStartOver = (newSeed?: number) => {
    setOrchestrator(new SimulationOrchestrator(newSeed))
    setShowCompromised(false)
  }

  // Simulate an election when the page first loads
  useEffect(() => onStartOver(), [])

  const handleRunTests = () => {
    if (!orchestrator) return alert('Simulation not initialized')

    setOrchestrator(orchestrator.runTests(testResults))

    // Reset the test request form
    setTestResults({
      testA: '',
      testB: '',
      testC: '',
    })
  }

  if (!orchestrator) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center md:!p-10 p-2 py-10 gap-8">
        <div className="italic animate-pulse text-black/50">
          Loading initial simulation...
        </div>
      </main>
    )
  }

  const state = orchestrator.getState()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center md:!p-10 p-2 py-10 gap-8">
      <Header />

      <SimulatedContent
        results={state.election}
        showCompromised={showCompromised}
        onToggleCompromised={() => setShowCompromised(!showCompromised)}
        onStartOver={onStartOver}
        testResults={testResults}
        onTestResultsChange={setTestResults}
        onRunTests={handleRunTests}
        testRuns={state.testRuns}
        seed={state.seed}
        showSeedInput={showSeedInput}
        onToggleSeedInput={() => setShowSeedInput(!showSeedInput)}
      />
    </main>
  )
}
