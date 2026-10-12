import React, { useState, useEffect, useRef } from "react";
import { api, acceptSession } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { IDCardCanvas } from "./IDCardCanvas";
export default function AccountSecurity() {
  const { user, currentStudent } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]),
    [password, setPassword] = useState(""),
    [nextPassword, setNext] = useState(""),
    [message, setMessage] = useState(""),
    [payload, setPayload] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const preview = useRef<HTMLDivElement>(null);
  const refresh = async () => {
    try {
      setSessions((await api("/auth/sessions")).items);
    } catch (e: any) {
      setMessage(e.message);
    }
  };
  useEffect(() => {
    void refresh();
  }, [user?.uid]);
  useEffect(() => {
    if (!payload) return;
    const timer = setTimeout(() => setPayload(null), 60000);
    return () => clearTimeout(timer);
  }, [payload]);
  if (!user) return null;
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setPassword("");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3"
      aria-label="Keamanan akun"
    >
      <h3 className="font-bold">Keamanan Akun</h3>
      {user.mustChangePassword && (
        <p role="alert" className="text-amber-700 text-sm">
          Ganti kata sandi sementara sebelum mengubah data atau mengunggah
          konten.
        </p>
      )}
      <p className="text-xs">
        Kata sandi kartu QR bersifat pribadi. Simpan kartu di perangkat Anda.
      </p>
      <input
        className="w-full p-2 rounded-lg border dark:bg-slate-900"
        aria-label="Kata sandi saat ini"
        type="password"
        placeholder="Kata sandi saat ini"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        className="w-full p-2 rounded-lg border dark:bg-slate-900"
        aria-label="Kata sandi baru"
        type="password"
        minLength={12}
        placeholder="Kata sandi baru, minimal 12 karakter"
        autoComplete="new-password"
        value={nextPassword}
        onChange={(e) => setNext(e.target.value)}
      />
      <div className="flex gap-2 flex-wrap">
        <button
          className="p-2 bg-slate-800 text-white rounded-lg text-xs"
          disabled={busy || nextPassword.length < 12 || !password}
          onClick={() =>
            run(async () => {
              await api("/auth/reauth", { password });
              await api("/auth/password", { password: nextPassword });
              setNext("");
              acceptSession({ user: null, profile: null, csrfToken: null });
              window.location.assign("/login");
            })
          }
        >
          Ganti kata sandi dan cabut semua sesi
        </button>
        <button
          className="p-2 bg-slate-800 text-white rounded-lg text-xs"
          disabled={busy || !password || user.mustChangePassword}
          onClick={() =>
            run(async () => {
              await api("/auth/reauth", { password });
              setPayload(JSON.stringify({ username: user.username, password }));
            })
          }
        >
          Buat kartu login pribadi
        </button>
      </div>
      {payload && (
        <div ref={preview} className="space-y-2">
          <IDCardCanvas
            student={
              currentStudent || { name: user.displayName, id: user.profileId }
            }
            loginPayload={payload}
          />
          <button
            className="p-2 rounded-lg bg-emerald-700 text-white text-xs"
            onClick={() => {
              const canvas = preview.current?.querySelector("canvas");
              if (!canvas) return;
              try {
                const a = document.createElement("a");
                a.download = "kartu-login-pribadi.png";
                a.href = canvas.toDataURL("image/png");
                a.click();
                setPayload(null);
              } catch {
                setMessage(
                  "Kartu belum dapat diunduh. Coba tanpa foto eksternal.",
                );
              }
            }}
          >
            Unduh kartu pribadi
          </button>
          <p className="text-xs">
            Pratinjau dihapus otomatis setelah 60 detik.
          </p>
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-sm font-semibold">
          Sesi aktif ({sessions.length})
        </summary>
        {sessions.map((s) => (
          <div key={s.id} className="py-2 text-xs flex justify-between gap-2">
            <span>
              {s.current ? "Sesi ini" : "Sesi lain"} —{" "}
              {new Date(s.createdAt).toLocaleString("id-ID")}
            </span>
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await api("/auth/sessions/revoke", { id: s.id });
                  if (s.current) {
                    acceptSession({
                      user: null,
                      profile: null,
                      csrfToken: null,
                    });
                  } else await refresh();
                })
              }
            >
              Cabut sesi
            </button>
          </div>
        ))}
      </details>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
