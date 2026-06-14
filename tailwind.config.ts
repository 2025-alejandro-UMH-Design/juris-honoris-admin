import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1a3a6b',
          light:   '#2a5298',
          dark:    '#0f2444',
        },
      },
    },
  },
  plugins: [],
}

export default config
