/**
 * xPOS Design System - Color Palette
 *
 * Simplified color system to reduce visual noise and improve UX.
 * Reduced from 8+ colors to 4 semantic variants + neutral.
 */

export interface ColorConfig {
  gradient: string;
  solid: string;
  light: string;
  border: string;
  text: string;
  hover: string;
  ring?: string;
}

export const COLORS = {
  /**
   * PRIMARY - Main brand color for actions and navigation
   * Use for: Primary buttons, active navigation, main CTAs
   */
  primary: {
    gradient: 'from-blue-600 to-blue-700',
    solid: 'bg-blue-600',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    hover: 'hover:bg-blue-700',
    ring: 'ring-blue-500',
  },

  /**
   * SUCCESS - Positive actions and completed states
   * Use for: Completed tasks, profit, revenue, positive trends
   */
  success: {
    gradient: 'from-green-500 to-green-600',
    solid: 'bg-green-600',
    light: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-600',
    hover: 'hover:bg-green-700',
    ring: 'ring-green-500',
  },

  /**
   * DANGER - Critical alerts and destructive actions
   * Use for: Errors, critical alerts, out of stock, negative stock
   */
  danger: {
    gradient: 'from-red-500 to-red-600',
    solid: 'bg-red-600',
    light: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    hover: 'hover:bg-red-700',
    ring: 'ring-red-500',
  },

  /**
   * WARNING - Attention needed, caution states
   * Use for: Low stock, pending actions, expenses, warnings
   */
  warning: {
    gradient: 'from-yellow-500 to-yellow-600',
    solid: 'bg-yellow-600',
    light: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-600',
    hover: 'hover:bg-yellow-700',
    ring: 'ring-yellow-500',
  },

  /**
   * NEUTRAL - Default states and backgrounds
   * Use for: Cards, hover states, borders, disabled states
   */
  neutral: {
    card: 'bg-white',
    cardHover: 'hover:bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    textMuted: 'text-gray-500',
    textDark: 'text-gray-900',
    bg: 'bg-gray-100',
    bgDark: 'bg-gray-50',
  },
} as const;

/**
 * Color variant types for type-safe component props
 */
export type ColorVariant = 'primary' | 'success' | 'danger' | 'warning';

/**
 * Legacy color mapping for migration
 * Maps old 8-color system to new 4-color semantic system
 */
export const LEGACY_COLOR_MAP: Record<string, ColorVariant> = {
  // Primary group (blue, indigo, teal, purple → primary)
  blue: 'primary',
  indigo: 'primary',
  teal: 'primary',
  purple: 'primary',

  // Success group (green → success)
  green: 'success',

  // Danger group (red → danger)
  red: 'danger',

  // Warning group (yellow, orange → warning)
  yellow: 'warning',
  orange: 'warning',
};

/**
 * Get color config by variant
 */
export function getColorConfig(variant: ColorVariant): ColorConfig {
  return COLORS[variant];
}

/**
 * Migrate legacy color name to new variant
 */
export function migrateLegacyColor(oldColor: string): ColorVariant {
  return LEGACY_COLOR_MAP[oldColor] || 'primary';
}

/**
 * Get gradient classes for background
 */
export function getGradientClasses(variant: ColorVariant): string {
  return `bg-gradient-to-br ${COLORS[variant].gradient}`;
}

/**
 * Get text color classes
 */
export function getTextClasses(variant: ColorVariant): string {
  return COLORS[variant].text;
}

/**
 * Get background color classes
 */
export function getBgClasses(variant: ColorVariant): string {
  return COLORS[variant].solid;
}

/**
 * Get light background color classes
 */
export function getLightBgClasses(variant: ColorVariant): string {
  return COLORS[variant].light;
}

/**
 * Get border color classes
 */
export function getBorderClasses(variant: ColorVariant): string {
  return COLORS[variant].border;
}
