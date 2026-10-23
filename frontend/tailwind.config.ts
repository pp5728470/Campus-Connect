import type { Config } from 'tailwindcss'

/**
 * Tailwind v4 reads theme tokens from src/index.css (@theme).
 * This file documents the design-system class names wired there so editors
 * and future tooling can see the intended palette and fonts.
 *
 * Utilities available: bg-surface, bg-surface-2, bg-bg, bg-stage, text-ink,
 * text-muted, text-faint, text-accent, bg-accent, border-line, border-line-strong,
 * bg-cover-teal|maroon|forest|indigo|steel|ochre, font-sans, font-serif, font-hand,
 * text-warn/danger/ok, bg-warn-soft/danger-soft/ok-soft/accent-soft, etc.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
