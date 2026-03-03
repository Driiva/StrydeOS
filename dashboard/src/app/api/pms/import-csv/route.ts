import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyApiRequest, handleApiError, requireRole } from "@/lib/auth-guard";
import { computeWeeklyMetricsForClinic } from "@/lib/metrics/compute-weekly";
import type { AppointmentStatus } from "@/types";

// ─── WriteUpp CSV column aliases ──────────────────────────────────────────────
// WriteUpp exports vary slightly — we try multiple column name spellings.

const COL = {
  date:            ["Appointment Date", "Date", "appointment_date", "Start Date", "Start"],
  time:            ["Appointment Time", "Time", "Start Time", "appointment_time"],
  endDate:         ["End Date", "End"],
  endTime:         ["End Time"],
  patientId:       ["Patient ID", "Patient Id", "PatientID", "patient_id", "WUID", "Client ID"],
  patientFirst:    ["Patient First Name", "First Name", "patient_first_name", "Client First Name"],
  patientLast:     ["Patient Last Name", "Last Name", "patient_last_name", "Surname", "Client Last Name"],
  patientEmail:    ["Patient Email", "Email", "patient_email", "Client Email"],
  patientPhone:    ["Patient Phone", "Phone", "patient_phone", "Mobile", "Client Phone"],
  patientDob:      ["Date of Birth", "DOB", "dob", "Patient DOB"],
  practitioner:    ["Practitioner", "Clinician", "Provider", "Staff", "Assigned To", "Therapist"],
  practitionerId:  ["Practitioner ID", "Clinician ID", "Staff ID", "practitioner_id"],
  type:            ["Appointment Type", "Service", "Type", "Treatment Type", "appointment_type"],
  status:          ["Status", "Appointment Status", "attendance_status"],
  notes:           ["Notes", "note", "Internal Notes"],
  price:           ["Price", "Amount", "Fee", "Cost", "Net Amount"],
  duration:        ["Duration", "Duration (mins)", "duration_minutes"],
};

const STATUS_MAP: Record<string, AppointmentStatus> = {
  confirmed:         "scheduled",
  booked:            "scheduled",
  attended:          "completed",
  "did not attend":  "dna",
  dna:               "dna",
  cancelled:         "cancelled",
  "late cancellation": "late_cancel",
  "late cancel":     "late_cancel",
  no_show:           "dna",
};

// ─── CSV parser (handles quoted fields, \r\n and \n) ─────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function col(row: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    if (alias in row && row[alias] !== undefined && row[alias] !== "") return row[alias];
  }
  return "";
}

function parsePrice(raw: string): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw.replace(/[£$€,\s]/g, ""));
  if (isNaN(n)) return undefined;
  return Math.round(n * 100); // convert to pence/cents
}

function parseStatus(raw: string): AppointmentStatus {
  return STATUS_MAP[raw.toLowerCase().trim()] ?? "scheduled";
}

function buildDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Handle common UK formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
  let normalised = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalised)) {
    const [d, m, y] = normalised.split("/");
    normalised = `${y}-${m}-${d}`;
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(normalised)) {
    const [d, m, y] = normalised.split("-");
    normalised = `${y}-${m}-${d}`;
  }
  const combined = timeStr ? `${normalised}T${timeStr}` : `${normalised}T09:00:00`;
  const dt = new Date(combined);
  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await verifyApiRequest(request);
    requireRole(user, ["owner", "admin", "superadmin"]);
    const clinicId = user.clinicId;
    if (!clinicId) return NextResponse.json({ error: "No clinic" }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("fileType") as string) ?? "appointments";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!["appointments", "patients"].includes(fileType)) {
      return NextResponse.json({ error: "fileType must be 'appointments' or 'patients'" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV is empty or could not be parsed" }, { status: 400 });
    }

    const db = getAdminDb();
    const now = new Date().toISOString();
    const clinicRef = db.collection("clinics").doc(clinicId);

    let written = 0;
    let skipped = 0;
    const errors: string[] = [];
    const patientExternalIds = new Set<string>();

    if (fileType === "appointments") {
      // ── Appointments CSV ───────────────────────────────────────────────────
      const apptColl = clinicRef.collection("appointments");
      const batch = db.batch();
      let batchCount = 0;

      for (const row of rows) {
        const dateStr  = col(row, COL.date);
        const timeStr  = col(row, COL.time);
        const practitioner = col(row, COL.practitioner);
        const patientIdRaw = col(row, COL.patientId);
        const statusRaw = col(row, COL.status);
        const apptType  = col(row, COL.type);

        if (!dateStr && !practitioner) { skipped++; continue; }

        const dateTime = buildDateTime(dateStr, timeStr);
        const endDateStr = col(row, COL.endDate) || dateStr;
        const endTimeStr = col(row, COL.endTime);
        const endTime = buildDateTime(endDateStr, endTimeStr);

        const patientId = patientIdRaw || `csv_${col(row, COL.patientFirst)}_${col(row, COL.patientLast)}`.replace(/\s+/g, "_").toLowerCase();
        if (patientId) patientExternalIds.add(patientId);

        const docId = `csv_${dateTime}_${practitioner}_${patientId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);

        const apptData = {
          externalId:         docId,
          patientExternalId:  patientId,
          clinicianExternalId: practitioner,
          clinicianName:      practitioner,
          dateTime,
          endTime,
          status:             parseStatus(statusRaw),
          appointmentType:    apptType || undefined,
          revenueAmountPence: parsePrice(col(row, COL.price)),
          notes:              col(row, COL.notes) || undefined,
          source:             "csv_import",
          importedAt:         now,
        };

        batch.set(apptColl.doc(docId), apptData, { merge: true });
        batchCount++;
        written++;

        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }
      if (batchCount > 0) await batch.commit();

      // Upsert patient records from appointment rows
      const patientBatch = db.batch();
      let pBatchCount = 0;
      const patientColl = clinicRef.collection("patients");

      for (const row of rows) {
        const patientIdRaw = col(row, COL.patientId);
        const firstName = col(row, COL.patientFirst);
        const lastName  = col(row, COL.patientLast);
        if (!patientIdRaw && !firstName && !lastName) continue;

        const pid = patientIdRaw || `csv_${firstName}_${lastName}`.replace(/\s+/g, "_").toLowerCase();
        const docId = `p_${pid}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);

        patientBatch.set(patientColl.doc(docId), {
          pmsExternalId: pid,
          firstName:     firstName || "Unknown",
          lastName:      lastName  || "",
          email:         col(row, COL.patientEmail) || undefined,
          phone:         col(row, COL.patientPhone) || undefined,
          dob:           col(row, COL.patientDob)   || undefined,
          source:        "csv_import",
          importedAt:    now,
        }, { merge: true });
        pBatchCount++;

        if (pBatchCount >= 450) {
          await patientBatch.commit();
          pBatchCount = 0;
        }
      }
      if (pBatchCount > 0) await patientBatch.commit();

    } else {
      // ── Patients CSV ───────────────────────────────────────────────────────
      const patientColl = clinicRef.collection("patients");
      const batch = db.batch();
      let batchCount = 0;

      for (const row of rows) {
        const patientIdRaw = col(row, COL.patientId);
        const firstName = col(row, COL.patientFirst);
        const lastName  = col(row, COL.patientLast);
        if (!patientIdRaw && !firstName && !lastName) { skipped++; continue; }

        const pid = patientIdRaw || `csv_${firstName}_${lastName}`.replace(/\s+/g, "_").toLowerCase();
        const docId = `p_${pid}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);

        batch.set(patientColl.doc(docId), {
          pmsExternalId: pid,
          firstName:     firstName || "Unknown",
          lastName:      lastName  || "",
          email:         col(row, COL.patientEmail) || undefined,
          phone:         col(row, COL.patientPhone) || undefined,
          dob:           col(row, COL.patientDob)   || undefined,
          source:        "csv_import",
          importedAt:    now,
        }, { merge: true });
        batchCount++;
        written++;

        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }
      if (batchCount > 0) await batch.commit();
    }

    // Re-compute weekly metrics from the imported appointment data
    let metricsWritten = 0;
    if (fileType === "appointments") {
      try {
        const { written: mw } = await computeWeeklyMetricsForClinic(db, clinicId, 13);
        metricsWritten = mw;
      } catch (e) {
        errors.push(`Metrics recompute: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Mark clinic as having data from CSV import
    await clinicRef.set(
      {
        pmsType: "csv_import",
        pmsLastSyncAt: now,
        "onboarding.pmsConnected": true,
        updatedAt: now,
      },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      written,
      skipped,
      metricsWritten,
      errors,
      message: `Imported ${written} ${fileType} records${metricsWritten ? `, recomputed ${metricsWritten} metric weeks` : ""}`,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
