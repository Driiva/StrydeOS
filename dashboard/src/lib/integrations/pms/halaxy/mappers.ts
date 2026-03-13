import type { PMSAppointment, PMSClinician, PMSPatient } from "@/types/pms";
import { HALAXY_STATUS_MAP } from "@/types/pms";

// ─── FHIR Resource Shapes ────────────────────────────────────────────────────

/** FHIR Reference — e.g. "Practitioner/123" or "Patient/456" */
export interface FHIRReference {
  reference?: string;
  display?: string;
}

/** FHIR HumanName */
export interface FHIRHumanName {
  family?: string;
  given?: string[];
  text?: string;
  use?: string;
}

/** FHIR ContactPoint (phone/email) */
export interface FHIRContactPoint {
  system?: "phone" | "email" | "fax" | "other";
  value?: string;
  use?: string;
}

/** FHIR Appointment resource */
export interface HalaxyAppointmentResource {
  resourceType: "Appointment";
  id: string;
  status?: string; // booked | fulfilled | noshow | cancelled | entered-in-error
  start?: string; // ISO 8601
  end?: string;   // ISO 8601
  comment?: string;
  description?: string;
  serviceType?: Array<{ coding?: Array<{ display?: string; code?: string }> }>;
  participant?: Array<{
    actor?: FHIRReference;
    status?: string;
    type?: Array<{ coding?: Array<{ code?: string }> }>;
  }>;
  [key: string]: unknown;
}

/** FHIR Practitioner resource */
export interface HalaxyPractitionerResource {
  resourceType: "Practitioner";
  id: string;
  active?: boolean;
  name?: FHIRHumanName[];
  telecom?: FHIRContactPoint[];
  qualification?: Array<{ code?: { text?: string } }>;
  [key: string]: unknown;
}

/** FHIR Patient resource */
export interface HalaxyPatientResource {
  resourceType: "Patient";
  id: string;
  active?: boolean;
  name?: FHIRHumanName[];
  telecom?: FHIRContactPoint[];
  birthDate?: string;
  extension?: Array<{ url?: string; valueString?: string }>;
  [key: string]: unknown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract numeric ID from a FHIR reference string.
 * "Practitioner/123" → "123"
 * "https://eu-api.halaxy.com/main/fhir/Patient/456" → "456"
 */
function extractFHIRId(reference?: string): string {
  if (!reference) return "";
  const parts = reference.split("/");
  return parts[parts.length - 1] || "";
}

/** Resolve a FHIR HumanName to a display string */
function resolveName(names?: FHIRHumanName[]): string {
  if (!names || names.length === 0) return "Unknown";
  const official = names.find((n) => n.use === "official") ?? names[0];
  if (official.text) return official.text;
  const given = official.given?.join(" ") ?? "";
  const family = official.family ?? "";
  return [given, family].filter(Boolean).join(" ") || "Unknown";
}

/** Find practitioner and patient references from FHIR appointment participants */
function extractParticipants(resource: HalaxyAppointmentResource): {
  clinicianId: string;
  patientId: string;
} {
  let clinicianId = "";
  let patientId = "";

  for (const p of resource.participant ?? []) {
    const ref = p.actor?.reference ?? "";
    if (ref.includes("Practitioner")) {
      clinicianId = extractFHIRId(ref);
    } else if (ref.includes("Patient")) {
      patientId = extractFHIRId(ref);
    }
  }

  return { clinicianId, patientId };
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function mapHalaxyAppointment(resource: HalaxyAppointmentResource): PMSAppointment {
  const { clinicianId, patientId } = extractParticipants(resource);
  const rawStatus = resource.status ?? "booked";
  const canonicalStatus = HALAXY_STATUS_MAP[rawStatus] ?? "scheduled";

  const serviceType = resource.serviceType?.[0]?.coding?.[0]?.display
    ?? resource.serviceType?.[0]?.coding?.[0]?.code;

  return {
    externalId: String(resource.id),
    patientExternalId: patientId,
    clinicianExternalId: clinicianId,
    dateTime: resource.start ?? new Date().toISOString(),
    endTime: resource.end ?? new Date().toISOString(),
    status: canonicalStatus,
    appointmentType: serviceType,
    notes: resource.comment ?? resource.description,
    revenueAmountPence: undefined, // Halaxy revenue lives on Invoice resources
  };
}

export function mapHalaxyPractitioner(resource: HalaxyPractitionerResource): PMSClinician {
  const name = resolveName(resource.name);
  const qualification = resource.qualification?.[0]?.code?.text;

  return {
    externalId: String(resource.id),
    name,
    role: qualification,
    active: resource.active !== false,
  };
}

export function mapHalaxyPatient(resource: HalaxyPatientResource): PMSPatient {
  const fullName = resolveName(resource.name);
  const nameParts = fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const email = resource.telecom?.find((t) => t.system === "email")?.value;
  const phone = resource.telecom?.find((t) => t.system === "phone")?.value;

  return {
    externalId: String(resource.id),
    firstName,
    lastName,
    email,
    phone,
    dob: resource.birthDate,
    insurerName: undefined,
  };
}
