/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10151C',
        paper: '#F5F6F2',
        panel: '#FFFFFF',
        line: '#E4E3DC',
        muted: '#6B7280',
        signal: {
          DEFAULT: '#FF7A1A',
          soft: '#FFE7D3',
        },
        route: {
          DEFAULT: '#1E6F5C',
          soft: '#DCEEE8',
        },
        alert: {
          DEFAULT: '#D64545',
          soft: '#FBE0E0',
        },
        transit: {
          DEFAULT: '#2A4B8D',
          soft: '#DFE6F5',
        },
      },
      fontFamily: {
        display: ['var(--font-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
};
