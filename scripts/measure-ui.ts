// Local, dummy-only lab sample. Does not contact Firebase or external providers.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const server = spawn(process.execPath, ["--import", "tsx", "tests/e2e-server.ts"], {
  stdio: ["ignore", "ignore", "inherit"],
});
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  let available = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error("Dummy server exited");
    available = await fetch("http://127.0.0.1:4173/api/health")
      .then((r) => r.ok).catch(() => false);
    if (available) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!available) throw new Error("Dummy server unavailable");
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const results = [];
  for (const width of [390, 1280]) for (const route of ["home", "feed", "guru", "nusa-ai"]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await context.route("**/*", (r) => new URL(r.request().url()).hostname === "127.0.0.1" ? r.continue() : r.abort());
    await context.addInitScript(() => {
      (window as any).__lcp = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) (window as any).__lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/" + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const sample = await page.evaluate(() => ({
      lcpMs: Math.round((window as any).__lcp),
      dom: document.querySelectorAll("*").length,
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      jsBytes: performance.getEntriesByType("resource")
        .filter((r) => new URL(r.name).pathname.endsWith(".js"))
        .reduce((n, r) => n + (r as PerformanceResourceTiming).decodedBodySize, 0),
    }));
    results.push({ route, width, ...sample });
    await context.close();
  }
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/ui-performance.json", JSON.stringify(results, null, 2) + "\n");
  console.log(JSON.stringify(results));
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
