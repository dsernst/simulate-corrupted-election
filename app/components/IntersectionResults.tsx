import {
  TestRun,
  calculateIntersectionStats,
  calculateLayeredStats,
} from '../utils/calculateIntersections'
import { calculatePercentage } from '../utils/simulation'

interface IntersectionResultsProps {
  testRuns: TestRun[]
}

export function IntersectionResults({ testRuns }: IntersectionResultsProps) {
  const layeredStats = calculateLayeredStats(testRuns)
  const results = calculateIntersectionStats(testRuns)
  if (results.every((r) => r.detected === 0)) return null

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Multi-Layered RLA Results
      </h3>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr className="bg-gray-100 font-semibold text-gray-700">
              <th className="px-4 py-2 text-left">Group</th>
              <th className="px-4 py-2">% Compromised</th>
              <th className="px-4 py-2"># Compromised</th>
              <th className="px-4 py-2"># Tested</th>
            </tr>
          </thead>
          <tbody>
            {layeredStats.map(
              ({
                label,
                tested,
                compromised,
                percentCompromised,
                indentLevel,
              }) => (
                <tr
                  key={label}
                  className={`${
                    tested === 0 && 'opacity-30'
                  } border-t border-gray-200`}
                >
                  <td
                    className="px-4 py-2 whitespace-nowrap text-left"
                    style={{
                      paddingLeft: `${indentLevel ? indentLevel * 2 : 0}em`,
                    }}
                  >
                    {label}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {percentCompromised}%
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {compromised.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {tested.toLocaleString()}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Intersection Results
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr className="bg-gray-100 font-semibold text-gray-700">
              <th className="px-4 py-2">Tested by</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Compromises Detected</th>
              <th className="px-4 py-2"># Tested</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ label, detected, tested }) => {
              const percent = calculatePercentage(detected, tested)
              return (
                <tr
                  key={label}
                  className={`${
                    tested === 0 && 'opacity-30'
                  } border-t border-gray-200`}
                >
                  <td className="px-4 py-2 whitespace-nowrap">{label}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{percent}%</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {detected.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {tested.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
