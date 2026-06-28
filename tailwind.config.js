/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forsythia: '#FFC801',
        oceanic:   '#172B36',
        nocturnal: '#114C5A',
        arctic:    '#F1F6F4',
        saffron:   '#FF9932',
        term: {
          bg:     '#020617',
          body:   '#0f172a',
          border: '#1e293b',
        },
        sky:     '#38bdf8',
        success: '#4ade80',
        warning: '#fbbf24',
        subdued: '#e2e8f0',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
