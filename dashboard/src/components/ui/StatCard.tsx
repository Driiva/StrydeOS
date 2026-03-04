"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { StatCardProps } from "@/types";
import { ChevronUp, ChevronDown, Minus, AlertTriangle } from "lucide-react";

const STATUS_COLORS: Record<string, { dot: string; glow: string }> = {
  ok:      { dot: "#059669", glow: "rgba(5,150,105,0.45)" },
  warn:    { dot: "#F59E0B", glow: "rgba(245,158,11,0.45)" },
  danger:  { dot: "#EF4444", glow: "rgba(239,68,68,0.45)" },
  neutral: { dot: "#6B7280", glow: "rgba(107,114,128,0.2)" },
};

const TREND_COLORS: Record<string, string> = {
  up: "#059669",
  down: "#EF4444",
  warn: "#F59E0B",
  flat: "#6B7280",
};

function useCountUp(rawTarget: string | number, duration = 800): string {
  const target = String(rawTarget);
  const numericPart = parseFloat(target.replace(/[^0-9.\-]/g, ""));
  const isNumeric = !isNaN(numericPart);
  const prefix = isNumeric ? target.match(/^[^0-9.\-]*/)?.[0] ?? "" : "";
  const suffix = isNumeric ? target.match(/[^0-9.\-]*$/)?.[0] ?? "" : "";
  const decimals = target.includes(".") ? (target.split(".")[1]?.replace(/[^0-9]/g, "").length ?? 0) : 0;

  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const animate = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = numericPart * eased;

    setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [numericPart, prefix, suffix, decimals, duration]);

  useEffect(() => {
    if (!isNumeric) {
      setDisplay(target);
      return;
    }
    setDisplay(`${prefix}${(0).toFixed(decimals)}${suffix}`);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, isNumeric, prefix, suffix, decimals, animate]);

  return display;
}

export default function StatCard({
  label,
  value,
  unit,
  target,
  benchmark,
  trend,
  status,
  insight,
  onClick,
  progress,
}: StatCardProps) {
  const dotStyle = STATUS_COLORS[status] ?? STATUS_COLORS.neutral;
  const animatedValue = useCountUp(value);

  const TrendIcon = trend === "up"
    ? ChevronUp
    : trend === "down"
      ? ChevronDown
      : trend === "warn"
        ? AlertTriangle
        : Minus;

  const trendColor = TREND_COLORS[trend ?? "flat"];

  const progressFill = status === "warn" || status === "danger"
    ? "#F59E0B"
    : undefined;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-[var(--radius-card)] bg-white border border-border shadow-[var(--shadow-card)] overflow-hidden transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5" : ""
      }`}
    >
      {/* Status dot — top right */}
      <div
        className="absolute top-4 right-4 w-[6px] h-[6px] rounded-full"
        style={{
          backgroundColor: dotStyle.dot,
          boxShadow: `0 0 6px ${dotStyle.glow}`,
        }}
      />

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-[0.12em]">
            {label}
          </span>
          {benchmark && (
            <span className="text-[10px] font-semibold text-muted bg-cloud-dark/60 px-2 py-0.5 rounded-full">
              {benchmark}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-display text-5xl text-navy leading-none">
            {animatedValue}
          </span>
          {unit && (
            <span className="text-xs text-muted font-medium">{unit}</span>
          )}
          {trend && (
            <TrendIcon size={16} color={trendColor} strokeWidth={2.5} />
          )}
        </div>

        {target !== undefined && (
          <p className="text-[11px] text-muted mt-1">
            Target: {target}
          </p>
        )}

        {insight && (
          <p className="text-[11px] text-muted italic mt-2 leading-relaxed">
            {insight}
          </p>
        )}
      </div>

      {/* Progress bar — bottom */}
      {progress !== undefined && (
        <div className="h-[3px] w-full bg-black/[0.06]">
          <div
            className="h-full rounded-r-[2px] transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              background: progressFill ?? "linear-gradient(90deg, #0891B2, #4B8BF5)",
            }}
          />
        </div>
      )}
    </div>
  );
}
