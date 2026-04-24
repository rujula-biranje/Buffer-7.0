/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      keyframes: {
        steam: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.8)' },
          '25%': { opacity: '0.8' },
          '70%': { opacity: '0.5', transform: 'translateY(-32px) scale(1.2)' },
          '100%': {
            opacity: '0',
            transform: 'translateY(-56px) scale(1.5)',
          },
        },
        cupFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        badgeBump: {
          '0%, 100%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.4)' },
          '70%': { transform: 'scale(0.9)' },
        },
        cartWiggle: {
          '0%, 100%': { transform: 'rotate(0)' },
          '25%': { transform: 'rotate(-8deg)' },
          '75%': { transform: 'rotate(8deg)' },
        },
      },
      animation: {
        steam: 'steam 2.8s ease-in-out infinite',
        'cup-float': 'cupFloat 3.5s ease-in-out infinite',
        'badge-bump': 'badgeBump 0.45s ease-out',
        'cart-wiggle': 'cartWiggle 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
};
