"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { WeeklyStat } from "@/lib/types";
import { colors } from "@/lib/brand";

interface ChartInnerProps {
  data: WeeklyStat[];
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ChartDatum {
  label: string;
  followUpRate: number;
  physitrackPct: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl border border-cloud-dark bg-white px-4 py-3 shadow-lg">
      <p className="text-[12px] font-medium text-muted mb-2">
        Week of {label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[13px]">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted">{entry.name}:</span>
          <span className="font-semibold text-ink">
            {entry.dataKey === "physitrackPct"
              ? `${entry.value}%`
              : entry.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ChartInner({ data }: ChartInnerProps) {
  const chartData: ChartDatum[] = data.map((d) => ({
    label: formatWeekLabel(d.weekStart),
    followUpRate: d.followUpRate,
    physitrackPct: Math.round(d.physitrackRate * 100),
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.cloudDark}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: colors.muted }}
            dy={8}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: colors.muted }}
            dx={-4}
            domain={["auto", "auto"]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: colors.muted }}
            dx={4}
            tickFormatter={(v: number) => `${v}%`}
            domain={["auto", 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="followUpRate"
            name="Follow-Up Rate"
            stroke={colors.blue}
            strokeWidth={2.5}
            dot={{ r: 4, fill: colors.blue, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: colors.blue, stroke: "#fff", strokeWidth: 2 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="physitrackPct"
            name="Physitrack Rate"
            stroke={colors.success}
            strokeWidth={2.5}
            dot={{ r: 4, fill: colors.success, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: colors.success, stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
