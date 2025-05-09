import { NumberInput } from './NumberInput'
import { Button } from './Button'

export interface TestResults {
  gatherA: string
  gatherB: string
  gatherC: string
}

interface TestInputsProps {
  testResults: TestResults
  onTestResultsChange: (results: TestResults) => void
  onSubmit: () => void
}

export function TestInputs({
  testResults,
  onTestResultsChange,
  onSubmit,
}: TestInputsProps) {
  return (
    <div className="space-y-4">
      <NumberInput
        id="gatherA"
        label="Gather A"
        value={testResults.gatherA}
        onChange={(value) =>
          onTestResultsChange({ ...testResults, gatherA: value })
        }
      />
      <NumberInput
        id="gatherB"
        label="Gather B"
        value={testResults.gatherB}
        onChange={(value) =>
          onTestResultsChange({ ...testResults, gatherB: value })
        }
      />
      <NumberInput
        id="gatherC"
        label="Gather C"
        value={testResults.gatherC}
        onChange={(value) =>
          onTestResultsChange({ ...testResults, gatherC: value })
        }
      />
      <Button onClick={onSubmit}>Simulate</Button>
    </div>
  )
}
