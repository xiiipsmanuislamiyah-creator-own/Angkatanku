// Dummy-only entry point. Never imported by the production server.
import express from "express";
import path from "node:path";
import { createApp } from "../server/app";
import { MemoryStore, seed } from "./helpers";
const store = new MemoryStore();
await seed(store);
const app = express();
app.post("/__test/reset", async (_req, res) => {
  await seed(store);
  res.json({ ok: true });
});
app.use(
  createApp({
    store,
    origins: ["http://127.0.0.1:4173"],
    media: {
      async upload() {
        return {
          publicId: "angkatanku-v2/dummy",
          resourceType: "image",
          mime: "image/png",
          format: "png",
          size: 100,
        };
      },
      async download() {
        return new Response("dummy");
      },
      async destroy() {},
    },
    ai: async () => "Jawaban dummy untuk pengujian.",
  }),
);
app.use(express.static(path.resolve("dist/client")));
app.get("*", (_req, res) =>
  res.sendFile(path.resolve("dist/client/index.html")),
);
app.listen(4173, "127.0.0.1");
