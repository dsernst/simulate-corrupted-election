export function Button({
  onClick,
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled = false,
}: {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'outline'
  fullWidth?: boolean
  className?: string
  disabled?: boolean
}) {
  const baseClasses =
    'px-6 py-3 rounded-lg transition-colors text-lg font-semibold'
  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline:
      'bg-white text-purple-800 border-2 border-purple-600 hover:bg-purple-50',
  }
  const widthClass = fullWidth ? 'w-full' : ''
  const disabledClass = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer'

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
