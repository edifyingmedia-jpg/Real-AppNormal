/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        appnormal: {
          bg: "#111111",
          surface: "#1b1b1b",
          border: "#2a2a2a",
          lime: "#b4ff39"
        }
      }
    }
  },
  plugins: []
};
