import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef8f2',
          100: '#d5ebdf',
          200: '#acd8c0',
          300: '#82c49f',
          400: '#57af7d',
          500: '#2c9a5b',
          600: '#1f7947',
          700: '#155933',
          800: '#0c3b22',
          900: '#041d11'
        },
        accent: '#f3a712',
        bg: '#f5f7f8',
        surface: '#ffffff',
        text: '#1e2a2f',
      },
      boxShadow: {
        card: '0 10px 20px -15px rgba(16, 24, 40, 0.3)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Sora"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
