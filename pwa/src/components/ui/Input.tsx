import { useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Typography } from './Typography';

/**
 * Input component for forms.
 *
 * Features:
 * - Label and helper text
 * - Error state with message
 * - Password visibility toggle
 * - Focus state styling
 * - Left/right icon support
 */

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  type,
  containerClassName = '',
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = type === 'password';
  const actualType = type === 'password' && isPasswordVisible ? 'text' : type;

  return (
    <div className={containerClassName}>
      {label && (
        <Typography variant="label" color="secondary" className="mb-1">
          {label}
        </Typography>
      )}

      <div
        className={`
          flex items-center
          rounded-xl border
          min-h-[48px]
          transition-colors duration-150
          ${isFocused
            ? 'border-primary-light bg-card dark:bg-gray-800 dark:border-primary-light'
            : 'border-themed bg-tertiary dark:bg-gray-900'
          }
          ${error ? 'border-red-500 dark:border-red-400' : ''}
        `}
      >
        {leftIcon && (
          <div className="pl-3">
            {leftIcon}
          </div>
        )}

        <input
          type={actualType}
          className={`
            flex-1 px-3 py-3 bg-transparent
            text-base text-themed placeholder-gray-400 dark:placeholder-gray-500
            outline-none
            ${leftIcon ? 'pl-1' : ''}
            ${rightIcon || showPasswordToggle ? 'pr-1' : ''}
          `}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            className="pr-3 text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        )}

        {rightIcon && !showPasswordToggle && (
          <div className="pr-3">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <Typography variant="caption" color="error" className="mt-1">
          {error}
        </Typography>
      )}

      {helperText && !error && (
        <Typography variant="caption" color="tertiary" className="mt-1">
          {helperText}
        </Typography>
      )}
    </div>
  );
}
