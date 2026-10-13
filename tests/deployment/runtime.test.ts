import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createServer as httpServer, request as httpRequest } from "node:http";
import { createServer as httpsServer } from "node:https";
import { chromium, expect, type Browser } from "@playwright/test";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { firebaseStore } from "../../server/store";
import { MemoryStore, seed, TEST_PASSWORD } from "../helpers";

async function unusedPort() {
  const server = httpServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = (server.address() as { port: number }).port;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return port;
}

test(
  "production build over HTTPS preserves secure sessions, Firestore writes and access boundaries",
  { timeout: 60000 },
  async () => {
    assert.equal(process.env.FIREBASE_PROJECT_ID, "demo-angkatanku");
    assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080");
    const rulesEnvironment = await initializeTestEnvironment({
      projectId: "demo-angkatanku",
      firestore: {
        host: "127.0.0.1",
        port: 8080,
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
    const store = firebaseStore();
    const fixture = new MemoryStore();
    await seed(fixture);
    await store.atomic(["security_accounts/member"], () => ({
      value: null,
      writes: Object.fromEntries(fixture.map),
    }));

    const dir = mkdtempSync(join(tmpdir(), "angkatanku-https-test-"));
    let processUnderTest: ChildProcess | undefined;
    let browser: Browser | undefined;
    const backendPort = await unusedPort();
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-days",
        "1",
        "-keyout",
        join(dir, "key.pem"),
        "-out",
        join(dir, "cert.pem"),
        "-subj",
        "/CN=localhost",
        "-addext",
        "subjectAltName=DNS:localhost,IP:127.0.0.1",
      ],
      { stdio: "ignore" },
    );
    const proxy = httpsServer(
      {
        key: readFileSync(join(dir, "key.pem")),
        cert: readFileSync(join(dir, "cert.pem")),
      },
      (req, res) => {
        const upstream = httpRequest(
          {
            host: "127.0.0.1",
            port: backendPort,
            method: req.method,
            path: req.url,
            headers: req.headers,
          },
          (response) => {
            res.writeHead(response.statusCode || 502, response.headers);
            response.pipe(res);
          },
        );
        upstream.on("error", () => {
          if (!res.headersSent) res.writeHead(502);
          res.end();
        });
        req.pipe(upstream);
      },
    );
    try {
      proxy.listen(0, "127.0.0.1");
      await once(proxy, "listening");
      const origin =
        "https://127.0.0.1:" + (proxy.address() as { port: number }).port;
      processUnderTest = spawn(
        process.execPath,
        ["scripts/start-production.mjs"],
        {
          stdio: "ignore",
          env: {
            ...process.env,
            NODE_ENV: "production",
            PORT: String(backendPort),
            APP_ORIGINS: origin,
            GOOGLE_APPLICATION_CREDENTIALS: "",
            GEMINI_API_KEY: "",
            CLOUDINARY_CLOUD_NAME: "",
            CLOUDINARY_API_KEY: "",
            CLOUDINARY_API_SECRET: "",
            TRUSTED_PROXY_CIDRS: "",
          },
        },
      );
      let ready = false;
      for (let attempt = 0; attempt < 80; attempt++) {
        assert.equal(
          processUnderTest.exitCode,
          null,
          "Production entrypoint must remain running",
        );
        try {
          const response = await fetch(
            "http://127.0.0.1:" + backendPort + "/api/health",
            { signal: AbortSignal.timeout(500) },
          );
          if (response.ok) {
            ready = true;
            break;
          }
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.ok(ready, "Production server must become ready");
      browser = await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.route("**/*", (route) =>
        route
          .request()
          .url()
          .startsWith(origin + "/") || route.request().url().startsWith("data:")
          ? route.continue()
          : route.abort(),
      );
      const response = await page.goto(origin + "/login");
      assert.match(
        response!.headers()["strict-transport-security"],
        /max-age=/,
      );
      assert.match(
        response!.headers()["content-security-policy"],
        /object-src 'none'/,
      );
      await expect(page.locator(".cinematic-stage")).toHaveCount(0, {
        timeout: 20000,
      });
      await page
        .getByRole("button", { name: "Masuk dengan username & password" })
        .click();
      await page.getByPlaceholder("Masukkan username atau ID").fill("member");
      await page.getByPlaceholder("Masukkan kata sandi...").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "Otorisasi Masuk" }).click();
      await expect(page).toHaveURL(/\/home/, { timeout: 15000 });

      const cookies = await context.cookies();
      const sessionCookie = cookies.find(
        (cookie) => cookie.name === "__Host-angkatan_session",
      );
      assert.ok(sessionCookie?.secure && sessionCookie.httpOnly);
      assert.equal(sessionCookie.sameSite, "Strict");
      assert.equal(sessionCookie.path, "/");
      assert.ok(
        !(await page.evaluate(() => document.cookie)).includes(
          "angkatan_session",
        ),
      );
      await page.reload();
      const session = await (
        await context.request.get(origin + "/api/auth/session")
      ).json();
      assert.equal(session.user.role, "member");
      assert.ok(!JSON.stringify(session).includes(TEST_PASSWORD));
      assert.equal(
        (await context.request.get(origin + "/api/admin/accounts")).status(),
        403,
      );

      const writeStatus = await page.evaluate(async (csrfToken) => {
        const response = await fetch("/api/data/write", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            collection: "students",
            id: "member",
            operation: "update",
            data: { motto: "HTTPS dummy update" },
          }),
        });
        return response.status;
      }, session.csrfToken);
      assert.equal(writeStatus, 200);
      assert.equal(
        (await store.get("students/member"))!.motto,
        "HTTPS dummy update",
      );
      assert.equal(
        (
          await context.request.post(origin + "/api/auth/logout", {
            headers: {
              Origin: "https://untrusted.invalid",
              "X-CSRF-Token": session.csrfToken,
            },
            data: {},
          })
        ).status(),
        403,
      );
      for (const path of ["/.env", "/dist/server/server.mjs", "/server.ts"]) {
        const staticResponse = await context.request.get(origin + path);
        assert.match(staticResponse.headers()["content-type"], /text\/html/);
        assert.match(await staticResponse.text(), /<!doctype html>/i);
      }
      assert.equal(
        await page.evaluate(
          async (csrfToken) =>
            (
              await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRF-Token": csrfToken,
                },
                body: "{}",
              })
            ).status,
          session.csrfToken,
        ),
        200,
      );
      assert.equal(
        (await (await context.request.get(origin + "/api/auth/session")).json())
          .user,
        null,
      );
      assert.ok(
        !(await context.cookies()).some(
          (cookie) => cookie.name === "__Host-angkatan_session",
        ),
      );
      await context.close();
    } finally {
      await browser?.close();
      if (processUnderTest?.exitCode === null) {
        const stopped = once(processUnderTest, "exit");
        processUnderTest.kill("SIGTERM");
        await stopped;
      }
      proxy.closeAllConnections();
      await new Promise<void>((resolve) => proxy.close(() => resolve()));
      rmSync(dir, { recursive: true, force: true });
      await rulesEnvironment.cleanup();
    }
  },
);
