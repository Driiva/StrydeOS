/**
 * Billing helpers — module/price mapping and Stripe↔Firestore entitlement sync.
 *
 * Module key canonical names:
 *   intelligence → featureFlags.intelligence
 *   pulse        → featureFlags.continuity
 *   ava          → featureFlags.receptionist
 *
 * Required env vars (server-side only):
 *   STRIPE_PRICE_INTELLIGENCE
 *   STRIPE_PRICE_PULSE
 *   STRIPE_PRICE_AVA
 */

import type { FeatureFlags } from "@/types";

// ─── Module keys ─────────────────────────────────────────────────────────────

export const MODULE_KEYS = ["intelligence", "pulse", "ava"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

/** Map module key → FeatureFlags key in Firestore clinic doc. */
export const MODULE_TO_FLAG: Record<ModuleKey, keyof FeatureFlags> = {
  intelligence: "intelligence",
  pulse: "continuity",
  ava: "receptionist",
};

// ─── Stripe Price IDs ────────────────────────────────────────────────────────

/** Get the Stripe Price ID for a module key (throws if env var missing). */
export function getPriceId(module: ModuleKey): string {
  const map: Record<ModuleKey, string | undefined> = {
    intelligence: process.env.STRIPE_PRICE_INTELLIGENCE,
    pulse: process.env.STRIPE_PRICE_PULSE,
    ava: process.env.STRIPE_PRICE_AVA,
  };
  const id = map[module];
  if (!id) {
    throw new Error(`STRIPE_PRICE_${module.toUpperCase()} env var is not set`);
  }
  return id;
}

// ─── Entitlement reconciliation ──────────────────────────────────────────────

/**
 * Given a list of subscription items (from a Stripe subscription),
 * return the full FeatureFlags object with modules set to true/false
 * based on which price IDs are present.
 */
export function flagsFromSubscriptionItems(
  items: Array<{ price: { id: string } }>
): Partial<FeatureFlags> {
  const priceToFlag: Record<string, keyof FeatureFlags> = {};

  const intelligence = process.env.STRIPE_PRICE_INTELLIGENCE;
  const pulse = process.env.STRIPE_PRICE_PULSE;
  const ava = process.env.STRIPE_PRICE_AVA;

  if (intelligence) priceToFlag[intelligence] = "intelligence";
  if (pulse) priceToFlag[pulse] = "continuity";
  if (ava) priceToFlag[ava] = "receptionist";

  // Start all false; flip true for each matched price
  const flags: Partial<FeatureFlags> = {
    intelligence: false,
    continuity: false,
    receptionist: false,
  };

  for (const item of items) {
    const flag = priceToFlag[item.price.id];
    if (flag) flags[flag] = true;
  }

  return flags;
}

// ─── Display metadata ────────────────────────────────────────────────────────

// ─── Trial helpers ────────────────────────────────────────────────────────────

export const TRIAL_DURATION_DAYS = 14;

/**
 * Compute trial end date from trialStartedAt.
 * Returns null if trialStartedAt is null/invalid (no trial granted).
 */
export function getTrialEndsAt(trialStartedAt: string | null): Date | null {
  if (!trialStartedAt) return null;
  const start = new Date(trialStartedAt);
  if (isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DURATION_DAYS);
  return end;
}

/**
 * Returns true if the clinic is currently within its 14-day trial window.
 * Demo users (clinicId === "demo-clinic") always return true.
 */
export function isTrialActive(trialStartedAt: string | null, clinicId?: string): boolean {
  if (clinicId === "demo-clinic") return true;
  const endsAt = getTrialEndsAt(trialStartedAt);
  if (!endsAt) return false;
  return Date.now() < endsAt.getTime();
}

/**
 * Days remaining in trial (rounded down). 0 if expired. null if no trial.
 */
export function trialDaysRemaining(trialStartedAt: string | null): number | null {
  const endsAt = getTrialEndsAt(trialStartedAt);
  if (!endsAt) return null;
  const ms = endsAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// ─── Display metadata ────────────────────────────────────────────────────────

export const MODULE_DISPLAY: Record<
  ModuleKey,
  { name: string; description: string; color: string; flagKey: keyof FeatureFlags }
> = {
  intelligence: {
    name: "Intelligence",
    description:
      "Clinical performance dashboard. 8 validated KPIs, revenue analytics, outcome measures, DNA analysis, and reputation tracking.",
    color: "#8B5CF6",
    flagKey: "intelligence",
  },
  pulse: {
    name: "Pulse",
    description:
      "Patient retention engine. Automated rebooking sequences, HEP reminders, churn risk detection, and comms log.",
    color: "#0891B2",
    flagKey: "continuity",
  },
  ava: {
    name: "Ava",
    description:
      "AI voice receptionist powered by Retell AI. Handles inbound calls, books appointments 24/7, and logs all interactions.",
    color: "#1C54F2",
    flagKey: "receptionist",
  },
};
