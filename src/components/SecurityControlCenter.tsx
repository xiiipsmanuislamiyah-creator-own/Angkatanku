import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
const permissions = [
  "profiles.manage",
  "feed.moderate",
  "story.moderate",
  "globalChat.moderate",
  "reports.review",
  "academic.manage",
  "announcements.manage",
  "config.manage",
  "audit.read",
  "memory.review",
  "identity.publish",
];
const input =
  "w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm";
const button =
  "px-3 py-2 rounded-lg bg-slate-800 text-white text-xs disabled:opacity-50";
export default function SecurityControlCenter() {
  const { user, realRole } = useAuth(),
    isOwner = realRole === "owner",
    canConfigure =
      isOwner ||
      (user?.scope === "school" &&
        user?.permissions?.includes("config.manage"));
  const [accounts, setAccounts] = useState<any[]>([]),
    [settings, setSettings] = useState<any>({}),
    [logs, setLogs] = useState<any[]>([]),
    [reports, setReports] = useState<any[]>([]),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const [logCursor, setLogCursor] = useState<string | null>(null),
    [reportCursor, setReportCursor] = useState<string | null>(null);
  const [pending, setPending] = useState<{
      label: string;
      path: string;
      body: any;
    } | null>(null),
    [confirmation, setConfirmation] = useState("");
  const [newAccount, setNewAccount] = useState({
      username: "",
      displayName: "",
      password: "",
      profileKind: "student",
      classRoom: "",
    }),
    [target, setTarget] = useState(""),
    [role, setRole] = useState("member"),
    [scope, setScope] = useState("classes"),
    [classes, setClasses] = useState(""),
    [grants, setGrants] = useState<string[]>([]),
    [resetPassword, setResetPassword] = useState("");
  const [content, setContent] = useState({
    collection: "posts",
    id: "",
    audience: "members",
    hidden: false,
  });
  async function refresh() {
    setStatus("");
    try {
      if (isOwner) {
        let items: any[] = [],
          after: string | null = null;
        do {
          const r = await api(
            "/admin/accounts" +
              (after ? "?after=" + encodeURIComponent(after) : ""),
          );
          items.push(...r.items);
          after = r.next;
        } while (after && items.length < 1000);
        setAccounts(items);
      }
      if (canConfigure) setSettings(await api("/admin/config"));
      if (isOwner || user?.permissions?.includes("audit.read")) {
        const r = await api("/admin/audit");
        setLogs(r.items);
        setLogCursor(r.next);
      }
      if (isOwner || user?.permissions?.includes("reports.review")) {
        const r = await api("/admin/reports");
        setReports(r.items);
        setReportCursor(r.next);
      }
    } catch (e: any) {
      setStatus(e.message);
    }
  }
  async function loadMore(kind: "audit" | "reports") {
    setBusy(true);
    try {
      const cursor = kind === "audit" ? logCursor : reportCursor;
      if (!cursor) return;
      const r = await api(
        "/admin/" + kind + "?after=" + encodeURIComponent(cursor),
      );
      if (kind === "audit") {
        setLogs((old) => [...old, ...r.items]);
        setLogCursor(r.next);
      } else {
        setReports((old) => [...old, ...r.items]);
        setReportCursor(r.next);
      }
    } catch (e: any) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, [user?.uid]);
  const request = (label: string, path: string, body: any) => {
    setConfirmation("");
    setPending({ label, path, body });
  };
  async function execute(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    setBusy(true);
    try {
      await api("/auth/reauth", { password: confirmation });
      await api(pending.path, pending.body);
      setPending(null);
      setConfirmation("");
      setResetPassword("");
      setNewAccount((v) => ({ ...v, password: "" }));
      await refresh();
      setStatus("Tindakan berhasil disimpan dan dicatat.");
    } catch (e: any) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  }
  function selectAccount(uid: string) {
    setTarget(uid);
    const a = accounts.find((x) => x.uid === uid);
    setRole(a?.role || "member");
    setGrants(a?.permissions || []);
    setScope(a?.scope || "classes");
    setClasses((a?.classRooms || []).join(", "));
  }
  if (!["owner", "admin"].includes(realRole)) return null;
  return (
    <section
      className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4"
      aria-label="Pusat kontrol keamanan"
    >
      <h2 className="text-xl font-bold">Pusat Kontrol Keamanan</h2>
      <p className="text-sm text-slate-500">
        Izin berlaku di server. Siswa dan guru merupakan jenis profil.
      </p>
      {status && (
        <p
          role="status"
          className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm"
        >
          {status}
        </p>
      )}
      {isOwner && (
        <>
          <details>
            <summary className="font-semibold cursor-pointer">
              Manajemen akun
            </summary>
            <div className="space-y-3 pt-3">
              <label className="block text-sm">
                Akun
                <select
                  aria-label="Akun"
                  className={input}
                  value={target}
                  onChange={(e) => selectAccount(e.target.value)}
                >
                  <option value="">Pilih akun</option>
                  {accounts.map((a) => (
                    <option
                      key={a.uid}
                      value={a.uid}
                      disabled={a.role === "owner"}
                    >
                      {a.displayName} — {a.role} / {a.status}
                    </option>
                  ))}
                </select>
              </label>
              {target && (
                <div className="space-y-3">
                  <label className="block text-sm">
                    Role
                    <select
                      aria-label="Role"
                      className={input}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    Lingkup
                    <select
                      className={input}
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                    >
                      <option value="classes">Kelas tertentu</option>
                      <option value="school">Sekolah</option>
                    </select>
                  </label>
                  <input
                    className={input}
                    aria-label="Kelas yang diizinkan"
                    placeholder="IPS 1, IPS 2"
                    value={classes}
                    onChange={(e) => setClasses(e.target.value)}
                  />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {permissions.map((p) => (
                      <label
                        key={p}
                        className="text-xs flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={grants.includes(p)}
                          onChange={(e) =>
                            setGrants((g) =>
                              e.target.checked
                                ? [...g, p]
                                : g.filter((x) => x !== p),
                            )
                          }
                        />
                        {p}
                        {p === "globalChat.moderate"
                          ? " (fondasi tahap berikutnya)"
                          : ""}
                      </label>
                    ))}
                  </div>
                  <button
                    className={button}
                    onClick={() =>
                      request(
                        "Ubah role dan izin",
                        "/admin/accounts/" + target,
                        {
                          action: "permissions",
                          role,
                          permissions: grants,
                          scope,
                          classRooms: classes
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        },
                      )
                    }
                  >
                    Simpan izin
                  </button>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      ["suspended", "Suspend"],
                      ["banned", "Ban"],
                      ["active", "Aktifkan"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        className={button}
                        onClick={() =>
                          request(
                            label + " akun",
                            "/admin/accounts/" + target,
                            { action: "status", status: value },
                          )
                        }
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      className={button}
                      onClick={() =>
                        request(
                          "Cabut seluruh sesi akun",
                          "/admin/accounts/" + target,
                          { action: "revoke" },
                        )
                      }
                    >
                      Cabut sesi
                    </button>
                  </div>
                  <input
                    className={input}
                    type="password"
                    minLength={12}
                    autoComplete="new-password"
                    aria-label="Kata sandi sementara baru"
                    placeholder="Kata sandi sementara baru, minimal 12 karakter"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                  <button
                    disabled={resetPassword.length < 12}
                    className={button}
                    onClick={() =>
                      request(
                        "Reset kredensial dan cabut sesi",
                        "/admin/accounts/" + target,
                        { action: "reset", password: resetPassword },
                      )
                    }
                  >
                    Reset kredensial
                  </button>
                  <p className="text-xs text-slate-500">
                    Sampaikan kata sandi sementara melalui jalur pribadi.
                    Pengguna wajib menggantinya setelah masuk.
                  </p>
                </div>
              )}
            </div>
          </details>
          <details>
            <summary className="font-semibold cursor-pointer">
              Buat akun
            </summary>
            <form
              className="grid sm:grid-cols-2 gap-3 pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                request("Buat akun member", "/admin/accounts", newAccount);
              }}
            >
              {[
                ["username", "Username"],
                ["displayName", "Nama tampilan"],
                ["classRoom", "Kelas"],
              ].map(([key, label]) => (
                <input
                  key={key}
                  className={input}
                  placeholder={label}
                  aria-label={label}
                  required={key !== "classRoom"}
                  value={(newAccount as any)[key]}
                  onChange={(e) =>
                    setNewAccount((v) => ({ ...v, [key]: e.target.value }))
                  }
                />
              ))}
              <select
                className={input}
                aria-label="Jenis profil"
                value={newAccount.profileKind}
                onChange={(e) =>
                  setNewAccount((v) => ({ ...v, profileKind: e.target.value }))
                }
              >
                <option value="student">Siswa</option>
                <option value="teacher">Guru</option>
              </select>
              <input
                className={input}
                required
                minLength={12}
                type="password"
                autoComplete="new-password"
                placeholder="Kata sandi sementara"
                value={newAccount.password}
                onChange={(e) =>
                  setNewAccount((v) => ({ ...v, password: e.target.value }))
                }
              />
              <button className={button}>Buat akun</button>
            </form>
          </details>
        </>
      )}
      {canConfigure && (
        <details>
          <summary className="font-semibold cursor-pointer">
            Konfigurasi dan filter
          </summary>
          <div className="grid sm:grid-cols-2 gap-3 pt-3">
            {[
              "aiEnabled",
              "feedEnabled",
              "storiesEnabled",
              "globalChatEnabled",
              "uploadLock",
              ...(isOwner ? ["readOnly", "maintenance"] : []),
            ].map((k) => (
              <label key={k} className="text-sm flex gap-2">
                <input
                  type="checkbox"
                  checked={settings[k] ?? k.endsWith("Enabled")}
                  onChange={(e) =>
                    setSettings((s: any) => ({ ...s, [k]: e.target.checked }))
                  }
                />
                {k}
              </label>
            ))}
          </div>
          <label className="block text-sm mt-3">
            Kata yang dibatasi, pisahkan koma
            <input
              className={input}
              value={(settings.blockedWords || []).join(", ")}
              onChange={(e) =>
                setSettings((s: any) => ({
                  ...s,
                  blockedWords: e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                }))
              }
            />
          </label>
          <label className="block text-sm mt-3">Jeda kirim chat global (detik)
            <input className={input} type="number" min={0} max={300} value={settings.slowMode||0} onChange={e=>setSettings((s:any)=>({...s,slowMode:Number(e.target.value)}))}/>
          </label>
          <button
            className={button + " mt-3"}
            onClick={() => {
              const { id, ...body } = settings;
              request("Ubah konfigurasi", "/admin/config", body);
            }}
          >
            Simpan konfigurasi
          </button>
        </details>
      )}
      <details>
        <summary className="font-semibold cursor-pointer">
          Moderasi konten dan visibilitas
        </summary>
        <div className="grid sm:grid-cols-2 gap-3 pt-3">
          <select
            className={input}
            value={content.collection}
            onChange={(e) =>
              setContent((v) => ({ ...v, collection: e.target.value }))
            }
          >
            {["posts", "stories", "gallery", "personal_albums"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            className={input}
            placeholder="ID konten"
            value={content.id}
            onChange={(e) => setContent((v) => ({ ...v, id: e.target.value }))}
          />
          <select
            className={input}
            value={content.audience}
            onChange={(e) =>
              setContent((v) => ({ ...v, audience: e.target.value }))
            }
          >
            <option value="members">Anggota</option>
            <option value="public">Publik</option>
          </select>
          <label className="text-sm">
            <input
              type="checkbox"
              checked={content.hidden}
              onChange={(e) =>
                setContent((v) => ({ ...v, hidden: e.target.checked }))
              }
            />{" "}
            Sembunyikan
          </label>
          <button
            className={button}
            disabled={!content.id}
            onClick={() =>
              request("Moderasi konten", "/data/write", {
                collection: content.collection,
                id: content.id,
                operation: "update",
                data: { audience: content.audience, hidden: content.hidden },
              })
            }
          >
            Simpan moderasi
          </button>
          <button
            className={button}
            disabled={!content.id}
            onClick={() =>
              request("Hapus konten", "/data/write", {
                collection: content.collection,
                id: content.id,
                operation: "delete",
              })
            }
          >
            Hapus konten
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          URL CDN lama tetap publik sampai medianya dimigrasikan.
        </p>
      </details>
      {(isOwner||user?.scope==='school'&&user?.permissions?.includes('globalChat.moderate'))&&<details><summary>Moderasi chat global</summary><p className="text-sm">Jeda sementara akun pelanggar. Semua tindakan dicatat.</p><form className="space-y-2" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);request('Jeda akses kirim pesan','/admin/chat/mute',{userId:f.get('userId'),minutes:Number(f.get('minutes')),reason:f.get('reason')});}}><label className="block text-sm">ID akun<input className={input} name="userId" required/></label><label className="block text-sm">Durasi menit (0 untuk melepas)<input className={input} name="minutes" type="number" min={0} max={10080} defaultValue={15} required/></label><label className="block text-sm">Alasan<input className={input} name="reason" minLength={3} maxLength={500} required/></label><button className={button}>Tinjau tindakan</button></form></details>}
      <details>
        <summary className="font-semibold cursor-pointer">
          Laporan konten ({reports.length})
        </summary>
        <p className="text-xs my-2">
          DM hanya ditampilkan jika pesan tersebut disertakan oleh pelapor.
        </p>
        {reports.map((r) => (
          <div key={r.id} className="border-t py-2 text-sm">
            <p>Status: {r.status||'open'}</p>
            {r.status==='open'&&<div className="flex gap-2">{[['resolved','Selesaikan'],['dismissed','Tutup tanpa tindakan']].map(([status,label])=><button key={status} className={button} onClick={()=>{const reason=prompt('Alasan keputusan laporan');if(reason&&reason.trim().length>=3)request(label,'/admin/reports/'+r.id+'/resolve',{status,reason});}}>{label}</button>)}</div>}
            <p>
              {r.collection} — {r.reason}
            </p>
            <p className="whitespace-pre-wrap">
              {r.selectedContent?.content ||
                r.selectedContent?.caption ||
                r.selectedContent?.title}
            </p>
          </div>
        ))}
        {reportCursor && (
          <button
            className={button}
            disabled={busy}
            onClick={() => loadMore("reports")}
          >
            Muat laporan berikutnya
          </button>
        )}
      </details>
      <details>
        <summary className="font-semibold cursor-pointer">
          Audit log ({logs.length})
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Aksi</th>
                <th>Aktor</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {logs
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.createdAt).toLocaleString("id-ID")}</td>
                    <td>{l.action}</td>
                    <td className="break-all">{l.actor}</td>
                    <td className="break-all">{l.target}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {logCursor && (
          <button
            className={button}
            disabled={busy}
            onClick={() => loadMore("audit")}
          >
            Muat audit berikutnya
          </button>
        )}
      </details>
      <button className={button} onClick={refresh}>
        Muat ulang status
      </button>
      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi keamanan"
          className="fixed inset-0 z-[100] bg-black/60 p-4 flex items-center justify-center"
        >
          <form
            onSubmit={execute}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4"
          >
            <h3 className="font-bold">{pending.label}</h3>
            <p className="text-sm">
              Tindakan ini dicatat. Konfirmasi dengan kata sandi akun Anda.
            </p>
            <input
              className={input}
              type="password"
              autoComplete="current-password"
              aria-label="Konfirmasi kata sandi"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            {status && (
              <p role="alert" className="text-sm">
                {status}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className={button}
                disabled={busy}
                onClick={() => {
                  setPending(null);
                  setConfirmation("");
                }}
              >
                Batal
              </button>
              <button className={button} disabled={busy}>
                Konfirmasi tindakan
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
