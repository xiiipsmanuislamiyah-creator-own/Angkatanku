import type { Domain } from "./domain.js";
import type { Store, RecordData } from "./store.js";
import { authenticated } from "./auth.js";
import {
  requireThat,
  validId,
  digest,
  randomToken,
  rateLimit,
  can,
  fresh,
  type Principal,
} from "./security.js";

export const GLOBAL_ROOMS = [
  { id: "global-students", title: "Siswa & Alumni", kind: "students" },
  { id: "global-community", title: "Guru & Angkatan", kind: "community" },
];
const root = (id: string) => "security_chat_rooms/" + id;
const prefKey = (id: string) => "security_chat_preferences/" + id;
const member = (p: Principal) =>
  requireThat(!p.account.mustChangePassword, 403, "PASSWORD_CHANGE_REQUIRED");
export function roomAllowed(room: RecordData | null, p: Principal) {
  if (!room) return false;
  if (room.kind === "dm") return room.members?.includes(p.uid) === true;
  return (
    room.kind === "community" ||
    (room.kind === "students" && p.account.profileKind === "student")
  );
}
export function ensureUnblocked(
  sender: string,
  recipient: string,
  a: RecordData | null,
  b: RecordData | null,
) {
  requireThat(
    !a?.blocked?.includes(recipient) && !b?.blocked?.includes(sender),
    403,
    "DM_UNAVAILABLE",
    "Percakapan ini sedang dibatasi.",
  );
}
export async function checkLegacyDm(
  store: Store,
  sender: string,
  recipient: string,
) {
  const [a, b] = await Promise.all([
    store.get(prefKey(sender)),
    store.get(prefKey(recipient)),
  ]);
  ensureUnblocked(sender, recipient, a, b);
}
export function installChat({
  app,
  store,
  wrap,
  writeUser,
  mutation,
  config,
}: Domain) {
  async function room(id: unknown, p: Principal) {
    requireThat(validId(id));
    const g = GLOBAL_ROOMS.find((x) => x.id === id);
    const r = g
      ? { ...g, ...(await store.get(root(id))) }
      : await store.get(root(id));
    requireThat(roomAllowed(r, p), 404, "NOT_FOUND");
    return r!;
  }
  app.get(
    "/api/chat/rooms",
    wrap(async (req, res) => {
      const p: Principal = res.locals.p;
      authenticated(p);
      const cfg = await config();
      const rows = await store.list(
        "security_chat_inboxes/" + p.uid + "/rooms",
        [],
        undefined,
        100,
      );
      const globals = await Promise.all(
        GLOBAL_ROOMS.filter((r) => roomAllowed(r, p)).map(async (r) => ({
          ...r,
          ...(await store.get(root(r.id))),
        })),
      );
      const items = await Promise.all(
        [
          ...globals,
          ...rows.map((r) => ({ id: r.id, ...r.data, kind: "dm" })),
        ].map(async (r: RecordData) => {
          const read = await store.get(root(r.id) + "/readers/" + p.uid);
          return {
            ...r,
            unread:
              (r.lastAt || 0) > (read?.readAt || 0) && r.lastSender !== p.uid,
          };
        }),
      );
      res.json({
        items,
        enabled: cfg.globalChatEnabled !== false,
        slowMode: Number(cfg.slowMode) || 0,
        preferences: (await store.get(prefKey(p.uid))) || {
          blocked: [],
          muted: [],
          receipts: true,
        },
      });
    }),
  );
  app.get(
    "/api/chat/contacts",
    wrap(async (req, res) => {
      const p: Principal = res.locals.p;
      authenticated(p);
      await rateLimit(store, "chat-contacts:" + p.uid, 15, 60000);
      const after =
        typeof req.query.after === "string" ? req.query.after : undefined;
      requireThat(!after || validId(after));
      const rows = await store.list("security_accounts", [], after, 100);
      res.json({
        items: rows
          .filter((r) => r.id !== p.uid && r.data.status === "active")
          .map((r) => ({
            id: r.id,
            name: r.data.displayName || r.data.username,
            kind: r.data.profileKind,
            profileId: r.data.profileId,
            classRoom: r.data.classRooms?.[0] || "",
          })),
        next: rows.length === 100 ? rows.at(-1)!.id : null,
      });
    }),
  );
  app.post(
    "/api/chat/dm",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      member(p);
      const uid = req.body.userId;
      requireThat(validId(uid) && uid !== p.uid);
      await rateLimit(store, "chat-start:" + p.uid, 10, 60000);
      const id = "dm-" + digest([uid, p.uid].sort().join(":"));
      await mutation(
        p,
        [root(id), "security_accounts/" + uid, prefKey(p.uid), prefKey(uid)],
        "chat.start",
        id,
        ([old, target, a, b]) => {
          requireThat(
            target?.status === "active",
            404,
            "RECIPIENT_UNAVAILABLE",
          );
          ensureUnblocked(p.uid, uid, a, b);
          const r = old || {
            id,
            kind: "dm",
            members: [p.uid, uid],
            createdAt: Date.now(),
          };
          return {
            value: null,
            writes: {
              [root(id)]: r,
              ["security_chat_inboxes/" + p.uid + "/rooms/" + id]: {
                ...r,
                title: target.displayName || target.username,
                peer: uid,
                profileId: target.profileId,
              },
              ["security_chat_inboxes/" + uid + "/rooms/" + id]: {
                ...r,
                title: p.account.displayName || p.account.username,
                peer: p.uid,
                profileId: p.account.profileId,
              },
            },
          };
        },
      );
      res.json({ id });
    }),
  );
  app.get(
    "/api/chat/:room/messages",
    wrap(async (req, res) => {
      const p: Principal = res.locals.p;
      authenticated(p);
      const id = req.params.room,
        r = await room(id, p);
      await rateLimit(store, "chat-read:" + p.uid, 80, 60000);
      const after =
        typeof req.query.before === "string" ? req.query.before : undefined;
      requireThat(!after || validId(after));
      // Inverted timestamp IDs: newest page first using an ascending key scan.
      const unchanged=!after&&req.query.revision!==undefined&&req.query.revision===String(r.revision||0);
      const rows = unchanged?[]:await store.list(
        root(id) + "/messages",
        [],
        after,
        50,
      );
      const state = await store.get(root(id) + "/readers/" + p.uid);
      const items = rows
        .filter((x) => !state?.hiddenIds?.includes(x.id))
        .map((x) => ({ id: x.id, ...x.data }))
        .reverse();
      let peerState: any = null;
      if (r.kind === "dm") {
        const peer = r.members.find((x: string) => x !== p.uid),
          prefs = await store.get(prefKey(peer));
        const read = await store.get(root(id) + "/readers/" + peer);
        peerState = {
          readAt: prefs?.receipts === false ? null : read?.readAt || 0,
          typing: !!read && read.typingUntil > Date.now(),
        };
      }
      res.json({
        unchanged,
        items,
        next: rows.length === 50 ? rows.at(-1)!.id : null,
        room: r,
        peerState,
      });
    }),
  );
  app.post(
    "/api/chat/:room/messages",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      member(p);
      const id = req.params.room,
        r = await room(id, p),
        cfg = await config();
      requireThat(
        r.kind === "dm" || cfg.globalChatEnabled !== false,
        403,
        "CHAT_CLOSED",
        "Ruang global sedang ditutup.",
      );
      const { content, requestId, replyTo } = req.body;
      requireThat(
        typeof content === "string" &&
          content.trim().length > 0 &&
          content.length <= 2000 &&
          validId(requestId) &&
          (!replyTo || validId(replyTo)),
      );
      requireThat(
        (content.match(/https?:\/\//g) || []).length <= 3 &&
          (content.match(/@/g) || []).length <= 5,
        400,
        "MESSAGE_SPAM",
      );
      requireThat(
        !(cfg.blockedWords || []).some((x: string) =>
          content.toLowerCase().includes(x.toLowerCase()),
        ),
        400,
        "CONTENT_FILTERED",
      );
      const dedup =
          "security_chat_requests/" +
          digest(p.uid + ":" + id + ":" + requestId),
        old = await store.get(dedup);
      if (old) {
        requireThat(
          old.hash === digest(content + ":" + (replyTo || "")),
          409,
          "REQUEST_CONFLICT",
        );
        res.json({ id: old.messageId });
        return;
      }
      await rateLimit(
        store,
        "chat-send:" + p.uid + ":" + r.kind,
        r.kind === "dm" ? 10 : 8,
        r.kind === "dm" ? 60000 : 20000,
      );
      const now = Date.now(),
        messageId = String(9999999999999 - now).padStart(13, "0") + "_" + randomToken();
      const peer =
        r.kind === "dm" ? r.members.find((x: string) => x !== p.uid) : p.uid;
      const keys = [
        root(id),
        dedup,
        "security_chat_mutes/" + p.uid,
        root(id) + "/senders/" + p.uid,
        prefKey(p.uid),
        prefKey(peer),
        "security_accounts/" + peer,
        "security_config/main",
        ...(replyTo ? [root(id) + "/messages/" + replyTo] : []),
      ];
      const sent = await mutation(
        p,
        keys,
        "chat.send",
        id,
        ([latest, seen, mute, last, a, b, target, policy, quote]) => {
          requireThat(roomAllowed(latest || r, p), 403, "FORBIDDEN");
          if (seen) {
            requireThat(
              seen.hash === digest(content + ":" + (replyTo || "")),
              409,
              "REQUEST_CONFLICT",
            );
            return { value: seen.messageId };
          }
          requireThat(
            !mute || mute.until <= now,
            403,
            "CHAT_MUTED",
            "Akses kirim pesan sedang dijeda.",
          );
          if (r.kind === "dm") {
            requireThat(
              target?.status === "active",
              403,
              "RECIPIENT_UNAVAILABLE",
            );
            ensureUnblocked(p.uid, peer, a, b);
          } else {
            requireThat(
              policy?.globalChatEnabled !== false,
              403,
              "CHAT_CLOSED",
            );
            requireThat(
              !last ||
                now - last.at >=
                  Math.max(0, Number(policy?.slowMode) || 0) * 1000,
              429,
              "SLOW_MODE",
              "Tunggu sejenak sebelum mengirim pesan lagi.",
            );
          }
          requireThat(!replyTo || quote, 400, "REPLY_NOT_FOUND");
          const message = {
            senderId: p.uid,
            senderName: p.account.displayName || p.account.username,
            profileId: p.account.profileId,
            profileKind: p.account.profileKind,
            content: content.trim(),
            createdAt: now,
            replyTo: replyTo || null,
            deleted: false,
          };
          const updated = { ...(latest || r), revision:(latest?.revision||0)+1, lastAt: now, lastSender: p.uid };
          const writes: Record<string, RecordData> = {
            [root(id)]: updated,
            [root(id) + "/messages/" + messageId]: message,
            [root(id) + "/senders/" + p.uid]: { at: now },
            [dedup]: {
              messageId,
              hash: digest(content + ":" + (replyTo || "")),
              createdAt: now,
            },
          };
          if (r.kind === "dm")
            for (const uid of r.members)
              writes["security_chat_inboxes/" + uid + "/rooms/" + id] = {
                ...updated,
                peer: uid === p.uid ? peer : p.uid,
                title:
                  uid === p.uid
                    ? target!.displayName || target!.username
                    : p.account.displayName || p.account.username,
                profileId:
                  uid === p.uid ? target!.profileId : p.account.profileId,
              };
          return { value: messageId, writes };
        },
      );
      res.json({ id: sent });
    }),
  );
  app.post(
    "/api/chat/:room/read",
    wrap(async (req, res) => {
      const p = writeUser(req, res),
        id = req.params.room;
      await room(id, p);
      await rateLimit(store, "chat-readmark:" + p.uid, 30, 60000);
      const key = root(id) + "/readers/" + p.uid;
      await mutation(p, [key], "chat.read", id, ([old]) => ({
        value: null,
        writes: {
          [key]: {
            ...old,
            readAt: Date.now(),
            typingUntil: req.body.typing === true ? Date.now() + 5000 : 0,
          },
        },
      }));
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/chat/preferences",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      member(p);
      const { userId, blocked, muted, receipts } = req.body;
      requireThat(
        (validId(userId) &&
          userId !== p.uid &&
          (typeof blocked === "boolean" || typeof muted === "boolean")) ||
          typeof receipts === "boolean",
      );
      await mutation(
        p,
        [prefKey(p.uid)],
        "chat.preferences",
        p.uid,
        ([old]) => {
          const v = { blocked: [], muted: [], receipts: true, ...old };
          for (const [key, value] of [
            ["blocked", blocked],
            ["muted", muted],
          ] as const)
            if (typeof value === "boolean") {
              const ids = new Set<string>(v[key]);
              value ? ids.add(userId) : ids.delete(userId);
              requireThat(ids.size <= 100);
              v[key] = [...ids];
            }
          if (typeof receipts === "boolean") v.receipts = receipts;
          return { value: null, writes: { [prefKey(p.uid)]: v } };
        },
      );
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/chat/:room/action",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      member(p);
      const id = req.params.room,
        r = await room(id, p),
        { messageId, action, reason } = req.body;
      requireThat(
        validId(messageId) &&
          ["hide", "delete", "pin", "report"].includes(action),
      );
      const key = root(id) + "/messages/" + messageId;
      await rateLimit(store, "chat-action:" + p.uid, 20, 60000);
      await mutation(
        p,
        [key, root(id), root(id) + "/readers/" + p.uid],
        "chat." + action,
        id,
        ([m, roomState, state]) => {
          requireThat(m, 404, "NOT_FOUND");
          let writes: Record<string, RecordData> = {};
          if (action === "report") {
            requireThat(
              typeof reason === "string" &&
                reason.trim().length >= 3 &&
                reason.length <= 1000,
            );
            writes["security_reports/" + randomToken()] = {
              reporterId: p.uid,
              collection: "chat",
              documentId: id + "/" + messageId,
              reason,
              selectedContent: { ...m, id: messageId },
              classRoom: p.account.classRooms?.[0] || "",
              status: "open",
              createdAt: Date.now(),
            };
          } else if (action === "hide") {
            const hidden = [
              ...new Set([...(state?.hiddenIds || []), messageId]),
            ];
            requireThat(hidden.length <= 200);
            writes[root(id) + "/readers/" + p.uid] = {
              ...state,
              hiddenIds: hidden,
            };
          } else {
            const moderator = r.kind !== "dm" && can(p, "globalChat.moderate");
            requireThat(
              action === "delete"
                ? m.senderId === p.uid || moderator
                : moderator,
              403,
              "FORBIDDEN",
            );
            if (m.senderId !== p.uid || action === "pin") {
              fresh(p);
              requireThat(
                typeof reason === "string" &&
                  reason.trim().length >= 3 &&
                  reason.length <= 500,
              );
            }
            if (action === "pin")
              writes[root(id)] = {
                ...(roomState || r),
                pinnedMessageId: req.body.pinned === false ? null : messageId,
              };
            else
              writes[key] = {
                ...m,
                content: "",
                deleted: true,
                deletedByModerator: m.senderId !== p.uid,
                deletedAt: Date.now(),
              };
          }
          if(action==='pin'||action==='delete')writes[root(id)]={...(writes[root(id)]||roomState||r),revision:(roomState?.revision||0)+1};
          return { value: null, writes };
        },
      );
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/admin/chat/mute",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      fresh(p);
      requireThat(can(p, "globalChat.moderate"), 403, "FORBIDDEN");
      const { userId, minutes, reason } = req.body;
      requireThat(
        validId(userId) &&
          Number.isInteger(minutes) &&
          minutes >= 0 &&
          minutes <= 10080 &&
          typeof reason === "string" &&
          reason.trim().length >= 3 &&
          reason.length <= 500,
      );
      await mutation(
        p,
        ["security_accounts/" + userId],
        "chat.mute",
        userId,
        ([target]) => {
          requireThat(
            target && target.role !== "owner" && userId !== p.uid,
            403,
            "OWNER_PROTECTED",
          );
          return {
            value: null,
            writes: {
              ["security_chat_mutes/" + userId]: {
                until: Date.now() + minutes * 60000,
                reason,
                actor: p.uid,
              },
            },
          };
        },
      );
      res.json({ ok: true });
    }),
  );
}
