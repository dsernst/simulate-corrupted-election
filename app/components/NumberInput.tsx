interface NumberInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
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
        type="number"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder={placeholder}
        min="0"
      />
    </div>
  )
}
