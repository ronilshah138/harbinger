/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0A0F',
        brand: {
          accentBlue: '#63B3ED',
          accentBlueDim: 'rgba(99,179,237,0.15)',
          accentPurple: '#9F7AEA',
          accentGold: '#C9A84C',
          textPrimary: '#F0F4FF',
          textSecondary: '#8892A4',
          textTertiary: '#4A5568',
          success: '#48BB78',
          danger: '#FC8181',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
