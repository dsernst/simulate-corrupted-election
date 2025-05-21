import { toDisplayLabelFromKey } from '../utils/calculateIntersections'

/**
 * IntersectionResultsLabel
 * Displays a label like "A & not B" with the "& not B" part faded.
 * Used for the "Tested By" column in intersection results tables.
 */
export const IntersectionResultsLabel = ({
  label,
  tested,
}: {
  label: string
  tested: number
}) => {
  // Convert canonical key (e.g. 'A!B') to display label (e.g. 'A & not B')
  const displayLabel = toDisplayLabelFromKey(label)

  // Regex matches any segment like ' & not X' or 'not X' for fading
  const fadedRegex = /(?: ?&)? ?not [A-Z]/g
  let lastIndex = 0
  const parts: { faded: boolean; text: string; }[] = []
  let match

  // Split the label into faded and normal parts
  while ((match = fadedRegex.exec(displayLabel)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        faded: false,
        text: displayLabel.slice(lastIndex, match.index),
      })
    }
    parts.push({ faded: true, text: match[0] })
    lastIndex = fadedRegex.lastIndex
  }

  // Add any remaining normal part at the end
  if (lastIndex < displayLabel.length) {
    parts.push({ faded: false, text: displayLabel.slice(lastIndex) })
  }

  // Render each part, fading as appropriate
  return (
    <>
      {parts.map((part, i) => (
        <span
          className={(part.faded && tested && `text-pink-700/30`) || ''}
          key={i}
        >
          {part.text}
        </span>
      ))}
    </>
  )
}
