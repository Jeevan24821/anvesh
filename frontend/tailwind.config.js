/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        anvesh: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          navy: '#0F172A',
          secondary: '#64748B',
          teal: '#0D9488',
          tealHover: '#0F766E',
          tealLight: '#F0FDFA',
          tealBorder: '#CCFBF1',
          accentNavy: '#12345A',
        },
        navy: {
          950: '#0A0F1D',
          900: '#0F172A',
          800: '#12345A',
          700: '#1E293B',
          600: '#334155',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
