// Modern Design System for DLM.Cash
// Light Theme - Clean, modern aesthetic with light backgrounds and dark text
// Professional light mode design

export const colors = {
  // Primary Brand Colors (Yellow/Gold)
  primary: {
    50: '#FFF9E6',
    100: '#FFF3CC',
    200: '#FFE699',
    300: '#FFDA66',
    400: '#FFCE33',
    500: '#FFC200', // Main brand yellow
    600: '#CC9B00',
    700: '#997400',
    800: '#664E00',
    900: '#332700',
  },
  
  // Light Theme Base - Inspired by modern light themes
  dark: {
    50: '#0F172A',   // Darkest (for text on light)
    100: '#1F2933',  // Very dark gray (for text)
    200: '#323F4B',  // Dark gray (for text)
    300: '#52606D',  // Medium dark gray
    400: '#616E7C',  // Medium gray
    500: '#7B8794',  // Gray
    600: '#9AA5B1',  // Light gray
    700: '#CBD2D9',  // Very light gray
    800: '#E4E7EB',  // Almost white gray
    900: '#F5F7FA',  // Light background
    950: '#FFFFFF',  // White background
  },
  
  // Accent Colors - Multi-color vibrant theme (dark mode)
  accent: {
    blue: '#3B82F6',      // Primary blue
    lightBlue: '#60A5FA', // Light blue
    darkBlue: '#2563EB',  // Dark blue
    purple: '#8B5CF6',    // Purple
    lightPurple: '#A78BFA', // Light purple
    cyan: '#06B6D4',      // Cyan
    teal: '#14B8A6',      // Teal
    green: '#10B981',     // Green
    emerald: '#34D399',   // Emerald green
    red: '#EF4444',       // Red
    pink: '#EC4899',      // Pink
    orange: '#F59E0B',    // Orange
    amber: '#FBBF24',     // Amber
    indigo: '#6366F1',    // Indigo
    violet: '#8B5CF6',    // Violet
  },
  
  // Semantic Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const gradients = {
  // Background gradients (light theme) - Clean and bright
  primary: 'linear-gradient(135deg, #FFFFFF 0%, #F5F7FA 100%)',
  secondary: 'linear-gradient(135deg, #F5F7FA 0%, #E4E7EB 100%)',
  accent: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #06B6D4 100%)',
  accentBlue: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  accentPurple: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  accentMulti: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 33%, #EC4899 66%, #06B6D4 100%)',
  accentRainbow: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 20%, #EC4899 40%, #F59E0B 60%, #10B981 80%, #06B6D4 100%)',
  
  // Card gradients - Light theme
  card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 247, 250, 0.9) 100%)',
  cardHover: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)',
  cardVibrant: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(236, 72, 153, 0.08) 100%)',
  
  // Glassmorphism for light theme
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 247, 250, 0.9) 100%)',
  glassDark: 'linear-gradient(135deg, rgba(245, 247, 250, 0.95) 0%, rgba(228, 231, 235, 0.95) 100%)',
  
  // Glow effects - Subtle for light theme
  glow: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(6, 182, 212, 0.15) 100%)',
  glowBlue: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
  glowMulti: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(236, 72, 153, 0.2) 100%)',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  glow: '0 0 20px rgba(59, 130, 246, 0.2)',
  glowLg: '0 0 40px rgba(59, 130, 246, 0.25)',
  glowPurple: '0 0 20px rgba(139, 92, 246, 0.2)',
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

export const transitions = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};
