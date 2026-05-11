export const colorPalette = {
  brand: {
    primary: "#2F855A",
    secondary: "#68D391",
    accent: "#F59E0B",
  },
  text: {
    primary: "#1A202C",
    secondary: "#718096",
  },
  surface: {
    pageLight: "#F7F6F2",
    pageDark: "#0F1720",
    heroLight:
      "radial-gradient(140% 85% at 0% -10%, rgba(47, 133, 90, 0.24), transparent 62%), radial-gradient(135% 80% at 100% -10%, rgba(104, 211, 145, 0.20), transparent 60%), radial-gradient(120% 70% at 50% 115%, rgba(245, 158, 11, 0.10), transparent 62%), linear-gradient(180deg, #f7f6f2 0%, #eef2ec 56%, #f7f6f2 100%)",
    heroDark:
      "radial-gradient(140% 85% at 0% -10%, rgba(104, 211, 145, 0.22), transparent 62%), radial-gradient(135% 80% at 100% -10%, rgba(47, 133, 90, 0.24), transparent 60%), radial-gradient(120% 70% at 50% 115%, rgba(245, 158, 11, 0.12), transparent 62%), linear-gradient(180deg, #0f1720 0%, #16211d 56%, #0f1720 100%)",
    categoryLight: "#EEF2EC",
    categoryDark: "#16211D",
    cardLight: "rgba(255, 255, 255, 0.8)",
    cardHoverDark: "rgba(255, 255, 255, 0.06)",
    cardDark: "#16211D",
    highlightLight: "linear-gradient(180deg, #f7f6f2 0%, #eef2ec 100%)",
    highlightDark: "linear-gradient(180deg, #0f1720 0%, #16211d 100%)",
  },
  divider: {
    softLight: "rgba(15, 23, 42, 0.06)",
    softDark: "rgba(255, 255, 255, 0.10)",
  },
} as const;
