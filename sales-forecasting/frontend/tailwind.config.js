/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      keyframes: {
        dash: {
          to: { 'stroke-dashoffset': '0' }
        },
        slide_up: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' }
        },
        count_in: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to:   { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        dash: 'dash 1.5s ease forwards',
        slide_up: 'slide_up 0.4s ease forwards',
        count_in: 'count_in 0.3s ease forwards',
      }
    },
  },
  plugins: [],
}