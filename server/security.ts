import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import type { Store, RecordData } from "./store.js";
const scrypt = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCallback(
      password,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
export const randomToken = () => randomBytes(32).toString("base64url");
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function requireThat(
  condition: unknown,
  status = 400,
  code = "INVALID_INPUT",
  message = "Permintaan tidak valid.",
): asserts condition {
  if (!condition) throw new HttpError(status, code, message);
}
export const validId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[\w@.-]{1,128}$/.test(id) &&
  id !== "." &&
  id !== "..";
export function normalizeUsername(value: unknown) {
  requireThat(typeof value === "string" && value.length <= 100);
  const name = value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/@angkatanku\.local$/, "");
  requireThat(/^[a-z0-9][a-z0-9_.-]{1,63}$/.test(name));
  return name;
}
export function passwordInput(value: unknown) {
  requireThat(
    typeof value === "string" &&
      value.length >= 12 &&
      Buffer.byteLength(value) <= 128,
    400,
    "PASSWORD_POLICY",
    "Gunakan kata sandi minimal 12 karakter, maksimal 128 byte.",
  );
  return value;
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return (
    "scrypt-v1$" + salt + "$" + (await scrypt(password, salt)).toString("hex")
  );
}
export async function verifyPassword(password: unknown, encoded?: string) {
  if (typeof password !== "string" || Buffer.byteLength(password) > 128)
    return false;
  const [, salt, expected] = (encoded || "").split("$");
  const actual = await scrypt(password, salt || "0".repeat(32)),
    wanted = Buffer.from(expected || "00".repeat(64), "hex");
  return (
    !!encoded?.startsWith("scrypt-v1$") &&
    wanted.length === actual.length &&
    timingSafeEqual(actual, wanted)
  );
}
export const PERMISSIONS = [
  "profiles.manage",
  "feed.moderate",
  "story.moderate",
  "globalChat.moderate",
  "reports.review",
  "academic.manage",
  "announcements.manage",
  "config.manage",
  "audit.read",
  "memory.review",
  "identity.publish",
] as const;
export type Role = "owner" | "admin" | "member";
export interface Principal {
  uid: string;
  account: RecordData;
  session: RecordData;
  sid: string;
}
export function can(
  p: Principal | null,
  permission: string,
  item?: RecordData,
) {
  if (!p || p.account.status !== "active") return false;
  if (p.account.role === "owner") return true;
  if (
    p.account.role !== "admin" ||
    !p.account.permissions?.includes(permission)
  )
    return false;
  const c = item?.classRoom || item?.className;
  return (
    p.account.scope === "school" ||
    (!!c && (p.account.classRooms || []).includes(c))
  );
}
export const audit = (actor: string, action: string, target: string) => ({
  actor,
  action,
  target,
  createdAt: Date.now(),
});
export function fresh(p: Principal) {
  requireThat(
    Date.now() - (p.session.reauthenticatedAt || 0) < 5 * 60_000,
    403,
    "REAUTH_REQUIRED",
    "Konfirmasi kata sandi lagi sebelum tindakan ini.",
  );
}
export async function rateLimit(
  store: Store,
  key: string,
  limit: number,
  windowMs: number,
) {
  const path = "security_rates/" + digest(key),
    now = Date.now();
  await store.atomic([path], ([old]) => {
    const times: number[] = (old?.times || []).filter(
      (t: number) => now - t < windowMs,
    );
    requireThat(
      times.length < limit,
      429,
      "RATE_LIMITED",
      "Terlalu banyak permintaan. Coba lagi nanti.",
    );
    return {
      value: null,
      writes: { [path]: { times: [...times, now], expiresAt: now + windowMs } },
    };
  });
}
export function cleanObject(value: unknown, depth = 0): RecordData {
  requireThat(
    value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      depth <= 5,
  );
  const out: RecordData = {};
  for (const [k, v] of Object.entries(value)) {
    requireThat(
      /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(k) &&
        !["constructor", "prototype", "__proto__"].includes(k),
    );
    requireThat(typeof v !== "string" || v.length <= 10000);
    if (Array.isArray(v)) {
      requireThat(v.length <= 100);
      out[k] = v.map((x) =>
        x && typeof x === "object" ? cleanObject(x, depth + 1) : x,
      );
    } else out[k] = v && typeof v === "object" ? cleanObject(v, depth + 1) : v;
  }
  return out;
}
