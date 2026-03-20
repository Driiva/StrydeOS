import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "./firebase-admin";
import type { UserRole } from "@/types";

export interface VerifiedUser {
  uid: string;
  email: string;
  clinicId: string;
  clinicianId?: string;
  role: UserRole;
}

/**
 * Verify a Firebase ID token and extract identity from custom claims.
 *
 * Primary path: reads clinicId / role / clinicianId from the JWT custom
 * claims (set via Admin SDK setCustomUserClaims). Zero Firestore reads.
 * clinicId is immutable from the client — only server-side
 * setCustomClaims can change it.
 *
 * Temporary fallback: if custom claims are missing (pre-migration user
 * whose token hasn't refreshed yet), reads from Firestore user doc.
 * Remove this fallback once all users have rotated tokens after running
 * `npm run migrate:claims`.
 */
export async function verifyApiRequest(
  request: NextRequest
): Promise<VerifiedUser> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiAuthError("Missing or invalid Authorization header", 401);
  }

  const token = authHeader.slice(7);
  const decoded = await getAdminAuth().verifyIdToken(token);

  const clinicId = decoded.clinicId as string | undefined;
  const role = decoded.role as UserRole | undefined;
  const clinicianId = decoded.clinicianId as string | undefined;

  // Fast path — custom claims present
  if (role && (role === "superadmin" || clinicId)) {
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      clinicId: clinicId ?? "",
      clinicianId,
      role,
    };
  }

  // Temporary fallback — read from Firestore (pre-migration users)
  // TODO: remove once all users have refreshed tokens after migrate:claims
  const userDoc = await getAdminDb()
    .collection("users")
    .doc(decoded.uid)
    .get();

  if (!userDoc.exists) {
    throw new ApiAuthError("User profile not found", 403);
  }

  const data = userDoc.data()!;
  const fbRole = data.role as UserRole;

  if (fbRole !== "superadmin" && (!data.clinicId || !fbRole)) {
    throw new ApiAuthError("User has no clinic assignment — contact support", 403);
  }

  return {
    uid: decoded.uid,
    email: decoded.email ?? "",
    clinicId: data.clinicId as string,
    clinicianId: data.clinicianId as string | undefined,
    role: fbRole,
  };
}

export function requireRole(
  user: VerifiedUser,
  allowed: UserRole[]
): void {
  if (!allowed.includes(user.role)) {
    throw new ApiAuthError("Insufficient permissions", 403);
  }
}

export function requireClinic(
  user: VerifiedUser,
  clinicId: string
): void {
  if (user.role === "superadmin") return;
  if (user.clinicId !== clinicId) {
    throw new ApiAuthError("Access denied for this clinic", 403);
  }
}

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  Sentry.captureException(error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

export function verifyCronRequest(request: NextRequest): void {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (!secret) {
    throw new ApiAuthError("CRON_SECRET not configured", 500);
  }
  const auth = request.headers.get("authorization")?.trim();
  if (auth !== `Bearer ${secret}`) {
    throw new ApiAuthError("Invalid cron secret", 401);
  }
}
