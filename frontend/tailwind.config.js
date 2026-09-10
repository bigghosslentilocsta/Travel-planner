/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5"
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48"
        },
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(99, 102, 241, 0.25), 0 20px 40px -24px rgba(99, 102, 241, 0.75)",
        soft: "0 4px 24px -4px rgba(0, 0, 0, 0.1)",
        card: "0 2px 16px -2px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.6)"
      },
      animation: {
        "gradient-shift": "gradientShift 15s ease infinite",
        "blob-1": "blob1 20s infinite",
        "blob-2": "blob2 25s infinite",
        "blob-3": "blob3 18s infinite",
        "float": "float 6s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "slide-in": "slideIn 0.3s ease-out"
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        blob1: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(60px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-30px, 30px) scale(0.95)" }
        },
        blob2: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-50px, 50px) scale(1.05)" },
          "66%": { transform: "translate(40px, -20px) scale(0.9)" }
        },
        blob3: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, 40px) scale(1.08)" },
          "66%": { transform: "translate(-60px, -30px) scale(0.92)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" }
        }
      }
    }
  },
  plugins: []
};
