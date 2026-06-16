/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#090d16',
          card: '#111827',
          border: '#1f2937',
          accent: '#3b82f6',
          glow: '#10b981',
          gold: '#f59e0b',
          silver: '#9ca3af',
          oil: '#10b981',
          copper: '#ea580c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
