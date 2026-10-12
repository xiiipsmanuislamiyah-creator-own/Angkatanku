import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  setLogLevel,
} from "firebase/firestore";
import { firebaseStore } from "../../server/store";
import { fixture, seed, MemoryStore, TEST_PASSWORD } from "../helpers";
setLogLevel("silent");
test("108 direct Firestore attempts denied for anonymous, member and forged owner claims", async () => {
  const env = await initializeTestEnvironment({
    projectId: "demo-angkatanku",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
  try {
    const contexts = [
      env.unauthenticatedContext(),
      env.authenticatedContext("member", { role: "member" }),
      env.authenticatedContext("attacker", {
        role: "owner",
        admin: true,
        email: "owner@example.invalid",
      }),
    ];
    let checks = 0;
    for (const ctx of contexts)
      for (const c of [
        "security_accounts",
        "security_sessions",
        "admins",
        "students",
        "teachers",
        "messages",
        "posts",
        "config",
        "security_audit",
      ]) {
        const db = ctx.firestore(),
          ref = doc(db, c, "dummy");
        for (const op of [
          () => getDoc(ref),
          () => getDocs(collection(db, c)),
          () => setDoc(ref, { role: "owner" }),
          () => deleteDoc(ref),
        ]) {
          await assertFails(op());
          checks++;
        }
      }
    assert.equal(checks, 108);
  } finally {
    await env.cleanup();
  }
});
test("real Firestore transactions enforce login concurrency and session revocation", async () => {
  const store = firebaseStore(),
    memory = new MemoryStore();
  await seed(memory);
  await store.atomic(["security_accounts/member"], () => ({
    value: null,
    writes: Object.fromEntries(memory.map),
  }));
  const f = await fixture({ store });
  try {
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () =>
        f.call("/auth/login", { username: "member", password: "incorrect" }),
      ),
    );
    assert.equal(attempts.filter((r) => r.status === 401).length, 5);
    assert.equal(attempts.filter((r) => r.status === 429).length, 7);
    const other = await f.login("other"),
      owner = await f.login("owner");
    assert.equal(
      (await f.call("/admin/accounts/other", { action: "revoke" }, owner))
        .status,
      200,
    );
    assert.equal(
      (await f.call("/auth/session", undefined, other)).body.user,
      null,
    );
  } finally {
    await f.close();
  }
});
test("real Firestore migration and encrypted rollback preserve timestamps and document identity", async () => {
  const { prepareMigration, applyMigration, encryptBackup, decryptBackup } =
    await import("../../server/migration");
  const { Timestamp } = await import("firebase-admin/firestore");
  const { randomBytes } = await import("node:crypto");
  const store = firebaseStore();
  await store.atomic(["students/migration-fixture"], () => ({
    value: null,
    writes: {
      "students/migration-fixture": {
        z: "preserve",
        a: "unchanged",
        time: new Timestamp(123, 123456789),
      },
    },
  }));
  const baseline = await store.get("students/migration-fixture");
  const plan = await prepareMigration(
    store,
    [
      {
        uid: "migration-dummy",
        username: "migration-dummy",
        displayName: "Dummy migration",
        role: "owner",
        profileCollection: "students",
        profileId: "migration-fixture",
        profileKind: "student",
        classRooms: [],
      },
    ],
    TEST_PASSWORD,
  );
  const key = randomBytes(32),
    restored = decryptBackup(encryptBackup(plan, key), key);
  await applyMigration(store, restored);
  assert.equal(
    (await store.get("students/migration-fixture"))!.ownerId,
    "migration-dummy",
  );
  await applyMigration(store, restored, true);
  const result = await store.get("students/migration-fixture");
  assert.equal(result!.time.seconds, baseline!.time.seconds);
  assert.equal(result!.time.nanoseconds, baseline!.time.nanoseconds);
  assert.equal(result!.z, baseline!.z);
  assert.equal(result!.a, baseline!.a);
  assert.equal(await store.get("security_accounts/migration-dummy"), null);
});
