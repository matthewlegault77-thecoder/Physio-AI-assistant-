/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'color-1': 'hsl(var(--color-1))',
        'color-2': 'hsl(var(--color-2))',
        'color-3': 'hsl(var(--color-3))',
        'color-4': 'hsl(var(--color-4))',
        'color-5': 'hsl(var(--color-5))',
      },
      animation: {
        rainbow: 'rainbow var(--speed, 2s) infinite linear',
        slideUp: 'slideUp 0.5s ease-out both',
      },
      keyframes: {
        rainbow: {
          '0%': { 'background-position': '0%' },
          '100%': { 'background-position': '200%' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'animate-fadeIn',
    'animate-rainbow',
    'animate-revealUp',
    'animate-revealUp-1',
    'animate-revealUp-2',
    'animate-revealUp-3',
    'animate-revealUp-4',
    'animate-scaleIn',
    'animate-glowPulse',
    'animate-breathe',
    'animate-float',
    'animate-float-slow',
  ],
};
