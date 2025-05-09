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
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center mx-auto">
      {/* Vertical axis label outside the table */}
      <div
        className="font-bold text-base text-gray-800 mr-2 flex-shrink-0 border border-gray-400 relative top-[76px] left-2 bg-yellow-100 px-2.5 rotate-180"
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
          <span className="text-xs text-gray-500">(n={grandTotal})</span>
        </div>
        <table className="min-w-[16em] text-xs text-center overflow-hidden border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                className="bg-gray-300 font-extrabold text-base text-gray-800 border border-gray-400 text-center px-6 py-4"
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
                className="bg-blue-200 font-extrabold text-base text-gray-800 border border-gray-400 text-center px-6 py-4"
                colSpan={2}
              >{`Test ${second} Said`}</th>
            </tr>
            <tr>
              <th className="bg-blue-200 font-extrabold text-base text-gray-800 border border-gray-400 text-center px-6 py-4">
                Clean
              </th>
              <th className="bg-blue-200 font-extrabold text-base text-gray-800 border border-gray-400 text-center px-6 py-4">
                Compromised
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="bg-yellow-200 font-extrabold text-base text-gray-800 border border-gray-400 text-center px-6 py-4">
                Clean
              </th>
              <td
                className="bg-green-50 border border-gray-400 text-center font-bold text-base px-4 py-3"
                style={{ minWidth: '3em' }}
              >
                {matrix.clean_clean}
              </td>
              <td
                className="bg-red-50 border border-gray-400 text-center font-bold text-base px-4 py-3"
                style={{ minWidth: '3em' }}
              >
                {matrix.clean_compromised}
              </td>
            </tr>
            <tr>
              <th className="bg-yellow-200 font-extrabold text-base text-gray-800 border border-gray-400 text-center px-6 py-4">
                Compromised
              </th>
              <td
                className="bg-red-50 border border-gray-400 text-center font-bold text-base px-4 py-3"
                style={{ minWidth: '3em' }}
              >
                {matrix.compromised_clean}
              </td>
              <td
                className="bg-green-50 border border-gray-400 text-center font-bold text-base px-4 py-3"
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
