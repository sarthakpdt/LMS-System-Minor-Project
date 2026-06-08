/**
 * Design System - Color Palette
 * Centralized color definitions for consistent theming.
 * 
 * These JS tokens mirror the CSS custom properties in design-system.css
 * for use in JS-based styling (Recharts, inline styles, etc.).
 */

export const colorPalette = {
  // Primary Colors - Brand identity
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Student Role Color - Blue
  student: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1e40af',
    gradient: 'from-blue-400 to-blue-600',
    gradientVibrant: 'from-blue-500 to-cyan-500',
  },

  // Teacher Role Color - Green
  teacher: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
    gradient: 'from-green-400 to-green-600',
    gradientVibrant: 'from-green-500 to-emerald-500',
  },

  // Admin Role Color - Purple
  admin: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    light: '#f3e8ff',
    main: '#a855f7',
    dark: '#6d28d9',
    gradient: 'from-purple-400 to-purple-600',
    gradientVibrant: 'from-purple-500 to-indigo-500',
  },

  // Semantic Colors
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#92400e',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#991b1b',
  },
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#1e40af',
  },

  // Neutral/Gray Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#0c1222',
  },

  // Gradients (Tailwind class format)
  gradients: {
    primary: 'from-blue-500 to-cyan-500',
    secondary: 'from-purple-500 to-pink-500',
    success: 'from-green-400 to-emerald-600',
    warning: 'from-amber-400 to-orange-600',
    error: 'from-red-400 to-rose-600',
    admin: 'from-purple-500 to-indigo-600',
    adminSubtle: 'from-purple-50 to-indigo-50',
    student: 'from-blue-500 to-cyan-600',
    studentSubtle: 'from-blue-50 to-cyan-50',
    teacher: 'from-green-500 to-emerald-600',
    teacherSubtle: 'from-green-50 to-emerald-50',
    dark: 'from-slate-800 to-slate-900',
    darkSubtle: 'from-slate-700 to-slate-800',
    ai: 'from-violet-500 to-fuchsia-500',
    aiSubtle: 'from-violet-50 to-fuchsia-50',
  },

  // Performance Levels
  performance: {
    bronze: { color: '#CD7F32', bg: '#fef3e2', gradient: 'from-amber-600 to-orange-700' },
    silver: { color: '#94a3b8', bg: '#f1f5f9', gradient: 'from-slate-400 to-slate-500' },
    gold: { color: '#eab308', bg: '#fef9c3', gradient: 'from-yellow-400 to-amber-500' },
    platinum: { color: '#818cf8', bg: '#eef2ff', gradient: 'from-indigo-400 to-violet-500' },
  },

  // Chart Colors — light mode
  charts: {
    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'],
    categorical: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'],
    sequential: ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
    diverging: ['#ef4444', '#f59e0b', '#22c55e'],
  },

  // Chart Colors — dark mode (brighter for visibility)
  chartsDark: {
    colors: ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#c084fc', '#22d3ee'],
    categorical: ['#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#22d3ee'],
    gridColor: '#1e3050',
    textColor: '#94a3b8',
  },
};

// Glassmorphism config for JS usage
export const glassConfig = {
  light: {
    background: 'rgba(255, 255, 255, 0.72)',
    border: 'rgba(255, 255, 255, 0.3)',
    blur: '16px',
  },
  dark: {
    background: 'rgba(21, 29, 48, 0.72)',
    border: 'rgba(255, 255, 255, 0.08)',
    blur: '16px',
  },
};

// Light Mode Theme
export const lightTheme = {
  bg: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },
  border: '#e2e8f0',
  shadow: '0 1px 3px 0 rgb(0 0 0 / 0.08)',
  shadowMd: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
  shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
};

// Dark Mode Theme
export const darkTheme = {
  bg: {
    primary: '#151d30',
    secondary: '#0c1222',
    tertiary: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    tertiary: '#64748b',
    inverse: '#0f172a',
  },
  border: '#1e3050',
  shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3)',
  shadowMd: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
  shadowLg: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
};

export type Theme = typeof lightTheme;

/** Helper: get role-specific gradient class */
export const getRoleGradient = (role: 'admin' | 'teacher' | 'student') =>
  colorPalette.gradients[role];

/** Helper: get role-specific subtle gradient class */
export const getRoleSubtleGradient = (role: 'admin' | 'teacher' | 'student') =>
  colorPalette.gradients[`${role}Subtle` as keyof typeof colorPalette.gradients];

/** Helper: get chart colors based on dark mode */
export const getChartColors = (isDark: boolean) =>
  isDark ? colorPalette.chartsDark : colorPalette.charts;
