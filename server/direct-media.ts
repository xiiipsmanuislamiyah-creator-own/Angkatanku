import type { Domain } from "./domain.js";
import type { MediaProvider } from "./media.js";
import { validateFile } from "./media.js";
import { requireThat, rateLimit, randomToken, validId } from "./security.js";
export const directUploads = () =>
  process.env.VERCEL === "1" || process.env.DIRECT_MEDIA_UPLOAD === "true";
export async function boundedDownload(response: Response, max: number) {
  requireThat(response.ok && response.body, 502, "MEDIA_UNAVAILABLE");
  const size = Number(response.headers.get("content-length"));
  requireThat(!size || size <= max, 413, "FILE_TOO_LARGE");
  const reader = response.body.getReader(),
    parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      requireThat(total <= max, 413, "FILE_TOO_LARGE");
      parts.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(parts);
}
export function installDirectMedia(
  { app, store, wrap, writeUser, mutation, config }: Domain,
  media: MediaProvider,
) {
  app.get(
    "/api/media/config",
    wrap(async (_req, res) =>
      res.json({
        direct: directUploads(),
        imageLimit: 8 * 1024 * 1024,
        videoLimit: 20 * 1024 * 1024,
      }),
    ),
  );
  app.post(
    "/api/media/authorize",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      requireThat(
        !p.account.mustChangePassword,
        403,
        "PASSWORD_CHANGE_REQUIRED",
      );
      requireThat(
        directUploads() && media.authorize && media.inspect,
        503,
        "MEDIA_UNAVAILABLE",
      );
      const { mime, size } = req.body;
      requireThat(
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
          "video/webm",
        ].includes(mime) &&
          Number.isInteger(size) &&
          size > 0 &&
          size <= (mime.startsWith("image/") ? 8 : 20) * 1024 * 1024,
        400,
        "INVALID_FILE",
      );
      const cfg = await config();
      requireThat(!cfg.uploadLock, 403, "UPLOAD_LOCKED");
      await rateLimit(store, "upload:" + p.uid, 20, 3600000);
      await rateLimit(store, "upload-global", 200, 86400000);
      const id = randomToken(),
        now = Date.now(),
        resourceType = mime.startsWith("video/") ? "video" : "image";
      const asset = {
        publicId: "angkatanku-v2/" + id,
        resourceType,
        mime,
        size,
        ownerId: p.uid,
        createdAt: now,
        parents: [],
        pending: true,
        signatureUntil: now + 3600_000,
      };
      const authorized = await media.authorize(asset);
      await mutation(
        p,
        ["security_config/main"],
        "media.authorize",
        id,
        ([policy]) => {
          requireThat(!policy?.uploadLock, 403, "UPLOAD_LOCKED");
          return { value: null, writes: { ["security_media/" + id]: asset } };
        },
      );
      res.json({ id, ...authorized });
    }),
  );
  app.post(
    "/api/media/complete",
    wrap(async (req, res) => {
      const p = writeUser(req, res),
        id = req.body.id;
      requireThat(validId(id) && media.inspect, 400, "INVALID_FILE");
      requireThat(
        !p.account.mustChangePassword,
        403,
        "PASSWORD_CHANGE_REQUIRED",
      );
      await rateLimit(store, "upload-confirm:" + p.uid, 40, 3600000);
      const key = "security_media/" + id,
        a = await store.get(key);
      requireThat(
        a && a.ownerId === p.uid && !a.deleted && !a.deleting,
        404,
        "NOT_FOUND",
      );
      if (!a.pending) {
        res.json({ id, url: "/api/media/" + id });
        return;
      }
      requireThat(a.signatureUntil > Date.now(), 409, "UPLOAD_EXPIRED");
      const checked = await media.inspect(a);
      // The provider response in the browser is untrusted. Inspect on the server.
      requireThat(
        checked.publicId === a.publicId &&
          checked.resourceType === a.resourceType &&
          checked.deliveryType === "authenticated" &&
          checked.size === a.size,
        400,
        "INVALID_FILE",
      );
      const buffer = await boundedDownload(
        await media.download(checked),
        a.size,
      );
      requireThat(buffer.length === a.size, 400, "INVALID_FILE");
      await validateFile(buffer, a.mime);
      await mutation(
        p,
        [key, "security_config/main"],
        "media.upload",
        id,
        ([latest, policy]) => {
          requireThat(
            latest?.ownerId === p.uid && !latest.deleted && !latest.deleting,
            409,
            "MEDIA_STATE_CHANGED",
          );
          requireThat(!policy?.uploadLock, 403, "UPLOAD_LOCKED");
          return {
            value: null,
            writes: {
              [key]: {
                ...latest,
                ...checked,
                mime: a.mime,
                pending: false,
                verifiedAt: Date.now(),
              },
            },
          };
        },
      );
      res.json({ id, url: "/api/media/" + id });
    }),
  );
}
