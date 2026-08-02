import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FFFFFF',
        panel: '#F4F2EC',
        panel2: '#E9E4D8',
        camel: '#A8987C',
        camelDeep: '#6B6459',
        ink: '#141210',
        mute: '#8A8175',
        line: '#E4E0D8',
        success: '#3F6B45',
        error: '#9B3A3A'
      },
      fontFamily: {
        oswald: ['var(--font-oswald)'],
        inter: ['var(--font-inter)'],
        cinzel: ['var(--font-cinzel)'],
        playfair: ['var(--font-playfair)']
      },
      boxShadow: {
        sm2: '0 2px 14px rgba(29,26,21,0.07)',
        md2: '0 12px 32px rgba(29,26,21,0.10)',
        lg2: '0 26px 60px rgba(29,26,21,0.16)'
      }
    }
  },
  plugins: []
};
export default config;
