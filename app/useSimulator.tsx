import { motion } from 'motion/react'
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
  rerender: () => void
  setSimulator: (simulator: Simulator) => void
  simulator: Simulator
  version: number
}>(null)

export function SimulatorContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [simulator, setSimulator] = useState<null | Simulator>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => setSimulator(new Simulator()), [])

  const rerender = useCallback(() => setVersion((v) => v + 1), [])

  return (
    <>
      {!simulator ? (
        <motion.div key="loading" layout>
          <LoadingSimulation />
        </motion.div>
      ) : (
        <motion.div
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          key="content"
          layout
        >
          <SimulatorContext.Provider
            value={{ rerender, setSimulator, simulator, version }}
          >
            {children}
          </SimulatorContext.Provider>
        </motion.div>
      )}
    </>
  )
}

export function useSimulator() {
  const ctx = useContext(SimulatorContext)
  if (!ctx)
    throw new Error('useSimulator must be used within SimulatorContextProvider')

  const { rerender, setSimulator, simulator, version } = ctx

  return {
    election: simulator.election,
    rerender,
    simulator,
    startOver: useCallback(
      (newSeed?: number) => setSimulator(new Simulator(newSeed)),
      [setSimulator]
    ),
    testRuns: simulator.testRuns,
    version,
  }
}
