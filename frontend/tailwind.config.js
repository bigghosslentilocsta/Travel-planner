/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#6366f1",
          600: "#4f46e5"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99, 102, 241, 0.25), 0 20px 40px -24px rgba(99, 102, 241, 0.75)"
      }
    }
  },
  plugins: []
};
