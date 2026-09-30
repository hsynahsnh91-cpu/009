import { launchBrowser } from "./browser-support.mjs";
import assert from "node:assert/strict";
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000");
await page.screenshot({ path: "/tmp/explainx-desktop.png", fullPage: true });
await page.getByRole("button", { name: "Explain it", exact: true }).click();
await page.getByRole("alert").filter({ hasText: "Enter something" }).waitFor();
await page.getByRole("textbox").fill("What is gravity?");
await page.getByRole("button", { name: "Explain it", exact: true }).click();
await page
  .getByRole("alert")
  .filter({ hasText: "AI is not connected" })
  .waitFor();
await page.getByRole("textbox").fill("2x + 5 = 15");
await page.getByRole("button", { name: "Explain it", exact: true }).click();
await page.locator(".short-answer").filter({ hasText: "x = 5" }).waitFor();
await page.getByRole("button", { name: "Save", exact: true }).click();
await page
  .getByRole("button", { name: "A Subtract the same number from both sides" })
  .click();
await page.getByRole("status").filter({ hasText: "That’s right!" }).waitFor();
await page.locator(".why-button").first().click();
await page.locator(".deep-dive .text-button").click();
await page.locator(".why-node").waitFor();
await page.getByRole("button", { name: "03 Explore connections" }).click();
await page.getByRole("button", { name: "Zoom in" }).click();
await page.getByRole("button", { name: "Reset view" }).click();
await page
  .getByRole("button", { name: "Explore: Equality", exact: true })
  .click();
await page
  .getByRole("alert")
  .filter({ hasText: "AI is not connected" })
  .waitFor();
await page.getByRole("button", { name: "02 Go deeper" }).click();
await page.getByRole("combobox").selectOption("5");
await page.getByRole("button", { name: "02 Go deeper" }).click();
await page.getByRole("heading", { name: "Sensitivity" }).first().waitFor();
await page
  .getByRole("button", { name: "I don’t understand this", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Analogy: an unknown box" })
  .first()
  .waitFor();
await page.getByRole("button", { name: "Export", exact: true }).click();
const dl = page.waitForEvent("download");
await page.getByRole("button", { name: "Markdown", exact: true }).click();
assert.ok((await dl).suggestedFilename().endsWith(".md"));
await page.getByRole("button", { name: "3x + 9 = 21", exact: true }).click();
await page.locator(".short-answer").filter({ hasText: "x = 4" }).waitFor();
await page.reload();
await page
  .getByRole("button", { name: "Saved explanations", exact: false })
  .click();
await page.locator(".history-row").first().waitFor();
await page.getByRole("button", { name: "My history", exact: true }).click();
await page.getByRole("textbox").fill("not a topic");
await page
  .getByText("No matching explanations. Try a different search.")
  .waitFor();
await page.getByRole("textbox").fill("");
const before = await page.locator(".history-row").count();
await page
  .getByRole("button", { name: /Delete:/ })
  .first()
  .click();
assert.equal(await page.locator(".history-row").count(), before - 1);
await page.getByRole("button", { name: "Language", exact: true }).click();
assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
await page.reload();
await page.waitForFunction(() => document.documentElement.dir === "rtl");
await page.setViewportSize({ width: 390, height: 844 });
await page.getByRole("button", { name: "فتح التنقل" }).click();
await page.getByRole("button", { name: "اكتشف", exact: true }).click();
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
await page.screenshot({ path: "/tmp/explainx-ar-mobile.png", fullPage: true });
await page.getByRole("button", { name: "اللغة", exact: true }).click();
await page.screenshot({ path: "/tmp/explainx-mobile.png", fullPage: true });
// Cache reuse must avoid a second generation request.
await page.getByRole("textbox").fill("2x + 5 = 15");
await page.getByRole("button", { name: "Explain it", exact: true }).click();
await page.locator(".short-answer").waitFor();
await page
  .getByRole("button", { name: "Back to discover", exact: false })
  .click();
let calls = 0;
page.on("request", (r) => {
  if (r.url().endsWith("/api/explain")) calls++;
});
await page.getByRole("textbox").fill("2x + 5 = 15");
await page.getByRole("button", { name: "Explain it", exact: true }).click();
await page.locator(".short-answer").waitFor();
assert.equal(calls, 0);
await page
  .getByRole("button", { name: "Back to discover", exact: false })
  .click();
// Hold a real outgoing request, cancel it, and ensure no stale view appears.
let held;
await page.route("**/api/explain", (route) => {
  held = route;
});
await page.getByRole("textbox").fill("Explain photosynthesis");
await page.getByRole("button", { name: "Explain it", exact: true }).click();
await page.getByRole("button", { name: "Cancel", exact: true }).click();
await page.locator(".loading-panel").waitFor({ state: "hidden" });
if (held) await held.abort().catch(() => {});
await page.unroute("**/api/explain");
await page.route("**/api/explain", (route) =>
  route.abort("internetdisconnected"),
);
await page.getByRole("button", { name: "Explain it", exact: true }).click();
await page
  .getByRole("alert")
  .filter({ hasText: "connection appears to be unavailable" })
  .waitFor();
await page.unroute("**/api/explain");
assert.deepEqual(errors, []);
console.log(
  "PASS: input validation, honest AI-unavailable state, deterministic algebra, favorite persistence, quiz, WHY, map, depth, simplification, export, follow-up, search, delete, RTL persistence, mobile drawer, no overflow or browser errors.",
);
await browser.close();
