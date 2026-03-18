"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  AlertCircle,
  Loader2,
  ArrowRight,
  Building2,
  CreditCard,
  Check,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { StrydeOSLogo } from "@/components/MonolithLogo";
import { trackCTAClick } from "@/lib/funnel-events";
import {
  MODULE_DISPLAY,
  MODULE_KEYS,
  MODULE_PRICING,
  TIER_KEYS,
  TIER_LABELS,
  INTERVAL_KEYS,
  formatGBP,
  type ModuleKey,
  type TierKey,
  type BillingInterval,
  type ProductKey,
} from "@/lib/billing";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "form" | "creating_account" | "redirecting" | "error";

const VALID_PRODUCTS: readonly string[] = [...MODULE_KEYS, "fullstack"];

function isValidProduct(v: string): v is ProductKey {
  return VALID_PRODUCTS.includes(v);
}

// ─── Order Summary ───────────────────────────────────────────────────────────

function OrderSummary({
  product,
  tier,
  interval,
}: {
  product: ProductKey;
  tier: TierKey;
  interval: BillingInterval;
}) {
  const pricing = MODULE_PRICING[product][tier][interval];
  const isFullStack = product === "fullstack";
  const displayInfo = isFullStack
    ? { name: "Full Stack", description: "Intelligence + Pulse + Ava — all three modules.", color: "#1C54F2" }
    : MODULE_DISPLAY[product as ModuleKey];
  const tierLabel = TIER_LABELS[tier];

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="text-[11px] font-semibold text-navy/60 uppercase tracking-widest mb-4">
        Order summary
      </div>

      {/* Module badge */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${displayInfo.color}15` }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: displayInfo.color }}
          />
        </div>
        <div>
          <div className="text-[15px] font-semibold text-navy">
            {displayInfo.name}
          </div>
          <div className="text-[12px] text-muted">
            {tierLabel.label} · {tierLabel.detail}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-navy/60 leading-relaxed mb-6">
        {displayInfo.description}
      </p>

      {/* Price */}
      <div className="border-t border-border pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-navy/60">
            {interval === "month" ? "Monthly" : "Annual"} subscription
          </span>
          <span className="text-[20px] font-semibold text-navy font-display">
            {formatGBP(pricing)}
          </span>
        </div>
        <div className="text-[11px] text-muted mt-1">
          per {interval === "month" ? "month" : "year"}
          {interval === "year" && (
            <span className="ml-2 text-success font-semibold">Save 20%</span>
          )}
        </div>
      </div>

      {/* Trial note */}
      <div className="mt-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-success/8 border border-success/15">
        <ShieldCheck size={14} className="text-success mt-0.5 shrink-0" />
        <div className="text-[12px] text-success leading-relaxed">
          <span className="font-semibold">14-day free trial included.</span>{" "}
          You won&apos;t be charged until the trial ends. Cancel anytime.
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-5 space-y-2">
        {[
          "Secure payment via Stripe",
          "Cancel or change plan anytime",
          "No setup fees",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <Check size={12} className="text-success shrink-0" />
            <span className="text-[11px] text-navy/50">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isFirebaseConfigured } = useAuth();
  const shouldReduce = useReducedMotion();

  // Parse query params
  const moduleParam = searchParams.get("module") ?? "";
  const tierParam = searchParams.get("tier") ?? "studio";
  const intervalParam = searchParams.get("interval") ?? "month";

  const product: ProductKey | null = isValidProduct(moduleParam) ? moduleParam : null;
  const tier: TierKey = (TIER_KEYS as readonly string[]).includes(tierParam)
    ? (tierParam as TierKey)
    : "studio";
  const interval: BillingInterval = (INTERVAL_KEYS as readonly string[]).includes(intervalParam)
    ? (intervalParam as BillingInterval)
    : "month";

  // Form state
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profession, setProfession] = useState("");
  const [clinicSize, setClinicSize] = useState("");
  const [country, setCountry] = useState("uk");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");

  // If user is already authenticated, skip signup and go straight to Stripe
  useEffect(() => {
    if (!authLoading && user && product && step === "form") {
      handleAuthenticatedCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function handleAuthenticatedCheckout() {
    if (!product) return;
    setStep("redirecting");
    setError(null);

    try {
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        setError("Session expired. Please sign in.");
        setStep("error");
        return;
      }

      const token = await currentUser.getIdToken();
      const includeAvaSetup = product === "ava" || product === "fullstack";

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modules: [product],
          tier,
          interval,
          includeAvaSetup,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create checkout session.");
        setStep("error");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;

    setError(null);
    setStep("creating_account");
    trackCTAClick("Buy now — create account", "checkout_page");

    try {
      // Step 1: Create account
      const signupRes = await fetch("/api/clinic/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: clinicName.trim(),
          email: email.trim(),
          password,
          profession,
          clinicSize,
          country,
        }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        if (signupRes.status === 409) {
          setError(
            "An account with this email already exists. Please sign in first, then complete your purchase."
          );
          setStep("error");
          return;
        }
        setError(signupData.error || "Account creation failed. Please try again.");
        setStep("error");
        return;
      }

      // Step 2: Sign in to get auth token
      const auth = getFirebaseAuth();
      if (!auth) {
        setError("Authentication is not configured.");
        setStep("error");
        return;
      }

      await signInWithEmailAndPassword(auth, email.trim(), password);

      try {
        localStorage.setItem("strydeos_last_email", email.trim());
      } catch {
        // localStorage unavailable
      }

      // Step 3: Create Stripe checkout session
      setStep("redirecting");

      const token = await auth.currentUser!.getIdToken();
      const includeAvaSetup = product === "ava" || product === "fullstack";

      const checkoutRes = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          modules: [product],
          tier,
          interval,
          includeAvaSetup,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        // Account was created successfully — redirect to billing page as fallback
        router.push(`/billing?module=${product}`);
        return;
      }

      // Step 4: Redirect to Stripe
      window.location.href = checkoutData.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStep("error");
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud-dancer">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  // ─── Invalid module ──────────────────────────────────────────────────────────

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-cloud-dancer">
        <header className="flex items-center justify-between px-6 py-4">
          <StrydeOSLogo size={34} fontSize={17} theme="light" gap={10} />
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-[400px] text-center">
            <div className="rounded-2xl p-8 bg-white border border-border shadow-[var(--shadow-elevated)]">
              <AlertCircle size={32} className="text-muted mx-auto mb-4" />
              <h1 className="font-display text-[24px] text-navy leading-tight mb-2">
                No module selected
              </h1>
              <p className="text-sm text-muted mb-6">
                Please choose a module from our pricing page to continue.
              </p>
              <a
                href="https://strydeos.com/#pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue hover:opacity-90 transition-all"
              >
                View pricing
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Processing states (creating account / redirecting) ────────────────────

  if (step === "creating_account" || step === "redirecting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud-dancer">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue/10 flex items-center justify-center">
            {step === "creating_account" ? (
              <Loader2 size={24} className="animate-spin text-blue" />
            ) : (
              <CreditCard size={24} className="text-blue" />
            )}
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-navy">
              {step === "creating_account"
                ? "Creating your account..."
                : "Redirecting to payment..."}
            </p>
            <p className="text-[13px] text-muted mt-1">
              {step === "creating_account"
                ? "Setting up your clinic workspace"
                : "Taking you to Stripe to complete your purchase"}
            </p>
          </div>
          {step === "redirecting" && (
            <Loader2 size={16} className="animate-spin text-muted mt-2" />
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Form + Order Summary ──────────────────────────────────────────────────

  const formDisabled = step !== "form" && step !== "error";
  const canSubmit =
    !formDisabled &&
    clinicName.trim() &&
    email.trim() &&
    password.length >= 8 &&
    profession &&
    clinicSize;

  const fadeUp = shouldReduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen flex flex-col bg-cloud-dancer">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-cloud-dancer">
        <StrydeOSLogo size={34} fontSize={17} theme="light" gap={10} />
        <a
          href="/login?mode=signin"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-navy border border-border hover:border-navy/30 hover:bg-cloud-light transition-colors"
        >
          Sign in
          <ArrowRight size={14} />
        </a>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-[880px]">
          <motion.div
            className="text-center mb-8"
            {...fadeUp}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <h1 className="font-display text-[28px] text-navy leading-tight">
              Complete your purchase
            </h1>
            <p className="text-sm text-navy/60 mt-2">
              Create your account and start your 14-day free trial
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start"
            {...fadeUp}
            transition={{
              duration: 0.4,
              delay: shouldReduce ? 0 : 0.1,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            {/* Left — Signup Form */}
            <div className="rounded-2xl p-6 bg-white border border-border shadow-[var(--shadow-elevated)]">
              <div className="text-[11px] font-semibold text-navy/60 uppercase tracking-widest mb-5">
                Create your account
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-semibold text-navy/80 uppercase tracking-widest mb-2">
                    Clinic name
                  </label>
                  <div className="relative">
                    <Building2
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      required
                      autoFocus
                      placeholder="Your clinic name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-navy placeholder-muted border border-border bg-cloud-light focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-navy/80 uppercase tracking-widest mb-2">
                      Profession
                    </label>
                    <select
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm text-navy border border-border bg-cloud-light focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all appearance-none"
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      <option value="physiotherapist">Physiotherapist</option>
                      <option value="osteopath">Osteopath</option>
                      <option value="chiropractor">Chiropractor</option>
                      <option value="sports_therapist">Sports Therapist</option>
                      <option value="personal_trainer_medical">
                        Personal Trainer (Medical)
                      </option>
                      <option value="gp_primary_care">GP / Primary Care</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-navy/80 uppercase tracking-widest mb-2">
                      Clinic size
                    </label>
                    <select
                      value={clinicSize}
                      onChange={(e) => setClinicSize(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm text-navy border border-border bg-cloud-light focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all appearance-none"
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      <option value="solo">Solo (1 practitioner)</option>
                      <option value="small">Small (2–5)</option>
                      <option value="midsize">Mid-size (6–10)</option>
                      <option value="large">Large (10+)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-navy/80 uppercase tracking-widest mb-2">
                    Country / Region
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-navy border border-border bg-cloud-light focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all appearance-none"
                  >
                    <option value="uk">United Kingdom / EU</option>
                    <option value="us">United States</option>
                    <option value="au">Australia</option>
                    <option value="ca">Canada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-navy/80 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@clinic.com"
                    className="w-full px-4 py-3 rounded-xl text-sm text-navy placeholder-muted border border-border bg-cloud-light focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-navy/80 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-3 rounded-xl text-sm text-navy placeholder-muted border border-border bg-cloud-light focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-danger/10 border border-danger/20">
                        <AlertCircle
                          size={14}
                          className="text-danger mt-0.5 shrink-0"
                        />
                        <div className="text-[13px] text-danger">
                          <p>{error}</p>
                          {step === "error" &&
                            error.includes("already exists") && (
                              <a
                                href={`/login?mode=signin&next=/billing?module=${product}`}
                                className="inline-block mt-2 text-blue font-semibold hover:underline"
                              >
                                Sign in instead →
                              </a>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white bg-blue transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
                  whileTap={shouldReduce ? {} : { scale: 0.97 }}
                >
                  <CreditCard size={15} />
                  Create account & continue to payment
                  <ArrowRight size={14} />
                </motion.button>
              </form>

              <p className="text-center text-[12px] text-muted mt-5">
                Already have an account?{" "}
                <a
                  href={`/login?mode=signin&next=/billing?module=${product}`}
                  className="text-blue font-semibold hover:underline"
                >
                  Sign in
                </a>
              </p>
            </div>

            {/* Right — Order Summary */}
            <div className="lg:sticky lg:top-8">
              <OrderSummary product={product} tier={tier} interval={interval} />
            </div>
          </motion.div>

          <p className="text-center text-[11px] text-muted mt-8">
            StrydeOS — Clinical Performance Platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <CheckoutPageInner />;
}
