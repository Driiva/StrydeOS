import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  verifyApiRequest,
  verifyCronRequest,
  handleApiError,
  requireRole,
} from "@/lib/auth-guard";
import { runPipeline } from "@/lib/pipeline/run-pipeline";

/**
 * POST /api/pipeline/run
 *
 * Main pipeline entry point. Runs the full data pipeline for all clinics
 * (or a specific clinicId). Accepts cron auth or user auth (owner/admin/superadmin).
 *
 * Body (optional): { clinicId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const isCron = request.headers.get("authorization")?.startsWith("Bearer ");
    if (isCron) {
      try {
        verifyCronRequest(request);
      } catch {
        const user = await verifyApiRequest(request);
        requireRole(user, ["owner", "admin", "superadmin"]);
      }
    } else {
      const user = await verifyApiRequest(request);
      requireRole(user, ["owner", "admin", "superadmin"]);
    }

    const db = getAdminDb();
    const body = await request.json().catch(() => ({}));
    const targetClinicId = body.clinicId as string | undefined;

    if (targetClinicId) {
      const result = await runPipeline(db, targetClinicId);
      return NextResponse.json(result);
    }

    // Run for all clinics
    const clinicsSnap = await db.collection("clinics").get();
    const results = [];
    for (const clinicDoc of clinicsSnap.docs) {
      const result = await runPipeline(db, clinicDoc.id);
      results.push(result);
    }

    return NextResponse.json({ results });
  } catch (e) {
    return handleApiError(e);
  }
}
