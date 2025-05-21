import { TestType } from '../utils/calculateIntersections'

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
  const percentage =
    count > 0 ? ((detectedCompromised / count) * 100).toFixed(1) : '0.0'

  return (
    <div
      className={`bg-white p-3 rounded-lg shadow-sm ${!count && 'opacity-0'}`}
    >
      <h4 className="font-medium text-blue-800 mb-2">Test {testType}</h4>
      <p className="text-sm text-gray-600">
        Tests Run: {count.toLocaleString()}
      </p>
      <p className="text-sm text-gray-600">
        Detected Compromised: {detectedCompromised.toLocaleString()}
        <span className="text-gray-500 ml-1">({percentage}%)</span>
      </p>
    </div>
  )
}
