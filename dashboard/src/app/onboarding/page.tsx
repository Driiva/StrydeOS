"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plug,
  Phone,
  RefreshCw,
  Zap,
  ChevronRight,
  Check,
} from "lucide-react";

type StepId = "pms" | "ava" | "pulse" | "golive";

interface WizardStep {
  id: StepId;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

const STEPS: WizardStep[] = [
  {
    id: "pms",
    title: "Connect your PMS",
    subtitle: "Sync patient data from WriteUpp or Cliniko",
    icon: Plug,
    color: "#1A5CDB",
  },
  {
    id: "ava",
    title: "Configure Ava",
    subtitle: "Set up your AI front desk coordinator",
    icon: Phone,
    color: "#0891B2",
  },
  {
    id: "pulse",
    title: "Set up Pulse",
    subtitle: "Enable patient retention sequences",
    icon: RefreshCw,
    color: "#8B5CF6",
  },
  {
    id: "golive",
    title: "Go live",
    subtitle: "Review your setup and launch StrydeOS",
    icon: Zap,
    color: "#059669",
  },
];

const PMS_OPTIONS = [
  { id: "writeupp", label: "WriteUpp", description: "Most popular in UK private physio — 50,000+ clinicians", badge: "Recommended" },
  { id: "cliniko", label: "Cliniko", description: "Global PMS with strong UK adoption via CSP partnership", badge: null },
  { id: "tm3", label: "TM3 (Blue Zinc)", description: "Dominant in MSK and insurance-funded UK clinics", badge: "Coming soon", disabled: true },
];

const PULSE_SEQUENCES = [
  { id: "rebooking_prompt", label: "Rebooking prompt", description: "SMS when patient hasn't rebooked within 72h of their last session", defaultOn: true },
  { id: "hep_reminder", label: "HEP reminder", description: "SMS reminder to complete home exercises before next appointment", defaultOn: true },
  { id: "review_prompt", label: "Review prompt", description: "SMS requesting a Google review after discharge", defaultOn: true },
  { id: "reactivation_90d", label: "90-day reactivation", description: "Email re-engagement if patient hasn't booked in 90 days", defaultOn: false },
  { id: "reactivation_180d", label: "6-month reactivation", description: "Email re-engagement campaign after 6 months of inactivity", defaultOn: false },
  { id: "pre_auth_collection", label: "Insurance pre-auth", description: "Email reminder to obtain pre-authorisation before first session", defaultOn: true },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [selectedPms, setSelectedPms] = useState<string | null>(null);
  const [pmsApiKey, setPmsApiKey] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [enabledSequences, setEnabledSequences] = useState<Set<string>>(
    new Set(PULSE_SEQUENCES.filter((s) => s.defaultOn).map((s) => s.id))
  );

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const canProceed = currentStep === 0
    ? (selectedPms !== null && (selectedPms === "tm3" || pmsApiKey.length > 0))
    : currentStep === 1
    ? clinicPhone.length >= 10
    : true;

  function handleNext() {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (isLast) {
      router.push("/dashboard");
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function toggleSequence(id: string) {
    setEnabledSequences((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #0B2545 0%, #132D5E 60%, #1A5CDB 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-display text-sm font-bold"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            S
          </div>
          <span className="font-display text-[16px] text-white">StrydeOS</span>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          Skip setup
        </button>
      </div>

      {/* Step progress */}
      <div className="px-6 pb-2">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const done = completedSteps.has(i);
              const active = currentStep === i;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all duration-300 ${
                      done ? "bg-success text-white" : active ? "bg-white text-navy" : "bg-white/10 text-white/40"
                    }`}
                  >
                    {done ? <Check size={13} /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${done ? "bg-success/60" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 px-0.5">
            {STEPS.map((s, i) => (
              <p
                key={s.id}
                className={`text-[10px] font-medium transition-colors ${currentStep === i ? "text-white" : "text-white/30"}`}
                style={{ width: i < STEPS.length - 1 ? "auto" : "auto" }}
              >
                {s.title}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-6 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl bg-white overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.25)]"
            >
              {/* Card header */}
              <div className="px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0B2545 0%, #132D5E 100%)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${step.color}25`, border: `1px solid ${step.color}40` }}
                  >
                    <step.icon size={20} style={{ color: step.color }} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">
                      Step {currentStep + 1} of {STEPS.length}
                    </div>
                    <h2 className="font-display text-[22px] text-white leading-tight">{step.title}</h2>
                  </div>
                </div>
                <p className="text-[14px] text-white/60 leading-relaxed">{step.subtitle}</p>
              </div>

              {/* Card body */}
              <div className="p-8 space-y-5">
                {/* Step 1: Connect PMS */}
                {step.id === "pms" && (
                  <>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-navy mb-3">Select your PMS</p>
                      {PMS_OPTIONS.map((pms) => (
                        <button
                          key={pms.id}
                          onClick={() => !pms.disabled && setSelectedPms(pms.id)}
                          disabled={pms.disabled}
                          className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                            selectedPms === pms.id
                              ? "border-blue bg-blue/5"
                              : pms.disabled
                              ? "border-border/40 opacity-50 cursor-default"
                              : "border-border hover:border-blue/30"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                            selectedPms === pms.id ? "border-blue bg-blue" : "border-border"
                          }`}>
                            {selectedPms === pms.id && <Check size={11} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-navy">{pms.label}</span>
                              {pms.badge && (
                                <span className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                  pms.badge === "Recommended" ? "bg-blue/10 text-blue" : "bg-warn/10 text-warn"
                                }`}>
                                  {pms.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-muted">{pms.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedPms && selectedPms !== "tm3" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                          {PMS_OPTIONS.find((p) => p.id === selectedPms)?.label} API Key
                        </label>
                        <input
                          type="password"
                          value={pmsApiKey}
                          onChange={(e) => setPmsApiKey(e.target.value)}
                          placeholder="Paste your API key here"
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-cloud-light text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue/30 transition-colors"
                        />
                        <p className="text-[11px] text-muted mt-1.5">
                          Found in your {PMS_OPTIONS.find((p) => p.id === selectedPms)?.label} account under Settings → Integrations → API.
                        </p>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Step 2: Configure Ava */}
                {step.id === "ava" && (
                  <>
                    <div className="rounded-xl border border-blue/20 bg-blue/5 p-4 flex items-start gap-3">
                      <Phone size={16} className="text-blue mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-navy mb-0.5">Ava — your AI front desk coordinator</p>
                        <p className="text-[12px] text-muted leading-relaxed">
                          Ava handles inbound calls 24/7 — booking, rescheduling, cancellation recovery, FAQs, and insurance flagging. She sounds like she&apos;s worked at your clinic for three years.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                          Clinic phone number (Ava&apos;s number)
                        </label>
                        <input
                          type="tel"
                          value={clinicPhone}
                          onChange={(e) => setClinicPhone(e.target.value)}
                          placeholder="020 7794 0202"
                          className="w-full px-3 py-2.5 rounded-lg border border-border bg-cloud-light text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue/30 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                          Initial assessment price
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted">£</span>
                          <input
                            type="number"
                            placeholder="95"
                            className="w-32 px-3 py-2.5 rounded-lg border border-border bg-cloud-light text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue/30 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                          Follow-up appointment price
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted">£</span>
                          <input
                            type="number"
                            placeholder="75"
                            className="w-32 px-3 py-2.5 rounded-lg border border-border bg-cloud-light text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue/30 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-cloud-light p-4">
                      <p className="text-[11px] font-semibold text-navy mb-1">What Ava handles out of the box</p>
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {["New patient bookings", "Cancellation recovery", "Insurance flagging", "Emergency routing", "FAQ handling", "After-hours logging"].map((item) => (
                          <div key={item} className="flex items-center gap-1.5 text-[11px] text-muted">
                            <CheckCircle2 size={11} className="text-success shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Step 3: Set up Pulse */}
                {step.id === "pulse" && (
                  <>
                    <p className="text-sm text-muted leading-relaxed">
                      Choose which automated patient communication sequences to enable. Each fires automatically based on PMS events — no manual effort required.
                    </p>

                    <div className="space-y-2">
                      {PULSE_SEQUENCES.map((seq) => {
                        const enabled = enabledSequences.has(seq.id);
                        return (
                          <button
                            key={seq.id}
                            onClick={() => toggleSequence(seq.id)}
                            className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                              enabled ? "border-success/30 bg-success/5" : "border-border hover:border-border/80"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                              enabled ? "bg-success" : "border-2 border-border"
                            }`}>
                              {enabled && <Check size={11} className="text-white" />}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${enabled ? "text-navy" : "text-muted"}`}>{seq.label}</p>
                              <p className="text-[11px] text-muted">{seq.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-muted">
                      {enabledSequences.size} of {PULSE_SEQUENCES.length} sequences enabled. You can change these anytime from Pulse → Comms Sequences.
                    </p>
                  </>
                )}

                {/* Step 4: Go live */}
                {step.id === "golive" && (
                  <>
                    <div className="space-y-3">
                      {[
                        {
                          icon: Plug,
                          color: "#1A5CDB",
                          title: `PMS: ${selectedPms ? PMS_OPTIONS.find((p) => p.id === selectedPms)?.label ?? selectedPms : "Not configured"}`,
                          status: selectedPms ? "ready" : "skipped",
                        },
                        {
                          icon: Phone,
                          color: "#0891B2",
                          title: `Ava: ${clinicPhone ? clinicPhone : "Phone number not set"}`,
                          status: clinicPhone ? "ready" : "skipped",
                        },
                        {
                          icon: RefreshCw,
                          color: "#8B5CF6",
                          title: `Pulse: ${enabledSequences.size} sequences enabled`,
                          status: "ready" as const,
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          className={`flex items-center gap-3 p-4 rounded-xl border ${
                            item.status === "ready" ? "border-success/20 bg-success/5" : "border-warn/20 bg-warn/5"
                          }`}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${item.color}15` }}
                          >
                            <item.icon size={16} style={{ color: item.color }} />
                          </div>
                          <p className="flex-1 text-sm font-medium text-navy">{item.title}</p>
                          {item.status === "ready" ? (
                            <CheckCircle2 size={16} className="text-success shrink-0" />
                          ) : (
                            <span className="text-[10px] font-semibold text-warn uppercase tracking-wide">Skipped</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-blue/20 bg-blue/5 p-5">
                      <p className="text-sm font-semibold text-navy mb-2">What happens next</p>
                      <div className="space-y-2">
                        {[
                          "We'll run your first PMS sync within minutes of launching",
                          "Ava will be live on your phone line within 48 hours",
                          "Pulse sequences will activate automatically once patient data syncs",
                          "Your dashboard will populate with real data as it flows in",
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-muted">
                            <ChevronRight size={13} className="text-blue mt-0.5 shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-navy transition-colors disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={!canProceed && currentStep < 2}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: step.color }}
                  >
                    {isLast ? (
                      <>
                        <Zap size={14} />
                        Launch StrydeOS
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
