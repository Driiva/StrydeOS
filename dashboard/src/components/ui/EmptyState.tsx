"use client";

import type { ReactNode } from "react";
import { MonolithMark } from "@/components/MonolithLogo";

const MODULE_COLORS: Record<string, string> = {
  ava: "#1C54F2",
  pulse: "#0891B2",
  intelligence: "#8B5CF6",
  default: "#1C54F2",
};

interface EmptyStateProps {
  icon?: ReactNode;
  heading: string;
  subtext: string;
  action?: ReactNode;
  module?: "ava" | "pulse" | "intelligence";
}

export default function EmptyState({ heading, subtext, action, module }: EmptyStateProps) {
  const accentColor = MODULE_COLORS[module ?? "default"];

  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-8 text-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at 50% 40%, ${accentColor}0F, transparent 70%)`,
        }}
      />

      <div className="relative mb-6">
        <MonolithMark size={64} />
      </div>

      <h3 className="relative font-display text-2xl text-navy mb-2">{heading}</h3>
      <p className="relative text-sm text-muted max-w-md leading-relaxed mb-6">
        {subtext}
      </p>
      {action && <div className="relative">{action}</div>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-white p-6 animate-skeleton">
      <div className="h-3 w-20 bg-black/[0.06] rounded-lg mb-4" />
      <div className="h-10 w-28 bg-black/[0.06] rounded-lg mb-2" />
      <div className="h-2 w-16 bg-black/[0.06] rounded-lg" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-white p-6 animate-skeleton space-y-4">
      <div className="h-4 w-40 bg-black/[0.06] rounded-lg" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-3 w-32 bg-black/[0.06] rounded-lg" />
          <div className="h-3 w-16 bg-black/[0.06] rounded-lg" />
          <div className="h-3 w-16 bg-black/[0.06] rounded-lg" />
          <div className="h-3 w-16 bg-black/[0.06] rounded-lg" />
        </div>
      ))}
    </div>
  );
}
