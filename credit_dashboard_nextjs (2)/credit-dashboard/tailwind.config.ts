import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Syne'", "sans-serif"],
      },
      colors: {
        background: "#0a0a0b",
        surface: "#111113",
        "surface-2": "#18181b",
        "surface-3": "#222226",
        border: "#2a2a2f",
        "border-bright": "#3a3a42",
        amber: {
          DEFAULT: "#f59e0b",
          50:  "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        slate: {
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
        },
        red:   { DEFAULT: "#ef4444", 500: "#ef4444", 900: "#1a0404" },
        green: { DEFAULT: "#22c55e", 500: "#22c55e", 900: "#021a0a" },
        blue:  { DEFAULT: "#3b82f6", 500: "#3b82f6", 900: "#020c1a" },
        purple:{ DEFAULT: "#a855f7", 500: "#a855f7", 900: "#0f021a" },
        orange:{ DEFAULT: "#f97316", 500: "#f97316", 900: "#1a0702" },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-sm": "24px 24px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-in":   "slideIn 0.2s ease-out",
        "fade-in":    "fadeIn 0.3s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
