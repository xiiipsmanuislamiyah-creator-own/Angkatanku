import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import handler from "../api/index";
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

test("Vercel API and transitive imports load as compiled native Node ESM without the tsx resolver", () => {
  const output = path.resolve("test-results/native-vercel");
  try {
    execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--target", "ES2022", "--module", "NodeNext", "--moduleResolution", "NodeNext", "--skipLibCheck", "--esModuleInterop", "--outDir", output, "--rootDir", ".", "api/index.ts"], { stdio: "pipe" });
    const url = pathToFileURL(path.join(output, "api/index.js")).href;
    const result = execFileSync(process.execPath, ["--input-type=module", "-e", `const module = await import(${JSON.stringify(url)}); if (typeof module.default !== 'function') process.exit(1); console.log('native-esm-ok');`], {
      encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" },
    });
    assert.match(result, /native-esm-ok/);
  } finally { rmSync(output, { recursive: true, force: true }); }
});

test("unconfigured Vercel handler fails closed on a native Node response without leaking configuration", async () => {
  const keys = ["APP_ORIGINS", "FIREBASE_PROJECT_ID", "GCLOUD_PROJECT", "VERCEL", "VERCEL_URL", "VERCEL_BRANCH_URL"];
  const saved = keys.map((k) => process.env[k]);
  keys.forEach((k) => delete process.env[k]);
  process.env.APP_ORIGINS = "https://dummy.invalid";
  const server = createServer(handler);
  try {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as { port: number }).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/session`);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(response.headers.get("content-type") || "", /application\/json/);
    assert.deepEqual(await response.json(), {
      code: "SERVICE_UNCONFIGURED",
      error: "Layanan sedang disiapkan. Silakan kembali nanti.",
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    keys.forEach((k, i) => { if (saved[i] === undefined) delete process.env[k]; else process.env[k] = saved[i]; });
  }
});
