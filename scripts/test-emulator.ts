import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
const jar = process.env.FIRESTORE_EMULATOR_JAR;
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--production"))
  throw new Error("Unknown emulator test option");
const testFile = args.includes("--production")
  ? "tests/deployment/runtime.test.ts"
  : "tests/emulator/firestore.test.ts";
if (!jar)
  throw new Error(
    "FIRESTORE_EMULATOR_JAR required (official Firebase emulator, Java 21).",
  );
const child = spawn(
  process.env.JAVA_BIN || "java",
  [
    "-jar",
    jar,
    "--host=127.0.0.1",
    "--port=8080",
    "--project_id=demo-angkatanku",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
const log = createWriteStream("firestore-emulator.log");
child.stdout.pipe(log);
child.stderr.pipe(log);
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error("Emulator terminated");
    try {
      const r = await fetch("http://127.0.0.1:8080");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!ready) throw new Error("Emulator not ready");
  const result = spawn(
    process.execPath,
    ["--import", "tsx", "--test", testFile],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        FIREBASE_PROJECT_ID: "demo-angkatanku",
        GCLOUD_PROJECT: "demo-angkatanku",
        FIREBASE_DATABASE_ID: "(default)",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
        GOOGLE_APPLICATION_CREDENTIALS: "",
      },
    },
  );
  process.exitCode = await new Promise<number>((resolve, reject) => {
    result.once("error", reject);
    result.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  child.kill("SIGTERM");
  log.end();
}
