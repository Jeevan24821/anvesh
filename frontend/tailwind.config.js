/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ux4g: {
          primary: '#0B4F6C',
          primaryHover: '#083B52',
          secondary: '#1363DF',
          accent: '#0D9488',
          accentHover: '#0F766E',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          borderDark: '#CBD5E1',
          text: '#0F172A',
          muted: '#64748B',
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
        },
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
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
