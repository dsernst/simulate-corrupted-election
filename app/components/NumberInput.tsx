interface NumberInputProps {
  autoFocus?: boolean
  id: string
  label: string
  onChange: (value: string) => void
  onEnterKey?: () => void
  value: string
}

export function NumberInput({
  autoFocus,
  id,
  label,
  onChange,
  onEnterKey,
  value,
}: NumberInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-lg font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        autoFocus={autoFocus}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        id={id}
        inputMode="numeric"
        onChange={(e) => onChange(parseNumberInput(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnterKey) {
            e.preventDefault()
            onEnterKey()
          }
        }}
        pattern="[0-9,kmKM]*"
        placeholder="Enter count"
        type="text"
        value={formatNumberWithCommas(value)}
      />
    </div>
  )
}

function formatNumberWithCommas(value: string): string {
  if (!value) return ''
  return parseInt(value).toLocaleString()
}

function parseNumberInput(input: string): string {
  // Remove any whitespace
  input = input.trim()

  // Handle empty input
  if (!input) return ''

  // Handle k/m suffixes (case insensitive)
  const suffixMatch = input.match(/^([\d,]+)([km])$/i)
  if (suffixMatch) {
    const [, number, suffix] = suffixMatch
    const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000
    const baseNumber = parseInt(number.replace(/,/g, ''))
    return (baseNumber * multiplier).toString()
  }

  // Handle comma-separated numbers
  if (input.includes(',')) {
    return input.replace(/,/g, '')
  }

  // Handle regular numbers
  return input
}
