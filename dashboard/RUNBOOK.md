# StrydeOS — Operations Runbook

Internal ops reference for the Intelligence dashboard. Not for end-users.

---

## Environment Variables

All variables must be set in the Vercel dashboard under **Settings → Environment Variables** for the `dashboard` project.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | Sentry DSN (public — safe in browser bundles) |
| `SENTRY_AUTH_TOKEN` | CI only | Sentry auth token for source map upload during builds |
| `SENTRY_ORG` | CI only | Sentry organisation slug |
| `SENTRY_PROJECT` | CI only | Sentry project slug |
| `CRON_SECRET` | **Yes** | Shared secret Vercel uses to authenticate cron invocations. Must match the `Authorization: Bearer <secret>` header Vercel sends. Generate with `openssl rand -hex 32`. |
| `CSV_INBOUND_SECRET` | Yes | Shared secret for inbound email-to-CSV webhook (Mailgun/SendGrid/n8n). |
| `INGEST_EMAIL_DOMAIN` | Yes | Domain for ingest addresses — `ingest.strydeos.com` |
| `FIREBASE_*` | Yes | Firebase Admin SDK credentials |

### Confirming `CRON_SECRET` is set

1. In Vercel dashboard → Project → Settings → Environment Variables
2. Verify `CRON_SECRET` exists for **Production** environment
3. After any change, redeploy for it to take effect (Vercel caches env at build/deploy time)
4. To test: `curl -X POST https://app.strydeos.com/api/pipeline/run -H "Authorization: Bearer <secret>"` — should return `200` with pipeline results, not `500 CRON_SECRET not configured`

---

## Cron Schedule

Pipeline runs every **4 hours** for all connected clinics.

```json
{ "path": "/api/pipeline/run", "schedule": "0 */4 * * *" }
```

Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC.

### Checking cron health

- Vercel dashboard → Project → **Deployments** → **Cron Jobs** tab shows last run time and status
- Sentry will surface any pipeline exceptions automatically (tagged with `clinicId` and `source: pipeline_cron`)
- If a cron invocation fails auth: check `CRON_SECRET` is set and matches what Vercel sends

### Real-time sync availability by PMS

| PMS | Sync method | Notes |
|---|---|---|
| WriteUpp | Webhook (real-time) | `POST /api/webhooks/writeupp` |
| Cliniko | Cron only (every 4h) | Cliniko has no outbound webhooks — pull-only API |
| TM3 | Email-ingest (manual trigger) | See TM3 section below |
| Jane App | CSV / email-ingest | No API |

---

## Pipeline Architecture

The 7-stage pipeline (`/lib/pipeline/run-pipeline.ts`) runs per-clinic:

1. **Fetch** — pull appointments from PMS adapter (WriteUpp API / Cliniko API / CSV)
2. **Normalise** — map PMS fields to `PMSAppointment` canonical shape
3. **Upsert** — write to Firestore `appointments` collection with `clinicId` partition
4. **Compute metrics** — derive weekly KPIs from appointment data
5. **Cache** — write computed metrics to `metrics_weekly` collection
6. **Physitrack sync** — fetch HEP compliance data from Physitrack
7. **n8n callback** — trigger any downstream automation flows

The pipeline is idempotent — safe to re-run. All writes are upserts keyed on `{clinicId}_{appointmentId}`.

---

## TM3 — Email-Ingest Pathway

TM3 (Blue Zinc) has no public API. The interim automation pathway is:

**Export → Email → Auto-import**

1. Set up a scheduled export in TM3 (or export manually)
2. Email the CSV attachment to the clinic's ingest address:  
   `import-{clinicId}@ingest.strydeos.com`
3. The inbound webhook (`POST /api/pms/import-csv/inbound`) receives the email via Mailgun/SendGrid, validates the `X-Inbound-Secret` header, extracts the clinic ID from the recipient address, and runs `runCSVImport()`

### Mailgun setup (if using Mailgun for inbound)

1. Add `ingest.strydeos.com` as a receiving domain in Mailgun
2. Set up a Route: match `import-*@ingest.strydeos.com` → forward to `https://app.strydeos.com/api/pms/import-csv/inbound`
3. Add the `X-Inbound-Secret` header to the forwarded request (Mailgun supports custom headers in route forwarding, or proxy via n8n)
4. Set `CSV_INBOUND_SECRET` env var to match

### n8n alternative (simpler)

Use an n8n Email Trigger node → HTTP Request node to `POST /api/pms/import-csv/inbound` with `X-Inbound-Secret` header. Attach the CSV from the email trigger payload as a `file` form field.

---

## Sentry

Error monitoring is live on all API routes and the client bundle.

| Component | Coverage |
|---|---|
| API routes (server) | All unhandled exceptions via `handleApiError()` |
| Pipeline cron | Per-clinic failures captured with `clinicId` tag |
| Client bundle | Unhandled JS errors + 5% session replay |

**DSN:** set `NEXT_PUBLIC_SENTRY_DSN` in Vercel — use the project DSN from sentry.io → Project Settings → Client Keys.

**Key alerts to configure in Sentry:**
- Issue alert: any new error in `pipeline_cron` tag → Slack/email
- Issue alert: `CRON_SECRET not configured` (error text) → immediate page
- Performance alert: p95 API response > 10s → warning

**Source maps:** set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` env vars for CI builds to enable readable stack traces in production.

---

## Manual Pipeline Trigger ("Sync now")

From the dashboard → Settings → click **Sync now**.

This calls `POST /api/pipeline/run` with `{ clinicId }` body using the logged-in user's Firebase ID token. Requires `owner`, `admin`, or `superadmin` role.

To trigger from the CLI (e.g. backfill after a bug fix):

```bash
# Get a Firebase ID token for a superadmin account
TOKEN=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<WEB_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@strydeos.com","password":"...","returnSecureToken":true}' \
  | jq -r .idToken)

curl -X POST https://app.strydeos.com/api/pipeline/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"<clinicId>"}'
```

---

## Backfill

`POST /api/pipeline/backfill` runs the pipeline over a longer historical window. Use this when:
- A new clinic is onboarded (populate historical metrics)
- A bug in the pipeline corrupted metric data
- A new metric is added and needs to be computed historically

Same auth as `/api/pipeline/run`.

---

## Incident Response

### Pipeline failures showing in Sentry

1. Check Sentry → Issues → filter by `source: pipeline_cron`
2. Identify which `clinicId` is affected
3. Check clinic's PMS credentials in Firestore `clinics` collection → `pmsConfig`
4. Test the connection via Settings → PMS → Test connection
5. If PMS credentials expired, ask the clinic owner to reconnect in Settings
6. Trigger a manual sync via CLI (above) once credentials are fixed

### Cron not running

1. Vercel dashboard → Cron Jobs — check last invocation time
2. If last run was >5h ago, check Vercel deployment status (crons only run on active deployments)
3. If deployment is healthy but cron is skipped, check Vercel cron logs for auth failures
4. Verify `CRON_SECRET` is set and matches

### High DNA rate spike at a clinic

Not an incident — surface to the clinic owner via the Intelligence dashboard. This is signal, not error.

---

*Last updated: March 2026*
