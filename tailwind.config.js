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
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e23744', // Zomato / Momo Red
          700: '#be123c',
          800: '#9f1239'
        },
        tandoor: {
          500: '#ff5200',
          600: '#ea580c'
        },
        amberGold: '#ffa41c',
        vegGreen: '#16a34a',
        nonVegRed: '#dc2626',
        canvas: '#fafaf8'
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'floating': '0 12px 36px rgba(226, 55, 68, 0.25)'
      }
    },
  },
  plugins: [],
}
