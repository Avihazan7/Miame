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
        // NOTE: `slate` and `sky` were brand single-colors here, but they clobbered
        // Tailwind's default slate-*/sky-* scales that the vehicle-media components
        // need (bg-slate-950, from-sky-400, …). Nothing uses them as utilities (the
        // brand reads --slate/--sky CSS vars in globals.css), so they're removed to
        // restore the full default scales.
        ink: "#0B0F14",
        line: "#E6EEF6",
        // Ultra Color P Master — utilities read the CSS tokens so the palette stays
        // single-source (styles/tokens.miame.css). Do not hardcode these hexes here.
        abyss: "var(--bg-abyss)",
        reef: "var(--surface-reef)",
        frost: "var(--ink-frost)",
        "glow-teal": "var(--glow-teal)",
        "glow-ice": "var(--glow-ice)",
        "gold-bright": "var(--gold-bright)",
        "mint-zero": "var(--mint-zero)",
        "ink-teal": "var(--ink-teal)",
        "ink-gold": "var(--ink-gold)",
        "track-private": "var(--track-private)",
        "track-business": "var(--track-business)",
        "track-partner": "var(--track-partner)"
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
