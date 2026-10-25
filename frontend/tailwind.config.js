/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        royal: {
          900: '#063B8B',
          800: '#0845A8',
          700: '#0E55C8',
          600: '#1769E0',
          500: '#2575FC',
          100: '#E8F1FD',
          50: '#F0F6FE',
        },
        navy: {
          950: '#060B18',
          900: '#0B132B',
          850: '#0F1B38',
          800: '#152244',
          750: '#1C2C55',
          700: '#233766',
          600: '#324D85',
        },
        brand: {
          teal: '#00B4D8',
          cyan: '#38BDF8',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
