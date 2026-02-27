/**
 * Reset firstLogin + tourCompleted for one or more users so the welcome tour fires
 * on their next login. Uses Firestore only — does NOT call Firebase Auth API.
 *
 * Usage (from dashboard directory):
 *
 *   # Reset a single user by email:
 *   npx tsx scripts/reset-first-login.ts jamal@spiresphysiotherapy.com
 *
 *   # Reset multiple users:
 *   npx tsx scripts/reset-first-login.ts jamal@spiresphysiotherapy.com joe@spiresphysiotherapy.com
 *
 *   # Reset by UID directly:
 *   UID=abc123 npx tsx scripts/reset-first-login.ts
 *
 * Credentials: same chain — .env.local vars, serviceAccountKey.json, or gcloud ADC.
 */

import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

function loadEnvLocal(): void {
  try {
    require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  } catch {
    // dotenv unavailable
  }
}

function initAdmin(): void {
  if (admin.apps.length) return;
  loadEnvLocal();

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "clinical-tracker-spires";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
    return;
  }

  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(process.cwd(), "scripts", "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, "utf-8"))) });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

async function resetUser(db: admin.firestore.Firestore, email: string) {
  const now = new Date().toISOString();

  // Try querying Firestore users collection by email field (no Auth API needed)
  const snap = await db.collection("users").where("email", "==", email).limit(1).get();

  if (snap.empty) {
    console.error(`  ✗ No Firestore user doc found with email: ${email}`);
    console.error(`    → Create the doc manually in Firebase Console → Firestore → users`);
    console.error(`    → Or check the email is stored in the 'email' field of the user doc\n`);
    return;
  }

  const docRef = snap.docs[0].ref;
  await docRef.update({
    firstLogin: false,
    tourCompleted: false,
    updatedAt: now,
    updatedBy: "reset-first-login-script",
  });

  const uid = snap.docs[0].id;
  console.log(`  ✓ ${email} (uid: ${uid}) → firstLogin: false, tourCompleted: false`);
  console.log(`    Tour will show on next login.\n`);
}

async function resetByUid(db: admin.firestore.Firestore, uid: string) {
  const now = new Date().toISOString();
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`  ✗ No user doc found for uid: ${uid}\n`);
    return;
  }
  await ref.update({ firstLogin: false, tourCompleted: false, updatedAt: now, updatedBy: "reset-first-login-script" });
  console.log(`  ✓ uid: ${uid} → firstLogin: false, tourCompleted: false`);
  console.log(`    Tour will show on next login.\n`);
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  // Option A: UID passed via env var
  const uid = process.env.UID ?? process.env.USER_UID ?? "";
  if (uid) {
    console.log(`Resetting by UID: ${uid}\n`);
    await resetByUid(db, uid);
    return;
  }

  // Option B: emails passed as CLI args
  const emails = process.argv.slice(2).filter(Boolean);
  if (emails.length === 0) {
    console.error(
      "Usage:\n" +
      "  npx tsx scripts/reset-first-login.ts email@example.com [email2@...]\n" +
      "  UID=<uid> npx tsx scripts/reset-first-login.ts\n"
    );
    process.exit(1);
  }

  console.log(`Resetting ${emails.length} user(s)...\n`);
  for (const email of emails) {
    await resetUser(db, email);
  }

  console.log("Done. Sign out and back in to trigger the tour.");
}

main().catch((err) => {
  console.error("Script failed:", err?.message ?? err);
  process.exit(1);
});
