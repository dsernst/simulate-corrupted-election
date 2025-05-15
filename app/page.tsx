'use client'

import { useState, useEffect } from 'react'
import { SimulationResultsDisplay } from './components/SimulationResults'
import { TestResults } from './components/RequestTests'
import {
  SimulationResults,
  generateSimulation,
  calculateTestResults,
} from './utils/simulation'
import { TestRun } from './utils/calculateIntersections'
import { MT19937 } from './utils/mt19937'

function getRandomSeed() {
  return Math.floor(Math.random() * 1000000)
}

export default function Home() {
  const [simulation, setSimulation] = useState<SimulationResults | null>(null)
  const [showCompromised, setShowCompromised] = useState(false)
  const [seed, setSeed] = useState<number>(getRandomSeed())
  const [showSeedInput, setShowSeedInput] = useState(false)
  const [testResults, setTestResults] = useState<TestResults>({
    testA: '',
    testB: '',
    testC: '',
  })
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [nextRunId, setNextRunId] = useState(1)

  const handleSimulate = (newSeed?: number) => {
    const seedToUse = newSeed || getRandomSeed()
    setSeed(seedToUse)
    setSimulation(generateSimulation(seedToUse))
    setShowCompromised(false)
    setTestRuns([])
    setNextRunId(1)
  }

  // Simulate an election when the page first loads
  useEffect(() => handleSimulate(), [])

  const handleRunTests = () => {
    if (!simulation) return

    const mt = new MT19937(simulation.seed)
    const results = calculateTestResults(
      testResults,
      simulation.compromisedVotes,
      simulation.totalVotes,
      mt
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
    <main className="flex min-h-screen flex-col items-center justify-center sm:!p-24 p-2 py-10 gap-8">
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
          onStartOver={() => handleSimulate()}
          testResults={testResults}
          onTestResultsChange={setTestResults}
          onRunTests={handleRunTests}
          testRuns={testRuns}
          seed={seed}
          showSeedInput={showSeedInput}
          onToggleSeedInput={() => setShowSeedInput(!showSeedInput)}
        />
      )}
    </main>
  )
}
