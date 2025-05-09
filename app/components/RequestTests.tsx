import { NumberInput } from './NumberInput'
import { Button } from './Button'

export interface TestResults {
  testA: string
  testB: string
  testC: string
}

interface RequestTestsProps {
  testResults: TestResults
  onTestResultsChange: (results: TestResults) => void
  onSubmit: () => void
}

const TESTS = [
  {
    key: 'testA' as const,
    label: 'Test A',
    description: 'Quick, but less reliable',
  },
  {
    key: 'testB' as const,
    label: 'Test B',
    description: 'Balanced cost and reliability',
  },
  {
    key: 'testC' as const,
    label: 'Test C',
    description: 'Highest cost, perfect accuracy',
  },
] as const

export function RequestTests({
  testResults,
  onTestResultsChange,
  onSubmit,
}: RequestTestsProps) {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Request Tests</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {TESTS.map(({ key, label, description }) => (
            <div key={key}>
              <div className="mb-2">
                <span className="text-sm text-gray-600">{description}</span>
              </div>
              <NumberInput
                id={key}
                label={label}
                value={testResults[key]}
                onChange={(value) =>
                  onTestResultsChange({ ...testResults, [key]: value })
                }
                onEnterKey={onSubmit}
                placeholder="Enter count"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={onSubmit} className="px-6">
            Run Tests
          </Button>
        </div>
      </div>
    </div>
  )
}
