"use client";

import { useWeeklyStats } from "@/lib/useWeeklyStats";
import { colors } from "@/lib/brand";
import StatCard from "./StatCard";
import WeeklyChart from "./WeeklyChart";
import ClinicianSelect from "./ClinicianSelect";

const FOLLOW_UP_TARGET = 2.9;
const PHYSITRACK_TARGET = 0.95;

function FollowUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 10h4l2-5 3 10 2-5h3" stroke={colors.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PhysitrackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={colors.success} strokeWidth="1.5" />
      <path d="M7 10l2 2 4-4" stroke={colors.success} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function AppointmentsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke={colors.warning} strokeWidth="1.5"/>
      <path d="M3 8h14M7 2v4M13 2v4" stroke={colors.warning} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-cloud-dark bg-white p-6 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-cloud-light mb-4" />
      <div className="h-3 w-24 bg-cloud-light rounded mb-3" />
      <div className="h-8 w-16 bg-cloud-light rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-cloud-dark bg-white p-6 animate-pulse">
      <div className="h-4 w-32 bg-cloud-light rounded mb-2" />
      <div className="h-3 w-56 bg-cloud-light rounded mb-6" />
      <div className="h-[320px] bg-cream rounded-xl" />
    </div>
  );
}

export default function Dashboard() {
  const { stats, clinicians, selectedClinician, setSelectedClinician, loading, error } =
    useWeeklyStats();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-8 py-6 text-center max-w-md">
          <p className="text-[15px] font-semibold text-red-800 mb-1">
            Connection Error
          </p>
          <p className="text-[13px] text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const latest = stats.length > 0 ? stats[stats.length - 1] : null;

  const followUpStatus: "green" | "red" | "neutral" =
    latest ? (latest.followUpRate >= FOLLOW_UP_TARGET ? "green" : "red") : "neutral";
  const physitrackStatus: "green" | "red" | "neutral" =
    latest ? (latest.physitrackRate >= PHYSITRACK_TARGET ? "green" : "red") : "neutral";

  const selectedLabel =
    selectedClinician === "all"
      ? "All Clinicians"
      : clinicians.find((c) => c.id === selectedClinician)?.name ?? "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Weekly Dashboard
          </h1>
          <p className="text-[14px] text-muted mt-1">
            {latest
              ? `Reporting week of ${formatDate(latest.weekStart)}`
              : "Loading latest data…"}
          </p>
        </div>
        {!loading && clinicians.length > 0 && (
          <ClinicianSelect
            clinicians={clinicians}
            value={selectedClinician}
            onChange={setSelectedClinician}
          />
        )}
      </div>

      {/* Clinician badge */}
      {!loading && selectedClinician !== "all" && (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue flex items-center justify-center text-[12px] font-bold text-white">
            {selectedLabel.charAt(0)}
          </div>
          <span className="text-[14px] font-semibold text-ink">
            {selectedLabel}
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <section id="scorecard" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : latest ? (
          <>
            <StatCard
              title="Follow-Up Rate"
              value={latest.followUpRate.toFixed(2)}
              subtitle={`Target ≥ ${FOLLOW_UP_TARGET.toFixed(1)}`}
              status={followUpStatus}
              icon={<FollowUpIcon />}
            />
            <StatCard
              title="Physitrack Rate"
              value={`${Math.round(latest.physitrackRate * 100)}%`}
              subtitle={`Target ≥ ${Math.round(PHYSITRACK_TARGET * 100)}%`}
              status={physitrackStatus}
              icon={<PhysitrackIcon />}
            />
            <StatCard
              title="Appointments"
              value={latest.appointmentsTotal}
              subtitle="Total this week"
              status="neutral"
              icon={<AppointmentsIcon />}
            />
          </>
        ) : (
          <p className="col-span-3 text-center text-muted text-[14px] py-12">
            No data available yet.
          </p>
        )}
      </section>

      {/* Chart */}
      {loading ? (
        <SkeletonChart />
      ) : stats.length > 0 ? (
        <WeeklyChart data={stats} />
      ) : null}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
