import type { Domain } from "./domain";
import type { Store, RecordData } from "./store";
import { authenticated } from "./auth";
import {
  can,
  fresh,
  requireThat,
  validId,
  randomToken,
  rateLimit,
  type Principal,
} from "./security";
import { visible, project } from "./policy";

export function memoryVisible(d: RecordData, p: Principal | null) {
  return (
    d.reviewStatus === "approved" &&
    d.consentState === "confirmed" &&
    !d.hidden &&
    (d.audience === "public" ||
      (!!p && d.audience === "members") ||
      (!!p &&
        d.audience === "restricted" &&
        p.account.classRooms?.includes(d.classRoom)))
  );
}
export async function retrieveKnowledge(
  store: Store,
  p: Principal,
  message: string,
) {
  const words = message
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((x) => x.length > 2);
  const score = (d: RecordData) =>
    words.reduce(
      (n, w) => n + (JSON.stringify(d).toLowerCase().includes(w) ? 1 : 0),
      0,
    );
  const context: RecordData = {},
    sources: RecordData[] = [];
  for (const c of ["schedules", "teachers", "achievements", "announcements"]) {
    const rows = (await store.list(c, [], undefined, 100))
      .filter((r) => visible(c, r.data, p))
      .map((r) => ({ id: r.id, data: project(c, r.id, r.data, p) }));
    context[c] = rows
      .sort((a, b) => score(b.data) - score(a.data))
      .slice(0, 6)
      .map((r) => {
        sources.push({
          id: r.id,
          collection: c,
          title:
            r.data.title || r.data.name || r.data.nama || r.data.classRoom || c,
          updatedAt: r.data.updatedAt || null,
          url:
            c === "schedules"
              ? "/jadwal"
              : c === "teachers"
                ? "/guru"
                : "/prestasi",
        });
        return r.data;
      });
  }
  const rows = (
    await store.list(
      "security_memory",
      [["reviewStatus", "approved"]],
      undefined,
      100,
    )
  )
    .filter((r) => memoryVisible(r.data, p) && score(r.data) > 0)
    .sort((a, b) => score(b.data) - score(a.data));
  context.memory = rows.slice(0, 5).map((r) => {
    sources.push({
      id: r.id,
      collection: "memory",
      title: r.data.title,
      factType: r.data.factType,
      updatedAt: r.data.updatedAt,
      url: "/nusa-ai?memory=" + r.id,
    });
    return {
      id: r.id,
      title: r.data.title,
      body: r.data.body,
      factType: r.data.factType,
      category: r.data.category,
      updatedAt: r.data.updatedAt,
    };
  });
  return { context, sources: sources.slice(0, 12) };
}
export function installKnowledge({
  app,
  store,
  wrap,
  writeUser,
  mutation,
}: Domain) {
  app.get(
    "/api/memory",
    wrap(async (req, res) => {
      const p: Principal = res.locals.p;
      authenticated(p);
      const after =
        typeof req.query.after === "string" ? req.query.after : undefined;
      requireThat(!after || validId(after));
      const mode =
        req.query.mode === "review"
          ? "review"
          : req.query.mode === "mine"
            ? "mine"
            : "approved";
      if (mode === "review")
        requireThat(
          p.account.role === "owner" ||
            p.account.permissions?.includes("memory.review"),
          403,
          "FORBIDDEN",
        );
      const rows = await store.list(
        "security_memory",
        mode === "mine"
          ? [["submittedBy", p.uid]]
          : mode === "approved"
            ? [["reviewStatus", "approved"]]
            : [],
        after,
        50,
      );
      res.json({
        items: rows
          .filter((r) =>
            mode === "review"
              ? can(p, "memory.review", r.data)
              : mode === "mine" || memoryVisible(r.data, p),
          )
          .map((r) =>
            mode === "approved"
              ? {
                  id: r.id,
                  title: r.data.title,
                  body: r.data.body,
                  category: r.data.category,
                  factType: r.data.factType,
                  audience: r.data.audience,
                  classRoom: r.data.classRoom,
                  updatedAt: r.data.updatedAt,
                  reviewStatus: r.data.reviewStatus,
                  version: r.data.version,
                }
              : { id: r.id, ...r.data },
          ),
        next: rows.length === 50 ? rows.at(-1)!.id : null,
      });
    }),
  );
  app.post(
    "/api/memory",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      requireThat(
        !p.account.mustChangePassword,
        403,
        "PASSWORD_CHANGE_REQUIRED",
      );
      const {
        title,
        body,
        category,
        factType,
        audience,
        classRoom = "",
        consent,
        requestId,
      } = req.body;
      requireThat(
        typeof title === "string" &&
          title.trim().length >= 3 &&
          title.length <= 120 &&
          typeof body === "string" &&
          body.trim().length >= 10 &&
          body.length <= 4000,
      );
      requireThat(
        [
          "fakta sekolah",
          "kegiatan",
          "jokes",
          "meme",
          "istilah",
          "cerita",
        ].includes(category) &&
          ["fact", "personal_story", "joke", "opinion"].includes(factType),
      );
      requireThat(
        ["public", "members", "restricted"].includes(audience) &&
          typeof classRoom === "string" &&
          classRoom.length <= 40 &&
          consent === true &&
          validId(requestId),
      );
      requireThat(
        !classRoom ||
          p.account.role === "owner" ||
          p.account.classRooms?.includes(classRoom),
        403,
        "SCOPE_DENIED",
      );
      requireThat(audience !== "restricted" || classRoom.length > 0);
      await rateLimit(store, "memory-submit:" + p.uid, 5, 3600000);
      const id = requestId,
        key = "security_memory/" + id;
      await mutation(p, [key], "memory.submit", id, ([old]) => {
        requireThat(
          !old || (old.submittedBy === p.uid && old.reviewStatus === "pending"),
          409,
          "CONCURRENT_CHANGE",
        );
        return {
          value: null,
          writes: {
            [key]: {
              title: title.trim(),
              body: body.trim(),
              category,
              factType,
              audience,
              classRoom,
              consentState: "confirmed",
              submittedBy: p.uid,
              reviewStatus: "pending",
              version: (old?.version || 0) + 1,
              createdAt: old?.createdAt || Date.now(),
              updatedAt: Date.now(),
              sourceRefs: [],
            },
          },
        };
      });
      res.json({ id });
    }),
  );
  app.post(
    "/api/memory/:id/review",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      fresh(p);
      const id = req.params.id,
        { status, reason, version } = req.body;
      requireThat(
        validId(id) &&
          ["approved", "rejected", "withdrawn"].includes(status) &&
          typeof reason === "string" &&
          reason.trim().length >= 3 &&
          reason.length <= 1000 &&
          Number.isInteger(version),
      );
      await mutation(
        p,
        ["security_memory/" + id],
        "memory." + status,
        id,
        ([d]) => {
          requireThat(d && can(p, "memory.review", d), 403, "FORBIDDEN");
          requireThat(d.version === version, 409, "CONCURRENT_CHANGE");
          requireThat(
            d.submittedBy !== p.uid || p.account.role === "owner",
            403,
            "SELF_REVIEW_DENIED",
          );
          return {
            value: null,
            writes: {
              ["security_memory/" + id]: {
                ...d,
                reviewStatus: status,
                reviewReason: reason,
                approvedBy: p.uid,
                version: version + 1,
                updatedAt: Date.now(),
              },
            },
          };
        },
      );
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/memory/:id/correction",
    wrap(async (req, res) => {
      const p = writeUser(req, res),
        id = req.params.id,
        { reason } = req.body;
      requireThat(
        validId(id) &&
          typeof reason === "string" &&
          reason.trim().length >= 3 &&
          reason.length <= 1000,
      );
      const d = await store.get("security_memory/" + id);
      requireThat(d && memoryVisible(d, p), 404, "NOT_FOUND");
      await rateLimit(store, "memory-correction:" + p.uid, 5, 3600000);
      await mutation(p, [], "memory.correction", id, () => ({
        value: null,
        writes: {
          ["security_reports/" + randomToken()]: {
            reporterId: p.uid,
            collection: "memory",
            documentId: id,
            reason,
            selectedContent: {
              title: d.title,
              body: d.body,
              version: d.version,
            },
            classRoom: d.classRoom,
            status: "open",
            createdAt: Date.now(),
          },
        },
      }));
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/admin/reports/:id/resolve",
    wrap(async (req, res) => {
      const p = writeUser(req, res);
      fresh(p);
      const id = req.params.id,
        { status, reason } = req.body;
      requireThat(
        validId(id) &&
          ["resolved", "dismissed"].includes(status) &&
          typeof reason === "string" &&
          reason.trim().length >= 3 &&
          reason.length <= 1000,
      );
      await mutation(
        p,
        ["security_reports/" + id],
        "report." + status,
        id,
        ([d]) => {
          requireThat(d && can(p, "reports.review", d), 403, "FORBIDDEN");
          return {
            value: null,
            writes: {
              ["security_reports/" + id]: {
                ...d,
                status,
                resolution: reason,
                resolvedBy: p.uid,
                resolvedAt: Date.now(),
              },
            },
          };
        },
      );
      res.json({ ok: true });
    }),
  );
}
