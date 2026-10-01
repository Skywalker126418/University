/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 50% Black & Deep Charcoal Palette
        black: {
          DEFAULT: '#090D16',
          deep: '#04060A',
          surface: '#0F172A',
          card: '#111827',
          border: '#1E293B',
          muted: '#1E293B',
        },
        // 30% Dark Blue / University Navy Palette
        darkblue: {
          DEFAULT: '#0F2744',
          deep: '#0A192F',
          navy: '#102A43',
          royal: '#1E3A8A',
          accent: '#2563EB',
          border: '#1E3A8A',
          light: '#172554',
        },
        // Primary alias pointing to Dark Blue
        primary: {
          DEFAULT: '#102A43',
          hover: '#1E3A8A',
          light: '#1E293B',
          accent: '#2563EB',
        },
        // 20% White & Crisp High Contrast text
        white: {
          DEFAULT: '#FFFFFF',
          pure: '#FFFFFF',
          soft: '#F8FAFC',
          muted: '#E2E8F0',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#DC2626',
        'text-dark': '#0F172A',
        'text-secondary': '#64748B',
        border: '#E2E8F0',
        'bg-light': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
