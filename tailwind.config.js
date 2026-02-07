/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#135bec",
        "primary-hover": "#0e4bce",
        "background-light": "#f6f6f8",
        "background-dark": "#0a0f1a",
        "panel-bg": "#161e2d",
        "success-green": "#10b981",
        "error-red": "#ef4444",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
