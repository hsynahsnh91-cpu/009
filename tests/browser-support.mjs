import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
export async function launchBrowser() {
  if (!process.env.BUNDLED_CHROMIUM) return chromium.launch({ headless: true });
  // A Linux-only fallback for sandboxes where the Playwright CDN is unavailable.
  const { default: bundled } = await import("@sparticuz/chromium");
  const root = resolve(
    dirname(fileURLToPath(import.meta.resolve("@sparticuz/chromium"))),
    "..",
  );
  const libs = resolve(tmpdir(), "explainx-browser-libs");
  mkdirSync(libs, { recursive: true });
  const tar = resolve(libs, "libs.tar");
  writeFileSync(
    tar,
    brotliDecompressSync(readFileSync(resolve(root, "bin/al2023.tar.br"))),
  );
  execFileSync("tar", ["-xf", tar, "-C", libs]);
  return chromium.launch({
    executablePath: await bundled.executablePath(),
    args: bundled.args.filter((a) => a !== "--disable-web-security"),
    headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: resolve(libs, "lib") },
  });
}
