/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zinc: {
          350: '#bbbbc1',
          450: '#898992',
          455: '#84848d',
          550: '#61616a',
          555: '#5d5d66',
          650: '#48484e',
          750: '#333338',
          850: '#1f1f23',
        },
      },
      boxShadow: {
        'neo-out': 'var(--neo-shadow-out)',
        'neo-in': 'var(--neo-shadow-in)',
        'glass': '0 8px 32px 0 var(--glass-shadow)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
