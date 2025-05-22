import { TestType } from '../utils/calculateIntersections'
import { percentage } from './PreliminaryResults'

interface TestResultCardProps {
  count: number
  detectedCompromised: number
  testType: TestType
}

export function TestResultCard({
  count,
  detectedCompromised,
  testType,
}: TestResultCardProps) {
  return (
    <div
      className={`bg-white p-3 rounded-lg shadow-sm text-sm text-black/70 ${
        !count && 'opacity-0'
      }`}
    >
      <h4 className="font-medium text-blue-800 mb-2">Test {testType}</h4>
      <p>Tests Ran: {count.toLocaleString()}</p>
      <p className="mt-1.5">
        # Compromised: {detectedCompromised.toLocaleString()}
        <span className="ml-1 font-semibold text-black/80">
          ({percentage(detectedCompromised, count)})
        </span>
      </p>
    </div>
  )
}
