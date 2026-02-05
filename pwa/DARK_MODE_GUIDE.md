# Dark Mode Implementation Guide

## Overview

MacroTracker now features a comprehensive dark mode theme system that matches the landing page's "Precision Tech" aesthetic. The dark theme is the default and provides a premium, modern experience with bold green accents and refined typography.

## Features

### Theme System
- **Default Mode**: Dark mode (matches landing page)
- **Theme Toggle**: Available in Settings page
- **Persistence**: Theme preference saved to localStorage
- **Smooth Transitions**: All elements transition smoothly between themes

### Design Aesthetic
- **Dark Backgrounds**: Gray-900 to Gray-950 range for depth
- **Bold Green Accents**: Primary-light (#22C55E) for CTAs and highlights
- **Subtle Grid Pattern**: Background texture in dark mode for atmosphere
- **High Contrast**: Optimized text colors for readability
- **Refined Shadows**: Adapted for dark backgrounds

## Architecture

### Core Files

1. **Theme Context** (`/src/contexts/ThemeContext.tsx`)
   - Manages theme state (light/dark)
   - Persists preference to localStorage
   - Applies theme class to document root
   - Exposes `useTheme()` hook

2. **CSS Variables** (`/src/index.css`)
   - Theme-aware CSS variables for colors, backgrounds, borders
   - Separate definitions for light and dark modes
   - Automatic switching based on `.dark` class

3. **Updated Components**
   - Card: Uses theme-aware backgrounds and borders
   - Button: Enhanced with dark mode shadows and colors
   - Input: Themed backgrounds and focus states
   - Typography: Color variants adapted for dark mode
   - BottomNav: Backdrop blur with themed colors

## Usage

### Using the Theme Hook

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### CSS Variables

Use these CSS variables in your components for automatic theme support:

**Backgrounds:**
- `var(--bg-primary)` - Main background
- `var(--bg-secondary)` - Secondary background (cards)
- `var(--bg-tertiary)` - Tertiary background (filled elements)
- `var(--bg-elevated)` - Elevated surfaces (modals, sheets)

**Text:**
- `var(--text-primary)` - Primary text
- `var(--text-secondary)` - Secondary text
- `var(--text-tertiary)` - Tertiary text
- `var(--text-inverse)` - Inverse text (buttons, badges)

**Borders:**
- `var(--border-primary)` - Main borders
- `var(--border-secondary)` - Secondary borders

**Accents:**
- `var(--accent-primary)` - Primary accent (green)
- `var(--accent-hover)` - Hover state

### Tailwind Utility Classes

**Custom utilities:**
- `bg-elevated` - Elevated surface background
- `bg-card` - Card background
- `bg-primary` - Primary background
- `bg-tertiary` - Tertiary background
- `border-themed` - Themed border color
- `text-themed` - Themed text color
- `text-themed-secondary` - Themed secondary text

**Dark mode variants:**
```tsx
// Standard Tailwind dark mode syntax
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">
    This adapts to theme
  </p>
</div>
```

## Component Examples

### Card with Theme Support
```tsx
<Card variant="elevated" padding="lg">
  <Typography variant="h3" className="mb-4">
    Title
  </Typography>
  <Typography variant="body" color="secondary">
    Content that adapts to theme
  </Typography>
</Card>
```

### Button with Theme Support
```tsx
<Button
  title="Primary Action"
  variant="primary"
  onClick={handleClick}
/>
```

### Input with Theme Support
```tsx
<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
/>
```

## Settings Page Integration

The theme toggle is located in Settings > Appearance:

- **Visual Toggle**: Animated switch with sun/moon icons
- **Status Indicator**: Shows current theme state
- **Instant Feedback**: Changes apply immediately

## Migration Guide

### Updating Existing Components

1. **Replace hardcoded colors with CSS variables:**
   ```tsx
   // Before
   className="bg-gray-50 text-gray-900"

   // After
   className="bg-primary text-themed"
   ```

2. **Use Tailwind dark variants for specific needs:**
   ```tsx
   // Before
   className="bg-white border-gray-200"

   // After
   className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
   ```

3. **Update Typography components:**
   ```tsx
   // Before
   <Typography variant="h1" className="text-gray-900">

   // After
   <Typography variant="h1">
   // Color handled automatically by variant
   ```

## Best Practices

1. **Use semantic CSS variables** for consistent theming
2. **Test both themes** during development
3. **Avoid hardcoded colors** - use theme variables or Tailwind dark variants
4. **Consider contrast ratios** for accessibility in both themes
5. **Use the theme hook** for conditional logic based on theme state

## Theme Transition Performance

All theme transitions use:
- **Duration**: 0.2-0.3s
- **Timing**: `cubic-bezier(0.16, 1, 0.3, 1)` for smooth easing
- **Properties**: `background-color`, `border-color`, `color`, `box-shadow`

## Browser Support

- Modern browsers with CSS custom properties support
- Fallback to light theme for older browsers
- localStorage for persistence (fallback to dark mode if unavailable)

## Future Enhancements

Potential additions to the theme system:
- Auto mode (follows system preference)
- Custom accent color selection
- High contrast mode
- Scheduled theme switching
