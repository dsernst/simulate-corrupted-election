const testColors = {
  A: 'bg-yellow-200/70',
  B: 'bg-blue-200/65',
  C: 'bg-purple-200/60',
}

const ConfusionMatrix = ({
  first,
  matrix,
  second,
}: {
  first: keyof typeof testColors
  matrix: {
    clean_clean: number
    clean_compromised: number
    compromised_clean: number
    compromised_compromised: number
    total: number
  }
  second: keyof typeof testColors
}) => {
  const grandTotal =
    matrix.clean_clean +
    matrix.clean_compromised +
    matrix.compromised_clean +
    matrix.compromised_compromised

  if (grandTotal === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 flex items-center mx-auto">
        <p>
          {first} vs {second}
          <span className="opacity-30">: No data</span>
        </p>
      </div>
    )
  }

  const topRightColor = testColors[second]
  const bottomLeftColor = testColors[first]

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center text-gray-800">
      {/* Rotated left-side label outside the table */}
      <div
        className={`${bottomLeftColor} text-base mr-2 border border-gray-400/70 relative top-[73px] left-2 h-[153px] text-center rotate-180 font-bold`}
        style={{ letterSpacing: '0.05em', writingMode: 'vertical-rl' }}
      >
        Test {first}
      </div>

      <div>
        {/* A vs B (n = 1000) label */}
        <div className="font-bold text-lg mb-2 text-center">
          {first} vs {second}{' '}
          <span className="text-xs text-gray-500">
            (n = {grandTotal.toLocaleString()})
          </span>
        </div>

        {/* Main table */}
        <table className="min-w-[16em] text-base text-center overflow-hidden border-separate border-spacing-0">
          {/* Header rows */}
          <thead>
            <tr>
              <th />
              <th
                className={`border border-gray-400/65 py-1 ${topRightColor}`}
                colSpan={2}
              >
                Test {second}
              </th>
            </tr>
            <tr>
              <th className="bg-gray-300/80 border border-gray-400/70">
                Total
                <div className="text-xs text-gray-600 font-normal mt-0.5">
                  {grandTotal.toLocaleString()}
                </div>
              </th>
              <th className={`border border-gray-300 px-6 ${topRightColor}`}>
                Clean
                <div className="text-xs text-gray-600 font-normal mt-0.5">
                  {(
                    matrix.clean_clean + matrix.compromised_clean
                  ).toLocaleString()}
                </div>
              </th>
              <th
                className={`border border-gray-300 px-6 py-4 ${topRightColor}`}
              >
                Compromised
                <div className="text-xs text-gray-600 font-normal mt-0.5">
                  {(
                    matrix.clean_compromised + matrix.compromised_compromised
                  ).toLocaleString()}
                </div>
              </th>
            </tr>
          </thead>

          {/* Content rows */}
          <tbody className="font-semibold text-black/80">
            {/* 2nd from bottom row */}
            <tr>
              <th
                className={`${bottomLeftColor} font-extrabold border border-gray-300 py-4`}
              >
                Clean
                <div className="text-xs text-gray-600 font-normal mt-0.5">
                  {(
                    matrix.clean_clean + matrix.clean_compromised
                  ).toLocaleString()}
                </div>
              </th>
              <td className="bg-green-50 border border-gray-300 px-4 py-3">
                {matrix.clean_clean.toLocaleString()}
              </td>
              <td className="bg-red-50 border border-gray-300 px-4 py-3">
                {matrix.clean_compromised.toLocaleString()}
              </td>
            </tr>

            {/* Bottom row */}
            <tr>
              <th
                className={`${bottomLeftColor} font-extrabold border border-gray-300 px-6 py-4`}
              >
                Compromised
                <div className="text-xs text-gray-600 font-normal mt-0.5">
                  {(
                    matrix.compromised_clean + matrix.compromised_compromised
                  ).toLocaleString()}
                </div>
              </th>
              <td className="bg-red-50 border border-gray-300">
                {matrix.compromised_clean.toLocaleString()}
              </td>
              <td className="bg-green-50 border border-gray-300">
                {matrix.compromised_compromised.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ConfusionMatrix
