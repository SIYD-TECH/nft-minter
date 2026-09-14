import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        botchain: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          900: "#14532d",
        },
        cyber: {
          dark: "#0a0c10",
          card: "#12161f",
          border: "#1f293d",
          accent: "#00f0ff",
          purple: "#9d4edd",
          gold: "#ffb703"
        }
      },
    },
  },
  plugins: [],
};
export default config;
