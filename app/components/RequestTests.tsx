import { NumberInput } from './NumberInput'
import { Button } from './Button'

export interface TestResults {
  gatherA: string
  gatherB: string
  gatherC: string
}

interface RequestTestsProps {
  testResults: TestResults
  onTestResultsChange: (results: TestResults) => void
  onSubmit: () => void
}

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
          <div>
            <NumberInput
              id="gatherA"
              label="Test A"
              value={testResults.gatherA}
              onChange={(value) =>
                onTestResultsChange({ ...testResults, gatherA: value })
              }
              placeholder="Enter count"
            />
          </div>
          <div>
            <NumberInput
              id="gatherB"
              label="Test B"
              value={testResults.gatherB}
              onChange={(value) =>
                onTestResultsChange({ ...testResults, gatherB: value })
              }
              placeholder="Enter count"
            />
          </div>
          <div>
            <NumberInput
              id="gatherC"
              label="Test C"
              value={testResults.gatherC}
              onChange={(value) =>
                onTestResultsChange({ ...testResults, gatherC: value })
              }
              placeholder="Enter count"
            />
          </div>
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
