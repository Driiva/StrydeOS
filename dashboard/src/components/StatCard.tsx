"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status: "green" | "red" | "neutral";
  icon: React.ReactNode;
}

export default function StatCard({ title, value, subtitle, status, icon }: StatCardProps) {
  const borderColor =
    status === "green"
      ? "border-emerald-200"
      : status === "red"
        ? "border-red-200"
        : "border-cloud-dark";

  const badgeColor =
    status === "green"
      ? "bg-emerald-50 text-emerald-700"
      : status === "red"
        ? "bg-red-50 text-red-700"
        : "bg-cloud-light text-muted";

  const badgeLabel =
    status === "green" ? "On track" : status === "red" ? "Below target" : "—";

  const accentBar =
    status === "green"
      ? "bg-emerald-500"
      : status === "red"
        ? "bg-red-500"
        : "bg-cloud-dark";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${borderColor} bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentBar}`} />
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 rounded-xl bg-cloud-light flex items-center justify-center">
            {icon}
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeColor}`}>
            {badgeLabel}
          </span>
        </div>
        <p className="text-[13px] font-medium text-muted mb-1">{title}</p>
        <p className="text-3xl font-bold text-ink tracking-tight">{value}</p>
        {subtitle && (
          <p className="text-[12px] text-muted mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
