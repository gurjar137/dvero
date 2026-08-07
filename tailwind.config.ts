import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAF9F6',
        panel: '#F4F3EE',
        panel2: '#ECEAE4',
        camel: '#111111',
        camelDeep: '#111111',
        ink: '#111111',
        mute: '#666666',
        line: '#EAEAEA',
        success: '#2E5B37',
        error: '#8C2B2B'
      },
      fontFamily: {
        oswald: ['var(--font-oswald)'],
        inter: ['var(--font-inter)'],
        cinzel: ['var(--font-cinzel)'],
        playfair: ['var(--font-playfair)']
      },
      boxShadow: {
        sm2: '0 2px 8px rgba(0,0,0,0.04)',
        md2: '0 8px 24px rgba(0,0,0,0.06)',
        lg2: '0 16px 40px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: []
};
export default config;
