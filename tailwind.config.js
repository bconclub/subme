/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0F',
        surface: 'rgba(255,255,255,0.05)',
        card: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.10)',
        ink: '#F4F4F7',
        muted: '#A0A0AD',
        faint: '#6B6B79',
        accent: '#C6F24E',
        accentDim: '#A7D636',
        violet: '#7C5CFF',
        blue: '#5B9DFF',
        warn: '#FFC24B',
        danger: '#FF5C6B',
        info: '#5B9DFF',
      },
      fontFamily: {
        display: ['SpaceGrotesk_700Bold'],
        sans: ['PlusJakartaSans_400Regular'],
      },
    },
  },
  plugins: [],
};
