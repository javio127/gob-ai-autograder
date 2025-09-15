/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brandGreen: {
          DEFAULT: '#4BAF5B',
          dark: '#3B9549',
        },
        brandBlue: {
          DEFAULT: '#4F8DF7',
          dark: '#3B6FD1',
        },
      },
      borderRadius: {
        xl: '1rem',
      }
    },
  },
  plugins: [],
};


