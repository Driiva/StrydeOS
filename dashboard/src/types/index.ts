// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = "owner" | "admin" | "clinician" | "superadmin";
export type UserStatus = "invited" | "onboarding" | "registered";

export interface UserDocument {
  clinicId: string;
  clinicianId?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  firstLogin: boolean;
  tourCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  clinicId: string;
  clinicianId?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  firstLogin: boolean;
  tourCompleted: boolean;
  status: UserStatus;
  clinicProfile: ClinicProfile | null;
}

// ─── Clinic ──────────────────────────────────────────────────────────────────

export interface FeatureFlags {
  intelligence: boolean;
  continuity: boolean;
  receptionist: boolean;
}

export type StripeSubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface BillingState {
  stripeCustomerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: StripeSubscriptionStatus | null;
  currentPeriodEnd: string | null;
}

export interface ClinicTargets {
  followUpRate: number;
  physitrackRate: number;
  utilisationRate: number;
  dnaRate: number;
  courseCompletionTarget: number;
}

export interface BrandConfig {
  logo?: string;
  primaryColor?: string;
  clinicUrl?: string;
}

export interface OnboardingState {
  pmsConnected: boolean;
  cliniciansConfirmed: boolean;
  targetsSet: boolean;
}

// ─── Onboarding V2 State Machine ─────────────────────────────────────────────

export type OnboardingStage =
  | "signup_complete"
  | "onboarding_started"
  | "integration_self_serve"
  | "integration_blocked"
  | "fallback_live"
  | "api_connected"
  | "first_value_reached"
  | "activation_complete";

export type OnboardingBlocker =
  | "missing_api_credentials"
  | "provider_not_supported"
  | "auth_failure"
  | "data_quality";

export type OnboardingPath = "self_serve" | "assisted";

export interface OnboardingV2 {
  stage: OnboardingStage;
  path: OnboardingPath;
  blockers: OnboardingBlocker[];
  firstValueAt: string | null;
  activationAt: string | null;
  lastEventAt: string;
}

export type PmsProvider = "writeupp" | "cliniko" | "tm3" | "jane" | "powerdiary" | "pabau" | "halaxy";
export type ClinicStatus = "onboarding" | "live" | "paused" | "churned";

export interface ClinicProfile {
  id: string;
  name: string;
  timezone: string;
  ownerEmail: string;
  status: ClinicStatus;
  pmsType: PmsProvider | null;
  /** Client-visible last PMS sync time (API key stored server-side only in integrations_config). */
  pmsLastSyncAt?: string | null;
  featureFlags: FeatureFlags;
  targets: ClinicTargets;
  brandConfig: BrandConfig;
  onboarding: OnboardingState;
  onboardingV2?: OnboardingV2;
  billing?: BillingState;
  trialStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Clinician ───────────────────────────────────────────────────────────────

export interface Clinician {
  id: string;
  name: string;
  role: string;
  pmsExternalId?: string;
  physitrackId?: string;
  active: boolean;
  avatar?: string;
  createdAt?: string;
  createdBy?: string;
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export type PreAuthStatus = "pending" | "confirmed" | "rejected" | "not_required";

export interface PatientContact {
  email?: string;
  phone?: string;
}

export interface ReferralSource {
  type: string;
  name: string;
  externalId?: string;
}

export interface Patient {
  id: string;
  name: string;
  dob?: string;
  contact: PatientContact;
  clinicianId: string;
  insuranceFlag: boolean;
  insurerName?: string;
  preAuthStatus: PreAuthStatus;
  pmsExternalId?: string;
  physitrackPatientId?: string;
  referralSource?: ReferralSource;
  lastSessionDate?: string;
  nextSessionDate?: string;
  sessionCount: number;
  courseLength: number;
  discharged: boolean;
  churnRisk: boolean;
  hepProgramId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus = "scheduled" | "completed" | "dna" | "cancelled" | "late_cancel";
export type AppointmentType = "initial_assessment" | "follow_up" | "review" | "discharge";
export type AppointmentSource = "pms_sync" | "strydeos_receptionist" | "manual";

export interface Appointment {
  id: string;
  patientId: string;
  clinicianId: string;
  dateTime: string;
  endTime: string;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
  isInitialAssessment: boolean;
  hepAssigned: boolean;
  hepProgramId?: string;
  conditionTag?: string; // populated by PMS sync (e.g. "Low Back Pain")
  revenueAmountPence: number;
  followUpBooked: boolean;
  source: AppointmentSource;
  pmsExternalId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Outcome Measures ────────────────────────────────────────────────────────

export type OutcomeMeasureType =
  | "nprs"
  | "psfs"
  | "quickdash"
  | "odi"
  | "ndi"
  | "oxford_knee"
  | "oxford_hip"
  | "koos"
  | "hoos"
  | "visa_a"
  | "visa_p";

export interface OutcomeScore {
  id: string;
  patientId: string;
  clinicianId: string;
  appointmentId?: string;
  measureType: OutcomeMeasureType;
  score: number;
  subscores?: Record<string, number>;
  recordedAt: string;
  recordedBy: string;
}

// ─── Weekly Metrics ──────────────────────────────────────────────────────────

export interface WeeklyStats {
  id: string;
  clinicianId: string;
  clinicianName: string;
  weekStart: string;
  followUpRate: number;
  followUpTarget: number;
  hepComplianceRate: number;
  physitrackRate: number;
  physitrackTarget: number;
  utilisationRate: number;
  dnaRate: number;
  courseCompletionRate: number;
  revenuePerSessionPence: number;
  appointmentsTotal: number;
  initialAssessments: number;
  followUps: number;
  npsScore?: number;
  reviewCount?: number;
  reviewVelocity?: number;
  dnaByDayOfWeek?: Record<string, number>;
  dnaByTimeSlot?: Record<string, number>;
  computedAt?: string;
  statisticallyRepresentative?: boolean;
  caveatNote?: string;
}

// ─── Comms ───────────────────────────────────────────────────────────────────

export type CommsChannel = "email" | "sms" | "whatsapp";
export type CommsOutcome = "booked" | "no_action" | "unsubscribed";
export type SequenceType =
  | "hep_reminder"
  | "rebooking_prompt"
  | "pre_auth_collection"
  | "review_prompt"
  | "reactivation_90d"
  | "reactivation_180d";

export interface CommsLogEntry {
  id: string;
  patientId: string;
  sequenceType: SequenceType;
  channel: CommsChannel;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  outcome: CommsOutcome;
  n8nExecutionId?: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export type ReviewPlatform = "google" | "trustpilot";

export interface Review {
  id: string;
  platform: ReviewPlatform;
  rating: number;
  reviewText?: string;
  date: string;
  clinicianMentioned?: string;
  patientId?: string;
  verified: boolean;
}

// ─── Call Log (Receptionist) ─────────────────────────────────────────────────

export type CallOutcome = "booked" | "cancelled" | "missed" | "info" | "transferred";

export interface CallLog {
  id: string;
  timestamp: string;
  duration: number;
  outcome: CallOutcome;
  clinicianId?: string;
  patientId?: string;
  callerPhone?: string;
  recordingUrl?: string;
  retellCallId?: string;
}

// ─── UI Component Types ──────────────────────────────────────────────────────

export type AlertSeverity = "warn" | "danger";
export type MetricStatus = "ok" | "warn" | "danger" | "neutral";
export type TrendDirection = "up" | "down" | "flat" | "warn";

export interface StatCardAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  target?: number;
  benchmark?: string;
  trend?: TrendDirection;
  trendPercent?: number;
  status: MetricStatus;
  insight?: string;
  color?: string;
  progress?: number;
  onClick?: () => void;
  action?: StatCardAction;
  sparklineData?: number[];
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
