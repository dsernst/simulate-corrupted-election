'use client'

import { useEffect, useState } from 'react'

import { Header } from './components/Header'
import { TestResults } from './components/RequestTests'
import { SimulatedContent } from './components/SimulatedContent'
import { Simulator } from './utils/simulator'

const defaultRequested = { testA: '', testB: '', testC: '' }

export default function Home() {
  const [simulator, setSimulator] = useState<null | Simulator>(null)
  const [showCompromised, setShowCompromised] = useState(false)
  const [showSeedInput, setShowSeedInput] = useState(false)
  const [requestedTests, setRequestedTests] =
    useState<TestResults>(defaultRequested)

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
        onRunTests={() => {
          if (!simulator) return alert('Simulation not initialized')
          setSimulator(simulator.runTests(requestedTests))
          setRequestedTests(defaultRequested) // Reset form
        }}
        onStartOver={onStartOver}
        onToggleCompromised={() => setShowCompromised(!showCompromised)}
        onToggleSeedInput={() => setShowSeedInput(!showSeedInput)}
        requestedTests={requestedTests}
        results={state.election}
        seed={simulator.seed}
        setRequestedTests={setRequestedTests}
        showCompromised={showCompromised}
        showSeedInput={showSeedInput}
        testRuns={state.testRuns}
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
