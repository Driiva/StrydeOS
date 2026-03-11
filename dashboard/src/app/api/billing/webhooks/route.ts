/**
 * POST /api/billing/webhooks
 *
 * Stripe webhook endpoint. Keeps Firestore featureFlags in sync with
 * the clinic's active Stripe subscription items.
 *
 * Stripe events handled:
 *   customer.subscription.created  → activate modules
 *   customer.subscription.updated  → update modules (add/remove)
 *   customer.subscription.deleted  → deactivate all modules
 *   invoice.payment_failed         → mark billing status (does NOT revoke access)
 *
 * Required env vars:
 *   STRIPE_WEBHOOK_SECRET  — whsec_... from Stripe Dashboard or CLI
 *
 * To test locally:
 *   stripe listen --forward-to localhost:3000/api/billing/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { flagsFromSubscriptionItems } from "@/lib/billing";
import type { StripeSubscriptionStatus } from "@/types";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error("[Billing webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Billing webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        break;
    }
  } catch (err) {
    // Return 200 to prevent Stripe retrying non-recoverable errors
    console.error(`[Billing webhook] Error processing ${event.type}:`, err);
  }

  return NextResponse.json({ received: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findClinicByCustomerId(customerId: string): Promise<{ id: string } | null> {
  const db = getAdminDb();
  const snap = await db
    .collection("clinics")
    .where("billing.stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { id: snap.docs[0].id };
}

function resolveCustomerId(customer: Stripe.Subscription["customer"]): string {
  return typeof customer === "string" ? customer : customer.id;
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const customerId = resolveCustomerId(subscription.customer);

  const clinic = await findClinicByCustomerId(customerId);
  if (!clinic) {
    console.warn(`[Billing webhook] No clinic found for Stripe customer ${customerId}`);
    return;
  }

  const items = subscription.items.data.map((item) => ({
    price: { id: typeof item.price === "string" ? item.price : item.price.id },
  }));

  const updatedFlags = flagsFromSubscriptionItems(items);
  const status = subscription.status as StripeSubscriptionStatus;
  const now = new Date().toISOString();

  const db = getAdminDb();
  await db
    .collection("clinics")
    .doc(clinic.id)
    .update({
      featureFlags: updatedFlags,
      billing: {
        stripeCustomerId: customerId,
        subscriptionId: subscription.id,
        subscriptionStatus: status,
        // billing_cycle_anchor is the anchor timestamp in Stripe v20 (replaces current_period_end)
        currentPeriodEnd: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
      },
      updatedAt: now,
    });

  console.log(
    `[Billing webhook] Clinic ${clinic.id} — sub ${subscription.id} ${status}. Flags:`,
    updatedFlags
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = resolveCustomerId(subscription.customer);

  const clinic = await findClinicByCustomerId(customerId);
  if (!clinic) {
    console.warn(`[Billing webhook] No clinic for customer ${customerId} (delete)`);
    return;
  }

  const now = new Date().toISOString();
  const db = getAdminDb();

  await db
    .collection("clinics")
    .doc(clinic.id)
    .update({
      featureFlags: {
        intelligence: false,
        continuity: false,
        receptionist: false,
      },
      billing: {
        stripeCustomerId: customerId,
        subscriptionId: subscription.id,
        subscriptionStatus: "canceled",
        currentPeriodEnd: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
      },
      updatedAt: now,
    });

  console.log(`[Billing webhook] Clinic ${clinic.id} — subscription canceled, all modules revoked`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const clinic = await findClinicByCustomerId(customerId);
  if (!clinic) return;

  // In Stripe v20 the subscription lives under invoice.parent.subscription_details.subscription
  const parent = invoice.parent as
    | { type: string; subscription_details?: { subscription?: string | Stripe.Subscription } }
    | null;
  const subscriptionRaw = parent?.subscription_details?.subscription;
  const subscriptionId =
    subscriptionRaw == null
      ? null
      : typeof subscriptionRaw === "string"
        ? subscriptionRaw
        : subscriptionRaw.id;

  const db = getAdminDb();
  await db
    .collection("clinics")
    .doc(clinic.id)
    .update({
      "billing.subscriptionStatus": "past_due",
      ...(subscriptionId ? { "billing.subscriptionId": subscriptionId } : {}),
      updatedAt: new Date().toISOString(),
    });

  console.warn(`[Billing webhook] Clinic ${clinic.id} — payment failed, marked past_due`);
}
