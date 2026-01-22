import type { ReactNode } from 'react';

/**
 * Typography component for consistent text styling.
 *
 * Semantic variants provide design system consistency.
 * Each variant maps to appropriate HTML elements and Tailwind classes.
 */

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption';

type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'error'
  | 'success';

interface TypographyProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<TypographyVariant, string> = {
  h1: 'text-3xl font-bold leading-tight',
  h2: 'text-2xl font-semibold leading-snug',
  h3: 'text-lg font-semibold leading-normal',
  body: 'text-base font-normal leading-normal',
  bodySmall: 'text-sm font-normal leading-normal',
  label: 'text-sm font-medium leading-snug',
  caption: 'text-xs font-normal leading-snug',
};

const colorClasses: Record<TypographyColor, string> = {
  primary: 'text-gray-900',
  secondary: 'text-gray-600',
  tertiary: 'text-gray-400',
  inverse: 'text-white',
  error: 'text-red-500',
  success: 'text-green-600',
};

export function Typography({
  variant = 'body',
  color = 'primary',
  className = '',
  children,
}: TypographyProps) {
  const classes = `${variantClasses[variant]} ${colorClasses[color]} ${className}`;

  // Map variants to appropriate HTML elements
  switch (variant) {
    case 'h1':
      return <h1 className={classes}>{children}</h1>;
    case 'h2':
      return <h2 className={classes}>{children}</h2>;
    case 'h3':
      return <h3 className={classes}>{children}</h3>;
    case 'body':
    case 'bodySmall':
      return <p className={classes}>{children}</p>;
    case 'label':
    case 'caption':
      return <span className={classes}>{children}</span>;
  }
}
