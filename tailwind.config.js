/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#06080C',
        surface: 'rgba(255,255,255,0.06)',
        card: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.12)',
        ink: '#F2F6FC',
        muted: '#9FB0C3',
        faint: '#6B7B8F',
        accent: '#34E5B0',
        accentDim: '#10B981',
        violet: '#8B7CFF',
        blue: '#5B9DFF',
        warn: '#FFC24B',
        danger: '#FF6B6B',
        info: '#5B9DFF',
      },
    },
  },
  plugins: [],
};
