import type { Config } from "tailwindcss";
import { heroui } from "@heroui/theme";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        rink: {
          50: "#f5fbff",
          100: "#e1f2ff",
          200: "#bce1ff",
          300: "#96cfff",
          400: "#6fbdff",
          500: "#47a9ff",
          600: "#1f95ff",
          700: "#007fe8",
          800: "#0060ad",
          900: "#003b66",
        },
      },
      boxShadow: {
        brand: "0 10px 40px rgba(111, 189, 255, 0.25)",
      },
    },
  },
  plugins: [heroui()],
};

export default config;
