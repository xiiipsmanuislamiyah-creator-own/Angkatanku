import {
  can,
  cleanObject,
  requireThat,
  validId,
  type Principal,
} from "./security";
import type { RecordData } from "./store";
export const COLLECTIONS = new Set(
  "students teachers users gallery albums personal_albums stories posts messages schedules achievements announcements config system_moderation app_ratings".split(
    " ",
  ),
);
export const CONTENT = new Set(
  "gallery albums personal_albums stories posts".split(" "),
);
const PROFILES = new Set(["students", "teachers"]);
// Exact legacy UID ownership only; conflicting author fields require moderator review.
export function resourceOwner(d: RecordData) {
  if (typeof d.ownerId === "string") return d.ownerId;
  const ids = [
    ...new Set(
      ["authorId", "uploaderId", "userId", "user_id"]
        .map((k) => d[k])
        .filter((x) => typeof x === "string" && x),
    ),
  ];
  return ids.length === 1 ? ids[0] : null;
}

export const moderationPermission = (c: string) =>
  PROFILES.has(c)
    ? "profiles.manage"
    : ["schedules", "achievements"].includes(c)
      ? "academic.manage"
      : c === "announcements"
        ? "announcements.manage"
        : c === "app_ratings"
          ? "reports.review"
          : c === "stories"
            ? "story.moderate"
            : c === "messages"
              ? "globalChat.moderate"
              : "feed.moderate";
export function visible(
  c: string,
  d: RecordData,
  p: Principal | null,
): boolean {
  if (c === "messages")
    return (
      !!p &&
      (d.senderId === p.uid ||
        d.receiverId === p.uid ||
        (d.type === "notification" && d.receiverId === "all"))
    );
  if (c === "users") return !!p && resourceOwner(d) === p.uid;
  if (["config", "system_moderation"].includes(c))
    return can(p, "config.manage");
  if (
    c === "stories" &&
    (!Number.isFinite(d.expiresAt) || d.expiresAt <= Date.now())
  )
    return can(p, "story.moderate", d);
  if ((p && resourceOwner(d) === p.uid) || can(p, moderationPermission(c), d))
    return true;
  if (d.hidden) return false;
  return (
    d.audience === "public" ||
    (!!p &&
      ((d.audience || "members") === "members" ||
        (d.audience === "restricted" && d.allowedUserIds?.includes(p.uid))))
  );
}
const PROFILE_FIELDS =
  "name nama title jabatan mapel role classRoom gender quote motto hobbies favoriteSubject socialTag bannerUrl avatarUrl url_gambar colors cardTheme cardCreated hasCreatedCard bio achievement achievements favoriteFood dream job city instagram portfolio website nickname tags socials socialLinks audience";
const CONTENT_FIELDS =
  "title caption content text description date album category imageUrl mediaUrl videoUrl url thumbnailUrl mediaType type authorId authorName authorSubtitle identityKey subtitle avatarType avatarSrc uploaderId uploaderEmail userId user_id timestamp createdAt updatedAt created_at expiresAt duration viewedBy likes comments likes_count pinned hidden audience allowedUserIds classRoom media coverUrl items photos order backgroundColor textColor fontStyle position align isOfficial authorAvatar authorRole commentLocked";
const ACADEMIC_FIELDS =
  "title description category date year imageUrl icon color level name subject teacher teacherId day start end startTime endTime time duration classRoom className room order mapel guru hari jam mulai selesai type entries lessons schedule schedules audience winner rank badge message active";
const MESSAGE_FIELDS =
  "type title receiverId senderId senderName content read createdAt";
const RATING_FIELDS =
  "rating comment userId userName userRole isGuest createdAt";
export const safeUrl = (v: string) =>
  v === "" ||
  /^https:\/\/[^\s<>"']+$/i.test(v) ||
  /^\/api\/media\/[\w-]+$/.test(v) ||
  /^\/gambar\/[\w./-]+$/.test(v) ||
  ["/logo-ips1.png", "/logo-ips2.jpg"].includes(v);
const sensitive =
  /(password|secret|token|credential|hash|privatekey|apikey|api_key|^email$|^nip$|^induk$|^viewedBy$|uploaderEmail)/i;
function publicValue(v: any, key = ""): any {
  if (sensitive.test(key)) return undefined;
  if (v && typeof v.toMillis === "function") return v.toMillis();
  if (typeof v === "string")
    return /url$|^url$|^avatarSrc$/i.test(key) && !safeUrl(v) ? "" : v;
  if (Array.isArray(v))
    return v.map((x) => publicValue(x)).filter((x) => x !== undefined);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v)
        .map(([k, x]) => [k, publicValue(x, k)])
        .filter(([, x]) => x !== undefined),
    );
  return v;
}
function fields(c: string) {
  return PROFILES.has(c)
    ? PROFILE_FIELDS
    : CONTENT.has(c)
      ? CONTENT_FIELDS
      : ["schedules", "achievements", "announcements"].includes(c)
        ? ACADEMIC_FIELDS
        : c === "messages"
          ? MESSAGE_FIELDS
          : c === "app_ratings"
            ? RATING_FIELDS
            : c === "users"
              ? "name displayName avatarUrl bio audience"
              : "maintenance readOnly aiEnabled feedEnabled storiesEnabled globalChatEnabled uploadLock blockedWords slowMode";
}
export function project(
  c: string,
  id: string,
  d: RecordData,
  p: Principal | null,
) {
  const allowed = new Set(
    (
      fields(c) + " ownerId username isTeacher viewCount updatedAt createdAt"
    ).split(" "),
  );
  const out: any = { id };
  for (const [k, v] of Object.entries(d))
    if (allowed.has(k)) {
      const x = publicValue(v, k);
      if (x !== undefined) out[k] = x;
    }
  if (PROFILES.has(c) && p && resourceOwner(d) === p.uid)
    for (const k of ["induk", "nip"])
      if (typeof d[k] === "string") out[k] = d[k];
  if (PROFILES.has(c) || c === "stories")
    out.viewCount = Number.isFinite(d.viewCount)
      ? d.viewCount
      : new Set(d.viewedBy || []).size;
  if (c === "posts") {
    out.comments = (d.comments || []).map((x: any) =>
      Object.fromEntries(
        ["id", "post_id", "author", "content", "created_at", "user_id"]
          .filter((k) => x[k] !== undefined)
          .map((k) => [k, publicValue(x[k], k)]),
      ),
    );
    out.media = (d.media || []).map((x: any) =>
      Object.fromEntries(
        [
          "id",
          "post_id",
          "type",
          "url",
          "width",
          "height",
          "size",
          "order",
          "created_at",
        ]
          .filter((k) => x[k] !== undefined)
          .map((k) => [k, publicValue(x[k], k)]),
      ),
    );
    const timestamp =
      d.created_at?.toMillis?.() ??
      d.created_at ??
      d.createdAt?.toMillis?.() ??
      d.createdAt ??
      0;
    const t = new Date(timestamp);
    out.created_at = Number.isNaN(+t)
      ? new Date(0).toISOString()
      : t.toISOString();
  }
  return out;
}
function checkUrls(v: any, key = "") {
  if (typeof v === "string" && /url$|^url$|^avatarSrc$/i.test(key))
    requireThat(safeUrl(v));
  if (v && typeof v === "object")
    for (const [k, x] of Object.entries(v)) checkUrls(x, k);
}
function validateNested(k: string, v: any) {
  if (k === "media") {
    requireThat(Array.isArray(v) && v.length <= 20);
    for (const m of v) {
      requireThat(
        m &&
          typeof m === "object" &&
          Object.keys(m).every((x) =>
            "id post_id type url width height size order created_at"
              .split(" ")
              .includes(x),
          ),
      );
      requireThat(
        ["image", "video"].includes(m.type) &&
          typeof m.url === "string" &&
          safeUrl(m.url),
      );
      for (const x of ["width", "height", "size", "order"])
        if (m[x] !== undefined) requireThat(Number.isFinite(m[x]) && m[x] >= 0);
    }
  } else if (["socials", "socialLinks", "colors"].includes(k)) {
    requireThat(
      v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        Object.values(v).every(
          (x) =>
            typeof x === "string" &&
            x.length <= 500 &&
            !/^(javascript|data|vbscript|file):/i.test(x.trim()),
        ),
    );
  } else if (k === "schedules") {
    requireThat(Array.isArray(v) && v.length <= 7);
    for (const day of v) {
      requireThat(
        Object.keys(day).every((x) => ["day", "subjects"].includes(x)) &&
          typeof day.day === "string" &&
          Array.isArray(day.subjects) &&
          day.subjects.length <= 30,
      );
      for (const s of day.subjects)
        requireThat(
          Object.entries(s).every(
            ([x, y]) =>
              [
                "time",
                "name",
                "jp",
                "teacher",
                "topic",
                "room",
                "isBreak",
              ].includes(x) &&
              (typeof y === "string" ||
                typeof y === "number" ||
                typeof y === "boolean"),
          ),
        );
    }
  } else if (Array.isArray(v))
    requireThat(v.every((x) => typeof x === "string" || typeof x === "number"));
  else requireThat(v === null || typeof v !== "object");
}
export function validateChange(
  c: string,
  id: string,
  raw: unknown,
  old: RecordData | null,
  p: Principal,
  operation: string,
): RecordData | null {
  requireThat(
    COLLECTIONS.has(c) && !["config", "system_moderation"].includes(c),
    403,
    "FORBIDDEN",
  );
  const d = cleanObject(raw),
    moderator = can(p, moderationPermission(c), old || d),
    self =
      PROFILES.has(c) &&
      p.account.profileCollection === c &&
      p.account.profileId === id;
  if (operation === "delete") {
    requireThat(
      !PROFILES.has(c) &&
        !["users", "messages"].includes(c) &&
        !!old &&
        (resourceOwner(old) === p.uid || moderator),
      403,
      "FORBIDDEN",
    );
    return null;
  }
  if (PROFILES.has(c)) {
    requireThat(!!old && (self || moderator), 403, "FORBIDDEN");
    requireThat(
      old.securityRole !== "owner" || p.account.role === "owner",
      403,
      "OWNER_PROTECTED",
    );
  } else if (c === "users") requireThat(id === p.uid, 403, "FORBIDDEN");
  else if (c === "messages") {
    if (old) {
      requireThat(
        old.receiverId === p.uid &&
          Object.keys(d).every((k) => k === "read") &&
          d.read === true,
        403,
        "FORBIDDEN",
      );
      return { ...old, read: true, updatedAt: Date.now() };
    }
    requireThat(
      d.type === "dm" ||
        (d.type === "notification" && can(p, "announcements.manage", d)),
      403,
      "FORBIDDEN",
    );
    requireThat(
      d.type !== "dm" || (validId(d.receiverId) && d.receiverId !== "all"),
    );
  } else if (["schedules", "achievements", "announcements"].includes(c))
    requireThat(moderator, 403, "FORBIDDEN");
  else if (c === "app_ratings")
    requireThat(id === p.uid || moderator, 403, "FORBIDDEN");
  else
    requireThat(
      !old || resourceOwner(old) === p.uid || moderator,
      403,
      "FORBIDDEN",
    );
  const allowed = new Set(fields(c).split(" "));
  const result: RecordData = {
    ...(old || {}),
    ownerId: old ? resourceOwner(old) : p.uid,
  };
  for (const [k, v] of Object.entries(d)) {
    if (k === "id") {
      requireThat(v === id);
      continue;
    }
    if (
      [
        "createdAt",
        "updatedAt",
        "created_at",
        "timestamp",
        "expiresAt",
        "email",
        "uploaderEmail",
        "senderId",
        "senderName",
        "read",
        "isTeacher",
      ].includes(k)
    )
      continue;
    if (["username", "induk", "nip"].includes(k) && PROFILES.has(c)) {
      requireThat(v === old?.[k], 403, "IDENTITY_IMMUTABLE");
      continue;
    }
    requireThat(allowed.has(k), 400, "FIELD_DENIED");
    if (
      PROFILES.has(c) &&
      ["role", "classRoom", "jabatan", "title", "mapel"].includes(k)
    )
      requireThat(moderator || v === old?.[k], 403, "IDENTITY_IMMUTABLE");
    if (
      CONTENT.has(c) &&
      ["likes", "likes_count", "comments", "viewedBy"].includes(k)
    ) {
      requireThat(!old && ((Array.isArray(v) && v.length === 0) || v === 0));
      continue;
    }
    if (
      ["authorId", "uploaderId", "userId", "user_id"].includes(k) &&
      c !== "app_ratings"
    )
      requireThat(
        v === p.uid || (moderator && v === old?.[k]),
        403,
        "IDENTITY_IMMUTABLE",
      );
    if (["pinned", "hidden", "commentLocked", "isOfficial"].includes(k))
      requireThat(
        moderator || v === old?.[k] || (v === false && old?.[k] !== true),
        403,
        "FORBIDDEN",
      );
    if (["identityKey", "authorRole"].includes(k))
      requireThat(
        moderator || v === (k === "identityKey" ? "personal" : "member"),
        403,
        "FORBIDDEN",
      );
    if (
      [
        "hidden",
        "pinned",
        "commentLocked",
        "isOfficial",
        "cardCreated",
        "hasCreatedCard",
        "active",
        "isGuest",
      ].includes(k)
    )
      requireThat(typeof v === "boolean");
    const flexible = new Set(
      "colors socials socialLinks hobbies tags achievements allowedUserIds media items photos schedules entries lessons schedule position duration order year start end rating".split(
        " ",
      ),
    );
    const booleans = new Set(
      "hidden pinned commentLocked isOfficial cardCreated hasCreatedCard active isGuest".split(
        " ",
      ),
    );
    if (!flexible.has(k) && !booleans.has(k))
      requireThat(
        typeof v === "string" || (k === "jabatan" && v === null),
        400,
        "INVALID_TYPE",
      );
    if (typeof v === "number") requireThat(Number.isFinite(v));
    validateNested(k, v);
    result[k] = v;
  }
  if (CONTENT.has(c)) {
    if (!old)
      Object.assign(result, {
        authorId: p.uid,
        uploaderId: p.uid,
        userId: p.uid,
        user_id: p.uid,
        createdAt: Date.now(),
        likes_count: 0,
        comments: [],
      });
    if (!moderator)
      Object.assign(result, {
        authorName: p.account.displayName || p.account.username,
        authorRole: "member",
        isOfficial: false,
        identityKey: "personal",
      });
    if (c === "stories" && !old)
      Object.assign(result, {
        timestamp: Date.now(),
        expiresAt: Date.now() + 86400_000,
      });
  }
  if (c === "messages")
    Object.assign(result, {
      senderId: p.uid,
      senderName: p.account.displayName || p.account.username,
      createdAt: Date.now(),
      read: false,
    });
  if (c === "app_ratings") {
    requireThat(
      Number.isInteger(result.rating) &&
        result.rating >= 1 &&
        result.rating <= 5,
    );
    Object.assign(result, {
      ownerId: p.uid,
      userId: p.uid,
      userName: p.account.displayName || p.account.username,
      userRole: p.account.role,
      isGuest: false,
    });
  }
  if (PROFILES.has(c))
    result.isTeacher =
      typeof old?.isTeacher === "boolean"
        ? old.isTeacher
        : c === "teachers" || (self && p.account.profileKind === "teacher");
  if (c !== "messages") {
    result.audience = result.audience || "members";
    requireThat(["public", "members", "restricted"].includes(result.audience));
    if (result.allowedUserIds)
      requireThat(
        Array.isArray(result.allowedUserIds) &&
          result.allowedUserIds.every((x: any) => validId(x)),
      );
  }
  if (p.account.role === "admin" && p.account.scope !== "school" && moderator)
    requireThat(can(p, moderationPermission(c), result), 403, "SCOPE_DENIED");
  if (c === "stories")
    requireThat(
      typeof result.url === "string" && result.url.length > 0,
      400,
      "MEDIA_REQUIRED",
    );
  if (["gallery", "personal_albums"].includes(c))
    requireThat(
      typeof result.imageUrl === "string" && result.imageUrl.length > 0,
      400,
      "MEDIA_REQUIRED",
    );
  result.createdAt = old?.createdAt || Date.now();
  result.updatedAt = Date.now();
  checkUrls(result);
  return result;
}
export function externalUrls(v: any): string[] {
  if (typeof v === "string") return /^https:\/\//i.test(v) ? [v] : [];
  return v && typeof v === "object"
    ? Object.values(v).flatMap(externalUrls)
    : [];
}
