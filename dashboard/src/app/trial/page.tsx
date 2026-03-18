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
  Check,
  Clock,
  BarChart3,
  Phone,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { StrydeOSLogo } from "@/components/MonolithLogo";
import { trackCTAClick } from "@/lib/funnel-events";

// ─── Trial info panel ────────────────────────────────────────────────────────

const TRIAL_MODULES = [
  {
    name: "Intelligence",
    description: "Clinical performance dashboard with 8 validated KPIs",
    color: "#8B5CF6",
    icon: BarChart3,
  },
  {
    name: "Ava",
    description: "AI voice receptionist — handles calls and books 24/7",
    color: "#1C54F2",
    icon: Phone,
  },
  {
    name: "Pulse",
    description: "Patient retention engine — automated follow-up sequences",
    color: "#0891B2",
    icon: Activity,
  },
];

function TrialInfoPanel() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="text-[11px] font-semibold text-navy/60 uppercase tracking-widest mb-4">
        Your free trial includes
      </div>

      {/* Trial duration */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue/5 border border-blue/10 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center shrink-0">
          <Clock size={18} className="text-blue" />
        </div>
        <div>
          <div className="text-[14px] font-semibold text-navy">
            14 days free access
          </div>
          <div className="text-[12px] text-navy/50">
            All three modules. No credit card required.
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="space-y-3 mb-5">
        {TRIAL_MODULES.map(({ name, description, color, icon: Icon }) => (
          <div key={name} className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${color}12` }}
            >
              <Icon size={15} style={{ color }} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-navy">{name}</div>
              <div className="text-[12px] text-navy/50 leading-relaxed">
                {description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* What happens after */}
      <div className="border-t border-border pt-4">
        <div className="text-[11px] font-semibold text-navy/60 uppercase tracking-widest mb-3">
          After 14 days
        </div>
        <div className="space-y-2">
          {[
            "Trial ends automatically — no surprise charges",
            "Choose modules and plan that fit your clinic",
            "All your data carries over to paid plan",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check size={12} className="text-success shrink-0" />
              <span className="text-[11px] text-navy/50">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type Step = "form" | "creating_account" | "success" | "error";

function TrialPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isFirebaseConfigured } = useAuth();
  const shouldReduce = useReducedMotion();

  // Form state
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profession, setProfession] = useState("");
  const [clinicSize, setClinicSize] = useState("");
  const [country, setCountry] = useState("uk");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");

  // If user is already authenticated, redirect to dashboard (same as login)
  useEffect(() => {
    if (!authLoading && user) {
      const dest =
        user.role === "superadmin" ? "/admin" : "/dashboard";
      router.replace(dest);
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("creating_account");
    trackCTAClick("Start free trial", "trial_page");

    try {
      // Create account via existing signup API with trial source marker
      const res = await fetch("/api/clinic/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: clinicName.trim(),
          email: email.trim(),
          password,
          profession,
          clinicSize,
          country,
          source: "trial",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(
            "An account with this email already exists. Please sign in instead."
          );
          setStep("error");
          return;
        }
        setError(data.error || "Account creation failed. Please try again.");
        setStep("error");
        return;
      }

      // Sign in to establish session
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

      // Show success, then redirect to onboarding (same destination as login signup)
      setStep("success");
      setTimeout(() => router.push("/onboarding"), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStep("error");
    }
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud-dancer">
        <Loader2 size={24} className="animate-spin text-muted" />
      </div>
    );
  }

  // Already authenticated — redirect handled by useEffect
  if (user) return null;

  // ─── Success state ────────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center bg-cloud-dancer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-success">
            <Check size={22} className="text-white" strokeWidth={3} />
          </div>
          <p className="text-sm font-medium text-muted">
            Trial activated — setting up your clinic...
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // ─── Creating account state ───────────────────────────────────────────────

  if (step === "creating_account") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cloud-dancer">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue/10 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-blue" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-navy">
              Creating your account...
            </p>
            <p className="text-[13px] text-muted mt-1">
              Setting up your 14-day trial
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  const canSubmit =
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
              Start your 14-day free trial
            </h1>
            <p className="text-sm text-navy/60 mt-2">
              Full access to every module. No credit card. No commitment.
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
                                href="/login?mode=signin"
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
                  Start free trial
                  <ArrowRight size={14} />
                </motion.button>
              </form>

              <p className="text-center text-[12px] text-muted mt-5">
                Already have an account?{" "}
                <a
                  href="/login?mode=signin"
                  className="text-blue font-semibold hover:underline"
                >
                  Sign in
                </a>
              </p>
            </div>

            {/* Right — Trial Info */}
            <div className="lg:sticky lg:top-8">
              <TrialInfoPanel />
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

export default function TrialPage() {
  return <TrialPageInner />;
}
