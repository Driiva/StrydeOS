#!/usr/bin/env node
/**
 * Creates minimal placeholder PNGs in ./frames/ so build-video.sh can run.
 * Replace these with real screenshots (01-login, 02-dashboard, 03-features) for the real demo.
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "frames");
const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const frames = ["01-login.png", "02-dashboard.png", "03-features.png"];

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

for (const name of frames) {
  const file = path.join(DIR, name);
  fs.writeFileSync(file, Buffer.from(MINIMAL_PNG_BASE64, "base64"));
  console.log("Created", file);
}

console.log("\nRun ./build-video.sh to create the video. Replace these placeholders with real screenshots for the final demo.");
