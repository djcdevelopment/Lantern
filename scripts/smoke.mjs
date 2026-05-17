/* Headless smoke test — drives the running dev server with a real
   browser and fails on any console error, page error, or blank route.
   Usage: `npm run dev` in one shell, then `node scripts/smoke.mjs`. */

import { chromium } from "playwright-core";

const BASE = process.env.SMOKE_BASE || "http://localhost:5180";
const CLOUD = process.env.SMOKE_CLOUD === "1";
const CHROME =
  process.env.SMOKE_CHROME ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const ROUTES = [
  "/",
  "/raids",
  "/raids/2026-05-12",
  "/replay",
  "/ask",
  "/contribute",
  "/notebook",
  "/observations",
  "/settings",
];

const errors = [];

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});
page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

for (const route of ROUTES) {
  const before = errors.length;
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForSelector(".main", { timeout: 5000 });
  await page.waitForTimeout(400); // let effects + async bootstrap settle
  const text = (await page.locator(".main").innerText()).trim();
  const ok = errors.length === before && text.length > 0;
  console.log(`${ok ? "PASS" : "FAIL"}  ${route}  (${text.length} chars)`);
}

// Interaction checks on Home.
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForSelector(".main");
await page.waitForTimeout(300);

const before = errors.length;
await page.keyboard.press("Control+k"); // command palette
await page.waitForSelector(".palette", { timeout: 3000 });
await page.keyboard.press("Escape");
await page.waitForSelector(".palette", { state: "detached", timeout: 3000 });
if (!CLOUD) {
  // Quick-note is local-only — disabled in the read-only cloud build.
  await page.keyboard.press("n");
  await page.waitForSelector(".quicknote-modal", { timeout: 3000 });
  await page.locator(".quicknote-modal .btn.ghost").click(); // Cancel
  await page.waitForSelector(".quicknote-modal", { state: "detached", timeout: 3000 });
}
const momentHero = page.locator(".moment-hero").first();
if (await momentHero.count()) {
  await momentHero.click(); // moment drawer
  await page.waitForSelector(".moment-drawer", { timeout: 3000 });
  await page.keyboard.press("Escape");
  await page.waitForSelector(".moment-drawer", { state: "detached", timeout: 3000 });
}
console.log(
  `${errors.length === before ? "PASS" : "FAIL"}  interactions (${CLOUD ? "palette / moment drawer" : "palette / quick-note / moment drawer"})`,
);

await browser.close();

if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log("  - " + e);
  process.exit(1);
}
console.log("\nAll smoke checks passed.");
