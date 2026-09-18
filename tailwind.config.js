/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F2EC',
        surface: '#FFFDF8',
        ink: '#1F1D1A',
        muted: '#5E5A54',
        plum: '#5A3D7A',
        approve: '#2F6B47',
        disapprove: '#B4532A',
      },
      fontFamily: {
        heading: ['Fraunces', 'Georgia', 'serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
      },
    },
  },
  plugins: [],
};
