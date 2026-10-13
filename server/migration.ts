import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import {
  requireThat,
  normalizeUsername,
  validId,
  passwordInput,
  hashPassword,
  digest,
  audit,
  randomToken,
} from "./security.js";
import type { Store, RecordData } from "./store.js";
export type MigrationAccount = {
  uid: string;
  username: string;
  displayName: string;
  profileKind: "student" | "teacher";
  profileCollection: "students" | "teachers";
  profileId: string;
  role: "owner" | "member";
  classRooms: string[];
  profile?: RecordData;
};
export type MigrationPlan = {
  before: Record<string, RecordData | null>;
  after: Record<string, RecordData | null>;
  projectId?: string;
  databaseId?: string;
  changeId?: string;
};
function encode(value: any): any {
  if (value instanceof Timestamp)
    return {
      __firestoreType: "timestamp",
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    };
  if (value instanceof Date)
    return { __firestoreType: "date", value: value.toISOString() };
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, encode(v)]),
    );
  return value;
}
function decode(value: any): any {
  if (value?.__firestoreType === "timestamp")
    return new Timestamp(value.seconds, value.nanoseconds);
  if (value?.__firestoreType === "date") return new Date(value.value);
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, decode(v)]),
    );
  return value;
}
export const equivalent = (a: any, b: any) =>
  JSON.stringify(encode(a)) === JSON.stringify(encode(b));
export function encryptBackup(plan: MigrationPlan, key: Buffer) {
  requireThat(key.length === 32);
  const nonce = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, nonce);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(encode(plan)), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([nonce, cipher.getAuthTag(), body]);
}
export function decryptBackup(bytes: Buffer, key: Buffer): MigrationPlan {
  requireThat(bytes.length > 28 && key.length === 32);
  const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return decode(
    JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString(),
    ),
  );
}
export async function prepareMigration(
  store: Store,
  accounts: MigrationAccount[],
  ownerPassword: string,
): Promise<MigrationPlan> {
  requireThat(
    accounts.length > 0 &&
      accounts.length <= 100 &&
      accounts.filter((a) => a.role === "owner").length === 1,
  );
  const ids = new Set<string>(),
    names = new Set<string>(),
    profiles = new Set<string>();
  const plan: MigrationPlan = { before: {}, after: {} };
  const ownerHash = await hashPassword(passwordInput(ownerPassword));
  for (const a of accounts) {
    const username = normalizeUsername(a.username),
      profileKey = a.profileCollection + "/" + a.profileId;
    requireThat(
      validId(a.uid) &&
        validId(a.profileId) &&
        ["students", "teachers"].includes(a.profileCollection) &&
        ["student", "teacher"].includes(a.profileKind) &&
        ["owner", "member"].includes(a.role),
    );
    requireThat(
      !ids.has(a.uid) && !names.has(username) && !profiles.has(profileKey),
      409,
      "MAPPING_CONFLICT",
    );
    ids.add(a.uid);
    names.add(username);
    profiles.add(profileKey);
    const accountKey = "security_accounts/" + a.uid,
      indexKey = "security_usernames/" + digest(username);
    const [existing, index, old] = await Promise.all([
      store.get(accountKey),
      store.get(indexKey),
      store.get(profileKey),
    ]);
    requireThat(!existing && !index, 409, "MIGRATION_ALREADY_EXISTS");
    plan.before[accountKey] = existing;
    plan.before[indexKey] = index;
    plan.before[profileKey] = old;
    plan.after[accountKey] = {
      username,
      displayName: a.displayName,
      role: a.role,
      status: a.role === "owner" ? "active" : "pending_reset",
      passwordHash: a.role === "owner" ? ownerHash : null,
      version: 1,
      permissions: [],
      scope: a.role === "owner" ? "school" : "classes",
      classRooms: a.classRooms || [],
      profileKind: a.profileKind,
      profileCollection: a.profileCollection,
      profileId: a.profileId,
      mustChangePassword: false,
    };
    plan.after[indexKey] = { uid: a.uid };
    const profile: RecordData = {
      ...(a.profile || {}),
      ...(old || {}),
      ownerId: a.uid,
      username,
      securityRole: a.role,
      isTeacher: a.profileKind === "teacher",
      audience: old?.audience || "members",
    };
    for (const k of Object.keys(profile))
      if (/password|secret|token|credential|hash|email/i.test(k))
        delete profile[k];
    plan.after[profileKey] = profile;
  }
  return plan;
}
export async function applyMigration(
  store: Store,
  plan: MigrationPlan,
  rollback = false,
) {
  const expected = rollback ? plan.after : plan.before,
    writes = rollback ? plan.before : plan.after,
    keys = Object.keys(expected);
  return store.atomic(keys, (rows) => {
    requireThat(
      keys.every((k, i) => equivalent(rows[i], expected[k])),
      409,
      "MIGRATION_CONCURRENT_CHANGE",
    );
    return {
      value: { documents: keys.length },
      writes: {
        ...writes,
        ["security_audit/" + randomToken()]: audit(
          "server-migration",
          rollback ? "migration.rollback" : "migration.apply",
          plan.changeId || "local-test",
        ),
      },
    };
  });
}
