import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyApiRequest, handleApiError, requireRole } from "@/lib/auth-guard";
import type { HEPIntegrationConfig } from "@/lib/integrations/hep/types";

const INTEGRATIONS_CONFIG = "integrations_config";
const HEP_DOC_ID = "hep";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyApiRequest(request);
    requireRole(user, ["owner", "admin", "superadmin"]);
    const clinicId = user.clinicId;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const provider = (body.provider as HEPIntegrationConfig["provider"]) ?? "physitrack";
    const apiKey = body.apiKey as string | undefined;
    if (!apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    const db = getAdminDb();

    await db
      .collection("clinics")
      .doc(clinicId)
      .collection(INTEGRATIONS_CONFIG)
      .doc(HEP_DOC_ID)
      .set(
        {
          provider,
          apiKey: apiKey.trim(),
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
