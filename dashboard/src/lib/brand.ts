/**
 * Brand palette — single source of truth.
 * All values from BRAND ASSETS/brand-identity-sheet.html :root.
 * Do not add colors not in the sheet.
 *
 * WCAG AA: ink/white on navy, blue on navy, and cloud surfaces meet contrast.
 * Muted (#6B7280) on light backgrounds: ~3.7:1 — use for large text (18px+) or
 * secondary UI; for body copy on light, prefer ink.
 */
export const brand = {
  navy: "#0B2545",
  navyMid: "#132D5E",
  blue: "#1C54F2",
  blueBright: "#2E6BFF",
  blueGlow: "#4B8BF5",
  teal: "#0891B2",
  purple: "#8B5CF6",
  cloud: "#F2F1EE",
  cloudLight: "#F9F8F6",
  cloudDark: "#E8E6E0",
  cream: "#FAF9F7",
  ink: "#111827",
  muted: "#6B7280",
  mutedStrong: "#4B5563",
  border: "#E2DFDA",
  success: "#059669",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export type BrandColor = keyof typeof brand;
