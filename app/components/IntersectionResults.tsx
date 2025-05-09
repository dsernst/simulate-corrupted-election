import { IntersectionCounts, TestResult } from '../utils/calculateIntersections'

interface IntersectionResultsProps {
  intersections: IntersectionCounts
}

function formatIntersectionResults(
  intersections: IntersectionCounts
): TestResult[] {
  return Object.entries(intersections)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      label: key.replaceAll(' ∩ ', ' & ').replace(' only', ''),
      value,
      description: key.includes('only')
        ? `Detected only by Test ${key[0]}`
        : `Detected by both Test ${key[0]} and Test ${key[4]}${
            key.includes('∩ C') ? ' and Test C' : ''
          }`,
    }))
}

export function IntersectionResults({
  intersections,
}: IntersectionResultsProps) {
  const results = formatIntersectionResults(intersections)
  if (results.length === 0) return null

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Final Results: Votes Detected as Compromised by Multiple Tests
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {results.map(({ label, value, description }) => (
          <div key={label} className="bg-gray-50 p-4 rounded-lg">
            <p className="text-lg font-medium text-gray-800">{label}</p>
            <p className="text-base text-gray-600">
              {value.toLocaleString()} votes
            </p>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
