'use client'

import { useState, useEffect } from 'react'
import { SimulatedContent } from './components/SimulatedContent'
import { TestResults } from './components/RequestTests'
import { Simulator } from './utils/simulator'
import { Header } from './components/Header'

export default function Home() {
  const [simulator, setSimulator] = useState<Simulator | null>(null)
  const [showCompromised, setShowCompromised] = useState(false)
  const [showSeedInput, setShowSeedInput] = useState(false)
  const [testResults, setTestResults] = useState<TestResults>({
    testA: '',
    testB: '',
    testC: '',
  })

  const onStartOver = (newSeed?: number) => {
    setSimulator(new Simulator(newSeed))
    setShowCompromised(false)
  }

  // Simulate an election when the page first loads
  useEffect(() => onStartOver(), [])

  if (!simulator) return <LoadingSimulation />

  const state = simulator.getState()

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
        onRunTests={() => {
          if (!simulator) return alert('Simulation not initialized')

          setSimulator(simulator.runTests(testResults))

          // Reset the test request form
          setTestResults({
            testA: '',
            testB: '',
            testC: '',
          })
        }}
        testRuns={state.testRuns}
        seed={state.seed}
        showSeedInput={showSeedInput}
        onToggleSeedInput={() => setShowSeedInput(!showSeedInput)}
      />
    </main>
  )
}

function LoadingSimulation() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center md:!p-10 p-2 py-10 gap-8">
      <div className="italic animate-pulse text-black/50">
        Loading initial simulation...
      </div>
    </main>
  )
}
