import type { NextConfig } from "next";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { withSentryConfig } from "@sentry/nextjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig: NextConfig = {
  outputFileTracingRoot: resolve(__dirname, ".."),
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@opentelemetry/api",
  ],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps during CI builds only — keeps local builds fast
  silent: !process.env.CI,

  // Disable source map upload when no auth token is present
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Tree-shake Sentry debug code from production bundles
  disableLogger: true,

  // Tunnel Sentry requests through our origin to avoid ad-blockers
  tunnelRoute: "/monitoring",
});
