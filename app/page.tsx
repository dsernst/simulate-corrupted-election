'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SimulationResultsDisplay } from './components/SimulationResults'
import { TestResults } from './components/RequestTests'
import { SimulationResults, generateSimulation } from './utils/simulation'
import { TestRun } from './utils/calculateIntersections'
import { MT19937 } from './utils/mt19937'
import {
  getInitialState,
  createUrlParams,
  generateTestRuns,
  type TestRequest,
} from './utils/urlState'

// Client component that handles all the client-side logic
function SimulationClient() {
  const [simulation, setSimulation] = useState<SimulationResults | null>(null)
  const [showCompromised, setShowCompromised] = useState(false)
  const [showSeedInput, setShowSeedInput] = useState(false)
  const [testResults, setTestResults] = useState<TestResults>({
    testA: '',
    testB: '',
    testC: '',
  })

  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize state from URL
  const { seed: initialSeed, testRequests: initialTestRequests } =
    getInitialState(searchParams)
  const [seed, setSeed] = useState<number>(initialSeed)
  const [testRequests, setTestRequests] =
    useState<TestRequest[]>(initialTestRequests)
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [mtState, setMtState] = useState<MT19937 | null>(null)

  // Update URL when seed or testRequests change
  useEffect(() => {
    const params = createUrlParams(seed, testRequests)
    router.replace(`?${params.toString()}`)
  }, [seed, testRequests, router])

  // Initialize simulation and MT state
  useEffect(() => {
    setSimulation(generateSimulation(seed))
    setMtState(new MT19937(seed))
  }, [seed])

  // Regenerate test runs when simulation or test requests change
  useEffect(() => {
    if (!simulation) {
      setTestRuns([])
      return
    }
    setTestRuns(generateTestRuns(testRequests, simulation, seed))
  }, [simulation, testRequests, seed])

  const onStartOver = (newSeed?: number) => {
    const seedToUse = newSeed || Math.floor(Math.random() * 1000000)
    setSeed(seedToUse)
    setSimulation(generateSimulation(seedToUse))
    setShowCompromised(false)
    setTestRequests([])
    setTestRuns([])
    setMtState(new MT19937(seedToUse))
  }

  const handleRunTests = () => {
    if (!simulation) return alert('Simulation not initialized')
    if (!mtState) return alert('MT state not initialized')

    // Add new test request
    const newTestRequests = [...testRequests, testResults]
    setTestRequests(newTestRequests)

    // Reset the test request form
    setTestResults({
      testA: '',
      testB: '',
      testC: '',
    })
  }

  if (!simulation) {
    return <Loading />
  }

  return (
    <SimulationResultsDisplay
      results={simulation}
      showCompromised={showCompromised}
      onToggleCompromised={() => setShowCompromised(!showCompromised)}
      onStartOver={onStartOver}
      testResults={testResults}
      onTestResultsChange={setTestResults}
      onRunTests={handleRunTests}
      testRuns={testRuns}
      seed={seed}
      showSeedInput={showSeedInput}
      onToggleSeedInput={() => setShowSeedInput(!showSeedInput)}
    />
  )
}

// Server component that provides the layout
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center md:!p-10 p-2 py-10 gap-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Simulate Corrupted Elections
        </h1>
        <p className="text-xl text-gray-600">
          How efficiently can you detect the compromised votes?
        </p>
      </div>

      <Suspense fallback={<Loading />}>
        <SimulationClient />
      </Suspense>
    </main>
  )
}

const Loading = () => (
  <div className="italic animate-pulse text-black/50">
    Loading simulation...
  </div>
)
