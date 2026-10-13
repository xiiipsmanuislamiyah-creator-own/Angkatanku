import type { IncomingMessage, ServerResponse } from "node:http";
import { createRuntimeApp } from "../server/runtime";
let application: ReturnType<typeof createRuntimeApp>;
export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    application ||= createRuntimeApp();
  } catch {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.statusCode = 503;
    res.end(JSON.stringify({
        code: "SERVICE_UNCONFIGURED",
        error: "Layanan sedang disiapkan. Silakan kembali nanti.",
      }));
    return;
  }
  return application(req, res);
}
