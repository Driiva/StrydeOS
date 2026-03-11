/**
 * POST /api/billing/checkout
 *
 * Creates a Stripe Checkout Session for the initial module subscription.
 * Use this when the clinic has no active subscription yet.
 * For managing an existing subscription (add/remove modules), use /api/billing/portal.
 *
 * Body: { modules: Array<"intelligence" | "pulse" | "ava"> }
 * Returns: { url: string }
 *
 * Requires: Authorization: Bearer <Firebase ID token> (owner or admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyApiRequest, requireRole, handleApiError } from "@/lib/auth-guard";
import { getStripe } from "@/lib/stripe";
import { getPriceId, MODULE_KEYS, type ModuleKey } from "@/lib/billing";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyApiRequest(request);
    requireRole(user, ["owner", "admin", "superadmin"]);

    const { clinicId } = user;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic associated with this account" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const modules: ModuleKey[] = (body.modules ?? []).filter((m: string) =>
      (MODULE_KEYS as readonly string[]).includes(m)
    );

    if (modules.length === 0) {
      return NextResponse.json({ error: "At least one module must be selected" }, { status: 400 });
    }

    const stripe = getStripe();
    const db = getAdminDb();
    const clinicRef = db.collection("clinics").doc(clinicId);
    const clinicSnap = await clinicRef.get();

    if (!clinicSnap.exists) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    const clinicData = clinicSnap.data()!;
    let stripeCustomerId: string | null = clinicData.billing?.stripeCustomerId ?? null;

    // Create Stripe Customer if this clinic doesn't have one yet
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: clinicData.ownerEmail ?? user.email,
        name: clinicData.name ?? clinicId,
        metadata: { clinicId },
      });
      stripeCustomerId = customer.id;

      // Persist immediately so parallel requests don't create duplicates
      await clinicRef.set(
        { billing: { stripeCustomerId, subscriptionId: null, subscriptionStatus: null, currentPeriodEnd: null } },
        { merge: true }
      );
    }

    // Build line items from selected modules
    const lineItems = modules.map((module) => ({
      price: getPriceId(module),
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: lineItems,
      success_url: `${APP_URL}/billing?checkout=success`,
      cancel_url: `${APP_URL}/billing?checkout=canceled`,
      metadata: { clinicId },
      subscription_data: {
        metadata: { clinicId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleApiError(e);
  }
}
