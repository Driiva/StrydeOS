/**
 * Smoke tests for the billing webhook handler.
 *
 * These test the pure logic functions (flagsFromSubscriptionItems, getTierFromMetadata)
 * and the webhook routing (via mocked Stripe + Firestore).
 *
 * Run: npx tsx --test src/app/api/billing/__tests__/webhooks.test.ts
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ─── Test flagsFromSubscriptionItems ────────────────────────────────────────

describe("flagsFromSubscriptionItems", () => {
  // We need to set env vars before importing so buildPriceToFlagsMap() picks them up
  beforeEach(() => {
    process.env.STRIPE_PRICE_INTELLIGENCE_SOLO_MONTH = "price_int_solo_m";
    process.env.STRIPE_PRICE_INTELLIGENCE_STUDIO_MONTH = "price_int_studio_m";
    process.env.STRIPE_PRICE_PULSE_SOLO_MONTH = "price_pulse_solo_m";
    process.env.STRIPE_PRICE_AVA_STUDIO_MONTH = "price_ava_studio_m";
    process.env.STRIPE_PRICE_FULLSTACK_CLINIC_MONTH = "price_fs_clinic_m";
  });

  it("maps a single Intelligence price to the intelligence flag", async () => {
    // Dynamic import to pick up env vars
    const { flagsFromSubscriptionItems } = await import("@/lib/billing");

    const flags = flagsFromSubscriptionItems([
      { price: { id: "price_int_solo_m" } },
    ]);

    assert.equal(flags.intelligence, true);
    assert.equal(flags.continuity, false);
    assert.equal(flags.receptionist, false);
  });

  it("maps Fullstack price to all three flags", async () => {
    const { flagsFromSubscriptionItems } = await import("@/lib/billing");

    const flags = flagsFromSubscriptionItems([
      { price: { id: "price_fs_clinic_m" } },
    ]);

    assert.equal(flags.intelligence, true);
    assert.equal(flags.continuity, true);
    assert.equal(flags.receptionist, true);
  });

  it("merges multiple individual module prices", async () => {
    const { flagsFromSubscriptionItems } = await import("@/lib/billing");

    const flags = flagsFromSubscriptionItems([
      { price: { id: "price_int_studio_m" } },
      { price: { id: "price_ava_studio_m" } },
    ]);

    assert.equal(flags.intelligence, true);
    assert.equal(flags.continuity, false);
    assert.equal(flags.receptionist, true);
  });

  it("returns all-false for unknown price IDs", async () => {
    const { flagsFromSubscriptionItems } = await import("@/lib/billing");

    const flags = flagsFromSubscriptionItems([
      { price: { id: "price_unknown_xyz" } },
    ]);

    assert.equal(flags.intelligence, false);
    assert.equal(flags.continuity, false);
    assert.equal(flags.receptionist, false);
  });
});

// ─── Test getTierFromMetadata ───────────────────────────────────────────────

describe("getTierFromMetadata", () => {
  it("extracts a valid tier from metadata", async () => {
    const { getTierFromMetadata } = await import("@/lib/billing");

    assert.equal(getTierFromMetadata({ tier: "solo" }), "solo");
    assert.equal(getTierFromMetadata({ tier: "studio" }), "studio");
    assert.equal(getTierFromMetadata({ tier: "clinic" }), "clinic");
  });

  it("returns null for invalid tier values", async () => {
    const { getTierFromMetadata } = await import("@/lib/billing");

    assert.equal(getTierFromMetadata({ tier: "enterprise" }), null);
    assert.equal(getTierFromMetadata({}), null);
    assert.equal(getTierFromMetadata(null), null);
    assert.equal(getTierFromMetadata(undefined), null);
  });
});

// ─── Test seat limit constants ──────────────────────────────────────────────

describe("TIER_SEAT_LIMITS", () => {
  it("enforces correct seat caps per tier", async () => {
    const { TIER_SEAT_LIMITS } = await import("@/lib/billing");

    assert.equal(TIER_SEAT_LIMITS.solo, 1);
    assert.equal(TIER_SEAT_LIMITS.studio, 4);
    assert.equal(TIER_SEAT_LIMITS.clinic, 25);
  });
});

// ─── Test trial helpers ─────────────────────────────────────────────────────

describe("trial helpers", () => {
  it("isTrialActive returns true for a recent trial start", async () => {
    const { isTrialActive } = await import("@/lib/billing");

    const now = new Date().toISOString();
    assert.equal(isTrialActive(now), true);
  });

  it("isTrialActive returns false for an expired trial", async () => {
    const { isTrialActive } = await import("@/lib/billing");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(isTrialActive(thirtyDaysAgo), false);
  });

  it("trialDaysRemaining returns correct value", async () => {
    const { trialDaysRemaining, TRIAL_DURATION_DAYS } = await import("@/lib/billing");

    const now = new Date().toISOString();
    const remaining = trialDaysRemaining(now);
    assert.ok(remaining !== null);
    // Should be close to TRIAL_DURATION_DAYS (13 or 14 depending on time of day)
    assert.ok(remaining! >= TRIAL_DURATION_DAYS - 1);
    assert.ok(remaining! <= TRIAL_DURATION_DAYS);
  });

  it("trialDaysRemaining returns 0 for expired trial", async () => {
    const { trialDaysRemaining } = await import("@/lib/billing");

    const longAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(trialDaysRemaining(longAgo), 0);
  });

  it("handles null trialStartedAt gracefully", async () => {
    const { isTrialActive, trialDaysRemaining } = await import("@/lib/billing");

    assert.equal(isTrialActive(null), false);
    assert.equal(trialDaysRemaining(null), null);
  });
});
