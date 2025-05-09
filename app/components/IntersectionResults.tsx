import {
  TestRun,
  calculateIntersectionStats,
  calculateLayeredStats,
  calculateConfusionMatrix,
} from '../utils/calculateIntersections'
import { calculatePercentage } from '../utils/simulation'

interface IntersectionResultsProps {
  testRuns: TestRun[]
}

export function IntersectionResults({ testRuns }: IntersectionResultsProps) {
  const layeredStats = calculateLayeredStats(testRuns)
  const results = calculateIntersectionStats(testRuns)
  // Confusion matrices for all pairs
  const pairs = [
    { first: 'A', second: 'B' },
    { first: 'A', second: 'C' },
    { first: 'B', second: 'C' },
  ] as const
  const confusionMatrices = pairs.map(({ first, second }) => ({
    first,
    second,
    matrix: calculateConfusionMatrix(testRuns, first, second),
  }))
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
      {/* Confusion Matrices Section */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Pairwise Confusion Matrices
      </h3>
      <div className="grid grid-cols-1 gap-8 mb-8">
        {confusionMatrices.map(({ first, second, matrix }) => {
          const rowTotal1 = matrix.clean_clean + matrix.clean_compromised
          const rowTotal2 =
            matrix.compromised_clean + matrix.compromised_compromised
          const colTotal1 = matrix.clean_clean + matrix.compromised_clean
          const colTotal2 =
            matrix.clean_compromised + matrix.compromised_compromised
          const grandTotal = rowTotal1 + rowTotal2
          return (
            <div
              key={`${first}-${second}`}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="font-semibold mb-2 text-center">
                {first} vs {second}{' '}
                <span className="text-xs text-gray-500">
                  (n={matrix.total})
                </span>
              </div>
              <table className="min-w-full text-xs text-center rounded-lg overflow-hidden border border-gray-200">
                <thead>
                  <tr>
                    <th className="border-b border-gray-200"></th>
                    <th className="px-3 py-2 border-b border-gray-200 font-semibold text-gray-700 text-center">
                      {second}: Clean
                    </th>
                    <th className="px-3 py-2 border-b border-gray-200 font-semibold text-gray-700 text-center">
                      {second}: Compromised
                    </th>
                    <th className="px-3 py-2 border-b border-gray-200 font-semibold text-gray-700 text-center">
                      Row Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th className="text-right font-semibold text-gray-700 px-3 py-2 border-r border-gray-200 align-middle">
                      {first}: Clean
                    </th>
                    <td className="px-3 py-2 bg-green-100 border border-gray-200 text-center align-middle">
                      {matrix.clean_clean}
                    </td>
                    <td className="px-3 py-2 bg-red-100 border border-gray-200 text-center align-middle">
                      {matrix.clean_compromised}
                    </td>
                    <td className="px-3 py-2 font-bold border border-gray-200 text-center align-middle">
                      {rowTotal1}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-right font-semibold text-gray-700 px-3 py-2 border-r border-gray-200 align-middle">
                      {first}: Compromised
                    </th>
                    <td className="px-3 py-2 bg-red-100 border border-gray-200 text-center align-middle">
                      {matrix.compromised_clean}
                    </td>
                    <td className="px-3 py-2 bg-green-100 border border-gray-200 text-center align-middle">
                      {matrix.compromised_compromised}
                    </td>
                    <td className="px-3 py-2 font-bold border border-gray-200 text-center align-middle">
                      {rowTotal2}
                    </td>
                  </tr>
                  <tr>
                    <th className="text-right font-semibold text-gray-700 px-3 py-2 border-r border-gray-200 align-middle">
                      Col Total
                    </th>
                    <td className="px-3 py-2 font-bold border border-gray-200 text-center align-middle">
                      {colTotal1}
                    </td>
                    <td className="px-3 py-2 font-bold border border-gray-200 text-center align-middle">
                      {colTotal2}
                    </td>
                    <td className="px-3 py-2 font-bold border border-gray-200 text-center align-middle">
                      {grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}
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
