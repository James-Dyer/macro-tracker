import type { ButtonHTMLAttributes } from 'react';

/**
 * Button component with variants and states.
 *
 * Variants:
 * - primary: Filled green button for main actions
 * - secondary: Outlined button for secondary actions
 * - ghost: Text-only button for tertiary actions
 *
 * Features:
 * - Loading state with spinner
 * - Disabled state
 * - Full width option
 * - Multiple sizes
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white active:bg-primary-dark disabled:bg-gray-300',
  secondary: 'bg-transparent border-2 border-primary text-primary active:bg-primary/10 disabled:border-gray-300 disabled:text-gray-400',
  ghost: 'bg-transparent text-primary active:bg-primary/10 disabled:text-gray-400',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 min-h-[36px] text-sm',
  md: 'px-6 py-3 min-h-[48px] text-base',
  lg: 'px-8 py-4 min-h-[56px] text-base',
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        flex items-center justify-center
        rounded-xl font-semibold
        transition-colors duration-150
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Spinner color={variant === 'primary' ? 'white' : 'primary'} />
      ) : (
        <span className="font-semibold">{title}</span>
      )}
    </button>
  );
}

function Spinner({ color }: { color: 'white' | 'primary' }) {
  const colorClass = color === 'white' ? 'border-white' : 'border-primary';

  return (
    <div
      className={`
        w-5 h-5 border-2 border-t-transparent rounded-full
        animate-spin
        ${colorClass}
      `}
    />
  );
}
