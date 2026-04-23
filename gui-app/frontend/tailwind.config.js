/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        cyan: {
          glow: '#00f5ff',
        },
      },
      keyframes: {
        pulse_ring: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.15)' },
        },
        slide_in: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fade_in: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        pulse_ring: 'pulse_ring 1s ease-in-out infinite',
        slide_in: 'slide_in 0.2s ease forwards',
        fade_in: 'fade_in 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}