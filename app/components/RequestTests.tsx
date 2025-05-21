import {
  calculateTotalCost,
  formatCost,
  DEFAULT_TEST_COSTS,
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
    key: 'testA' as const,
    label: 'Test A',
    subtitle: 'Voter Autonomous',
    description: 'Easiest, but least reliable',
    bias: 'High',
    cost: DEFAULT_TEST_COSTS.testA,
  },
  {
    key: 'testB' as const,
    label: 'Test B',
    subtitle: 'Guided by Auditor',
    description: 'Medium cost & reliability',
    bias: 'Medium',
    cost: DEFAULT_TEST_COSTS.testB,
  },
  {
    key: 'testC' as const,
    label: 'Test C',
    subtitle: 'Against In-person Paper',
    description: 'Highest cost, perfect accuracy',
    bias: 'Low',
    cost: DEFAULT_TEST_COSTS.testC,
  },
] as const

export function RequestTests({
  requestedTests,
  setRequestedTests,
  onSubmit,
  totalVotes,
}: {
  requestedTests: TestResults
  setRequestedTests: (results: TestResults) => void
  onSubmit: () => void
  totalVotes: number
}) {
  const hasValidTests = Object.values(requestedTests).some(
    (value) => parseInt(value) > 0
  )

  const totalCost = calculateTotalCost(requestedTests)

  const handleSubmit = () => {
    if (hasValidTests) onSubmit()
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Request Tests{' '}
        <span className="text-gray-500 text-xs ml-2 font-normal">
          (Total Votes: {totalVotes.toLocaleString()})
        </span>
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {TESTS.map(({ key, label, subtitle, description, cost }, index) => (
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
                id={key}
                autoFocus={index === 0}
                label={label}
                value={requestedTests[key]}
                onChange={(value) =>
                  setRequestedTests({ ...requestedTests, [key]: value })
                }
                onEnterKey={handleSubmit}
                placeholder="Enter count"
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
            onClick={handleSubmit}
            className="px-6"
            disabled={!hasValidTests}
          >
            Run Tests
          </Button>
        </div>
      </div>
    </div>
  )
}
