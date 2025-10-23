/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-black': '#000000',
        'primary-golden': '#FFD700', // Standard gold color
      },
    },
  },
  plugins: [],
};
