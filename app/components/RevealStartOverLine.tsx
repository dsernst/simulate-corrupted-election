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
    setCompromisedShown(false)
  }

  return (
    <div className="space-y-2">
      <div className="h-30 flex justify-between items-center">
        {!compromisedShown ? (
          // Button to reveal compromised votes
          <Button
            className="text-sm flex-1 mr-2"
            onClick={() => setCompromisedShown(!compromisedShown)}
            variant="outline"
          >
            👀 Reveal Compromised Votes
          </Button>
        ) : (
          // Revealed Compromised Votes
          <div className="p-3 bg-red-50 rounded-lg flex-1 mr-2 sm:text-lg text-sm text-red-700 gap-2 flex sm:flex-row flex-col justify-center text-center">
            Compromised Votes: {election.compromisedVotes.toLocaleString()}
            <span className="text-red-600">
              ({election.compromisedPercentage.toFixed(2)}% of total)
            </span>
          </div>
        )}

        {/* Start Over w/ Dropdown*/}
        <div className="flex items-center relative">
          <Button
            className="text-sm min-[413px]:!py-3 !py-8 !px-3.5 rounded-r-none"
            onClick={() => {
              startOver()
              setCompromisedShown(false)
            }}
            variant="outline"
          >
            ♻️ Start Over
          </Button>

          {/* Dropdown */}
          <Button
            aria-label={seedInputShown ? 'Hide seed input' : 'Show seed input'}
            className="min-[413px]:!py-3.5 !py-8.5 !px-1 !ml-0 rounded-l-none relative right-0.5"
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
              className="absolute -right-3 min-[413px]:top-12 top-23 bg-white border border-gray-200 rounded shadow-md flex gap-2 items-center px-3 py-2 z-10"
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
