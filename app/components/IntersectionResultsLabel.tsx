import React from 'react'
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
  const parts: { text: string; faded: boolean }[] = []
  let match

  // Split the label into faded and normal parts
  while ((match = fadedRegex.exec(displayLabel)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: displayLabel.slice(lastIndex, match.index),
        faded: false,
      })
    }
    parts.push({ text: match[0], faded: true })
    lastIndex = fadedRegex.lastIndex
  }

  // Add any remaining normal part at the end
  if (lastIndex < displayLabel.length) {
    parts.push({ text: displayLabel.slice(lastIndex), faded: false })
  }

  // Render each part, fading as appropriate
  return (
    <>
      {parts.map((part, i) => (
        <span key={i} className={(part.faded && tested && `opacity-20`) || ''}>
          {part.text}
        </span>
      ))}
    </>
  )
}
