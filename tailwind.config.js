/** @type {import('tailwindcss').Config} */

function withOpacity(varName) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `rgb(var(${varName}) / ${opacityValue})`
      : `rgb(var(${varName}))`;
}

module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Semantic, theme-aware tokens — swap value via CSS vars in globals.css,
        // not by duplicating classes with dark: everywhere.
        background: withOpacity("--color-bg"),
        surface: withOpacity("--color-surface"),
        surface2: withOpacity("--color-surface-2"),
        foreground: withOpacity("--color-fg"),
        muted: withOpacity("--color-muted"),
        muted2: withOpacity("--color-muted-2"),
        border: withOpacity("--color-border"),
        accent: {
          DEFAULT: withOpacity("--color-accent"),
          hover: withOpacity("--color-accent-hover"),
        },
      },
      fontFamily: {
        // "serif" = Poppins (headings/display), "sans"/"body" = Inter (UI/copy).
        // Keys kept from the earlier theme so component classNames don't need touching.
        serif: ["'Poppins'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        card: "0 2px 10px rgb(28 29 36 / 0.07)",
      },
    },
  },
  plugins: [],
};
