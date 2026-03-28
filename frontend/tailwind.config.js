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
      }
    },
  },
  plugins: [],
}
