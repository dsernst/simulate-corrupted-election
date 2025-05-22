'use client'

import { useEffect, useState } from 'react'

import { Header } from './components/Header'
import { TestResults } from './components/RequestTests'
import { SimulatedContent } from './components/SimulatedContent'
import { Simulator } from './utils/simulator'

const defaultRequested = { testA: '', testB: '', testC: '' }

export default function Home() {
  const [simulator, setSimulator] = useState<null | Simulator>(null)
  const [compromisedShown, setCompromisedShown] = useState(false)
  const [seedInputShown, setSeedInputShown] = useState(false)
  const [requestedTests, setRequestedTests] =
    useState<TestResults>(defaultRequested)

  const startOver = (newSeed?: number) => {
    setSimulator(new Simulator(newSeed))
    setCompromisedShown(false)
  }

  // Simulate an election when the page first loads
  useEffect(() => startOver(), [])

  if (!simulator) return <LoadingSimulation />

  return (
    <main className="flex min-h-screen flex-col items-center justify-center md:!p-10 p-2 py-10 gap-8">
      <Header />

      <SimulatedContent
        election={simulator.election}
        requestTests={() => {
          if (!simulator) return alert('Simulation not initialized')
          simulator.runTests(requestedTests)
          setRequestedTests(defaultRequested) // Reset form
        }}
        testRuns={simulator.testRuns}
        toggleCompromised={() => setCompromisedShown(!compromisedShown)}
        toggleSeedInput={() => setSeedInputShown(!seedInputShown)}
        {...{
          compromisedShown,
          requestedTests,
          seedInputShown,
          setRequestedTests,
          startOver,
          ...simulator,
        }}
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
