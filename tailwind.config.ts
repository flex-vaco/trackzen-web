import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2C5F7C',
          'primary-dk': '#1A3D52',
          secondary: '#E8A44C',
          accent: '#D97642',
          success: '#52A675',
          danger: '#D64545',
          bg: '#F8FAFB',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
