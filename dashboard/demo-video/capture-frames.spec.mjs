/**
 * Run: npx playwright test demo-video/capture-frames.spec.mjs
 * Captures 3 frames. Dashboard must be running (npm run dev, port 3000 or 3001).
 */
import { test } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, "frames");
const BASE = process.env.DEMO_URL || "http://localhost:3001";

test("capture demo frames", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(FRAMES_DIR, "01-login.png") });

  const demoBtn = page.getByRole("button", { name: /Enter dashboard \(demo\)/ });
  const signInBtn = page.getByRole("button", { name: /Sign in/ });
  if (await demoBtn.isVisible()) await demoBtn.click();
  else await signInBtn.click();

  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(FRAMES_DIR, "02-dashboard.png") });

  await page.locator("a[href='/intelligence']").first().click();
  await page.waitForURL(/\/intelligence/, { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(FRAMES_DIR, "03-features.png") });
});
