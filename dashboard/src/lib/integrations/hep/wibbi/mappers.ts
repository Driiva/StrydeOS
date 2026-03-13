import type { HEPProgramme } from "../types";

/**
 * Wibbi exercise programme raw API response structure.
 * Based on standard HEP API patterns.
 */
export interface WibbiProgrammeRow {
  id: string | number;
  patient_id?: string | number;
  title?: string;
  name?: string;
  exercise_count?: number;
  exercises?: unknown[];
  created_at?: string;
  assigned_at?: string;
  completion_percentage?: number;
  last_accessed?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Map a Wibbi programme API response to StrydeOS HEPProgramme format.
 */
export function mapWibbiProgramme(row: WibbiProgrammeRow): HEPProgramme {
  const exerciseCount = 
    typeof row.exercise_count === "number" 
      ? row.exercise_count 
      : Array.isArray(row.exercises) 
        ? row.exercises.length 
        : 0;

  const assignedAt = (row.assigned_at ?? row.created_at ?? new Date().toISOString()) as string;
  
  return {
    externalId: String(row.id),
    patientExternalId: String(row.patient_id ?? ""),
    name: (row.title ?? row.name ?? "Unnamed Programme") as string,
    exerciseCount,
    assignedAt,
    completionPercent: typeof row.completion_percentage === "number" ? row.completion_percentage : 0,
    lastAccessedAt: row.last_accessed as string | undefined,
    deepLink: row.url as string | undefined,
  };
}
