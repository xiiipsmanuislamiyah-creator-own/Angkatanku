import React, { useEffect, useState, useRef } from "react";
import { BookOpen, Plus, ArrowUpRight } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { mayModerate, timeLabel } from "../../lib/community";
import Modal from "../../components/ui/Modal";
export default function MemoryPanel() {
  const { user } = useAuth(),
    [items, setItems] = useState<any[]>([]),
    [mode, setMode] = useState("approved"),
    [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [category, setCategory] = useState("cerita"),
    [factType, setFactType] = useState("personal_story"),
    [audience, setAudience] = useState("members"),
    [consent, setConsent] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null),
    [classRoom, setClassRoom] = useState(user?.classRooms?.[0] || "");
  const [review, setReview] = useState<any>(null),
    [reason, setReason] = useState(""),
    [password, setPassword] = useState("");
  const requestId = useRef(crypto.randomUUID());
  const canReview =
    user?.role === "owner" ||
    (user?.role === "admin" && user?.permissions?.includes("memory.review"));
  const load = () =>
    api("/memory?mode=" + mode)
      .then((r) => {
        setItems(r.items);
        setCursor(r.next);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (user) load();
  }, [mode, user?.uid]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/memory", {
        title,
        body,
        category,
        factType,
        audience,
        classRoom,
        consent,
        requestId: requestId.current,
      });
      setOpen(false);
      setTitle("");
      setBody("");
      setConsent(false);
      requestId.current = crypto.randomUUID();
      setMode("mine");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const moderate = async (status: string) => {
    setBusy(true);
    try {
      await api("/auth/reauth", { password });
      await api("/memory/" + review.id + "/review", {
        status,
        reason,
        version: review.version,
      });
      setReview(null);
      setPassword("");
      setReason("");
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!user)
    return (
      <p className="ak-note">
        Masuk untuk membaca dan mengusulkan kenangan angkatan.
      </p>
    );
  return (
    <section className="ak-memory">
      <div className="ak-section-heading">
        <div>
          <p className="ak-eyebrow">NUSA MEMORY</p>
          <h2>Cerita yang kita simpan.</h2>
        </div>
        <button className="ak-button secondary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Kontribusi cerita
        </button>
      </div>
      <div className="ak-tabs">
        {[
          ["approved", "Disetujui"],
          ["mine", "Usulan saya"],
          ...(canReview ? [["review", "Tinjau usulan"]] : []),
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={mode === key}
            onClick={() => setMode(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="ak-error">
          {error}
        </p>
      )}
      {items.length === 0 ? (
        <div className="ak-empty">
          <BookOpen size={26} />
          <h3>Kenangan dimulai dari cerita.</h3>
          <p>
            Belum ada catatan di bagian ini. Usulan akan ditinjau sebelum
            digunakan Nusa.
          </p>
        </div>
      ) : (
        items.map((item) => (
          <article
            key={item.id}
            id={"memory-" + item.id}
            className="ak-memory-entry"
          >
            <div className="ak-row">
              <span className="ak-tag">
                {item.factType === "joke"
                  ? "Humor"
                  : item.factType === "fact"
                    ? "Fakta"
                    : item.factType === "opinion"
                      ? "Opini"
                      : "Cerita pribadi"}
              </span>
              <small>
                {timeLabel(item.updatedAt)} · {item.reviewStatus}
              </small>
            </div>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            {item.reviewReason && (
              <p className="ak-note">Catatan pengelola: {item.reviewReason}</p>
            )}
            {canReview && mayModerate(user, "memory.review", item) && (
              <button className="ak-link" onClick={() => setReview(item)}>
                Tinjau catatan →
              </button>
            )}
            {item.reviewStatus === "approved" && (
              <button
                className="ak-link"
                onClick={async () => {
                  const reason = prompt("Tuliskan koreksi untuk catatan ini.");
                  if (!reason) return;
                  try {
                    await api("/memory/" + item.id + "/correction", { reason });
                    setError("Usulan koreksi diterima.");
                  } catch (e: any) {
                    setError(e.message);
                  }
                }}
              >
                Usulkan koreksi
              </button>
            )}
          </article>
        ))
      )}
      {cursor && (
        <button
          className="ak-button secondary"
          onClick={async () => {
            try {
              const r = await api("/memory?mode=" + mode + "&after=" + cursor);
              setItems((old) => [...old, ...r.items]);
              setCursor(r.next);
            } catch (e: any) {
              setError(e.message);
            }
          }}
        >
          Muat catatan berikutnya
        </button>
      )}
      {open && (
        <Modal
          title="Kontribusi cerita angkatan"
          onClose={() => setOpen(false)}
        >
          <form onSubmit={submit} className="ak-stack">
            <label className="ak-field">
              Judul
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
                maxLength={120}
              />
            </label>
            <label className="ak-field">
              Cerita
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                minLength={10}
                maxLength={4000}
                required
              />
            </label>
            <div className="ak-row">
              <label className="ak-field">
                Kategori
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {[
                    "cerita",
                    "fakta sekolah",
                    "kegiatan",
                    "jokes",
                    "meme",
                    "istilah",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="ak-field">
                Jenis informasi
                <select
                  value={factType}
                  onChange={(e) => setFactType(e.target.value)}
                >
                  <option value="personal_story">Cerita pribadi</option>
                  <option value="fact">Fakta dengan sumber</option>
                  <option value="joke">Humor / lelucon</option>
                  <option value="opinion">Opini</option>
                </select>
              </label>
              <label className="ak-field">
                Audience
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                >
                  <option value="members">Anggota</option>
                  <option value="public">Publik</option>
                  <option value="restricted">Kelas</option>
                </select>
              </label>
              <label className="ak-field">
                Kelas terkait
                <select
                  value={classRoom}
                  onChange={(e) => setClassRoom(e.target.value)}
                >
                  {user.role === "owner" && <option value="">Sekolah</option>}
                  {(user.role === "owner"
                    ? ["IPS 1", "IPS 2"]
                    : user.classRooms || []
                  ).map((c: string) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="ak-row">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              Saya memiliki izin membagikan cerita ini dan menyetujui
              penggunaannya oleh Nusa.
            </label>
            <p className="ak-muted">
              Hindari rahasia pribadi, rumor, atau cerita yang merendahkan orang
              lain.
            </p>
            <button className="ak-button" disabled={busy}>
              {busy ? "Mengirim…" : "Kirim untuk ditinjau"}
            </button>
            {error && (
              <p className="ak-error" role="alert">
                {error}
              </p>
            )}
          </form>
        </Modal>
      )}
      {review && (
        <Modal
          title="Tinjau Nusa Memory"
          onClose={() => {
            setReview(null);
            setPassword("");
          }}
        >
          <div className="ak-stack">
            <h3>{review.title}</h3>
            <p>{review.body}</p>
            <label className="ak-field">
              Alasan keputusan
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
              />
            </label>
            <label className="ak-field">
              Konfirmasi kata sandi
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <div className="ak-row">
              {[
                ["approved", "Setujui"],
                ["rejected", "Tolak"],
                ["withdrawn", "Tarik dari Nusa"],
              ].map(([status, label]) => (
                <button
                  key={status}
                  className="ak-button secondary"
                  disabled={busy || reason.length < 3 || !password}
                  onClick={() => moderate(status)}
                >
                  {label}
                </button>
              ))}
            </div>
            {error && <p className="ak-error">{error}</p>}
          </div>
        </Modal>
      )}
    </section>
  );
}
