interface NumberInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
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

export function NumberInput({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter quantity',
}: NumberInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lg font-medium">
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(parseNumberInput(e.target.value))}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder={placeholder}
        pattern="[0-9,kmKM]*"
        inputMode="numeric"
      />
    </div>
  )
}
