import { useState } from 'react'

import { useSimulator } from '../useSimulator'
import {
  calculateTotalCost,
  DEFAULT_TEST_COSTS,
  formatCost,
} from '../utils/costCalculation'
import { Button } from './Button'
import { NumberInput } from './NumberInput'

export interface TestResults {
  testA: string
  testB: string
  testC: string
}

const TESTS = [
  {
    cost: DEFAULT_TEST_COSTS.testA,
    description: 'Easiest, but least reliable',
    key: 'testA' as const,
    label: 'Test A',
    subtitle: 'Voter Autonomous',
  },
  {
    cost: DEFAULT_TEST_COSTS.testB,
    description: 'Medium cost & reliability',
    key: 'testB' as const,
    label: 'Test B',
    subtitle: 'Guided by Auditor',
  },
  {
    cost: DEFAULT_TEST_COSTS.testC,
    description: 'Highest cost, perfect accuracy',
    key: 'testC' as const,
    label: 'Test C',
    subtitle: 'Vs In-person Paper',
  },
] as const

const defaultRequested = { testA: '', testB: '', testC: '' }
export function RequestTests() {
  const { rerender, simulator } = useSimulator()

  const [requestedTests, setRequestedTests] =
    useState<TestResults>(defaultRequested)

  const hasValidTests = Object.values(requestedTests).some(
    (value) => parseInt(value) > 0
  )

  const totalCost = calculateTotalCost(requestedTests)

  const handleSubmit = () => {
    if (!hasValidTests) return
    simulator.runTests(requestedTests)
    setRequestedTests(defaultRequested)
    rerender()
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Request Tests{' '}
        <span className="text-gray-500 text-xs ml-2 font-normal">
          (Total Votes: {simulator?.election?.totalVotes.toLocaleString()})
        </span>
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {TESTS.map(({ cost, description, key, label, subtitle }, index) => (
            <div key={key}>
              <div className="mb-2">
                <div className="text-xs text-gray-500">{subtitle}</div>
                <div className="text-sm text-gray-600">
                  {description}
                  <div className="mt-2">
                    <span className="border-2 border-green-600/40 px-1 py-0.5 text-gray-500 rounded-lg">
                      {formatCost(cost)} / vote
                    </span>
                  </div>
                </div>
              </div>
              <NumberInput
                autoFocus={index === 0}
                id={key}
                label={label}
                onChange={(value) =>
                  setRequestedTests({ ...requestedTests, [key]: value })
                }
                onEnterKey={handleSubmit}
                placeholder="Enter count"
                value={requestedTests[key]}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Costs:{' '}
            <span className="font-semibold">{formatCost(totalCost)}</span>
          </div>
          <Button
            className="px-6"
            disabled={!hasValidTests}
            onClick={handleSubmit}
          >
            Run Tests
          </Button>
        </div>
      </div>
    </div>
  )
}
