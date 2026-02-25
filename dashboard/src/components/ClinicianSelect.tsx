"use client";

import type { Clinician } from "@/lib/types";

interface ClinicianSelectProps {
  clinicians: Clinician[];
  value: string;
  onChange: (value: string) => void;
}

export default function ClinicianSelect({ clinicians, value, onChange }: ClinicianSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-cloud-dark bg-white pl-4 pr-10 py-2.5 text-[13px] font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-muted focus:border-blue focus:ring-2 focus:ring-blue/10 focus:outline-none transition-all cursor-pointer"
      >
        <option value="all">All Clinicians</option>
        {clinicians.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
      >
        <path
          d="M3.5 5.25L7 8.75L10.5 5.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
