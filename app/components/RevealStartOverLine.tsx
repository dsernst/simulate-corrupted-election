import { useEffect, useState } from 'react'
import { IoChevronDown, IoChevronUp, IoDiceOutline } from 'react-icons/io5'

import { ElectionResults } from '../utils/engine'
import { Button } from './Button'

export const RevealStartOverLine = ({
  showCompromised,
  onToggleCompromised,
  onStartOver,
  results,
  seed,
  showSeedInput,
  onToggleSeedInput,
}: {
  results: ElectionResults
  showCompromised: boolean
  onToggleCompromised: () => void
  onStartOver: (newSeed?: number) => void
  seed: number
  showSeedInput: boolean
  onToggleSeedInput: () => void
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
            onClick={onToggleCompromised}
            variant="outline"
            className="text-sm flex-1 mr-2"
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
            onClick={() => onStartOver()}
            variant="outline"
            className="text-sm py-2 !px-3.5 rounded-r-none"
          >
            ♻️ Start Over
          </Button>
          <Button
            onClick={onToggleSeedInput}
            variant="outline"
            className="!py-3.5 !px-1 !ml-0 rounded-l-none relative right-0.5"
            aria-label={showSeedInput ? 'Hide seed input' : 'Show seed input'}
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
                size={18}
                className="absolute left-5 text-purple-500"
              />
              <input
                type="number"
                name="seed"
                value={inputSeed}
                onChange={(e) => setInputSeed(Number(e.target.value))}
                className="pl-8 px-3 py-2 border border-gray-400 rounded text-sm w-32"
                placeholder="Enter seed"
              />
              <Button
                onClick={() => onStartOver(inputSeed)}
                variant="outline"
                className="!px-3 !py-2 text-xs whitespace-nowrap"
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
