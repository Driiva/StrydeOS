/**
 * StrydeOS Brand Tokens
 * Single source of truth for all brand values.
 * Import this wherever you need colours, fonts, or spacing.
 *
 * Usage:
 *   import { colors, fonts } from '@/brand'
 *   style={{ color: colors.blue }}
 */

export const colors = {
  // Core palette
  navy:        "#0B2545",  // Backgrounds, deep surfaces
  navyMid:     "#132D5E",  // Secondary surfaces
  blue:        "#1C54F2",  // Primary — mark container, CTAs
  blueBright:  "#2E6BFF",  // Hover, active states
  blueGlow:    "#4B8BF5",  // Accents, chart lines, chips
  teal:        "#0891B2",  // Continuity module

  // Surfaces (light mode)
  cloudDancer: "#F2F1EE",  // Page background
  cloudLight:  "#F9F8F6",  // Card surfaces
  cloudDark:   "#E8E6E0",  // Dividers, borders
  cream:       "#FAF9F7",  // Section alternates

  // Type
  ink:         "#111827",  // Body text
  muted:       "#6B7280",  // Secondary text
  border:      "#E2DFDA",  // Borders

  // Semantic
  success:     "#059669",
  warning:     "#F59E0B",
  danger:      "#EF4444",

  // Module colours (use for per-module accent)
  receptionist: "#1C54F2",  // = blue
  continuity:   "#0891B2",  // = teal
  intelligence: "#8B5CF6",  // purple
} as const;

export const fonts = {
  heading: "'DM Serif Display', serif",  // 32px+, weight 400 only
  body:    "'Outfit', sans-serif",       // All UI, weights 300–700
} as const;

export const fontWeights = {
  light:    300,
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

/**
 * Tailwind CSS config extension.
 * Paste the contents of `theme.extend` into your tailwind.config.ts.
 *
 * Then use: text-navy, bg-blue, border-teal, font-heading, etc.
 */
export const tailwindExtend = {
  colors: {
    navy:        colors.navy,
    "navy-mid":  colors.navyMid,
    blue:        colors.blue,
    "blue-bright": colors.blueBright,
    "blue-glow": colors.blueGlow,
    teal:        colors.teal,
    cloud:       colors.cloudDancer,
    "cloud-light": colors.cloudLight,
    "cloud-dark":  colors.cloudDark,
    cream:       colors.cream,
    ink:         colors.ink,
    muted:       colors.muted,
  },
  fontFamily: {
    heading: ['"DM Serif Display"', "serif"],
    body:    ["Outfit", "sans-serif"],
    sans:    ["Outfit", "sans-serif"],  // override Tailwind default
  },
} as const;

export type BrandColor = keyof typeof colors;
