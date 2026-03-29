import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        sidebar: {
          bg: '#0f1117',
          hover: '#1e2130',
          border: '#2a2d3e',
          text: '#a0aec0',
          active: '#1a1d2e',
        },
        chat: {
          bg: '#0d0f18',
          user: '#1e3a5f',
          assistant: '#161926',
        }
      },
    },
  },
  plugins: [],
}

export default config
