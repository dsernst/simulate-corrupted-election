interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'success'
  fullWidth?: boolean
}

export function Button({
  onClick,
  children,
  variant = 'primary',
  fullWidth = false,
}: ButtonProps) {
  const baseClasses =
    'px-6 py-3 text-white rounded-lg transition-colors text-lg font-semibold cursor-pointer'
  const variantClasses = {
    primary: 'bg-purple-600 hover:bg-purple-700',
    success: 'bg-green-600 hover:bg-green-700',
  }
  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass}`}
    >
      {children}
    </button>
  )
}
