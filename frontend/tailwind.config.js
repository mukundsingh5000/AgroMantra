/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#FDF7F6',   // Ultra light rose-white
          100: '#FAF1F0',  // Lighter color code #FAF1F0
          200: '#F2D7D3',  // Soft border
          300: '#E6B8B2',  // Accent border
          400: '#C88780',  // Muted rose-terracotta
          500: '#9B5B55',  // Medium accent
          600: '#7A3F39',  // Deep accent
          700: '#4A2320',  // Dark header/text
          800: '#2D1412',  // Deep dark text/footer
          900: '#1C0B0A',  // Deepest tone
        },
        agriText: {
          primary: '#2D1412',
          secondary: '#6E4E4B',
          muted: '#9E7A77',
        },
        agriBorder: '#F2D7D3',
        agriBg: '#FAF1F0',
      }
    },
  },
  plugins: [],
}
