import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Users,
  Search,
  Plus,
  MoreHorizontal,
  CheckCheck,
  Pin,
  Settings,
  Shield,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { timeWib, timeLabel, mayModerate } from "../lib/community";
import Modal from "../components/ui/Modal";
export default function ChatHub() {
  const { user, loading } = useAuth(),
    [rooms, setRooms] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [messages, setMessages] = useState<any[]>([]),
    [contacts, setContacts] = useState<any[] | null>(null),
    [contactsNext, setContactsNext] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    [text, setText] = useState(""),
    [reply, setReply] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [next, setNext] = useState<string | null>(null),
    [peer, setPeer] = useState<any>({}),
    [preferences, setPreferences] = useState<any>({}),
    [settings, setSettings] = useState(false),
    [slowMode, setSlowMode] = useState(0),
    [enabled, setEnabled] = useState(true);
  const [action, setAction] = useState<{ message: any; type: string } | null>(
      null,
    ),
    [reason, setReason] = useState(""),
    [password, setPassword] = useState(""),
    [menu, setMenu] = useState<string | null>(null),
    [find, setFind] = useState("");
  const [older,setOlder]=useState(false);
  const historyMode=useRef(false),revision=useRef<number|null>(null);
  const requestId = useRef(crypto.randomUUID()),
    list = useRef<HTMLDivElement>(null),
    nearBottom = useRef(true),
    typingAt = useRef(0),
    roomRef = useRef<string | null>(null),
    readAt = useRef(0);
  const loadRooms = async () => {
    const r = await api("/chat/rooms");
    setRooms(r.items);
    setPreferences(r.preferences);
    setSlowMode(r.slowMode);
    setEnabled(r.enabled);
  };
  const choose = (r: any) => {
    setSelected(r);revision.current=null;setOlder(false);historyMode.current=false;
    roomRef.current = r?.id || null;
    setMessages([]);
    setNext(null);
    setFind("");
    setReply(null);
    setError("");
    setText(
      r
        ? sessionStorage.getItem("angkatan-draft:" + user.uid + ":" + r.id) ||
            ""
        : "",
    );
    requestId.current = crypto.randomUUID();
    nearBottom.current = true;
    readAt.current = 0;
  };
  useEffect(() => {
    if (!user) return;
    let live = true;
    const tick = async () => {
      try {
        if (live && !document.hidden) await loadRooms();
      } catch (e: any) {
        if (live) setError(e.message);
      }
    };
    tick();
    const timer = setInterval(tick, 15000);
    const to = new URLSearchParams(location.search).get("to");
    if (to) start(to);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [user?.uid]);
  useEffect(() => {
    if (!user || !selected) return;
    let live = true;
    const id = selected.id;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const r = await api("/chat/" + id + "/messages"+(revision.current===null?"":"?revision="+revision.current));
        if (!live || roomRef.current !== id) return;
        revision.current=r.room.revision||0;
        setPeer(r.peerState||{});if(r.unchanged)return;
        setMessages((old) => historyMode.current?old.map(m=>r.items.find((x:any)=>x.id===m.id)||m):
          [...new Map([...old, ...r.items].map((m) => [m.id, m])).values()]
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-200),
        );
        setNext((old) => old || r.next);
        setPeer(r.peerState || {});
        setSelected((old: any) =>
          old?.id === id ? { ...old, ...r.room } : old,
        );
        const last = r.items.at(-1)?.createdAt || 0;
        if (last > readAt.current && nearBottom.current) {
          readAt.current = last;
          await api("/chat/" + id + "/read", {});
        }
        if (nearBottom.current)
          requestAnimationFrame(() =>
            list.current?.scrollTo({ top: list.current.scrollHeight }),
          );
      } catch (e: any) {
        if (live) setError(e.message);
      }
    };
    tick();
    const timer = setInterval(tick, 3000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [selected?.id, user?.uid]);
  async function start(uid: string) {
    try {
      const r = await api("/chat/dm", { userId: uid });
      const all = await api("/chat/rooms");
      setRooms(all.items);
      choose(all.items.find((x: any) => x.id === r.id));
      setContacts(null);
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy || !selected) return;
    setBusy(true);
    setError("");
    const id = selected.id;
    try {
      await api("/chat/" + id + "/messages", {
        content: text,
        requestId: requestId.current,
        replyTo: reply?.id,
      });
      requestId.current = crypto.randomUUID();
      setText("");
      sessionStorage.removeItem("angkatan-draft:" + user.uid + ":" + id);
      setReply(null);
      const r = await api("/chat/" + id + "/messages");
      if (roomRef.current === id) {
        setMessages(r.items);
        setNext(r.next);
        nearBottom.current = true;
        requestAnimationFrame(() =>
          list.current?.scrollTo({ top: list.current.scrollHeight }),
        );
      }
      loadRooms().catch(() => {});
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadOlder() {
    if (!next || !selected) return;
    setOlder(true);historyMode.current=true;nearBottom.current=false;
    try {
      const r = await api(
        "/chat/" + selected.id + "/messages?before=" + encodeURIComponent(next),
      );
      setMessages((old) =>
        [...new Map([...r.items, ...old].map((m) => [m.id, m])).values()].slice(
          0,200,
        ),
      );
      setNext(r.next);
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function changePreference(data: any) {
    try {
      await api("/chat/preferences", data);
      await loadRooms();
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function perform() {
    if (!action) return;
    setBusy(true);
    try {
      if (
        action.type === "pin" ||
        (action.type === "delete" && action.message.senderId !== user.uid)
      )
        await api("/auth/reauth", { password });
      await api("/chat/" + selected.id + "/action", {
        messageId: action.message.id,
        action: action.type,
        reason,
      });
      setAction(null);
      setPassword("");
      setReason("");
      const r = await api("/chat/" + selected.id + "/messages");
      setMessages(r.items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p className="ak-loading">Memeriksa sesi…</p>;
  if (!user)
    return (
      <div className="ak-empty">
        <MessageCircle size={36} />
        <h1>Percakapan untuk angkatanmu.</h1>
        <p>
          Masuk dengan kartu AngkatanKU untuk membuka ruang siswa, guru, dan
          pesan pribadi.
        </p>
        <a href="/login" className="ak-button">
          Masuk dengan kartu
        </a>
      </div>
    );
  const blocked =
      selected?.peer && preferences.blocked?.includes(selected.peer),
    canMod =
      selected?.kind !== "dm" && mayModerate(user, "globalChat.moderate");
  return (
    <section className="ak-chat-page">
      <header className="ak-page-heading">
        <div>
          <p className="ak-eyebrow">KOMUNITAS ANGKATANKU</p>
          <h1>Tetap dekat.</h1>
          <p>Nomor boleh berganti. Ruang kita tetap di sini.</p>
        </div>
        <button
          className="ak-button secondary"
          onClick={() => setSettings(true)}
        >
          <Settings size={18} />
          Privasi pesan
        </button>
      </header>
      <div className={"ak-chat " + (selected ? "has-selection" : "")}>
        <aside className="ak-chat-list">
          <div className="ak-row">
            <h2>Percakapan</h2>
            <button
              className="ak-icon ak-push-right"
              aria-label="Percakapan baru"
              onClick={async () => {
                try {
                  const r = await api("/chat/contacts");
                  setContacts(r.items);
                  setContactsNext(r.next);
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              <Plus />
            </button>
          </div>
          <label className="ak-search">
            <Search size={18} />
            <input
              aria-label="Cari percakapan"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari percakapan…"
            />
          </label>
          <p className="ak-eyebrow">RUANG ANGKATAN</p>
          {rooms
            .filter((r) => r.kind !== "dm")
            .map((r) => (
              <button
                key={r.id}
                className={"ak-room " + (selected?.id === r.id ? "active" : "")}
                onClick={() => choose(r)}
              >
                <span className="ak-avatar">
                  <Users size={20} />
                </span>
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    {r.kind === "students"
                      ? "Siswa & alumni"
                      : "Siswa, alumni & guru"}
                  </small>
                </span>
                {r.unread && <i aria-label="Pesan baru" />}
              </button>
            ))}
          <p className="ak-eyebrow">PESAN PRIBADI</p>
          {rooms
            .filter(
              (r) =>
                r.kind === "dm" &&
                r.title?.toLowerCase().includes(search.toLowerCase()),
            )
            .sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0))
            .map((r) => (
              <button
                key={r.id}
                className={"ak-room " + (selected?.id === r.id ? "active" : "")}
                onClick={() => choose(r)}
              >
                <span className="ak-avatar">{r.title?.slice(0, 1)}</span>
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    {preferences.muted?.includes(r.peer)
                      ? "Dibisukan"
                      : timeLabel(r.lastAt) || "Mulai menyapa"}
                  </small>
                </span>
                {r.unread && !preferences.muted?.includes(r.peer) && (
                  <i aria-label="Pesan baru" />
                )}
              </button>
            ))}
          {!rooms.some((r) => r.kind === "dm") && (
            <p className="ak-muted">
              Belum ada pesan pribadi. Pilih + untuk menyapa teman.
            </p>
          )}
          <a href="/inbox" className="ak-link">
            Notifikasi & pesan terdahulu →
          </a>
        </aside>
        <div className="ak-chat-main">
          {!selected ? (
            <div className="ak-empty">
              <MessageCircle size={38} />
              <h2>Sapaan kecil, hubungan panjang.</h2>
              <p>Pilih ruang atau mulai percakapan pribadi.</p>
            </div>
          ) : (
            <>
              <header className="ak-chat-header">
                <button
                  className="ak-icon"
                  aria-label="Kembali ke daftar chat"
                  onClick={() => choose(null)}
                >
                  <ArrowLeft size={21} />
                </button>
                <div>
                  <strong>{selected.title}</strong>
                  <small>
                    {peer.typing
                      ? "Sedang mengetik…"
                      : selected.kind === "dm"
                        ? "Hanya peserta percakapan"
                        : slowMode
                          ? `Jeda kirim ${slowMode} detik`
                          : "Ruang anggota · teks & emoji"}
                  </small>
                </div>
                {selected.peer && (
                  <a
                    className="ak-link ak-push-right"
                    href={"/siswa/" + selected.profileId}
                  >
                    Profil
                  </a>
                )}
              </header>
              {older&&<button className="ak-link" onClick={async()=>{const r=await api('/chat/'+selected.id+'/messages');setMessages(r.items);setNext(r.next);historyMode.current=false;setOlder(false);nearBottom.current=true;}}>Kembali ke pesan terbaru</button>}
        {selected.pinnedMessageId && (
                <div className="ak-chat-pin">
                  <Pin size={16} />
                  {messages.find((m) => m.id === selected.pinnedMessageId)
                    ?.content || "Ada pesan disematkan di riwayat."}
                </div>
              )}
              <label className="ak-search">
                <Search size={16} />
                <input
                  value={find}
                  onChange={(e) => setFind(e.target.value)}
                  placeholder="Cari di pesan yang dimuat"
                  aria-label="Cari dalam percakapan"
                />
              </label>
              <div
                ref={list}
                className="ak-messages"
                onScroll={() => {
                  if (list.current)
                    nearBottom.current =
                      list.current.scrollHeight -
                        list.current.scrollTop -
                        list.current.clientHeight <
                      100;
                }}
              >
                {next && (
                  <button className="ak-link" onClick={loadOlder}>
                    Muat pesan sebelumnya
                  </button>
                )}
                {messages
                  .filter(
                    (m) =>
                      !find ||
                      m.content.toLowerCase().includes(find.toLowerCase()),
                  )
                  .map((m, i) => {
                    const mine = m.senderId === user.uid,
                      prev = messages[i - 1],
                      day = new Date(m.createdAt).toLocaleDateString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        day: "numeric",
                        month: "long",
                      });
                    return (
                      <React.Fragment key={m.id}>
                        {(!prev ||
                          new Date(prev.createdAt).toDateString() !==
                            new Date(m.createdAt).toDateString()) && (
                          <p className="ak-chat-date">{day}</p>
                        )}
                        <div className={"ak-message " + (mine ? "mine" : "")}>
                          <div className="ak-row">
                            <a href={"/siswa/" + m.profileId}>
                              <strong>{mine ? "Anda" : m.senderName}</strong>
                            </a>
                            <button
                              className="ak-icon"
                              aria-label="Opsi pesan"
                              onClick={() =>
                                setMenu(menu === m.id ? null : m.id)
                              }
                            >
                              <MoreHorizontal size={16} />
                            </button>
                          </div>
                          {m.replyTo && (
                            <blockquote>
                              {messages.find((x) => x.id === m.replyTo)
                                ?.content || "Balasan untuk pesan sebelumnya"}
                            </blockquote>
                          )}
                          <p>
                            {m.deleted
                              ? m.deletedByModerator
                                ? "Pesan dihapus oleh moderator"
                                : "Pesan ditarik"
                              : m.content}
                          </p>
                          <small>
                            {timeWib(m.createdAt)}{" "}
                            {mine && (
                              <CheckCheck
                                size={14}
                                className={
                                  peer.readAt >= m.createdAt ? "read" : ""
                                }
                              />
                            )}
                          </small>
                          {menu === m.id && (
                            <div className="ak-message-menu">
                              {!m.deleted && (
                                <>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard
                                        .writeText(m.content)
                                        .catch(() =>
                                          setError(
                                            "Tidak dapat menyalin pesan.",
                                          ),
                                        );
                                      setMenu(null);
                                    }}
                                  >
                                    Salin
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReply(m);
                                      setMenu(null);
                                    }}
                                  >
                                    Balas
                                  </button>
                                </>
                              )}
                              {[
                                "hide",
                                "report",
                                ...(mine || canMod ? ["delete"] : []),
                                ...(canMod ? ["pin"] : []),
                              ].map((type) => (
                                <button
                                  key={type}
                                  onClick={() => {
                                    setAction({ message: m, type });
                                    setMenu(null);
                                  }}
                                >
                                  {
                                    {
                                      hide: "Sembunyikan untuk saya",
                                      report: "Laporkan",
                                      delete: mine
                                        ? "Tarik pesan"
                                        : "Hapus pesan",
                                      pin: "Sematkan",
                                    }[type]
                                  }
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                {messages.length === 0 && (
                  <p className="ak-muted">
                    Belum ada pesan. Mulai dengan sapaan.
                  </p>
                )}
              </div>
              {error && (
                <p className="ak-error" role="alert">
                  {error} <button onClick={() => setError("")}>Tutup</button>
                </p>
              )}
              {reply && (
                <div className="ak-chat-pin">
                  <span>
                    Membalas {reply.senderName}: {reply.content.slice(0, 80)}
                  </span>
                  <button className="ak-link" onClick={() => setReply(null)}>
                    Batal
                  </button>
                </div>
              )}
              {blocked ? (
                <p className="ak-note">
                  Akun ini Anda blokir.{" "}
                  <button
                    className="ak-link"
                    onClick={() =>
                      changePreference({
                        userId: selected.peer,
                        blocked: false,
                      })
                    }
                  >
                    Buka blokir
                  </button>
                </p>
              ) : selected.kind !== "dm" && !enabled ? (
                <p className="ak-note">
                  Ruang global sementara ditutup oleh pengelola.
                </p>
              ) : (
                <form className="ak-chat-compose" onSubmit={send}>
                  <textarea
                    aria-label="Pesan"
                    value={text}
                    maxLength={2000}
                    rows={1}
                    placeholder="Tulis pesan…"
                    onChange={(e) => {
                      setText(e.target.value);
                      sessionStorage.setItem(
                        "angkatan-draft:" + user.uid + ":" + selected.id,
                        e.target.value,
                      );
                      if (Date.now() - typingAt.current > 10000) {
                        typingAt.current = Date.now();
                        api("/chat/" + selected.id + "/read", {
                          typing: true,
                        }).catch(() => {});
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(e);
                      }
                    }}
                  />
                  <button
                    className="ak-button"
                    disabled={busy || !text.trim()}
                    aria-label="Kirim pesan"
                  >
                    <Send size={20} />
                    <span>
                      {busy ? "Mengirim…" : error ? "Coba lagi" : "Kirim"}
                    </span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      {!selected && error && (
        <p role="alert" className="ak-error">
          {error}
        </p>
      )}
      {contacts && (
        <Modal title="Mulai percakapan" onClose={() => setContacts(null)}>
          <label className="ak-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa atau guru"
            />
          </label>
          <div className="ak-contact-list">
            {contacts
              .filter((c) =>
                c.name.toLowerCase().includes(search.toLowerCase()),
              )
              .map((c) => (
                <button
                  className="ak-room"
                  key={c.id}
                  onClick={() => start(c.id)}
                >
                  <span className="ak-avatar">{c.name[0]}</span>
                  <span>
                    <strong>{c.name}</strong>
                    <small>{c.kind === "teacher" ? "Guru" : c.classRoom}</small>
                  </span>
                </button>
              ))}
          </div>
          {contactsNext && (
            <button
              className="ak-link"
              onClick={async () => {
                const r = await api("/chat/contacts?after=" + contactsNext);
                setContacts((old) => [...(old || []), ...r.items]);
                setContactsNext(r.next);
              }}
            >
              Muat kontak berikutnya
            </button>
          )}
        </Modal>
      )}
      {settings && (
        <Modal title="Privasi percakapan" onClose={() => setSettings(false)}>
          <div className="ak-stack">
            <label className="ak-row">
              <input
                type="checkbox"
                checked={preferences.receipts !== false}
                onChange={(e) =>
                  changePreference({ receipts: e.target.checked })
                }
              />
              Bagikan tanda sudah dibaca
            </label>
            {selected?.peer && (
              <>
                <button
                  className="ak-button secondary"
                  onClick={() =>
                    changePreference({
                      userId: selected.peer,
                      blocked: !preferences.blocked?.includes(selected.peer),
                    })
                  }
                >
                  {preferences.blocked?.includes(selected.peer)
                    ? "Buka blokir"
                    : "Blokir"}{" "}
                  {selected.title}
                </button>
                <button
                  className="ak-button secondary"
                  onClick={() =>
                    changePreference({
                      userId: selected.peer,
                      muted: !preferences.muted?.includes(selected.peer),
                    })
                  }
                >
                  {preferences.muted?.includes(selected.peer)
                    ? "Aktifkan tanda pesan baru"
                    : "Bisukan percakapan"}
                </button>
              </>
            )}
            <p className="ak-muted">
              Pesan pribadi hanya dapat dibaca peserta. Jika dilaporkan,
              pengelola menerima pesan yang dipilih saja.
            </p>
          </div>
        </Modal>
      )}
      {action && (
        <Modal
          title="Konfirmasi tindakan pesan"
          onClose={() => {
            setAction(null);
            setPassword("");
          }}
        >
          <div className="ak-stack">
            <p>
              {action.type === "report"
                ? "Pesan terpilih akan dikirim kepada moderator. Pesan lain tetap privat."
                : "Tindakan ini hanya berlaku pada pesan yang dipilih."}
            </p>
            {["report", "pin"].includes(action.type) ||
            (action.message.senderId !== user.uid &&
              action.type === "delete") ? (
              <label className="ak-field">
                Alasan
                <textarea
                  minLength={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            ) : null}
            {action.type === "pin" ||
            (action.type === "delete" &&
              action.message.senderId !== user.uid) ? (
              <label className="ak-field">
                Kata sandi pengelola
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
            ) : null}
            <button className="ak-button" disabled={busy} onClick={perform}>
              Konfirmasi
            </button>
            {error && <p className="ak-error">{error}</p>}
          </div>
        </Modal>
      )}
    </section>
  );
}
