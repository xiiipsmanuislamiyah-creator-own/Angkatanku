import { test } from "node:test";
import assert from "node:assert/strict";
import { Timestamp } from "firebase-admin/firestore";
import { fixture, TEST_PASSWORD } from "./helpers";
import { digest } from "../server/security";
test("existing schedule, achievement, card, teacher and view counter payloads", async () => {
  const f = await fixture();
  try {
    const o = await f.login("owner"),
      m = await f.login(),
      t = await f.login("teacher");
    const write = (s: any, c: string, id: string, data: any) =>
      f.call("/data/write", { collection: c, id, operation: "set", data }, s);
    assert.equal(
      (
        await write(o, "schedules", "IPS1", {
          className: "IPS 1",
          schedules: [
            {
              day: "Senin",
              subjects: [
                {
                  time: "07:00",
                  name: "IPS",
                  jp: "2",
                  teacher: "Dummy",
                  isBreak: false,
                },
              ],
            },
          ],
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await write(o, "achievements", "dummy", {
          title: "Dummy",
          winner: "Dummy",
          rank: "1",
          badge: "star",
          date: "2026-01-01",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await write(m, "students", "member", {
          nickname: "Dummy",
          cardCreated: true,
          colors: { bg: "#000000" },
          socials: { instagram: "dummy" },
          tags: ["dummy"],
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await write(t, "teachers", "teacher", {
          motto: "Teacher remains teacher",
          isTeacher: true,
        })
      ).status,
      200,
    );
    assert.equal((await f.store.get("teachers/teacher"))!.isTeacher, true);
    const view = await f.call(
      "/interactions",
      { collection: "students", id: "other", action: "view" },
      m,
    );
    assert.equal(view.status, 200);
    const doc = (
      await f.call("/data/query", { collection: "students", id: "other" }, m)
    ).body.items[0];
    assert.equal(doc.viewCount, 1);
    assert.equal(doc.viewedBy, undefined);
  } finally {
    await f.close();
  }
});
test("nested projection drops secrets and serializes legacy Firestore timestamps", async () => {
  const f = await fixture();
  try {
    f.store.map.set("posts/public", {
      audience: "public",
      created_at: Timestamp.fromMillis(1234),
      comments: [
        {
          id: "c",
          author: "dummy",
          content: "hi",
          password: "nested-secret",
          created_at: "2026-01-01",
        },
      ],
      media: [
        {
          type: "image",
          url: "https://example.invalid/a.png",
          token: "private-token",
        },
      ],
    });
    const r = await f.call("/data/query", {
      collection: "posts",
      id: "public",
    });
    assert.equal(r.body.items[0].created_at, "1970-01-01T00:00:01.234Z");
    assert.doesNotMatch(JSON.stringify(r.body), /nested-secret|private-token/);
  } finally {
    await f.close();
  }
});
test("delegated configuration cannot alter critical switches; scoped moderation and official identity guarded", async () => {
  const f = await fixture();
  try {
    const a = await f.login("admin");
    assert.equal(
      (await f.call("/admin/config", { aiEnabled: false }, a)).status,
      403,
    );
    f.store.map.get("security_accounts/admin")!.scope = "school";
    const school = await f.login("admin");
    assert.equal(
      (await f.call("/admin/config", { aiEnabled: false }, school)).status,
      200,
    );
    assert.equal(
      (await f.call("/admin/config", { readOnly: true }, school)).status,
      403,
    );
    const m = await f.login();
    assert.equal(
      (
        await f.call(
          "/data/write",
          {
            collection: "posts",
            id: "fake",
            operation: "set",
            data: { caption: "fake", isOfficial: true },
          },
          m,
        )
      ).status,
      403,
    );
  } finally {
    await f.close();
  }
});
test("idle renewal cannot revive expired sessions and password change revokes every old session", async () => {
  const f = await fixture();
  try {
    const a = await f.login(),
      b = await f.login();
    const path = "security_sessions/" + digest(a.cookie.split("=")[1]);
    f.store.map.get(path)!.idleExpiresAt = Date.now() + 10000;
    assert.equal((await f.call("/auth/renew", {}, a)).status, 200);
    assert.ok(f.store.map.get(path)!.idleExpiresAt > Date.now() + 100000);
    f.store.map.get(path)!.idleExpiresAt = Date.now() - 1;
    assert.equal((await f.call("/auth/renew", {}, a)).status, 401);
    const newPassword = TEST_PASSWORD + "-new";
    assert.equal(
      (await f.call("/auth/password", { password: newPassword }, b)).status,
      200,
    );
    assert.equal((await f.call("/auth/session", undefined, b)).body.user, null);
    assert.equal(
      (
        await f.call("/auth/login", {
          username: "member",
          password: TEST_PASSWORD,
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await f.call("/auth/login", {
          username: "member",
          password: newPassword,
        })
      ).status,
      200,
    );
  } finally {
    await f.close();
  }
});
