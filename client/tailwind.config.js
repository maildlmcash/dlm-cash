/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF9E6',
          100: '#FFF3CC',
          200: '#FFE699',
          300: '#FFDA66',
          400: '#FFCE33',
          500: '#FFC200',
          600: '#CC9B00',
          700: '#997400',
          800: '#664E00',
          900: '#332700',
        },
        dark: {
          50: '#F5F7FA',   // Very light gray (for text on dark)
          100: '#E4E7EB',  // Light gray
          200: '#CBD2D9',  // Medium light gray
          300: '#9AA5B1',  // Medium gray
          400: '#7B8794',  // Medium dark gray
          500: '#616E7C',  // Dark gray
          600: '#52606D',  // Darker gray
          700: '#3E4C59',  // Very dark gray
          800: '#323F4B',  // Almost black gray
          900: '#1F2933',  // Dark background
          950: '#0F172A',  // Darkest background
        },
        accent: {
          blue: '#3B82F6',
          lightBlue: '#60A5FA',
          darkBlue: '#2563EB',
          purple: '#8B5CF6',
          lightPurple: '#A78BFA',
          cyan: '#06B6D4',
          teal: '#14B8A6',
          green: '#10B981',
          emerald: '#34D399',
          red: '#EF4444',
          pink: '#EC4899',
          orange: '#F59E0B',
          amber: '#FBBF24',
          indigo: '#6366F1',
          violet: '#8B5CF6',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 194, 0, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 194, 0, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

