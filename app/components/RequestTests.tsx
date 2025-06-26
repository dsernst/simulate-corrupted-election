import { useState } from 'react'
import { ImSpinner3 } from 'react-icons/im'

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
    accuracy: 'Lowest',
    accuracy_color: 'text-red-600',
    cost: DEFAULT_TEST_COSTS.testA,
    cost_color: 'text-green-700',
    cost_text: 'Lowest',
    key: 'testA' as const,
    label: 'Test A',
    subtitle: 'Voter Autonomous',
  },
  {
    accuracy: 'Medium',
    accuracy_color: 'text-yellow-600',
    cost: DEFAULT_TEST_COSTS.testB,
    cost_color: 'text-yellow-600',
    cost_text: 'Medium',
    key: 'testB' as const,
    label: 'Test B',
    subtitle: 'Guided by Auditor',
  },
  {
    accuracy: 'Perfect',
    accuracy_color: 'text-green-700',
    cost: DEFAULT_TEST_COSTS.testC,
    cost_color: 'text-red-600',
    cost_text: 'High',
    key: 'testC' as const,
    label: 'Test C',
    subtitle: 'Vs In-person Paper',
  },
] as const

const defaultRequested = { testA: '', testB: '', testC: '' }
export function RequestTests() {
  const { rerender, simulator } = useSimulator()
  const [isRunning, setIsRunning] = useState(false)

  const [requestedTests, setRequestedTests] =
    useState<TestResults>(defaultRequested)

  const hasValidTests = Object.values(requestedTests).some(
    (value) => parseInt(value) > 0
  )

  const totalCost = calculateTotalCost(requestedTests)

  const handleSubmit = () => {
    if (!hasValidTests) return

    setIsRunning(true)

    // Allow React to flush + browser to paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        simulator.runTests(requestedTests)
        setRequestedTests(defaultRequested)
        rerender()
        setIsRunning(false)
      }, 0)
    })
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
          {TESTS.map(
            (
              {
                accuracy,
                accuracy_color,
                cost,
                cost_color,
                cost_text,
                key,
                label,
                subtitle,
              },
              index
            ) => (
              <div key={key}>
                <div className="mb-2">
                  <div className="text-xs text-gray-600">{subtitle}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className={`${accuracy_color} font-semibold`}>
                      {accuracy}
                    </span>{' '}
                    accuracy
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className={`${cost_color} font-semibold`}>
                      {cost_text}
                    </span>{' '}
                    cost
                  </div>

                  <div className="text-sm text-gray-600">
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
                  value={requestedTests[key]}
                />
              </div>
            )
          )}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Costs:{' '}
            <span className="font-semibold">{formatCost(totalCost)}</span>
          </div>
          <Button
            className="px-6"
            disabled={!hasValidTests || isRunning}
            onClick={handleSubmit}
          >
            {isRunning ? (
              <div className="flex items-center">
                <ImSpinner3 className="animate-spin mr-1.5" /> Running...
              </div>
            ) : (
              'Run Tests'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
