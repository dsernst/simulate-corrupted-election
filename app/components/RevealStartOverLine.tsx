import { Button } from './Button'
import { SimulationResults } from '../utils/simulation'

export const RevealStartOverLine = ({
  showCompromised,
  onToggleCompromised,
  onStartOver,
  results,
}: {
  showCompromised: boolean
  onToggleCompromised: () => void
  onStartOver: () => void
  results: SimulationResults
}) => {
  return (
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
      <Button
        onClick={onStartOver}
        variant="outline"
        className="text-sm py-2 px-4"
      >
        ♻️ Start Over
      </Button>
    </div>
  )
}
