import type { Config } from "tailwindcss";
import { frostedThemePlugin } from "@whop/react/tailwind";

export default {
  darkMode: "class",
  plugins: [frostedThemePlugin()],
  theme: {
    extend: {
      colors: {
        // Funnel design system colors using CSS variables
        "funnel-bg": {
          primary: "rgb(var(--funnel-bg-primary) / <alpha-value>)",
          card: "rgb(var(--funnel-bg-card) / <alpha-value>)",
          elevated: "rgb(var(--funnel-bg-elevated) / <alpha-value>)",
        },
        "funnel-text": {
          primary: "rgb(var(--funnel-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--funnel-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--funnel-text-muted) / <alpha-value>)",
        },
        "funnel-border": {
          DEFAULT: "rgb(var(--funnel-border-default) / <alpha-value>)",
          subtle: "rgb(var(--funnel-border-subtle) / <alpha-value>)",
        },
        "funnel-accent": {
          DEFAULT: "rgb(var(--funnel-accent) / <alpha-value>)",
          hover: "rgb(var(--funnel-accent-hover) / <alpha-value>)",
          light: "rgb(var(--funnel-accent-light) / <alpha-value>)",
        },
      },
      boxShadow: {
        "funnel-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "funnel-md":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "funnel-lg":
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "funnel-xl":
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "funnel-glow": "0 0 30px rgba(99, 102, 241, 0.4)",
        "funnel-glow-lg": "0 0 50px rgba(99, 102, 241, 0.5)",
        "funnel-inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
      },
      borderRadius: {
        "funnel-sm": "0.5rem",
        "funnel-md": "0.75rem",
        "funnel-lg": "1rem",
        "funnel-xl": "1.25rem",
        "funnel-2xl": "1.5rem",
      },
      transitionTimingFunction: {
        "funnel-ease": "cubic-bezier(0.4, 0, 0.2, 1)",
        "funnel-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      animation: {
        "funnel-fade-in": "funnel-fade-in 0.5s ease-out forwards",
        "funnel-scale-in": "funnel-scale-in 0.4s ease-out forwards",
        "funnel-slide-up": "funnel-slide-up 0.5s ease-out forwards",
        "funnel-glow-pulse": "funnel-glow-pulse 2s ease-in-out infinite",
        "funnel-countdown-tick": "funnel-countdown-tick 0.3s ease-out",
        "funnel-float-reaction": "funnel-float-reaction 2.5s ease-out forwards",
        "funnel-shimmer": "funnel-shimmer 2s linear infinite",
        "funnel-pulse-ring": "funnel-pulse-ring 1.5s ease-out infinite",
      },
      keyframes: {
        "funnel-fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "funnel-scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "funnel-slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "funnel-glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(99, 102, 241, 0.6)" },
        },
        "funnel-countdown-tick": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        "funnel-float-reaction": {
          "0%": {
            opacity: "1",
            transform: "translateY(0) scale(1) rotate(0deg)",
          },
          "50%": {
            opacity: "1",
            transform: "translateY(-100px) scale(1.2) rotate(10deg)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(-200px) scale(1.5) rotate(-10deg)",
          },
        },
        "funnel-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "funnel-pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
      backgroundImage: {
        "funnel-gradient-radial":
          "radial-gradient(ellipse at center, var(--tw-gradient-stops))",
        "funnel-gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "funnel-mesh":
          "radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(99, 102, 241, 0.1) 0px, transparent 50%), radial-gradient(at 80% 50%, rgba(168, 85, 247, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(99, 102, 241, 0.1) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(139, 92, 246, 0.1) 0px, transparent 50%)",
      },
    },
  },
} satisfies Config;
