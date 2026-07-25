import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Escala espejada: 950 = blanco (fondo), 0 = negro (texto).
        // Todo lo que ya referenciaba ink-950/ink-0/etc en el codigo
        // se reacomoda automaticamente al tema claro.
        ink: {
          950: "#ffffff",
          900: "#fbfbf9",
          850: "#f6f5f2",
          800: "#ece9e3",
          700: "#dbd7cf",
          600: "#b8b3a8",
          500: "#8a8478",
          400: "#565149",
          300: "#332f2a",
          200: "#1f1c19",
          100: "#121110",
          50: "#080807",
          0: "#000000",
        },
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.16em",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glass: "0 1px 1px 0 rgba(0,0,0,0.04), 0 8px 30px -8px rgba(0,0,0,0.12), inset 0 1px 0 0 rgba(255,255,255,0.6)",
        "glass-sm": "0 1px 1px 0 rgba(0,0,0,0.04), 0 4px 16px -6px rgba(0,0,0,0.10), inset 0 1px 0 0 rgba(255,255,255,0.6)",
        soft: "0 20px 60px -20px rgba(0,0,0,0.15)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(3%, -4%) scale(1.05)" },
        },
        driftSlow: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-4%, 3%) scale(1.08)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out both",
        drift: "drift 16s ease-in-out infinite",
        driftSlow: "driftSlow 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
