import { useEffect, useState } from 'react'
import { IoChevronDown, IoChevronUp, IoDiceOutline } from 'react-icons/io5'

import { useSimulator } from '../useSimulator'
import { Button } from './Button'

export const RevealStartOverLine = () => {
  const { simulator, startOver } = useSimulator()
  const { election, seed } = simulator

  const [inputSeed, setInputSeed] = useState(seed)
  const [seedInputShown, setSeedInputShown] = useState(false)
  const [compromisedShown, setCompromisedShown] = useState(false)

  // Sync inputSeed with seed prop when menu opens or seed changes
  useEffect(() => {
    if (seedInputShown) setInputSeed(seed)
  }, [seedInputShown, seed])

  const startOverWithSeed = () => {
    startOver(inputSeed)
    setSeedInputShown(false)
  }

  return (
    <div className="space-y-2">
      <div className="h-20 flex justify-between items-center">
        {!compromisedShown ? (
          <Button
            className="text-sm flex-1 mr-2"
            onClick={() => setCompromisedShown(!compromisedShown)}
            variant="outline"
          >
            👀 Reveal Compromised Votes
          </Button>
        ) : (
          <div className="p-4 bg-red-50 rounded-lg flex-1 mr-2">
            <p className="text-lg text-red-700">
              Compromised Votes: {election.compromisedVotes.toLocaleString()}
              <span className="text-red-600 ml-2">
                ({election.compromisedPercentage.toFixed(2)}% of total)
              </span>
            </p>
          </div>
        )}
        <div className="flex items-center relative">
          <Button
            className="text-sm py-2 !px-3.5 rounded-r-none"
            onClick={() => {
              startOver()
              setCompromisedShown(false)
            }}
            variant="outline"
          >
            ♻️ Start Over
          </Button>
          <Button
            aria-label={seedInputShown ? 'Hide seed input' : 'Show seed input'}
            className="!py-3.5 !px-1 !ml-0 rounded-l-none relative right-0.5"
            onClick={() => setSeedInputShown(!seedInputShown)}
            variant="outline"
          >
            {seedInputShown ? (
              <IoChevronUp size={16} />
            ) : (
              <IoChevronDown size={16} />
            )}
          </Button>

          {/* Seed input */}
          {seedInputShown && (
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
                onKeyDown={(e) => e.key === 'Enter' && startOverWithSeed()}
                placeholder="Enter seed"
                type="number"
                value={inputSeed}
              />
              <Button
                className="!px-3 !py-2 text-xs whitespace-nowrap"
                onClick={startOverWithSeed}
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
