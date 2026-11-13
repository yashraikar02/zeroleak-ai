/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        bg:          '#0A0A0A',
        sidebar:     '#0F0F0F',
        card:        '#141414',
        surface:     '#141414',
        'surface-2': '#1A1A1A',
        'surface-3': '#202020',
        border:      '#2A2A2A',
        'border-subtle': '#1E1E1E',
        primary: {
          DEFAULT: '#E5484D',
          hover:   '#CC3337',
          subtle:  'rgba(229, 72, 77, 0.12)',
        },
        text:  '#F5F5F5',
        muted: '#9A9A9A',
        danger: {
          DEFAULT: '#E5484D',
          hover:   '#CC3337',
          subtle:  'rgba(229, 72, 77, 0.12)',
        },
        warning: {
          DEFAULT: '#F5A524',
          hover:   '#E0941B',
          subtle:  'rgba(245, 165, 36, 0.12)',
        },
        info: {
          DEFAULT: '#3B82F6',
          subtle:  'rgba(59, 130, 246, 0.12)',
        },
        entity: {
          PERSON:       '#E5484D',
          AADHAAR:      '#F59E0B',
          PAN:          '#A78BFA',
          GSTIN:        '#38BDF8',
          ADDRESS:      '#FB923C',
          PASSPORT:     '#EC4899',
          VOTER_ID:     '#FBBF24',
          PHONE:        '#84CC16',
          EMAIL:        '#06B6D4',
          DATE_OF_BIRTH:'#E879F9',
          BANK_ACCOUNT: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        subtle:    '0 1px 2px rgba(0,0,0,0.4)',
        card:      '0 2px 8px rgba(0,0,0,0.5)',
        elevation: '0 8px 24px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
