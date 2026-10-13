import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import handler from "../api/index";

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
