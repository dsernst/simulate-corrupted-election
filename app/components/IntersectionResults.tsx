import {
  TestRun,
  calculateLayeredStats,
  calculateConfusionMatrix,
} from '../utils/calculateIntersections'
import { getIndentFromKey } from '../utils/createIntersections'
import ConfusionMatrix from './ConfusionMatrix'
import { IntersectionResultsLabel } from './IntersectionResultsLabel'

interface IntersectionResultsProps {
  testRuns: TestRun[]
}

export function IntersectionResults({ testRuns }: IntersectionResultsProps) {
  if (!ranAtLeastTwoTypes(testRuns)) return null

  const layeredStats = calculateLayeredStats(testRuns)

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

  // console.log(layeredStats)

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Intersection Results
      </h3>
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full text-sm text-center">
          <thead>
            <tr className="bg-gray-100 font-semibold text-gray-700">
              <th className="px-4 py-2 text-left">Tested By</th>
              <th className="px-4 py-2">% Compromised</th>
              <th className="px-4 py-2"># Compromised</th>
              <th className="px-4 py-2"># Tested</th>
            </tr>
          </thead>
          <tbody>
            {layeredStats.map(
              ({ key, label, tested, compromises, percentages }) => {
                return (
                  <tr
                    key={label}
                    className={`${
                      !tested && 'opacity-20'
                    } border-t border-gray-200`}
                  >
                    <td
                      className="px-4 py-2 whitespace-nowrap text-left"
                      style={{
                        paddingLeft: `${Math.max(
                          getIndentFromKey(key) * 2,
                          0.5
                        )}em`,
                      }}
                    >
                      <IntersectionResultsLabel label={label} tested={tested} />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {percentages
                        .map((s) => (s !== undefined ? `${s}%` : null))
                        .filter(Boolean)
                        .join(' | ')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {compromises
                        .map((s) =>
                          s !== undefined ? s.toLocaleString() : null
                        )
                        .filter(Boolean)
                        .join(' | ')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {tested.toLocaleString()}
                    </td>
                  </tr>
                )
              }
            )}
          </tbody>
        </table>
      </div>

      {/* Confusion Matrices Section */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Pairwise Confusion Matrices
      </h3>
      <div className="flex flex-col items-center">
        {confusionMatrices.map(({ first, second, matrix }) => (
          <div
            className="overflow-x-auto max-w-full mb-8"
            key={`${first}-${second}`}
          >
            <ConfusionMatrix first={first} second={second} matrix={matrix} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** At least two different types of tests need to have run, to show results */
function ranAtLeastTwoTypes(testRuns: TestRun[]) {
  let sawA = false
  let sawB = false
  let sawC = false
  for (const r of testRuns) {
    if (r.results.testBreakdown.testA.count > 0) sawA = true
    if (r.results.testBreakdown.testB.count > 0) sawB = true
    if (r.results.testBreakdown.testC.count > 0) sawC = true
  }
  const typesSeen = [sawA, sawB, sawC].filter(Boolean).length
  return typesSeen >= 2
}
