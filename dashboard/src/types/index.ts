export interface WeeklyStats {
  id: string;
  weekStart: string;
  clinicianId: string;
  clinicianName: string;
  followUpRate: number;
  followUpTarget: number;
  physitrackRate: number;
  physitrackTarget: number;
  appointmentsTotal: number;
  utilisationRate: number;
  dnaRate: number;
  courseCompletionRate: number;
  revenuePerSession: number;
}

export interface Clinician {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  active: boolean;
}

export interface Patient {
  id: string;
  name: string;
  clinicianId: string;
  lastSessionDate: string;
  nextSessionDate?: string;
  sessionCount: number;
  courseLength: number;
  discharged: boolean;
  hepProgramId?: string;
  churnRisk: boolean;
}

export interface CallLog {
  id: string;
  timestamp: string;
  duration: number;
  outcome: "booked" | "cancelled" | "missed" | "info";
  clinicianId?: string;
  patientId?: string;
}

export type AlertSeverity = "warn" | "danger";
export type MetricStatus = "ok" | "warn" | "danger" | "neutral";
export type TrendDirection = "up" | "down" | "flat" | "warn";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  target?: number;
  benchmark?: string;
  trend?: TrendDirection;
  status: MetricStatus;
  insight?: string;
  color?: string;
  onClick?: () => void;
}

export interface AlertFlagProps {
  metric: string;
  current: number;
  target: number;
  severity: AlertSeverity;
}

export interface TrendLine {
  key: string;
  color: string;
  label: string;
}
