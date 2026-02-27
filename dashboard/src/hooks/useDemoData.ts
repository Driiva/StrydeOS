import type { WeeklyStats, Clinician, Patient } from "@/types";

function ws(
  id: string,
  weekStart: string,
  clinicianId: string,
  clinicianName: string,
  followUpRate: number,
  physitrackRate: number,
  appointmentsTotal: number,
  utilisationRate: number,
  dnaRate: number,
  courseCompletionRate: number,
  revenuePerSessionPence: number
): WeeklyStats {
  return {
    id,
    weekStart,
    clinicianId,
    clinicianName,
    followUpRate,
    followUpTarget: 2.9,
    hepComplianceRate: physitrackRate,
    physitrackRate,
    physitrackTarget: 0.95,
    appointmentsTotal,
    utilisationRate,
    dnaRate,
    courseCompletionRate,
    revenuePerSessionPence,
    initialAssessments: Math.round(appointmentsTotal * 0.15),
    followUps: Math.round(appointmentsTotal * 0.85),
  };
}

const DEMO_WEEKLY_STATS_ALL: WeeklyStats[] = [
  ws("d1", "2026-01-12", "all", "All Clinicians", 2.68, 0.88, 61, 0.83, 0.09, 0.72, 7500),
  ws("d2", "2026-01-19", "all", "All Clinicians", 2.73, 0.89, 64, 0.85, 0.08, 0.74, 7500),
  ws("d3", "2026-01-26", "all", "All Clinicians", 2.81, 0.90, 66, 0.87, 0.07, 0.76, 7500),
  ws("d4", "2026-02-02", "all", "All Clinicians", 2.90, 0.91, 65, 0.88, 0.06, 0.77, 7500),
  ws("d5", "2026-02-09", "all", "All Clinicians", 2.98, 0.92, 67, 0.89, 0.06, 0.78, 7500),
  ws("d6", "2026-02-17", "all", "All Clinicians", 3.08, 0.93, 68, 0.91, 0.05, 0.79, 7500),
];

// Spires real trajectories — production data:
// Andrew Henry: 1.9 → 2.5 (target 2.9). Max Hubbard: 2.9 → 3.4 (~£10K/yr revenue impact). Jamal Adu: 3.2 → 3.4.
// Joe Korge: Admin/Owner, caseload 2, FU 3.8 — statistically non-representative (flagged).
// All rates: £75/session (7500 pence) — standard Spires IA and FU charge.
const DEMO_CLINICIAN_STATS: Record<string, WeeklyStats[]> = {
  "c-andrew": [
    ws("ca1", "2026-01-12", "c-andrew", "Andrew Henry", 1.90, 0.82, 22, 0.80, 0.12, 0.68, 7500),
    ws("ca2", "2026-01-19", "c-andrew", "Andrew Henry", 1.98, 0.84, 23, 0.82, 0.11, 0.70, 7500),
    ws("ca3", "2026-01-26", "c-andrew", "Andrew Henry", 2.10, 0.85, 23, 0.84, 0.10, 0.72, 7500),
    ws("ca4", "2026-02-02", "c-andrew", "Andrew Henry", 2.22, 0.87, 22, 0.85, 0.09, 0.73, 7500),
    ws("ca5", "2026-02-09", "c-andrew", "Andrew Henry", 2.35, 0.89, 23, 0.86, 0.08, 0.74, 7500),
    ws("ca6", "2026-02-17", "c-andrew", "Andrew Henry", 2.50, 0.91, 24, 0.88, 0.07, 0.76, 7500),
  ],
  "c-max": [
    ws("cm1", "2026-01-12", "c-max", "Max Hubbard", 2.90, 0.92, 20, 0.85, 0.07, 0.78, 7500),
    ws("cm2", "2026-01-19", "c-max", "Max Hubbard", 2.98, 0.93, 21, 0.87, 0.06, 0.79, 7500),
    ws("cm3", "2026-01-26", "c-max", "Max Hubbard", 3.08, 0.93, 22, 0.89, 0.06, 0.80, 7500),
    ws("cm4", "2026-02-02", "c-max", "Max Hubbard", 3.18, 0.94, 22, 0.90, 0.05, 0.81, 7500),
    ws("cm5", "2026-02-09", "c-max", "Max Hubbard", 3.28, 0.95, 22, 0.91, 0.05, 0.82, 7500),
    ws("cm6", "2026-02-17", "c-max", "Max Hubbard", 3.40, 0.95, 23, 0.92, 0.04, 0.83, 7500),
  ],
  "c-jamal": [
    ws("cj1", "2026-01-12", "c-jamal", "Jamal Adu", 3.20, 0.94, 19, 0.84, 0.06, 0.80, 7500),
    ws("cj2", "2026-01-19", "c-jamal", "Jamal Adu", 3.22, 0.94, 20, 0.86, 0.05, 0.81, 7500),
    ws("cj3", "2026-01-26", "c-jamal", "Jamal Adu", 3.26, 0.95, 21, 0.88, 0.05, 0.82, 7500),
    ws("cj4", "2026-02-02", "c-jamal", "Jamal Adu", 3.30, 0.95, 21, 0.89, 0.04, 0.83, 7500),
    ws("cj5", "2026-02-09", "c-jamal", "Jamal Adu", 3.35, 0.96, 22, 0.90, 0.04, 0.84, 7500),
    ws("cj6", "2026-02-17", "c-jamal", "Jamal Adu", 3.40, 0.96, 21, 0.92, 0.03, 0.85, 7500),
  ],
  "c-joe": [
    { ...ws("ck1", "2026-01-12", "c-joe", "Joe Korge", 3.80, 1.00, 2, 0.20, 0.00, 1.00, 7500), statisticallyRepresentative: false, caveatNote: "Sample size < 10 patients; metrics are directionally indicative only" },
    { ...ws("ck2", "2026-01-19", "c-joe", "Joe Korge", 3.80, 1.00, 2, 0.20, 0.00, 1.00, 7500), statisticallyRepresentative: false, caveatNote: "Sample size < 10 patients; metrics are directionally indicative only" },
    { ...ws("ck3", "2026-01-26", "c-joe", "Joe Korge", 3.80, 1.00, 2, 0.20, 0.00, 1.00, 7500), statisticallyRepresentative: false, caveatNote: "Sample size < 10 patients; metrics are directionally indicative only" },
    { ...ws("ck4", "2026-02-02", "c-joe", "Joe Korge", 3.80, 1.00, 2, 0.20, 0.00, 1.00, 7500), statisticallyRepresentative: false, caveatNote: "Sample size < 10 patients; metrics are directionally indicative only" },
    { ...ws("ck5", "2026-02-09", "c-joe", "Joe Korge", 3.80, 1.00, 2, 0.20, 0.00, 1.00, 7500), statisticallyRepresentative: false, caveatNote: "Sample size < 10 patients; metrics are directionally indicative only" },
    { ...ws("ck6", "2026-02-17", "c-joe", "Joe Korge", 3.80, 1.00, 2, 0.20, 0.00, 1.00, 7500), statisticallyRepresentative: false, caveatNote: "Sample size < 10 patients; metrics are directionally indicative only" },
  ],
};

const DEMO_CLINICIANS: Clinician[] = [
  { id: "c-jamal", name: "Jamal Adu", role: "Owner / Lead Physio", active: true },
  { id: "c-andrew", name: "Andrew Henry", role: "Physiotherapist", active: true },
  { id: "c-max", name: "Max Hubbard", role: "Physiotherapist", active: true },
  { id: "c-joe", name: "Joe Korge", role: "Owner / Admin", active: true },
];

const now = new Date().toISOString();

const DEMO_PATIENTS: Patient[] = [
  { id: "p1", name: "James Whitfield", clinicianId: "c-andrew", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-02-18", nextSessionDate: "2026-02-25", sessionCount: 3, courseLength: 6, discharged: false, churnRisk: false, createdAt: now, updatedAt: now },
  { id: "p2", name: "Catherine Bose", clinicianId: "c-andrew", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-02-14", nextSessionDate: "2026-02-21", sessionCount: 4, courseLength: 6, discharged: false, churnRisk: false, createdAt: now, updatedAt: now },
  { id: "p3", name: "Daniel Marr", clinicianId: "c-max", contact: {}, insuranceFlag: true, insurerName: "Bupa", preAuthStatus: "confirmed", lastSessionDate: "2026-02-01", sessionCount: 2, courseLength: 6, discharged: false, churnRisk: true, createdAt: now, updatedAt: now },
  { id: "p4", name: "Emma Richardson", clinicianId: "c-max", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-02-17", nextSessionDate: "2026-02-24", sessionCount: 5, courseLength: 6, discharged: false, churnRisk: false, createdAt: now, updatedAt: now },
  { id: "p5", name: "Oliver Shaw", clinicianId: "c-andrew", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-01-28", sessionCount: 3, courseLength: 6, discharged: false, churnRisk: true, createdAt: now, updatedAt: now },
  { id: "p6", name: "Sophie Turner", clinicianId: "c-jamal", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-02-19", nextSessionDate: "2026-02-26", sessionCount: 2, courseLength: 4, discharged: false, churnRisk: false, createdAt: now, updatedAt: now },
  { id: "p7", name: "Liam Bradshaw", clinicianId: "c-andrew", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-02-10", sessionCount: 6, courseLength: 6, discharged: true, churnRisk: false, createdAt: now, updatedAt: now },
  { id: "p8", name: "Rachel Obi", clinicianId: "c-max", contact: {}, insuranceFlag: true, insurerName: "AXA Health", preAuthStatus: "confirmed", lastSessionDate: "2026-02-12", sessionCount: 4, courseLength: 4, discharged: true, churnRisk: false, createdAt: now, updatedAt: now },
  { id: "p9", name: "Marcus Thorne", clinicianId: "c-andrew", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-01-30", sessionCount: 2, courseLength: 8, discharged: false, churnRisk: true, createdAt: now, updatedAt: now },
  { id: "p10", name: "Nina Aslam", clinicianId: "c-jamal", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-02-15", nextSessionDate: "2026-02-22", sessionCount: 1, courseLength: 6, discharged: false, churnRisk: false, createdAt: now, updatedAt: now },
  { id: "p11", name: "George Kemp", clinicianId: "c-max", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-01-25", sessionCount: 3, courseLength: 6, discharged: false, churnRisk: true, createdAt: now, updatedAt: now },
  { id: "p12", name: "Helen Corr", clinicianId: "c-jamal", contact: {}, insuranceFlag: false, preAuthStatus: "not_required", lastSessionDate: "2026-02-05", sessionCount: 6, courseLength: 6, discharged: true, churnRisk: false, createdAt: now, updatedAt: now },
];

export function useDemoWeeklyStats(clinicianId: string): WeeklyStats[] {
  if (clinicianId === "all") return DEMO_WEEKLY_STATS_ALL;
  return DEMO_CLINICIAN_STATS[clinicianId] ?? [];
}

export function useDemoClinicians(): Clinician[] {
  return DEMO_CLINICIANS;
}

export function useDemoPatients(clinicianId?: string): Patient[] {
  if (!clinicianId || clinicianId === "all") return DEMO_PATIENTS;
  return DEMO_PATIENTS.filter((p) => p.clinicianId === clinicianId);
}

export function getDemoLatestWeekStats(): {
  clinicianId: string;
  clinicianName: string;
  stats: WeeklyStats;
}[] {
  return Object.entries(DEMO_CLINICIAN_STATS).map(([cid, weeks]) => ({
    clinicianId: cid,
    clinicianName: weeks[weeks.length - 1].clinicianName,
    stats: weeks[weeks.length - 1],
  }));
}
