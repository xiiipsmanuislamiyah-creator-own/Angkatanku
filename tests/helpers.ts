import { once } from "node:events";
import type { Server } from "node:http";
import { createApp, type Options } from "../server/app";
import type { Store, RecordData, Row } from "../server/store";
import { hashPassword, digest } from "../server/security";
export const TEST_PASSWORD = "dummy-only-password-2026";
let hash: Promise<string>;
function clone<T>(v: T): T {
  if (v && typeof (v as any).toMillis === "function") return v;
  if (Array.isArray(v)) return v.map(clone) as T;
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, clone(x)]),
    ) as T;
  return v;
}
export class MemoryStore implements Store {
  map = new Map<string, RecordData>();
  private queue = Promise.resolve();
  async get(key: string) {
    return clone(this.map.get(key) || null);
  }
  async list(
    c: string,
    filters: [string, any][] = [],
    after?: string,
    count = 100,
  ): Promise<Row[]> {
    return [...this.map]
      .filter(
        ([k, v]) =>
          k.startsWith(c + "/") &&
          k.split("/").length === 2 &&
          (!after || k.slice(c.length + 1) > after) &&
          filters.every(([f, x]) => v[f] === x),
      )
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(0, count)
      .map(([k, v]) => ({ id: k.slice(c.length + 1), data: clone(v) }));
  }
  async atomic<T>(
    keys: string[],
    fn: (v: (RecordData | null)[]) => {
      value: T;
      writes?: Record<string, RecordData | null>;
    },
  ) {
    const before = this.queue;
    let release!: () => void;
    this.queue = new Promise((r) => (release = r));
    await before;
    try {
      const r = fn(keys.map((k) => clone(this.map.get(k) || null)));
      for (const [k, v] of Object.entries(r.writes || {}))
        v === null ? this.map.delete(k) : this.map.set(k, clone(v));
      return r.value;
    } finally {
      release();
    }
  }
}
export async function seed(store: MemoryStore) {
  hash ||= hashPassword(TEST_PASSWORD);
  const passwordHash = await hash;
  store.map.clear();
  for (const uid of ["owner", "admin", "member", "other", "teacher"]) {
    const profileKind = uid === "teacher" ? "teacher" : "student",
      profileCollection = uid === "teacher" ? "teachers" : "students",
      role = uid === "owner" ? "owner" : uid === "admin" ? "admin" : "member";
    store.map.set("security_accounts/" + uid, {
      username: uid,
      displayName: "Dummy " + uid,
      role,
      status: "active",
      passwordHash,
      version: 1,
      permissions:
        uid === "admin"
          ? [
              "profiles.manage",
              "feed.moderate",
              "story.moderate",
              "reports.review",
              "config.manage",
            ]
          : [],
      scope: uid === "owner" ? "school" : "classes",
      classRooms: [uid === "other" ? "IPS 2" : "IPS 1"],
      profileKind,
      profileCollection,
      profileId: uid,
      mustChangePassword: false,
    });
    store.map.set("security_usernames/" + digest(uid), { uid });
    store.map.set(profileCollection + "/" + uid, {
      name: "Dummy " + uid,
      nama: "Dummy " + uid,
      username: uid,
      ownerId: uid,
      securityRole: role,
      classRoom: uid === "other" ? "IPS 2" : "IPS 1",
      audience: "members",
      cardCreated: true,
      isTeacher: uid === "teacher",
      title: uid === "teacher" ? "Guru" : "",
      password: "legacy-secret-sentinel",
      email: "private-sentinel@example.invalid",
      viewedBy: ["sensitive-viewer"],
    });
  }
  for (const [id, audience] of [
    ["public", "public"],
    ["members", "members"],
    ["restricted", "restricted"],
  ])
    store.map.set("posts/" + id, {
      caption: "Dummy " + id,
      ownerId: "other",
      authorId: "other",
      classRoom: "IPS 2",
      audience,
      allowedUserIds: ["other"],
      likes_count: 0,
      comments: [],
      media: [],
      createdAt: Date.now(),
    });
  store.map.set("messages/private", {
    ownerId: "member",
    senderId: "member",
    receiverId: "other",
    type: "dm",
    content: "private-dm-sentinel",
    createdAt: Date.now(),
    read: false,
  });
  store.map.set("stories/expired", {
    ownerId: "other",
    audience: "public",
    expiresAt: Date.now() - 1,
  });
  store.map.set("security_config/main", {
    aiEnabled: true,
    feedEnabled: true,
    storiesEnabled: true,
  });
}
export async function fixture(custom?: Partial<Options>) {
  const store = new MemoryStore();
  await seed(store);
  let uploads = 0,
    destroys = 0,
    aiCalls = 0,
    lastContext: any;
  const media = {
    async upload(buffer: Buffer, mime: string) {
      uploads++;
      return {
        publicId: "angkatanku-v2/dummy" + uploads,
        resourceType: "image",
        mime,
        format: "png",
        size: buffer.length,
      };
    },
    async download() {
      return new Response("dummy-media");
    },
    async destroy() {
      destroys++;
    },
  };
  const app = createApp({
    store,
    origins: ["http://localhost"],
    media,
    ai: async (_m, _h, c) => {
      aiCalls++;
      lastContext = c;
      return "dummy answer";
    },
    ...custom,
  });
  const server: Server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = "http://127.0.0.1:" + (server.address() as any).port;
  async function call(
    path: string,
    body?: any,
    session?: any,
    headers: Record<string, string> = {},
  ) {
    const form = body instanceof FormData;
    const r = await fetch(base + "/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Origin: "http://localhost",
        ...(body === undefined || form
          ? {}
          : { "Content-Type": "application/json" }),
        ...(session
          ? { Cookie: session.cookie, "X-CSRF-Token": session.csrfToken }
          : {}),
        ...headers,
      },
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
    });
    const text = await r.text();
    let value: any;
    try {
      value = JSON.parse(text);
    } catch {
      value = text;
    }
    return { status: r.status, body: value, headers: r.headers };
  }
  async function login(username = "member") {
    const r = await call("/auth/login", { username, password: TEST_PASSWORD });
    if (r.status !== 200) throw new Error("Fixture login failed " + r.status);
    return {
      cookie: r.headers.get("set-cookie")!.split(";")[0],
      csrfToken: r.body.csrfToken,
      user: r.body.user,
    };
  }
  return {
    store,
    app,
    server,
    base,
    call,
    login,
    get uploads() {
      return uploads;
    },
    get destroys() {
      return destroys;
    },
    get aiCalls() {
      return aiCalls;
    },
    get lastContext() {
      return lastContext;
    },
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((r) => server.close(() => r()));
    },
  };
}
