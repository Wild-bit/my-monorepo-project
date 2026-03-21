/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      colors: {
        glass: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          strong: 'rgba(255,255,255,0.1)',
          border: 'rgba(255,255,255,0.1)',
          'border-hover': 'rgba(167,139,250,0.3)',
        },
        dark: '#0f0f1a',
      },
      animation: {
        float: 'float 20s ease-in-out infinite',
        'float-slow': 'float 25s ease-in-out infinite',
        'float-slower': 'float 30s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.95)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
