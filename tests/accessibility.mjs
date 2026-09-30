import { launchBrowser } from "./browser-support.mjs";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
const browser = await launchBrowser();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
});
const page = await context.newPage();
await page.goto("http://localhost:3000");
for (const screen of ["home", "reader"]) {
  if (screen === "reader") {
    await page.getByRole("textbox").fill("2x+5=15");
    await page.getByRole("button", { name: "Explain it", exact: true }).click();
    await page.locator(".short-answer").waitFor();
  }
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.equal(result.violations.length, 0, JSON.stringify(result.violations));
  console.log(
    screen,
    JSON.stringify(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      null,
      2,
    ),
  );
}
await browser.close();
