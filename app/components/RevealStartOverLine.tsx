import { Button } from './Button'
import { SimulationResults } from '../utils/simulation'
import { IoChevronDown, IoChevronUp, IoDiceOutline } from 'react-icons/io5'

export const RevealStartOverLine = ({
  showCompromised,
  onToggleCompromised,
  onStartOver,
  results,
  seed,
  showSeedInput,
  onToggleSeedInput,
  onSeedChange,
}: {
  showCompromised: boolean
  onToggleCompromised: () => void
  onStartOver: (newSeed?: number) => void
  results: SimulationResults
  seed: number
  showSeedInput: boolean
  onToggleSeedInput: () => void
  onSeedChange: (newSeed: number) => void
}) => {
  const handleSeedSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('seed') as HTMLInputElement
    const newSeed = parseInt(input.value, 10)
    if (!isNaN(newSeed)) {
      onSeedChange(newSeed)
    }
  }

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
        <div className="flex items-center gap-2 relative">
          <Button
            onClick={() => onStartOver()}
            variant="outline"
            className="text-sm py-2 px-4"
          >
            ♻️ Start Over
          </Button>
          <button
            onClick={onToggleSeedInput}
            className="p-1 hover:bg-gray-100 rounded cursor-pointer"
            aria-label={showSeedInput ? 'Hide seed input' : 'Show seed input'}
          >
            {showSeedInput ? (
              <IoChevronUp size={20} />
            ) : (
              <IoChevronDown size={20} />
            )}
          </button>
          {showSeedInput && (
            <form
              onSubmit={handleSeedSubmit}
              className="absolute right-3 top-12 bg-white border border-gray-200 rounded shadow-md flex gap-2 items-center px-3 py-2 z-10"
              style={{ minWidth: 0 }}
            >
              <IoDiceOutline
                size={18}
                className="absolute left-5 text-purple-500"
              />

              <input
                type="number"
                name="seed"
                defaultValue={seed}
                className="pl-8 px-3 py-2 border border-gray-400 rounded text-sm w-32"
                placeholder="Enter seed"
              />
              <Button
                onClick={() => onStartOver(seed)}
                variant="outline"
                className="!px-3 !py-2 text-xs whitespace-nowrap"
              >
                ♻️ Start Over w/ Seed
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
