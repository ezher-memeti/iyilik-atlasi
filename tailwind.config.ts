import type { Config } from "tailwindcss";
import { colorPalette } from "./config/colorPalette";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: colorPalette.brand,
        text: colorPalette.text,
        divider: colorPalette.divider,
        surface: {
          pageLight: colorPalette.surface.pageLight,
          pageDark: colorPalette.surface.pageDark,
          categoryLight: colorPalette.surface.categoryLight,
          categoryDark: colorPalette.surface.categoryDark,
          cardLight: colorPalette.surface.cardLight,
          cardDark: colorPalette.surface.cardDark,
          cardHoverDark: colorPalette.surface.cardHoverDark,
        },
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.10)",
      },
      backgroundImage: {
        "hero-surface-light": colorPalette.surface.heroLight,
        "hero-surface-dark": colorPalette.surface.heroDark,
        "highlight-surface-light": colorPalette.surface.highlightLight,
        "highlight-surface-dark": colorPalette.surface.highlightDark,
      },
    },
  },
  plugins: [],
};

export default config;
