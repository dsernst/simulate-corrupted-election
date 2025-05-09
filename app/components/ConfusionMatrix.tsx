import React from 'react'

interface ConfusionMatrixProps {
  first: string
  second: string
  matrix: {
    clean_clean: number
    clean_compromised: number
    compromised_clean: number
    compromised_compromised: number
    total: number
  }
}

const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  first,
  second,
  matrix,
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

  const topRightColor = 'bg-blue-200/65'

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center mx-auto font-bold text-gray-800">
      {/* Vertical axis label outside the table */}
      <div
        className="text-base mr-2 border border-gray-400/70 relative top-[76px] left-2 h-29 text-center bg-yellow-100 rotate-180"
        style={{
          writingMode: 'vertical-rl',
          letterSpacing: '0.05em',
        }}
      >
        Test {first}
      </div>

      <div>
        <div className="font-extrabold text-lg mb-2 text-center">
          {first} vs {second}{' '}
          <span className="text-xs text-gray-500">(n={grandTotal})</span>
        </div>
        <table className="min-w-[16em] text-base text-center overflow-hidden border-separate border-spacing-0 font-extrabold">
          <thead>
            <tr>
              <th
                className="bg-gray-300/80 border border-gray-400/70 px-6 py-4"
                rowSpan={2}
                style={{ minWidth: '5em' }}
              >
                Total
                <div className="text-xs text-gray-600 font-normal mt-1">
                  {matrix.clean_clean + matrix.clean_compromised} +{' '}
                  {matrix.compromised_clean + matrix.compromised_compromised} ={' '}
                  {grandTotal}
                </div>
              </th>
              <th
                className={`border border-gray-400/65 px-6 py-4 ${topRightColor}`}
                colSpan={2}
              >
                Test {second}
              </th>
            </tr>
            <tr>
              <th
                className={` border border-gray-300 px-6 py-4 ${topRightColor}`}
              >
                Clean
              </th>
              <th
                className={` border border-gray-300 px-6 py-4 ${topRightColor}`}
              >
                Compromised
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="bg-yellow-200/70 font-extrabold border border-gray-300 px-6 py-4">
                Clean
              </th>
              <td
                className="bg-green-50 border border-gray-300 px-4 py-3"
                style={{ minWidth: '3em' }}
              >
                {matrix.clean_clean}
              </td>
              <td
                className="bg-red-50 border border-gray-300 px-4 py-3"
                style={{ minWidth: '3em' }}
              >
                {matrix.clean_compromised}
              </td>
            </tr>
            <tr>
              <th className="bg-yellow-200/70 font-extrabold border border-gray-300 px-6 py-4">
                Compromised
              </th>
              <td
                className="bg-red-50 border border-gray-300 px-4 py-3"
                style={{ minWidth: '3em' }}
              >
                {matrix.compromised_clean}
              </td>
              <td
                className="bg-green-50 border border-gray-300 font-bold px-4 py-3"
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
}

export default ConfusionMatrix
