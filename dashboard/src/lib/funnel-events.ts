/**
 * Funnel event tracking for StrydeOS.
 *
 * Lightweight event layer that logs to Firestore for internal analytics.
 * Can be extended to PostHog/Mixpanel later by wrapping the track() call.
 *
 * Events:
 *   cta_clicked        — website CTA click (source variant + button label)
 *   trial_requested    — trial request form submitted
 *   signup_complete    — /api/clinic/signup succeeded
 *   onboarding_started — first authenticated visit to /onboarding or /dashboard
 *   integration_attempted — PMS test connection attempted
 *   integration_blocked   — PMS connection failed, user requested assist or fell back
 *   fallback_live      — CSV import succeeded as PMS fallback
 *   first_value_reached — first non-demo metrics_weekly read
 *   subscription_activated — Stripe webhook confirms active subscription
 */

import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export type FunnelEvent =
  | "cta_clicked"
  | "trial_requested"
  | "signup_complete"
  | "onboarding_started"
  | "integration_attempted"
  | "integration_blocked"
  | "fallback_live"
  | "first_value_reached"
  | "subscription_activated";

interface EventPayload {
  event: FunnelEvent;
  clinicId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackFunnelEvent(payload: EventPayload): Promise<void> {
  try {
    if (!db) return;
    await addDoc(collection(db, "funnel_events"), {
      ...payload,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // Non-blocking — never let analytics break the user flow
  }
}

export function trackCTAClick(label: string, source?: string): void {
  trackFunnelEvent({
    event: "cta_clicked",
    metadata: { label, source: source ?? "website" },
  });
}
