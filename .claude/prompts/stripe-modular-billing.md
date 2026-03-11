# Stripe integration — modular billing (StrydeOS)

Use this prompt when implementing Stripe for StrydeOS. Read CLAUDE.md first for product and stack context.

---

## Goal

Add Stripe so StrydeOS can charge for access **by module**, not the full suite. New users do **not** get Ava, Pulse, and Intelligence by default. They might start on Intelligence only and add Ava or Pulse later. Billing must support:

- **Base plan** — at least one module (e.g. Intelligence-only, or a “suite” tier if we offer it).
- **Add-ons** — additional modules (Ava, Pulse) that can be attached to an existing subscription.

Access control in the app should be driven by **which modules the clinic’s Stripe subscription entitles them to** (e.g. stored in Firestore, updated by Stripe webhooks).

## Product context

- **Modules (names locked):** Ava (voice), Pulse (retention), Intelligence (dashboard). See CLAUDE.md for colours and roles.
- **Multi-tenant:** Data is partitioned by `clinicId`. Billing is per clinic (or per-seat later; out of scope for this prompt).
- **Stack:** Next.js/React, Firebase (Auth + Firestore), Vercel. No existing Stripe or billing code.

## What to design and implement

1. **Stripe model**  
   Choose and justify: Stripe Billing (Products/Prices, Subscriptions) with either (a) one Product per module + subscription with multiple subscription items, or (b) a single Product with metered/quantity-based add-ons. Prefer the approach that makes “add module X to existing subscription” and “remove module X” straightforward and consistent with Stripe’s APIs.

2. **Checkout / Customer Portal**  
   - New clinic onboarding: create Stripe Customer (if not exists), then Checkout Session or Customer Portal for the initial plan (e.g. Intelligence-only).  
   - Existing clinic adding a module: add the corresponding Price to their subscription (or equivalent) and optionally use Customer Portal for self-serve add/remove.

3. **Webhooks**  
   - Subscribe to the events needed to keep “what this clinic pays for” in sync with Stripe (e.g. `customer.subscription.created/updated/deleted`, and any invoice events you rely on).  
   - Persist entitlements (e.g. `clinicId` → list of active module keys like `intelligence`, `ava`, `pulse`) in Firestore so the app can gate module access without calling Stripe on every request.

4. **App-side access control**  
   - Define where and how the app checks “does this clinic have module X?” (e.g. Firestore `clinics/{clinicId}` or a dedicated `entitlements` doc).  
   - Ensure dashboard/navigation and any module-specific routes or APIs respect these entitlements (no full-suite assumption).

5. **Security and env**  
   - Use Stripe env vars (e.g. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`); never commit keys.  
   - Validate webhook signatures; idempotency where it matters.  
   - Do not touch Firebase Auth or existing PMS integrations; only add billing and entitlement reads.

## Out of scope for this prompt

- Exact pricing (e.g. £/month per module) — use placeholder prices or env-driven config.  
- Per-seat or usage-based pricing — can be a follow-up.  
- Marketing site or ROI calculator — see CLAUDE.md “What not to build.”

## Deliverables

- Short design note: chosen Stripe model (products/prices/subscriptions) and how add-ons are represented.
- Implementation: Stripe Customer + Checkout or Portal flow, webhook handler(s), Firestore schema and writes for entitlements, and app-side checks that restrict access by module.
- README or inline comments on required env vars and how to test (e.g. Stripe CLI for webhooks).
