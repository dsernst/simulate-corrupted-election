import { useEffect, useState } from 'react'
import { IoChevronDown, IoChevronUp, IoDiceOutline } from 'react-icons/io5'

import { ElectionResults } from '../utils/engine'
import { Button } from './Button'

export const RevealStartOverLine = ({
  onStartOver,
  onToggleCompromised,
  onToggleSeedInput,
  results,
  seed,
  showCompromised,
  showSeedInput,
}: {
  onStartOver: (newSeed?: number) => void
  onToggleCompromised: () => void
  onToggleSeedInput: () => void
  results: ElectionResults
  seed: number
  showCompromised: boolean
  showSeedInput: boolean
}) => {
  const [inputSeed, setInputSeed] = useState(seed)

  // Sync inputSeed with seed prop when menu opens or seed changes
  useEffect(() => {
    if (showSeedInput) setInputSeed(seed)
  }, [showSeedInput, seed])

  return (
    <div className="space-y-2">
      <div className="h-20 flex justify-between items-center">
        {!showCompromised ? (
          <Button
            className="text-sm flex-1 mr-2"
            onClick={onToggleCompromised}
            variant="outline"
          >
            👀 Reveal Compromised Votes
          </Button>
        ) : (
          <div className="p-4 bg-red-50 rounded-lg flex-1 mr-2">
            <p className="text-lg text-red-700">
              Compromised Votes: {results.compromisedVotes.toLocaleString()}
              <span className="text-red-600 ml-2">
                ({results.compromisedPercentage.toFixed(1)}% of total)
              </span>
            </p>
          </div>
        )}
        <div className="flex items-center relative">
          <Button
            className="text-sm py-2 !px-3.5 rounded-r-none"
            onClick={() => onStartOver()}
            variant="outline"
          >
            ♻️ Start Over
          </Button>
          <Button
            aria-label={showSeedInput ? 'Hide seed input' : 'Show seed input'}
            className="!py-3.5 !px-1 !ml-0 rounded-l-none relative right-0.5"
            onClick={onToggleSeedInput}
            variant="outline"
          >
            {showSeedInput ? (
              <IoChevronUp size={16} />
            ) : (
              <IoChevronDown size={16} />
            )}
          </Button>

          {/* Seed input */}
          {showSeedInput && (
            <div
              className="absolute -right-3 top-12 bg-white border border-gray-200 rounded shadow-md flex gap-2 items-center px-3 py-2 z-10"
              style={{ minWidth: 0 }}
            >
              <IoDiceOutline
                className="absolute left-5 text-purple-500"
                size={18}
              />
              <input
                className="pl-8 px-3 py-2 border border-gray-400 rounded text-sm w-32"
                name="seed"
                onChange={(e) => setInputSeed(Number(e.target.value))}
                placeholder="Enter seed"
                type="number"
                value={inputSeed}
              />
              <Button
                className="!px-3 !py-2 text-xs whitespace-nowrap"
                onClick={() => onStartOver(inputSeed)}
                variant="outline"
              >
                ♻️ Start Over w/ Seed
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
