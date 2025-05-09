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
    subtitle: 'Voter Autonomous',
    description: 'Easiest, but least reliable',
    bias: 'High',
  },
  {
    key: 'testB' as const,
    label: 'Test B',
    subtitle: 'Guided by Auditor',
    description: 'Medium cost & reliability',
    bias: 'Medium',
  },
  {
    key: 'testC' as const,
    label: 'Test C',
    subtitle: 'Against In-person Paper',
    description: 'Highest cost, perfect accuracy',
    bias: 'Low',
  },
] as const

export function RequestTests({
  testResults,
  onTestResultsChange,
  onSubmit,
}: RequestTestsProps) {
  const hasValidTests = Object.values(testResults).some(
    (value) => parseInt(value) > 0
  )

  const handleSubmit = () => {
    if (hasValidTests) onSubmit()
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Request Tests</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {TESTS.map(({ key, label, subtitle, description }) => (
            <div key={key}>
              <div className="mb-2">
                <div className="text-xs text-gray-500">{subtitle}</div>
                <div className="text-sm text-gray-600">{description}</div>
              </div>
              <NumberInput
                id={key}
                label={label}
                value={testResults[key]}
                onChange={(value) =>
                  onTestResultsChange({ ...testResults, [key]: value })
                }
                onEnterKey={handleSubmit}
                placeholder="Enter count"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
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
