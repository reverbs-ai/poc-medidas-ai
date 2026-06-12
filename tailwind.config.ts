import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4efff",
          100: "#e8ddff",
          200: "#d1bcff",
          300: "#b592ff",
          400: "#9b6cff",
          500: "#7f49ff",
          600: "#6431e5",
          700: "#5126b4",
          800: "#40238a",
          900: "#331d6a",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(155,108,255,0.25), 0 24px 80px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
} satisfies Config;
