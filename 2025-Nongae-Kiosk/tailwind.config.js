/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'myeongjo': ['NanumMyeongjo-Regular', 'serif'],
        'myeongjo-bold': ['NanumMyeongjo-Bold', 'serif'],
        'myeongjo-extra': ['NanumMyeongjo-ExtraBold', 'serif'],
      },
      colors: {
        'main-bg': '#F8F5F1',
      },
    },
  },
  plugins: [],
}