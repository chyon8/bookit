/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4ADE80",
        "primary-light": "#A7F3D0",
        "light-gray": "#F8FAFC",
        card: "#FFFFFF",
        "card-secondary": "#FDF1F1",
        "text-heading": "#03314B",
        "text-body": "#475569",
        "text-muted": "#94A3B8",
        border: "#E2E8F0",
        footer: "#042330",
        "accent-blue": "#38BDF8",
        // Dark theme colors (mapped for convenience if needed, or used directly)
        "dark-bg": "#111827",
        "dark-card": "#1F2937",
        "dark-border": "#374151",
        "dark-text-heading": "#F9FAFB",
        "dark-text-body": "#D1D5DB",
        "dark-footer": "#0d1c24",
      },
    },
  },
  plugins: [],
}
