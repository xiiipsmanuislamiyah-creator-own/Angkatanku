import "dotenv/config";
import express from "express";
import path from "node:path";
import {createRuntimeApp} from "./server/runtime";
async function start() {
  const app = createRuntimeApp();
  if (process.env.NODE_ENV === "production") {
    const clientPath = path.resolve("dist/client");
    app.use(express.static(clientPath));
    app.get("*", (_req, res) =>
      res.sendFile(path.join(clientPath, "index.html")),
    );
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
  app.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
    console.log("AngkatanKU server ready"),
  );
}
start().catch(() => {
  console.error("Startup gagal. Periksa konfigurasi server.");
  process.exitCode = 1;
});
