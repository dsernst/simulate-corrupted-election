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
        Multi-Layered Audit Results
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
          const grandTotal =
            matrix.clean_clean +
            matrix.clean_compromised +
            matrix.compromised_clean +
            matrix.compromised_compromised
          return (
            <div
              key={`${first}-${second}`}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center"
            >
              {/* Vertical axis label outside the table */}
              <div
                className="font-bold text-base text-gray-800 mr-2 flex-shrink-0 border-2 border-gray-400 relative top-[78px] left-2 bg-yellow-100 px-2.5 rotate-180"
                style={{
                  writingMode: 'vertical-rl',
                  letterSpacing: '0.05em',
                }}
              >
                {`Test ${first} Said`}
              </div>
              <div className="flex-1">
                <div className="font-extrabold text-lg mb-2 text-center">
                  {first} vs {second}{' '}
                  <span className="text-xs text-gray-500">
                    (n={grandTotal})
                  </span>
                </div>
                <table
                  className="min-w-[16em] text-xs text-center rounded-lg rounded-bl-none overflow-hidden border-separate border-spacing-0"
                  style={{ borderCollapse: 'separate', borderSpacing: 0 }}
                >
                  <thead>
                    <tr>
                      <th
                        className="bg-gray-300 font-extrabold text-base text-gray-800 border-2 border-gray-400 text-center px-6 py-4"
                        rowSpan={2}
                        style={{ minWidth: '5em' }}
                      >
                        Total
                        <div className="text-xs text-gray-600 font-normal mt-1">
                          {matrix.clean_clean + matrix.clean_compromised} +{' '}
                          {matrix.compromised_clean +
                            matrix.compromised_compromised}{' '}
                          = {grandTotal}
                        </div>
                      </th>
                      <th
                        className="bg-blue-200 font-extrabold text-base text-gray-800 border-2 border-gray-400 text-center px-6 py-4"
                        colSpan={2}
                      >{`Test ${second} Said`}</th>
                    </tr>
                    <tr>
                      <th className="bg-blue-200 font-extrabold text-base text-gray-800 border-2 border-gray-400 text-center px-6 py-4">
                        Clean
                      </th>
                      <th className="bg-blue-200 font-extrabold text-base text-gray-800 border-2 border-gray-400 text-center px-6 py-4">
                        Compromised
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th className="bg-yellow-200 font-extrabold text-base text-gray-800 border-2 border-gray-400 text-center px-6 py-4">
                        Clean
                      </th>
                      <td
                        className="bg-green-50 border-2 border-gray-400 text-center font-bold text-base px-4 py-3"
                        style={{ minWidth: '3em' }}
                      >
                        {matrix.clean_clean}
                      </td>
                      <td
                        className="bg-red-50 border-2 border-gray-400 text-center font-bold text-base px-4 py-3"
                        style={{ minWidth: '3em' }}
                      >
                        {matrix.clean_compromised}
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-yellow-200 font-extrabold text-base text-gray-800 border-2 border-gray-400 text-center px-6 py-4">
                        Compromised
                      </th>
                      <td
                        className="bg-red-50 border-2 border-gray-400 text-center font-bold text-base px-4 py-3"
                        style={{ minWidth: '3em' }}
                      >
                        {matrix.compromised_clean}
                      </td>
                      <td
                        className="bg-green-50 border-2 border-gray-400 text-center font-bold text-base px-4 py-3"
                        style={{ minWidth: '3em' }}
                      >
                        {matrix.compromised_compromised}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
