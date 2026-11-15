/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // "Aurora Ink" theme: deep blue-tinted neutrals for dark mode surfaces.
        slate: {
          850: '#10182b',
          900: '#0b1220',
          950: '#060a14',
        },
        brand: {
          50: '#ecfdf8',
          100: '#d1faec',
          200: '#a7f3d9',
          300: '#6ee7bf',
          400: '#34d3a0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        aurora: {
          cyan: '#22d3ee',
          violet: '#8b5cf6',
          indigo: '#6366f1',
          pink: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(120deg, #10b981 0%, #22d3ee 45%, #8b5cf6 100%)',
        'aurora-soft': 'linear-gradient(120deg, rgba(16,185,129,.18), rgba(34,211,238,.14), rgba(139,92,246,.18))',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(16,185,129,.25), 0 8px 30px -6px rgba(16,185,129,.35)',
        'glow-lg': '0 0 0 1px rgba(34,211,238,.25), 0 20px 60px -15px rgba(16,185,129,.45)',
        soft: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px -8px rgba(15,23,42,.10)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate3d(0,0,0) rotate(0deg)' },
          '50%': { transform: 'translate3d(0,-20px,0) rotate(3deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(4%,-3%,0) scale(1.08)' },
          '66%': { transform: 'translate3d(-3%,4%,0) scale(.96)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        'aurora-drift': 'aurora-drift 18s ease-in-out infinite',
        shake: 'shake .45s ease-in-out',
      },
    },
  },
  plugins: [],
}
