import type { Domain } from "./domain";
import { authenticated, csrfCheck } from "./auth";
import {
  digest,
  randomToken,
  requireThat,
  validId,
  rateLimit,
  type Principal,
} from "./security";
import { visible, project } from "./policy";
import type { RecordData } from "./store";
const guestCookie = () =>
  process.env.NODE_ENV === "production"
    ? "__Host-angkatan_visitor"
    : "angkatan_visitor";
const readCookie = (req: any) =>
  req.headers.cookie
    ?.split(";")
    .map((x: string) => x.trim())
    .find((x: string) => x.startsWith(guestCookie() + "="))
    ?.slice(guestCookie().length + 1);
export function installSocial({
  app,
  store,
  wrap,
  writeUser,
  mutation,
  config,
}: Domain) {
  app.get(
    "/api/visitor",
    wrap(async (req, res) => {
      let token = readCookie(req),
        visitor =
          token && /^[\w-]{43}$/.test(token)
            ? await store.get("security_visitors/" + digest(token))
            : null;
      if (!visitor || visitor.expiresAt < Date.now()) {
        await rateLimit(store, "visitor-create:" + req.ip, 8, 86400000);
        token = randomToken();
        visitor = { expiresAt: Date.now() + 86400000 };
        await store.atomic(["security_visitors/" + digest(token)], () => ({
          value: null,
          writes: { ["security_visitors/" + digest(token)]: visitor },
        }));
        res.cookie(guestCookie(), token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: 86400000,
        });
      }
      res.json({ csrfToken: digest("visitor:" + token) });
    }),
  );
  app.post(
    "/api/social/like",
    wrap(async (req, res) => {
      const p: Principal | null = res.locals.p,
        { id, active = true } = req.body;
      requireThat(validId(id) && typeof active === "boolean");
      let actor: string;
      if (p) {
        csrfCheck(req, p);
        requireThat(
          !p.account.mustChangePassword,
          403,
          "PASSWORD_CHANGE_REQUIRED",
        );
        actor = p.uid;
      } else {
        const token = readCookie(req);
        requireThat(token && /^[\w-]{43}$/.test(token), 401, "AUTH_REQUIRED");
        const guest = await store.get("security_visitors/" + digest(token));
        requireThat(
          guest &&
            guest.expiresAt > Date.now() &&
            req.headers["x-csrf-token"] === digest("visitor:" + token),
          403,
          "CSRF_INVALID",
        );
        actor = "guest:" + digest(token);
        await rateLimit(store, "guest-like-ip:" + req.ip, 60, 3600000);
      }
      await rateLimit(store, "like:" + actor, 30, 60000);
      const key = "posts/" + id,
        rel = "security_interactions/" + digest(key + ":like:" + actor);
      const change = ([d, relation, cfg]: (RecordData | null)[]) => {
        requireThat(d && visible("posts", d, p), 404, "NOT_FOUND");
        requireThat(
          !cfg?.readOnly && !cfg?.maintenance && cfg?.feedEnabled !== false,
          403,
          "READ_ONLY",
        );
        const was = relation && relation.active !== false,
          delta = Number(active) - Number(!!was);
        const likes_count = Math.max(0, (Number(d.likes_count) || 0) + delta);
        return {
          value: { likes_count, liked: active },
          writes: {
            [key]: { ...d, likes_count },
            [rel]: { uid: actor, active, createdAt: Date.now() },
          },
        };
      };
      const r = p
        ? await mutation(
            p,
            [key, rel, "security_config/main"],
            "content.like",
            key,
            change,
          )
        : await store.atomic([key, rel, "security_config/main"], change);
      res.json(r);
    }),
  );
  app.get(
    "/api/social/saved",
    wrap(async (req, res) => {
      const p: Principal = res.locals.p;
      authenticated(p);
      const rows = await store.list(
        "security_bookmarks/" + p.uid + "/posts",
        [],
        undefined,
        100,
      );
      const items = await Promise.all(
        rows.map(async (r) => {
          const d = await store.get("posts/" + r.id);
          return d && visible("posts", d, p)
            ? project("posts", r.id, d, p)
            : null;
        }),
      );
      res.json({ items: items.filter(Boolean) });
    }),
  );
  app.post(
    "/api/social/bookmark",
    wrap(async (req, res) => {
      const p = writeUser(req, res),
        { id, active } = req.body;
      requireThat(validId(id) && typeof active === "boolean");
      await mutation(p, ["posts/" + id], "content.bookmark", id, ([d]) => {
        requireThat(d && visible("posts", d, p), 404, "NOT_FOUND");
        return {
          value: null,
          writes: {
            ["security_bookmarks/" + p.uid + "/posts/" + id]: active
              ? { createdAt: Date.now() }
              : null,
          },
        };
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/social/state",
    wrap(async (req, res) => {
      const p: Principal | null = res.locals.p,
        { ids } = req.body;
      requireThat(Array.isArray(ids) && ids.length <= 50 && ids.every(validId));
      const token = readCookie(req),
        actor =
          p?.uid ||
          (token && /^[\w-]{43}$/.test(token)
            ? "guest:" + digest(token)
            : null);
      const items = await Promise.all(
        ids.map(async (id: string) => {
          const rel = actor
            ? await store.get(
                "security_interactions/" +
                  digest("posts/" + id + ":like:" + actor),
              )
            : null;
          return {
            id,
            liked: !!rel && rel.active !== false,
            saved: p
              ? !!(await store.get(
                  "security_bookmarks/" + p.uid + "/posts/" + id,
                ))
              : false,
          };
        }),
      );
      res.json({ items });
    }),
  );
}
