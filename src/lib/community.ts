import { api, currentSession } from "./api";
import { getDocs, collection } from "./data";
import { db } from "./firebase";
export type Content = { id: string; [key: string]: any };
export const records = async (c: string): Promise<Content[]> =>
  (await getDocs(collection(db, c))).docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
export const ordered = (list: Content[]) =>
  list.sort(
    (a, b) =>
      Number(!!b.pinned) - Number(!!a.pinned) ||
      Number(new Date(b.createdAt || b.created_at || 0)) -
        Number(new Date(a.createdAt || a.created_at || 0)),
  );
export const saveContent = (c: string, id: string, data: any, old?: Content) =>
  api("/data/write", {
    collection: c,
    id,
    operation: old ? "update" : "set",
    data,
    requestId: id + "-" + (old?.updatedAt || "create"),
    ...(old?.updatedAt ? { expectedUpdatedAt: old.updatedAt } : {}),
  });
export const deleteContent = (c: string, id: string) =>
  api("/data/write", { collection: c, id, operation: "delete", data: {} });
export const timeLabel = (value: any) => {
  const t = new Date(value || 0);
  if (!Number.isFinite(+t) || +t === 0) return "";
  const ms = Date.now() - +t;
  if (ms < 60000) return "Baru saja";
  if (ms < 3600000) return Math.floor(ms / 60000) + " menit lalu";
  if (ms < 86400000) return Math.floor(ms / 3600000) + " jam lalu";
  return t.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
};
export const timeWib = (value: any) =>
  new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
let visitorCsrf: string | null = null;
export async function likePost(id: string, active: boolean) {
  if (!currentSession().user && !visitorCsrf)
    visitorCsrf = (await api("/visitor")).csrfToken;
  return api(
    "/social/like",
    { id, active },
    "POST",
    !currentSession().user ? { csrfToken: visitorCsrf! } : {},
  );
}
export async function shareContent(c: string, id: string) {
  const url =
    location.origin +
    "/" +
    (c === "posts" ? "feed" : c === "albums" ? "albums" : "home") +
    "?" +
    (c === "posts" ? "post" : c === "albums" ? "album" : "story") +
    "=" +
    encodeURIComponent(id);
  if (navigator.share) await navigator.share({ title: "AngkatanKU", url });
  else await navigator.clipboard.writeText(url);
}
export function mayModerate(user: any, permission: string, d?: any) {
  return (
    user?.role === "owner" ||
    (user?.role === "admin" &&
      user.permissions?.includes(permission) &&
      (user.scope === "school" || user.classRooms?.includes(d?.classRoom)))
  );
}
window.addEventListener("angkatan:session", () => {
  visitorCsrf = null;
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const k = sessionStorage.key(i);
    if (k?.startsWith("angkatan-draft:")) sessionStorage.removeItem(k);
  }
});
