import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        snow: "#FFFFFF",
        mist: "#F2F8FD",
        azure: "#0A84FF",
        sky: "#5AC8FA",
        ink: "#0B0F14",
        slate: "#5B6675",
        line: "#E6EEF6"
      },
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,15,20,0.04), 0 12px 32px rgba(11,15,20,0.06)",
        lift: "0 8px 20px rgba(10,132,255,0.10), 0 24px 60px rgba(11,15,20,0.10)"
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem"
      }
    }
  },
  plugins: []
};

export default config;
