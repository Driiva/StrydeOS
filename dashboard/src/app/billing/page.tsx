"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Lock,
  Loader2,
  CreditCard,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { MODULE_DISPLAY, MODULE_KEYS, getTrialEndsAt, type ModuleKey } from "@/lib/billing";
import type { StripeSubscriptionStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getIdToken(firebaseUser: { getIdToken: () => Promise<string> } | null): Promise<string | null> {
  if (!firebaseUser) return null;
  try {
    return await firebaseUser.getIdToken();
  } catch {
    return null;
  }
}

function subscriptionStatusLabel(status: StripeSubscriptionStatus | null | undefined): {
  label: string;
  color: string;
} {
  switch (status) {
    case "active":
      return { label: "Active", color: "#059669" };
    case "trialing":
      return { label: "Trial", color: "#0891B2" };
    case "past_due":
      return { label: "Payment overdue", color: "#F59E0B" };
    case "canceled":
      return { label: "Canceled", color: "#EF4444" };
    case "paused":
      return { label: "Paused", color: "#6B7280" };
    default:
      return { label: "Inactive", color: "#6B7280" };
  }
}

// ─── Module card ──────────────────────────────────────────────────────────────

interface ModuleCardProps {
  moduleKey: ModuleKey;
  isActive: boolean;
  isLoading: boolean;
  onActivate: (module: ModuleKey) => void;
}

function ModuleCard({ moduleKey, isActive, isLoading, onActivate }: ModuleCardProps) {
  const { name, description, color } = MODULE_DISPLAY[moduleKey];

  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200"
      style={{
        background: isActive
          ? "rgba(255,255,255,0.06)"
          : "rgba(255,255,255,0.03)",
        border: isActive
          ? `1px solid ${color}40`
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Module colour dot + name */}
      <div className="flex items-center gap-3">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
        />
        <h3
          className="text-[15px] font-semibold text-white"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {name}
        </h3>
        {isActive && (
          <span
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            <Check size={10} strokeWidth={2.5} />
            Active
          </span>
        )}
        {!isActive && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-white/30 uppercase tracking-wider">
            <Lock size={10} />
            Locked
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-[13px] text-white/55 leading-relaxed">{description}</p>

      {/* CTA */}
      {!isActive && (
        <button
          onClick={() => onActivate(moduleKey)}
          disabled={isLoading}
          className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all duration-150 hover:opacity-90 disabled:opacity-50"
          style={{ background: color }}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>Add {name}</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user, firebaseUser } = useAuth();
  const { hasModule, loading: entitlementLoading, trialActive, trialDaysRemaining } = useEntitlements();
  const searchParams = useSearchParams();

  const trialStartedAt = user?.clinicProfile?.trialStartedAt ?? null;
  const trialEndsAt = getTrialEndsAt(trialStartedAt);

  const [loadingModule, setLoadingModule] = useState<ModuleKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const billing = user?.clinicProfile?.billing;
  const hasActiveSubscription =
    billing?.subscriptionStatus === "active" ||
    billing?.subscriptionStatus === "trialing";

  const checkoutSuccess = searchParams.get("checkout") === "success";
  const checkoutCanceled = searchParams.get("checkout") === "canceled";
  const statusDisplay = subscriptionStatusLabel(billing?.subscriptionStatus);

  const handleActivate = useCallback(
    async (module: ModuleKey) => {
      setError(null);
      setLoadingModule(module);
      try {
        const token = await getIdToken(firebaseUser);
        if (!token) throw new Error("Not authenticated");

        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ modules: [module] }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Checkout failed");
        if (data.url) window.location.href = data.url;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoadingModule(null);
      }
    },
    [firebaseUser]
  );

  const handleManageBilling = useCallback(async () => {
    setError(null);
    setPortalLoading(true);
    try {
      const token = await getIdToken(firebaseUser);
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not open billing portal");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPortalLoading(false);
    }
  }, [firebaseUser]);

  if (entitlementLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B2545" }}>
        <Loader2 size={28} className="animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-[28px] text-white mb-2"
          style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}
        >
          Billing &amp; Modules
        </h1>
        <p className="text-[14px] text-white/45">
          Manage which StrydeOS modules your clinic has access to. Each module is billed
          separately — start with what you need and expand as you grow.
        </p>
      </div>

      {/* Checkout status banners */}
      {checkoutSuccess && (
        <div
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(5,150,105,0.12)", border: "1px solid rgba(5,150,105,0.25)", color: "#34D399" }}
        >
          <Check size={16} />
          Subscription activated. Your modules are now live.
        </div>
      )}
      {checkoutCanceled && (
        <div
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#F87171" }}
        >
          <AlertTriangle size={16} />
          Checkout was canceled. No changes were made.
        </div>
      )}
      {error && (
        <div
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#F87171" }}
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Trial status block */}
      {trialStartedAt && (
        <div
          className="mb-6 px-5 py-4 rounded-2xl"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: trialActive
              ? "1px solid rgba(245,158,11,0.20)"
              : "1px solid rgba(245,158,11,0.10)",
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: "rgba(245,158,11,0.45)" }}
          >
            Free Trial
          </p>
          {trialActive ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-white">
                  {trialDaysRemaining === 0
                    ? "Trial ends today"
                    : trialDaysRemaining === 1
                      ? "1 day remaining"
                      : `${trialDaysRemaining} days remaining`}
                </p>
                {trialEndsAt && (
                  <p className="text-[12px] mt-0.5 text-white/35">
                    Full access to all modules until{" "}
                    {trialEndsAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <span
                className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}
              >
                Active
              </span>
            </div>
          ) : (
            <p className="text-[14px] font-semibold" style={{ color: "#F87171" }}>
              Trial ended
              {!hasActiveSubscription && (
                <span className="text-[13px] font-normal ml-2" style={{ color: "rgba(248,113,113,0.60)" }}>
                  — subscribe below to restore access
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Subscription status + manage button */}
      <div
        className="mb-8 flex items-center justify-between px-5 py-4 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-1">
            Subscription
          </p>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: statusDisplay.color }}
            />
            <span className="text-[14px] font-semibold text-white">
              {statusDisplay.label}
            </span>
            {billing?.currentPeriodEnd && (
              <span className="text-[12px] text-white/35">
                · renews{" "}
                {new Date(billing.currentPeriodEnd).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {hasActiveSubscription && (
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white/70 hover:text-white transition-colors disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
          >
            {portalLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <CreditCard size={13} />
                Manage billing
                <ExternalLink size={11} className="text-white/35" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Module cards */}
      <div className="grid gap-4 sm:grid-cols-1">
        {MODULE_KEYS.map((moduleKey) => {
          const isActive = hasModule(moduleKey);
          return (
            <ModuleCard
              key={moduleKey}
              moduleKey={moduleKey}
              isActive={isActive}
              isLoading={loadingModule === moduleKey}
              onActivate={handleActivate}
            />
          );
        })}
      </div>

      {/* Pricing note */}
      <p className="mt-8 text-center text-[11px] text-white/25">
        Pricing is configured per plan. Contact your StrydeOS account manager for a quote.
        Subscriptions are billed monthly and can be adjusted at any time.
      </p>
    </div>
  );
}
