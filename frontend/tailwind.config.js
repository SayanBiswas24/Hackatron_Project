/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-lime': '#C0FF00',
        'deep-dark': '#0A0F0D',
      },
      animation: {
        'star-btn': 'star-btn calc(var(--duration, 3) * 1s) linear infinite',
      },
      keyframes: {
        'star-btn': {
          '0%': { 'offset-distance': '0%' },
          '100%': { 'offset-distance': '100%' },
        },
      },
    },
  },
  plugins: [],
}
