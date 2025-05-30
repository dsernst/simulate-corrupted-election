export function Button({
  children,
  className = '',
  disabled = false,
  fullWidth = false,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  fullWidth?: boolean
  onClick: () => void
  variant?: 'outline' | 'primary' | 'success'
}) {
  const baseClasses =
    'px-6 py-3 rounded-lg transition-colors text-lg font-semibold'
  const variantClasses = {
    outline:
      'bg-white text-purple-800 border-2 border-purple-600 hover:bg-purple-50',
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  }
  const widthClass = fullWidth ? 'w-full' : ''
  const disabledClass = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer'

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
