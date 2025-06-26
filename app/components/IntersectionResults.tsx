import { useSimulator } from '../useSimulator'
import { TestRun } from '../utils/calculateIntersections'
import { getIndentFromKey } from '../utils/createIntersections'
import ConfusionMatrix from './ConfusionMatrix'
import { IntersectionResultsLabel } from './IntersectionResultsLabel'

export function IntersectionResults() {
  const { simulator, testRuns } = useSimulator()
  const ran = ranAtLeastOneTestOf(testRuns)
  if (!ranAtLeastTwoTypes(ran)) return null

  console.time('getIntersections')
  const layeredStats = simulator.getIntersections()
  console.timeEnd('getIntersections')

  // Confusion matrices for all pairs
  console.time('calculateConfusionMatrix')
  const confusionMatrices = simulator.getConfusionMatrices()
  console.timeEnd('calculateConfusionMatrix')

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
            {layeredStats.map(({ compromises, key, percentages, tested }) => {
              // Hide intersection rows for tests that were never run
              for (const [ranKey, value] of Object.entries(ran)) {
                if (!value && key.includes(ranKey)) return null
              }

              return (
                <tr
                  className={`${
                    !tested && 'opacity-20'
                  } border-t border-gray-200`}
                  key={key}
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
                    <IntersectionResultsLabel label={key} tested={tested} />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {percentages
                      .map((s) => (s !== undefined ? `${s}%` : null))
                      .filter(Boolean)
                      .join(' | ')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {compromises
                      .map((s) => (s !== undefined ? s.toLocaleString() : null))
                      .filter(Boolean)
                      .join(' | ')}
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

      {/* Confusion Matrices Section */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Pairwise Confusion Matrices
      </h3>
      <div className="flex flex-col items-center">
        {confusionMatrices.map(({ first, matrix, second }) => (
          <div
            className="overflow-x-auto max-w-full mb-8"
            key={`${first}-${second}`}
          >
            <ConfusionMatrix first={first} matrix={matrix} second={second} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Check whether there's been at least 1 probe of each type */
function ranAtLeastOneTestOf(testRuns: TestRun[]) {
  return {
    A: testRuns.some((r) => r.results.testBreakdown.testA.count > 0),
    B: testRuns.some((r) => r.results.testBreakdown.testB.count > 0),
    C: testRuns.some((r) => r.results.testBreakdown.testC.count > 0),
  }
}

/** Given a boolean map of which tests have been run, check whether at least two are true */
function ranAtLeastTwoTypes(ran: ReturnType<typeof ranAtLeastOneTestOf>) {
  return Object.values(ran).filter(Boolean).length >= 2
}
