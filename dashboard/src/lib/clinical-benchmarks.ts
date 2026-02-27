/**
 * UK MSK Clinical Benchmarks for StrydeOS.
 *
 * Sources:
 * - HCPC Standards of Proficiency for Physiotherapists
 * - CSP (Chartered Society of Physiotherapy) clinical guidelines
 * - MACP (Manipulation Association of Chartered Physiotherapists)
 * - NICE CG177 (exercise as first-line intervention for MSK)
 * - Private MSK practice governance frameworks
 *
 * All financial calculations assume £75 fixed rate for both IAs and FUs.
 */

import type { MetricStatus } from "@/types";

const SESSION_RATE_PENCE = 7500;

export interface MetricBenchmark {
  key: string;
  label: string;
  definition: string;
  ownerExplainer: string;
  ukBenchmarkRange: string;
  thresholds: { green: string; amber: string; red: string };
  clinicalSignificance: string;
  financialSignificance: string;
  sources: string[];
}

export const BENCHMARKS: Record<string, MetricBenchmark> = {
  followUpRate: {
    key: "followUpRate",
    label: "Follow-Up Rate",
    definition:
      "Mean number of follow-up appointments booked per initial assessment. Measures patient retention through a treatment course.",
    ownerExplainer:
      "How many follow-up sessions each new patient books on average. Higher = patients are staying for the full treatment course.",
    ukBenchmarkRange: "2.5–4.0 (CSP MSK pathway: 4–6 sessions typical; private practice norm 3–4 FUs per IA)",
    thresholds: {
      green: "≥ 2.9",
      amber: "2.3–2.8",
      red: "< 2.3",
    },
    clinicalSignificance:
      "Low FU rate indicates patients dropping off before reaching recovery milestones. HCPC Standard 6 requires practitioners to practise safely and effectively, which includes adequate treatment completion. Incomplete courses raise risk of re-injury, chronic pain development, and poor long-term outcomes.",
    financialSignificance:
      "Each missed FU = £75 lost. At target 2.9 FU/IA, revenue per patient journey = £75 (IA) + 2.9 × £75 = £292.50. A clinician at 2.5 yields £262.50 — a gap of £30/patient. With ~8 IAs/week, that's ~£240/week or ~£12,480/year unrealised revenue.",
    sources: ["HCPC Standard 6", "CSP MSK Pathway Guidance", "Private MSK governance frameworks"],
  },

  hepCompliance: {
    key: "hepCompliance",
    label: "HEP Compliance",
    definition:
      "Percentage of patients with an active home exercise programme (HEP) assigned via Physitrack. Proxy for NICE CG177 compliance.",
    ownerExplainer:
      "What proportion of your patients have been given a home exercise programme. Should be near-universal for MSK patients.",
    ukBenchmarkRange: ">90% (HCPC Standard 13; CSP Quality Assurance Framework mandates HEP for MSK patients)",
    thresholds: {
      green: "≥ 95%",
      amber: "85–94%",
      red: "< 85%",
    },
    clinicalSignificance:
      "Patients without HEP have 40–60% worse functional outcomes at 3 months (CSP evidence base). Non-provision breaches clinical governance expectations for private MSK practice and is inconsistent with NICE CG177 first-line exercise recommendations.",
    financialSignificance:
      "Better HEP compliance correlates with faster recovery, higher patient satisfaction (more referrals), and lower DNA rates. Indirect revenue uplift through improved course completion and reduced churn risk.",
    sources: ["NICE CG177", "HCPC Standard 13", "CSP Quality Assurance Framework"],
  },

  nps: {
    key: "nps",
    label: "Net Promoter Score",
    definition:
      "Patient satisfaction metric (−100 to +100). Based on \"How likely are you to recommend this practice?\" scored 0–10. Promoters (9–10) minus Detractors (0–6) as a percentage.",
    ownerExplainer:
      "A single number that tells you whether patients would recommend you. Above 70 is excellent. Below 40 means something systemic needs fixing.",
    ukBenchmarkRange: "NHS avg ~40; private healthcare >50 good; >70 excellent",
    thresholds: {
      green: "≥ 70",
      amber: "40–69",
      red: "< 40",
    },
    clinicalSignificance:
      "NPS below 40 suggests systemic issues with patient experience — communication gaps, wait times, perceived treatment effectiveness. Correlates with complaint risk and potential regulatory scrutiny. HCPC Standards of Conduct require maintaining patient trust.",
    financialSignificance:
      "Each 10-point NPS increase correlates with ~15–20% increase in word-of-mouth referrals for private practices. This is the primary organic growth lever for private physiotherapy.",
    sources: ["HCPC Standards of Conduct", "Healthcare NPS benchmarking studies"],
  },

  courseCompletion: {
    key: "courseCompletion",
    label: "Course Completion",
    definition:
      "Percentage of patients who attend all sessions in their recommended treatment course, from initial assessment through to planned discharge. A 'course' is the clinician's recommended number of sessions at IA (typically 4–8 for MSK). A patient 'completes' when they reach that number OR are clinically discharged early with documented rationale.",
    ownerExplainer:
      "How many patients actually finish what they started. If a clinician recommends 6 sessions and the patient only comes for 3, that's incomplete. It matters because incomplete treatment = incomplete recovery = the patient may blame your clinic when they're not better, even though they didn't follow through.",
    ukBenchmarkRange: "60–80% typical in private MSK; >80% excellent (MACP governance framework)",
    thresholds: {
      green: "≥ 80%",
      amber: "65–79%",
      red: "< 65%",
    },
    clinicalSignificance:
      "Low completion correlates with higher recurrence rates, worse long-term outcomes, and potential clinical governance flags. HCPC Standard 8 (communicate effectively) includes duty to explain treatment rationale to support patient adherence.",
    financialSignificance:
      "At 6-session avg course @ £75/session: 80% completion = £360 avg revenue/patient; 65% = £292.50. Gap = £67.50/patient. Across 8 new patients/week/clinician, that's £540/week or £28,080/year per clinician.",
    sources: ["MACP Clinical Governance Framework", "HCPC Standard 8"],
  },

  dnaRate: {
    key: "dnaRate",
    label: "DNA Rate",
    definition:
      "Percentage of scheduled appointments where the patient did not attend (Did Not Attend). Includes no-shows and same-day cancellations without rebooking.",
    ownerExplainer:
      "How often patients simply don't turn up. Each no-show is a £75 slot you can't fill. Below 5% is excellent; above 12% needs intervention.",
    ukBenchmarkRange: "<5% excellent; 5–8% acceptable; >12% requires intervention (NHS avg ~8%)",
    thresholds: {
      green: "≤ 5%",
      amber: "6–12%",
      red: "> 12%",
    },
    clinicalSignificance:
      "High DNA rate disrupts treatment continuity, delays recovery, and may indicate poor patient engagement or communication issues. HCPC expects clinicians to maintain therapeutic relationships that support attendance.",
    financialSignificance:
      "Each DNA = £75 lost with no replacement. A clinician with 25 appointments/week at 12% DNA loses ~3 slots = £225/week = £11,700/year. Reducing from 12% to 5% recovers ~£8,775/year per clinician.",
    sources: ["NHS DNA benchmarking data", "CSP private practice guidelines"],
  },

  caseload: {
    key: "caseload",
    label: "Caseload",
    definition:
      "Number of active (non-discharged) patients currently assigned to a clinician.",
    ownerExplainer:
      "How many patients each clinician is actively treating. Used for workload balancing — too many risks quality, too few means spare capacity.",
    ukBenchmarkRange: "15–25 active patients per clinician per week is sustainable; >30 risks quality deterioration",
    thresholds: {
      green: "15–25",
      amber: "26–30 or <15",
      red: ">30",
    },
    clinicalSignificance:
      "Overloaded clinicians risk burnout, reduced session quality, and missed clinical indicators. Underloaded clinicians may indicate scheduling or marketing inefficiency.",
    financialSignificance:
      "Context-dependent. Used for capacity planning rather than direct revenue attribution.",
    sources: ["CSP Workload Management Guidelines"],
  },
};

// ─── Threshold evaluation functions ─────────────────────────────────────────

export function getFollowUpBenchmarkStatus(rate: number): MetricStatus {
  if (rate >= 2.9) return "ok";
  if (rate >= 2.3) return "warn";
  return "danger";
}

export function getHepBenchmarkStatus(rate: number): MetricStatus {
  if (rate >= 0.95) return "ok";
  if (rate >= 0.85) return "warn";
  return "danger";
}

export function getNpsBenchmarkStatus(score: number): MetricStatus {
  if (score >= 70) return "ok";
  if (score >= 40) return "warn";
  return "danger";
}

export function getCourseCompletionBenchmarkStatus(rate: number): MetricStatus {
  if (rate >= 0.80) return "ok";
  if (rate >= 0.65) return "warn";
  return "danger";
}

export function getDnaBenchmarkStatus(rate: number): MetricStatus {
  if (rate <= 0.05) return "ok";
  if (rate <= 0.12) return "warn";
  return "danger";
}

// ─── Derived financial metrics ──────────────────────────────────────────────

export function revenuePerPatientJourneyPence(followUpRate: number): number {
  return Math.round((1 + followUpRate) * SESSION_RATE_PENCE);
}

export function projectedAnnualRevenuePence(
  revenuePerJourneyPence: number,
  initialAssessmentsPerWeek: number
): number {
  return revenuePerJourneyPence * initialAssessmentsPerWeek * 52;
}

export function dnaFinancialImpactWeeklyPence(
  dnaRate: number,
  scheduledAppointments: number
): number {
  return Math.round(dnaRate * scheduledAppointments * SESSION_RATE_PENCE);
}

export function revenueGapVsTargetWeeklyPence(
  currentFollowUpRate: number,
  targetFollowUpRate: number,
  initialAssessmentsPerWeek: number
): number {
  const currentRevenue = revenuePerPatientJourneyPence(currentFollowUpRate);
  const targetRevenue = revenuePerPatientJourneyPence(targetFollowUpRate);
  return (targetRevenue - currentRevenue) * initialAssessmentsPerWeek;
}
