import type { HEPProgramme } from "../types";

// ─── RehabMyPatient API Response Shapes ──────────────────────────────────────

export interface RehabMyPatientExerciseRow {
  name?: string;
  description?: string;
  [key: string]: unknown;
}

export interface RehabMyPatientPlanRow {
  id: string | number;
  patient_id?: string | number;
  created?: string; // ISO timestamp
  last_update?: string; // ISO timestamp
  exercises?: RehabMyPatientExerciseRow[];
  name?: string;
  notes?: string;
  [key: string]: unknown;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

/**
 * Map RehabMyPatient plan to canonical HEPProgramme.
 *
 * Limitations:
 * - completionPercent: RehabMyPatient API does not expose adherence or completion data,
 *   so this is always set to 0
 * - lastAccessedAt: Not available from API
 */
export function mapRehabMyPatientPlan(row: RehabMyPatientPlanRow): HEPProgramme {
  const exerciseCount = Array.isArray(row.exercises) ? row.exercises.length : 0;
  
  // Build a readable programme name from exercises if name not provided
  const programmeName =
    row.name ||
    (exerciseCount > 0
      ? `${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""} programme`
      : "Unnamed Programme");

  return {
    externalId: String(row.id),
    patientExternalId: String(row.patient_id ?? ""),
    name: programmeName,
    exerciseCount,
    assignedAt: row.created ?? new Date().toISOString(),
    completionPercent: 0, // API does not expose adherence/completion data
    lastAccessedAt: undefined, // Not available from RehabMyPatient API
  };
}
