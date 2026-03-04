# StrydeOS Dashboard — Production deploy and “full live clinic”

Use this checklist so you and Joe can see a **proper full live version of your own clinic** (Spires) when you log in.

---

## 1. Deploy to Vercel with Firebase

1. Deploy the `dashboard` app to Vercel (or your production host).
2. In the Vercel project **Environment Variables**, set the following. Use the same Firebase project for both client and server.

**Client (browser) — prefix `NEXT_PUBLIC_`:**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase Console → Project settings → General |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase Console |

**Server (API routes, seed script):**

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Same as `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `FIREBASE_CLIENT_EMAIL` | From service account JSON (`client_email`) |
| `FIREBASE_PRIVATE_KEY` | From service account JSON (`private_key`); keep `\n` as literal two chars |

**Optional for scheduled pipeline sync:**

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | A random secret string. Vercel Cron will send `Authorization: Bearer <CRON_SECRET>` when calling `/api/pipeline/run`. If set, the pipeline runs on the schedule in `vercel.json` (e.g. every 4 hours). |

Full list of optional env vars (PMS, comms, n8n, etc.) is in [.env.example](.env.example).

---

## 2. Seed production Firestore (and Auth)

From your machine (with Firebase Admin credentials for the **production** project):

```bash
cd dashboard
npm run seed:production
```

This uses the same credential chain as other scripts: `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` in `.env.local`, or `scripts/serviceAccountKey.json`, or `gcloud auth application-default login`.

The script:

- Creates/updates clinic **Spires Physiotherapy London** (`clinic-spires`)
- Creates/updates 4 users in Firebase Auth + Firestore: Jamal (owner), Joe (admin), Andrew (clinician), Max (clinician)
- Seeds clinicians and **metrics_weekly** (9 weeks)
- Seeds **patients** so the Patients page and Pulse board show Spires data instead of demo

Default password for all seeded users: **`SpiresWH!`** (see script to change).

---

## 3. Log in and confirm

- **Jamal:** `jamal@spiresphysiotherapy.com`  
- **Joe:** `joe@spiresphysiotherapy.com`  
- Password: `SpiresWH!` (unless you changed it in the seed script)

You should see:

- Dashboard with **Spires Physiotherapy London**, real KPIs and trends, **no demo banner**
- Clinicians: Jamal, Andrew, Max, Joe
- Patients and Pulse: seeded Spires patients (no demo fallback)

---

## 4. Optional: real PMS data

To use **live data from WriteUpp** instead of (or in addition to) seeded data:

1. In the app, go to **Settings** and connect WriteUpp (API key stored in Firestore).
2. Trigger the pipeline once:
   - **Option A:** Call `POST https://your-app.vercel.app/api/pipeline/run` with header `Authorization: Bearer <CRON_SECRET>` (if you set `CRON_SECRET` in Vercel).
   - **Option B:** Call the same URL with `Authorization: Bearer <Firebase_ID_token>` (e.g. from a logged-in owner/admin session). You can use the browser Network tab after clicking something that triggers the pipeline, or use a small script that gets an ID token and calls the API.

After the pipeline runs, appointments and patients will be synced from WriteUpp and metrics recomputed.

---

## 5. Optional: fix Joe’s user

If Joe’s Firestore `users` doc or `clinicId` was ever wrong, after seeding run:

```bash
cd dashboard
npm run fix:joe
```

Or with an explicit UID from Firebase Console → Authentication → Users:

```bash
JOE_UID=<uid> npx tsx scripts/fix-joe-user.ts
```

---

## Tomorrow checklist (concise)

| Step | Action |
|------|--------|
| 1 | Deploy dashboard to Vercel; set Firebase client + server env vars (see above). |
| 2 | Run `npm run seed:production` from `dashboard/` against that Firebase project. |
| 3 | Log in as Jamal and Joe; confirm Dashboard shows Spires, real metrics, no demo banner. |
| 4 | (Optional) Connect WriteUpp in Settings and run pipeline so data stays in sync. |
| 5 | (Optional) Set `CRON_SECRET` in Vercel for scheduled pipeline runs. |

After steps 1–3, you and Joe see a **full live version of your own clinic** on login (Dashboard, clinicians, patients, Pulse). Steps 4–5 add live PMS sync and background pipeline runs.
