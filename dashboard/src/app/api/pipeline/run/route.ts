import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  verifyApiRequest,
  verifyCronRequest,
  handleApiError,
  requireRole,
} from "@/lib/auth-guard";
import { runPipeline } from "@/lib/pipeline/run-pipeline";
import { writeAuditLog, extractIpFromRequest } from "@/lib/audit-log";

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
    let userId = "cron";
    let userEmail = "cron@system";
    const isCron = request.headers.get("authorization")?.startsWith("Bearer ");
    if (isCron) {
      try {
        verifyCronRequest(request);
      } catch {
        const user = await verifyApiRequest(request);
        requireRole(user, ["owner", "admin", "superadmin"]);
        userId = user.uid;
        userEmail = user.email;
      }
    } else {
      const user = await verifyApiRequest(request);
      requireRole(user, ["owner", "admin", "superadmin"]);
      userId = user.uid;
      userEmail = user.email;
    }

    const db = getAdminDb();
    const body = await request.json().catch(() => ({}));
    const targetClinicId = body.clinicId as string | undefined;
    const ip = extractIpFromRequest(request);

    if (targetClinicId) {
      const result = await runPipeline(db, targetClinicId);
      
      await writeAuditLog(db, targetClinicId, {
        userId,
        userEmail,
        action: "write",
        resource: "pipeline",
        metadata: { trigger: isCron ? "cron" : "manual", result },
        ip,
      });
      
      return NextResponse.json(result);
    }

    // Run for all clinics in parallel (avoids Vercel timeout at scale)
    const clinicsSnap = await db.collection("clinics").get();
    const settled = await Promise.allSettled(
      clinicsSnap.docs.map((clinicDoc) => runPipeline(db, clinicDoc.id))
    );

    const results = settled.map((s, i) => {
      if (s.status === "fulfilled") return s.value;
      const clinicId = clinicsSnap.docs[i].id;
      Sentry.captureException(s.reason, { tags: { clinicId, source: "pipeline_cron" } });
      return { clinicId, ok: false, error: s.reason?.message ?? "Pipeline failed" };
    });

    return NextResponse.json({ results });
  } catch (e) {
    return handleApiError(e);
  }
}
