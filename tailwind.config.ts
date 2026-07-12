import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // Brand
        brand: {
          DEFAULT: "#6E56CF",
          hover: "#5B46B8",
          soft: "#F1EEFB",
          softer: "#FBFAFE",
          border: "#C9BCF2",
          text: "#CBBEF5",
          ring: "#E3DDF7",
        },
        // Surface
        canvas: "#FAFAFB",
        surface: "#FFFFFF",
        muted: {
          DEFAULT: "#F4F4F6",
          strong: "#EDEDF0",
          soft: "#F7F7F9",
        },
        // Text
        ink: {
          DEFAULT: "#1A1A21",
          muted: "#494952",
          subtle: "#6B6B76",
          faint: "#9A9AA4",
          fainter: "#C4C4CC",
        },
        // Sidebar (dark)
        sidebar: {
          DEFAULT: "#17171C",
          raised: "#212128",
          hover: "#26262E",
          border: "#26262E",
          borderStrong: "#2C2C34",
          chip: "#3A3A44",
          text: "#E7E7EC",
          textMuted: "#9B9BA6",
          textFaint: "#6F6F78",
          textStrong: "#F2F2F5",
          textOnActive: "#CBBEF5",
        },
        // Borders
        line: {
          DEFAULT: "#E3E3E8",
          soft: "#E9E9EE",
          softer: "#EFEFF2",
          softest: "#F0F0F3",
        },
        // Semantic
        danger: {
          text: "#B42318",
          bg: "#FEF3F2",
          border: "#F4CDC7",
        },
        warning: {
          text: "#B54708",
          bg: "#FFFAEB",
        },
        success: {
          text: "#027A48",
        },
        // Muted green used for the "accepted / selected" affordance on option
        // cards. Not bright, not dark — leans emerald.
        accept: {
          // Alpha suffix (last two hex chars) fades the accent so the button,
          // "Selected" pill, and border ring all read as translucent green.
          DEFAULT: "#10B981A6", // 65% opacity
          hover: "#10B981D9",   // 85% opacity
          soft: "#ECFDF5",
          softer: "#D1FAE5",
          border: "#A7F3D0",
          text: "#065F46",
        },
      },
      borderRadius: {
        card: "12px",
        panel: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,23,28,0.08)",
        pop: "0 2px 8px rgba(23,23,28,0.15)",
        popStrong: "0 2px 8px rgba(23,23,28,0.25)",
        mockup: "0 4px 16px rgba(23,23,28,0.12)",
        menu: "0 4px 12px rgba(23,23,28,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
