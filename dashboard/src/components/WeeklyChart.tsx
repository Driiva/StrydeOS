"use client";

import dynamic from "next/dynamic";
import type { WeeklyStat } from "@/lib/types";

const ChartInner = dynamic(() => import("./ChartInner"), { ssr: false });

interface WeeklyChartProps {
  data: WeeklyStat[];
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div id="trends" className="rounded-2xl border border-cloud-dark bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-ink">
          6-Week Trend
        </h2>
        <p className="text-[13px] text-muted mt-0.5">
          Follow-up rate and Physitrack compliance over time
        </p>
      </div>
      <ChartInner data={data} />
    </div>
  );
}
