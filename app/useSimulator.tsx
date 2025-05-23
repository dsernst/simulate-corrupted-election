import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { LoadingSimulation } from './components/LoadingSimulation'
import { Simulator } from './utils/simulator'

const SimulatorContext = createContext<null | {
  setSimulator: (simulator: Simulator) => void
  simulator: Simulator
}>(null)

export function SimulatorContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [simulator, setSimulator] = useState<null | Simulator>(null)
  useEffect(() => setSimulator(new Simulator()), [])

  if (!simulator) return <LoadingSimulation />

  return (
    <SimulatorContext.Provider
      value={simulator ? { setSimulator, simulator } : null}
    >
      {children}
    </SimulatorContext.Provider>
  )
}

export function useSimulator() {
  const ctx = useContext(SimulatorContext)
  if (!ctx)
    throw new Error('useSimulator must be used within SimulatorContextProvider')

  const { setSimulator, simulator } = ctx

  return {
    election: simulator.election,
    simulator,
    startOver: useCallback(
      (newSeed?: number) => setSimulator(new Simulator(newSeed)),
      [setSimulator]
    ),
    testRuns: simulator.testRuns,
  }
}
