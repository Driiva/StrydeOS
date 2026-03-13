import type { PMSAppointment, PMSClinician, PMSPatient } from "@/types/pms";
import { ZANDA_STATUS_MAP } from "@/types/pms";

// ─── Zanda API Response Shapes ───────────────────────────────────────────────

export interface ZandaAppointmentRow {
  id: string | number;
  start_time?: string;
  end_time?: string;
  status?: string;
  appointment_type?: string | { name?: string; id?: string | number };
  notes?: string;
  client_id?: string | number;
  practitioner_id?: string | number;
  location_id?: string | number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ZandaPractitionerRow {
  id: string | number;
  first_name?: string;
  last_name?: string;
  name?: string;
  display_name?: string;
  active?: boolean;
  title?: string;
  designation?: string;
  role?: string;
  [key: string]: unknown;
}

/** Zanda calls patients "clients" */
export interface ZandaClientRow {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  date_of_birth?: string;
  dob?: string;
  [key: string]: unknown;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function mapZandaAppointment(row: ZandaAppointmentRow): PMSAppointment {
  const rawStatus = (row.status ?? "confirmed") as string;
  const canonicalStatus = ZANDA_STATUS_MAP[rawStatus.toLowerCase()] ?? "scheduled";

  // appointment_type may be an object or a string
  const apptType =
    typeof row.appointment_type === "object" && row.appointment_type !== null
      ? (row.appointment_type as { name?: string }).name ?? String((row.appointment_type as { id?: string | number }).id ?? "")
      : String(row.appointment_type ?? "");

  return {
    externalId: String(row.id),
    patientExternalId: String(row.client_id ?? ""),
    clinicianExternalId: String(row.practitioner_id ?? ""),
    dateTime: row.start_time ?? new Date().toISOString(),
    endTime: row.end_time ?? new Date().toISOString(),
    status: canonicalStatus,
    appointmentType: apptType || undefined,
    notes: row.notes as string | undefined,
    revenueAmountPence: undefined, // Revenue lives on Zanda invoices
  };
}

export function mapZandaPractitioner(row: ZandaPractitionerRow): PMSClinician {
  const name =
    row.display_name ??
    row.name ??
    ([row.first_name, row.last_name].filter(Boolean).join(" ") || "Unknown");

  return {
    externalId: String(row.id),
    name,
    role: row.designation ?? row.role ?? row.title,
    active: row.active !== false,
  };
}

export function mapZandaClient(row: ZandaClientRow): PMSPatient {
  const phone = row.mobile ?? row.phone;

  return {
    externalId: String(row.id),
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email,
    phone: phone as string | undefined,
    dob: (row.date_of_birth ?? row.dob) as string | undefined,
    insurerName: undefined,
  };
}
