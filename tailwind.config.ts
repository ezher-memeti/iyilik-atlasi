import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf6",
          100: "#d5f8e7",
          500: "#19a66a",
          600: "#128455",
          700: "#0f6946",
        },
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
