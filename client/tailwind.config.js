/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nkb: {
          dark: '#081225',
          navy: '#0B192C',
          navyLight: '#1E3E62',
          surface: '#F8FAFC',
          gold: '#C5A059',
          goldLight: '#E8D29F',
          goldDark: '#997328',
          accent: '#0284C7',
          border: '#E2E8F0',
          textMuted: '#64748B'
        }
      }
    },
  },
  plugins: [],
}
