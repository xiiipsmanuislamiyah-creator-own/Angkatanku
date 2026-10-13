import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { fixture, TEST_PASSWORD } from "./helpers";
import { digest } from "../server/security";
import { canCollect } from "../server/media-gc";
const send = (
  f: any,
  s: any,
  room: string,
  content: string,
  requestId: string,
  replyTo?: string,
) => f.call("/chat/" + room + "/messages", { content, requestId, replyTo }, s);
test("global room membership, anonymous denial, slow mode and idempotent concurrent delivery", async () => {
  const f = await fixture();
  try {
    const m = await f.login(),
      t = await f.login("teacher");
    assert.equal((await f.call("/chat/rooms")).status, 401);
    assert.equal(
      (await f.call("/chat/global-students/messages", undefined, t)).status,
      404,
    );
    assert.equal(
      (await f.call("/chat/rooms", undefined, t)).body.items.length,
      1,
    );
    assert.equal(
      (await f.call("/chat/rooms", undefined, m)).body.items.length,
      2,
    );
    f.store.map.set("security_config/main", {
      globalChatEnabled: true,
      slowMode: 10,
    });
    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        send(f, m, "global-community", "Halo semua", "same-request"),
      ),
    );
    assert.ok(results.every((r) => r.status === 200));
    assert.equal(new Set(results.map((r) => r.body.id)).size, 1);
    assert.equal(
      (await f.call("/chat/global-community/messages", undefined, t)).body.items
        .length,
      1,
    );
    assert.equal(
      (
        await send(
          f,
          m,
          "global-community",
          "Pesan berikutnya",
          "other-request",
        )
      ).status,
      429,
    );
    assert.equal(
      (await send(f, m, "global-community", "Berubah", "same-request")).status,
      409,
    );
    f.store.map.set("security_config/main", { globalChatEnabled: false });
    assert.equal(
      (await send(f, t, "global-community", "Ditutup", "closed")).status,
      403,
    );
  } finally {
    await f.close();
  }
});
test("DM is participant-only including owner; blocking applies to new and legacy paths; selected report only", async () => {
  const f = await fixture();
  try {
    const a = await f.login(),
      b = await f.login("other"),
      o = await f.login("owner");
    const room = (await f.call("/chat/dm", { userId: "other" }, a)).body.id;
    const first = await send(f, a, room, "selected-only", "message-one");
    await send(f, a, room, "unreported-private", "message-two");
    assert.equal(
      (await f.call("/chat/" + room + "/messages", undefined, o)).status,
      404,
    );
    assert.equal(
      (
        await f.call(
          "/chat/" + room + "/action",
          { messageId: first.body.id, action: "delete" },
          o,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await f.call(
          "/chat/" + room + "/action",
          {
            messageId: first.body.id,
            action: "report",
            reason: "Laporan dummy",
          },
          b,
        )
      ).status,
      200,
    );
    const reports = await f.call("/admin/reports", undefined, o);
    assert.ok(JSON.stringify(reports.body).includes("selected-only"));
    assert.ok(!JSON.stringify(reports.body).includes("unreported-private"));
    assert.equal(
      (
        await f.call(
          "/chat/preferences",
          { userId: "member", blocked: true },
          b,
        )
      ).status,
      200,
    );
    assert.equal((await send(f, a, room, "blocked", "three")).status, 403);
    assert.equal(
      (
        await f.call(
          "/data/write",
          {
            collection: "messages",
            id: "legacy-blocked",
            operation: "set",
            data: { type: "dm", receiverId: "other", content: "blocked" },
          },
          a,
        )
      ).status,
      403,
    );
    await f.call(
      "/chat/preferences",
      { userId: "member", blocked: false, receipts: false },
      b,
    );
    await f.call("/chat/" + room + "/read", {}, b);
    assert.equal(
      (await f.call("/chat/" + room + "/messages", undefined, a)).body.peerState
        .readAt,
      null,
    );
  } finally {
    await f.close();
  }
});
test("bounded newest-first chat history, cross-room reply denied, sender withdrawal and moderator freshness", async () => {
  const f = await fixture();
  try {
    const m = await f.login(),
      o = await f.login("owner");
    for (let i = 0; i < 60; i++)
      f.store.map.set(
        "security_chat_rooms/global-community/messages/" +
          String(9999999999999 - (1700000000000 + i)) +
          "_item",
        {
          senderId: "other",
          content: "item " + i,
          createdAt: 1700000000000 + i,
        },
      );
    const first = (
      await f.call("/chat/global-community/messages", undefined, m)
    ).body;
    assert.equal(first.items.length, 50);
    assert.equal(first.items[0].content, "item 10");
    const second = (
      await f.call(
        "/chat/global-community/messages?before=" + first.next,
        undefined,
        m,
      )
    ).body;
    assert.equal(second.items.length, 10);
    assert.equal(second.next, null);
    assert.equal(
      (
        await send(
          f,
          m,
          "global-students",
          "reply",
          "bad-reply",
          first.items[0].id,
        )
      ).status,
      400,
    );
    const own = await send(f, m, "global-community", "withdraw me", "own");
    assert.equal(
      (
        await f.call(
          "/chat/global-community/action",
          { messageId: own.body.id, action: "delete" },
          m,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.store.get(
          "security_chat_rooms/global-community/messages/" + own.body.id,
        )
      )?.content,
      "",
    );
    const sid = digest(o.cookie.split("=")[1]);
    f.store.map.get("security_sessions/" + sid)!.reauthenticatedAt = 1;
    assert.equal(
      (
        await f.call(
          "/chat/global-community/action",
          { messageId: first.items[0].id, action: "pin", reason: "pengumuman" },
          o,
        )
      ).body.code,
      "REAUTH_REQUIRED",
    );
    await f.call("/auth/reauth", { password: TEST_PASSWORD }, o);
    assert.equal(
      (
        await f.call(
          "/admin/chat/mute",
          { userId: "member", minutes: 5, reason: "spam dummy" },
          o,
        )
      ).status,
      200,
    );
    assert.equal(
      (await send(f, m, "global-community", "muted", "muted")).status,
      403,
    );
    assert.equal(
      (
        await f.call(
          "/admin/chat/mute",
          { userId: "owner", minutes: 5, reason: "protected" },
          o,
        )
      ).status,
      403,
    );
  } finally {
    await f.close();
  }
});
test("public guest like requires cookie and CSRF; parallel retries/unlike never double-count or expose member content", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.call("/social/like", { id: "public" })).status, 401);
    const v = await f.call("/visitor"),
      g = {
        cookie: v.headers.get("set-cookie")!.split(";")[0],
        csrfToken: v.body.csrfToken,
      };
    assert.equal(
      (
        await f.call(
          "/social/like",
          { id: "public" },
          { ...g, csrfToken: "bad" },
        )
      ).status,
      403,
    );
    assert.equal(
      (await f.call("/social/like", { id: "members" }, g)).status,
      404,
    );
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        f.call("/social/like", { id: "public", active: true }, g),
      ),
    );
    assert.ok(
      results.every((r) => r.status === 200 && r.body.likes_count === 1),
    );
    assert.equal(
      (await f.call("/social/like", { id: "public", active: false }, g)).body
        .likes_count,
      0,
    );
    assert.equal(
      (await f.call("/social/like", { id: "public", active: false }, g)).body
        .likes_count,
      0,
    );
    assert.equal(
      (await f.call("/social/bookmark", { id: "public", active: true }, g))
        .status,
      401,
    );
  } finally {
    await f.close();
  }
});
test("official authors require delegated scope and are server-stamped; publishing retry keeps original expiration", async () => {
  const f = await fixture();
  try {
    const m = await f.login(),
      a = await f.login("admin");
    const body = {
      collection: "posts",
      id: "official",
      operation: "set",
      data: {
        caption: "official",
        identityKey: "angkatan-ku-ips1",
        authorName: "FAKE",
      },
    };
    assert.equal((await f.call("/data/write", body, m)).status, 403);
    // Scoped moderation alone is not a publishing grant.
    assert.equal((await f.call("/data/write", body, a)).status, 403);
    f.store.map.get("security_accounts/admin")!.permissions = [
      "identity.publish",
    ];
    assert.equal((await f.call("/data/write", body, a)).status, 200);
    assert.equal(
      f.store.map.get("posts/official")!.authorName,
      "XII IPS 1 Official",
    );
    assert.equal(
      (
        await f.call(
          "/data/write",
          {
            ...body,
            id: "outside",
            data: { ...body.data, identityKey: "angkatan-ku-ips2" },
          },
          a,
        )
      ).status,
      403,
    );
    const story = {
      collection: "stories",
      id: "textstory",
      operation: "set",
      requestId: "story-once",
      data: {
        type: "text",
        text: "Kenangan dummy",
        stylePreset: "navy",
        fontStyle: "sans",
        align: "center",
        audience: "public",
      },
    };
    assert.equal((await f.call("/data/write", story, m)).status, 200);
    const before = f.store.map.get("stories/textstory")!.expiresAt;
    assert.equal((await f.call("/data/write", story, m)).status, 200);
    assert.equal(f.store.map.get("stories/textstory")!.expiresAt, before);
    assert.equal(
      (
        await f.call(
          "/data/write",
          {
            ...story,
            requestId: "change",
            data: { ...story.data, stylePreset: "url(javascript:bad)" },
          },
          m,
        )
      ).status,
      400,
    );
    f.store.map.get("stories/textstory")!.expiresAt = Date.now() - 1;
    assert.equal(
      (await f.call("/data/query", { collection: "stories", id: "textstory" }))
        .body.items.length,
      0,
    );
  } finally {
    await f.close();
  }
});
test("Nusa uses approved consented visible memories only; review is scoped, versioned and cannot be self-granted", async () => {
  const f = await fixture();
  try {
    const m = await f.login(),
      o = await f.login("owner");
    const body = {
      title: "Festival dummy",
      body: "Festival dummy berjalan di sekolah.",
      category: "kegiatan",
      factType: "fact",
      audience: "members",
      classRoom: "IPS 1",
      consent: true,
      requestId: "mem-one",
    };
    assert.equal(
      (await f.call("/memory", { ...body, consent: false }, m)).status,
      400,
    );
    assert.equal((await f.call("/memory", body, m)).status, 200);
    assert.equal(
      (
        await f.call(
          "/memory/mem-one/review",
          { status: "approved", reason: "terverifikasi", version: 1 },
          m,
        )
      ).status,
      403,
    );
    await f.call("/nusa-ai", { message: "Festival dummy" }, m);
    assert.equal(f.lastContext.memory.length, 0);
    assert.equal(
      (
        await f.call(
          "/memory/mem-one/review",
          { status: "approved", reason: "terverifikasi", version: 1 },
          o,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.call(
          "/memory/mem-one/review",
          { status: "approved", reason: "lama", version: 1 },
          o,
        )
      ).status,
      409,
    );
    f.store.map.set("security_memory/private", {
      ...f.store.map.get("security_memory/mem-one"),
      title: "Festival private sentinel",
      audience: "restricted",
      classRoom: "IPS 2",
    });
    await f.call("/nusa-ai", { message: "Festival dummy" }, m);
    assert.equal(f.lastContext.memory.length, 1);
    assert.ok(!JSON.stringify(f.lastContext).includes("private sentinel"));
    assert.ok(!JSON.stringify(f.lastContext).includes("private-dm-sentinel"));
    const listing = (await f.call("/memory", undefined, m)).body;
    assert.equal(listing.items[0].submittedBy, undefined);
    assert.equal(
      (
        await f.call(
          "/memory/mem-one/correction",
          { reason: "koreksi tanggal" },
          m,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.call(
          "/memory/mem-one/review",
          { status: "withdrawn", reason: "ditinjau ulang", version: 2 },
          o,
        )
      ).status,
      200,
    );
    await f.call("/nusa-ai", { message: "Festival dummy" }, m);
    assert.equal(f.lastContext.memory.length, 0);
  } finally {
    await f.close();
  }
});
test("comments have bounded reply depth, duplicate rejection and ownership-based deletion; moderation requires fresh session", async () => {
  const f = await fixture();
  try {
    const m = await f.login(),
      other = await f.login("other"),
      o = await f.login("owner");
    const write = (s: any, b: any) =>
      f.call("/interactions", { collection: "posts", id: "public", ...b }, s);
    const a = await write(m, { action: "comment", content: "Hallo dummy" });
    assert.equal(a.status, 200);
    assert.equal(
      (await write(m, { action: "comment", content: "Hallo dummy" })).status,
      409,
    );
    const b = await write(other, {
      action: "comment",
      content: "Balasan",
      parentId: a.body.comment.id,
    });
    assert.equal(b.status, 200);
    assert.equal(
      (
        await write(other, {
          action: "comment",
          content: "Terlalu dalam",
          parentId: b.body.comment.id,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await write(other, {
          action: "deleteComment",
          commentId: a.body.comment.id,
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await write(m, {
          action: "deleteComment",
          commentId: a.body.comment.id,
        })
      ).status,
      200,
    );
    assert.equal(f.store.map.get("posts/public")!.comments[0].deleted, true);
    f.store.map.get(
      "security_sessions/" + digest(o.cookie.split("=")[1]),
    )!.reauthenticatedAt = 1;
    assert.equal(
      (
        await f.call(
          "/data/write",
          {
            collection: "posts",
            id: "public",
            operation: "update",
            data: { hidden: true },
          },
          o,
        )
      ).body.code,
      "REAUTH_REQUIRED",
    );
  } finally {
    await f.close();
  }
});
test("direct upload stays private pending server verification; ownership, size, revocation and signature lifetime are enforced", async () => {
  const prior = process.env.DIRECT_MEDIA_UPLOAD;
  process.env.DIRECT_MEDIA_UPLOAD = "true";
  const bytes = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "green" },
  })
    .png()
    .toBuffer();
  let resource: any,
    downloads = 0;
  const f = await fixture({
    media: {
      async upload() {
        throw Error("proxy forbidden");
      },
      async destroy() {},
      async authorize(a) {
        resource = a;
        return {
          url: "https://api.cloudinary.com/v1_1/dummy/image/upload",
          fields: { type: "authenticated" },
        };
      },
      async inspect(a) {
        return {
          publicId: a.publicId,
          resourceType: "image",
          deliveryType: "authenticated",
          format: "png",
          size: bytes.length,
        };
      },
      async download() {
        downloads++;
        return new Response(bytes);
      },
    },
  });
  try {
    const m = await f.login(),
      other = await f.login("other");
    assert.equal(
      (
        await f.call("/media/authorize", {
          mime: "image/png",
          size: bytes.length,
        })
      ).status,
      401,
    );
    assert.equal(
      (await f.call("/media/authorize", { mime: "image/svg+xml", size: 1 }, m))
        .status,
      400,
    );
    const r = await f.call(
        "/media/authorize",
        { mime: "image/png", size: bytes.length },
        m,
      ),
      id = r.body.id;
    assert.equal(r.status, 200);
    assert.equal((await f.call("/media/" + id, undefined, m)).status, 404);
    assert.equal((await f.call("/media/complete", { id }, other)).status, 404);
    assert.equal(downloads, 0);
    assert.equal((await f.call("/media/complete", { id }, m)).status, 200);
    assert.equal((await f.call("/media/complete", { id }, m)).status, 200);
    assert.equal(downloads, 1);
    assert.equal(canCollect({ ...resource, pendingDelete: true }), false);
    assert.equal((await f.call("/media/" + id)).status, 404);
    assert.equal(
      (
        await f.call(
          "/media/authorize",
          { mime: "video/mp4", size: 21 * 1024 * 1024 },
          m,
        )
      ).status,
      400,
    );
    const bad = await f.call(
      "/media/authorize",
      { mime: "image/png", size: bytes.length + 1 },
      m,
    );
    assert.equal(
      (await f.call("/media/complete", { id: bad.body.id }, m)).status,
      400,
    );
    assert.equal(
      f.store.map.get("security_media/" + bad.body.id)!.pending,
      true,
    );
    f.store.map.get("security_accounts/member")!.version++;
    assert.equal(
      (await f.call("/media/complete", { id: bad.body.id }, m)).status,
      401,
    );
  } finally {
    await f.close();
    if (prior === undefined) delete process.env.DIRECT_MEDIA_UPLOAD;
    else process.env.DIRECT_MEDIA_UPLOAD = prior;
  }
});

test('unchanged chat polls avoid history reads and invalidate on new messages and moderation',async()=>{
 const f=await fixture();try{
  const s=await f.login();await send(f,s,'global-community','First','poll-one');
  const first=(await f.call('/chat/global-community/messages',undefined,s)).body;
  assert.equal(first.room.revision,1);
  const again=(await f.call('/chat/global-community/messages?revision=1',undefined,s)).body;assert.equal(again.unchanged,true);assert.deepEqual(again.items,[]);
  await send(f,s,'global-community','Next','poll-two');
  const changed=(await f.call('/chat/global-community/messages?revision=1',undefined,s)).body;assert.equal(changed.unchanged,false);assert.equal(changed.items.length,2);
  await f.call('/chat/global-community/action',{messageId:first.items[0].id,action:'delete'},s);
  assert.equal((await f.call('/chat/global-community/messages?revision=2',undefined,s)).body.unchanged,false);
 }finally{await f.close();}
});
test('schedule writes reject overlapping ranges, reversed times and duplicate days while preserving legacy start times',async()=>{
 const f=await fixture();try{
  const o=await f.login('owner');
  const write=(subjects:any[],days?:any[])=>f.call('/data/write',{collection:'schedules',id:'collision',operation:'set',data:{className:'IPS 1',schedules:days||[{day:'Senin',subjects}]}},o);
  assert.equal((await write([{time:'07.00 - 08.00',name:'A'},{time:'07.30 - 09.00',name:'B'}])).body.code,'SCHEDULE_CONFLICT');
  assert.equal((await write([{time:'09.00 - 08.00',name:'A'}])).status,400);
  assert.equal((await write([],[{day:'Senin',subjects:[]},{day:'Senin',subjects:[]}])).status,400);
  assert.equal((await write([{time:'07.00 - 08.00',name:'A'},{time:'08.00 - 09.00',name:'B'}])).status,200);
 }finally{await f.close();}
});
