import React, { useEffect, useState, useRef } from "react";
import {
  Plus,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  ArrowUpRight,
  Users,
  Pin,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import {
  records,
  ordered,
  likePost,
  saveContent,
  deleteContent,
  shareContent,
  timeLabel,
  mayModerate,
  type Content,
} from "../lib/community";
import StoryRings from "../components/StoryRings";
import Composer from "../features/social/Composer";
import Modal from "../components/ui/Modal";
import MediaCarousel from "../components/MediaCarousel";
import FullscreenPreview from "../components/FullscreenPreview";

export default function FeedAngkatan() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Content[]>([]),
    [state, setState] = useState<Record<string, any>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("Semua"),
    [count, setCount] = useState(12),
    [composer, setComposer] = useState<Content | true | null>(null),
    [preview, setPreview] = useState<any>(null);
  const [comments, setComments] = useState<string | null>(null),
    [reply, setReply] = useState<string | null>(null),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<string | null>(null),
    [action, setAction] = useState<{ post: Content; type: string } | null>(
      null,
    ),
    [reason, setReason] = useState(""),
    [password, setPassword] = useState("");
  const inFlight = useRef(new Set<string>());
  const load = async () => {
    try {
      setError("");
      const data =
        filter === "Tersimpan"
          ? (await api("/social/saved")).items
          : await records("posts");
      setPosts(ordered(data));
      const r = await api("/social/state", {
        ids: data.slice(0, 50).map((p: any) => p.id),
      });
      setState(Object.fromEntries(r.items.map((s: any) => [s.id, s])));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [user?.uid, filter]);
  useEffect(() => {
    const target = new URLSearchParams(location.search).get("post");
    if (!target) return;
    api("/data/query", { collection: "posts", id: target })
      .then((r) => {
        if (r.items?.[0]) {
          setPosts((old) => [
            r.items[0],
            ...old.filter((p) => p.id !== target),
          ]);
          setTimeout(
            () =>
              document
                .getElementById("post-" + target)
                ?.scrollIntoView({ block: "start" }),
            200,
          );
        } else setNotice("Postingan tidak tersedia untuk akses Anda.");
      })
      .catch(() => {});
  }, []);
  const requireLogin = () =>
    setNotice("Masuk dengan kartu AngkatanKU untuk berinteraksi.");
  async function like(p: Content) {
    if (inFlight.current.has(p.id)) return;
    inFlight.current.add(p.id);
    try {
      const next = await likePost(p.id, !state[p.id]?.liked);
      setState((old) => ({
        ...old,
        [p.id]: { ...old[p.id], liked: next.liked },
      }));
      setPosts((old) =>
        old.map((x) =>
          x.id === p.id ? { ...x, likes_count: next.likes_count } : x,
        ),
      );
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      inFlight.current.delete(p.id);
    }
  }
  async function bookmark(p: Content) {
    if (!user) {
      requireLogin();
      return;
    }
    try {
      const saved = !state[p.id]?.saved;
      await api("/social/bookmark", { id: p.id, active: saved });
      setState((old) => ({ ...old, [p.id]: { ...old[p.id], saved } }));
    } catch (e: any) {
      setNotice(e.message);
    }
  }
  const activePost = posts.find((p) => p.id === comments);
  async function comment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      requireLogin();
      return;
    }
    if (!text.trim() || busy || !activePost) return;
    setBusy(true);
    try {
      const r = await api("/interactions", {
        collection: "posts",
        id: activePost.id,
        action: "comment",
        content: text,
        parentId: reply,
      });
      setPosts((old) =>
        old.map((p) =>
          p.id === activePost.id
            ? { ...p, comments: [...(p.comments || []), r.comment] }
            : p,
        ),
      );
      setText("");
      setReply(null);
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  function commentActions(c: any) {
    return user && !c.deleted ? (
      <span className="ak-row">
        {(c.user_id === user.uid ||
          mayModerate(user, "feed.moderate", activePost)) && (
          <button
            className="ak-link"
            onClick={() => {
              setComments(null);
              setAction({
                post: activePost!,
                type: "deleteComment",
                commentId: c.id,
              } as any);
            }}
          >
            Hapus komentar
          </button>
        )}
        <button
          className="ak-link"
          onClick={() => {
            setComments(null);
            setAction({ post: activePost!, type: "report" });
            setReason("Komentar " + c.id + ": ");
          }}
        >
          Laporkan
        </button>
      </span>
    ) : null;
  }
  async function applyAction() {
    if (!action) return;
    setBusy(true);
    try {
      const { post, type } = action;
      if (type === "report")
        await api("/reports", { collection: "posts", id: post.id, reason });
      else {
        if (
          type === "deleteComment"
            ? post.comments?.find(
                (c: any) => c.id === (action as any).commentId,
              )?.user_id !== user?.uid
            : post.ownerId !== user?.uid
        )
          await api("/auth/reauth", { password });
        if (type === "deleteComment") {
          await api("/interactions", {
            collection: "posts",
            id: post.id,
            action: "deleteComment",
            commentId: (action as any).commentId,
          });
          setComments(post.id);
        } else if (type === "delete") await deleteContent("posts", post.id);
        else await saveContent("posts", post.id, { [type]: !post[type] }, post);
      }
      setAction(null);
      setPassword("");
      setReason("");
      setNotice(
        action.type === "report" ? "Laporan diterima." : "Perubahan disimpan.",
      );
      await load();
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  const share = (post: Content) =>
    shareContent("posts", post.id)
      .then(() => setNotice("Tautan siap dibagikan."))
      .catch(() => {});
  const author = new URLSearchParams(location.search).get("author");
  const list = posts
    .filter(
      (p) => !author || [p.ownerId, p.profileId, p.authorId].includes(author),
    )
    .filter((p) =>
      filter === "Official"
        ? p.isOfficial
        : filter === "IPS 1" || filter === "IPS 2"
          ? p.classRoom === filter
          : !p.hidden || mayModerate(user, "feed.moderate", p),
    );
  return (
    <div className="ak-community">
      <header className="ak-page-heading">
        <div>
          <p className="ak-eyebrow">RUANG BERSAMA · XII IPS</p>
          <h1>Hari ini, jadi kenangan.</h1>
          <p>Kabar kecil, cerita besar. Tetap dekat dengan angkatanmu.</p>
        </div>
        <div className="ak-row">
          <a className="ak-button secondary" href="/chat">
            <MessageCircle size={18} />
            Chat
          </a>
          <button
            className="ak-button"
            onClick={() => (user ? setComposer(true) : requireLogin())}
          >
            <Plus size={18} />
            Buat postingan
          </button>
        </div>
      </header>
      <div className="ak-social-layout">
        <div className="ak-feed-column">
          <StoryRings />
          <div className="ak-tabs" aria-label="Filter Feed">
            {[
              "Semua",
              "IPS 1",
              "IPS 2",
              "Official",
              ...(user ? ["Tersimpan"] : []),
            ].map((f) => (
              <button
                key={f}
                aria-pressed={filter === f}
                onClick={() => {
                  setFilter(f);
                  setCount(12);
                }}
              >
                {f}
              </button>
            ))}
            <button aria-label="Muat ulang Feed" onClick={load}>
              <RefreshCw size={17} />
            </button>
          </div>
          {notice && (
            <div className="ak-note" role="status">
              {notice} {!user && <a href="/login">Masuk</a>}
              <button className="ak-link" onClick={() => setNotice("")}>
                Tutup
              </button>
            </div>
          )}
          {loading ? (
            <div className="ak-loading" role="status">
              Memuat kabar angkatan…
            </div>
          ) : error ? (
            <div className="ak-empty">
              <h2>Feed belum dapat dimuat</h2>
              <p>{error}</p>
              <button className="ak-button" onClick={load}>
                Coba lagi
              </button>
            </div>
          ) : list.length === 0 ? (
            <div className="ak-empty">
              <MessageCircle size={30} />
              <h2>Ruang untuk cerita pertama.</h2>
              <p>
                {filter === "Tersimpan"
                  ? "Simpan postingan yang ingin dibaca kembali."
                  : "Belum ada postingan yang dapat ditampilkan. Bagikan kabar ketika kamu siap."}
              </p>
            </div>
          ) : (
            list.slice(0, count).map((post) => (
              <article key={post.id} id={"post-" + post.id} className="ak-post">
                <header>
                  <a
                    className="ak-author"
                    href={
                      "/siswa/" +
                      encodeURIComponent(
                        post.profileId || post.ownerId || post.authorId || "",
                      )
                    }
                  >
                    <span className="ak-avatar">
                      {(post.authorName || "A").slice(0, 1)}
                    </span>
                    <span>
                      <strong>{post.authorName || "Anggota AngkatanKU"}</strong>
                      <small>
                        {post.isOfficial
                          ? "Akun resmi · "
                          : post.authorRole === "teacher"
                            ? "Guru · "
                            : ""}
                        {post.classRoom ? `XII ${post.classRoom} · ` : ""}
                        {timeLabel(post.createdAt || post.created_at)} ·{" "}
                        {post.audience === "public" ? "Publik" : "Anggota"}
                      </small>
                    </span>
                  </a>
                  {post.pinned && <Pin size={16} aria-label="Disematkan" />}
                  <div className="ak-menu-wrap">
                    <button
                      className="ak-icon"
                      aria-label="Opsi postingan"
                      aria-expanded={menu === post.id}
                      onClick={() => setMenu(menu === post.id ? null : post.id)}
                    >
                      <MoreHorizontal />
                    </button>
                    {menu === post.id && (
                      <div className="ak-menu">
                        <button
                          onClick={() => {
                            share(post);
                            setMenu(null);
                          }}
                        >
                          Bagikan tautan
                        </button>
                        {user && (
                          <button
                            onClick={() => {
                              setAction({ post, type: "report" });
                              setMenu(null);
                            }}
                          >
                            Laporkan
                          </button>
                        )}
                        {post.ownerId === user?.uid && (
                          <button
                            onClick={() => {
                              setComposer(post);
                              setMenu(null);
                            }}
                          >
                            Edit postingan
                          </button>
                        )}
                        {(post.ownerId === user?.uid ||
                          mayModerate(user, "feed.moderate", post)) && (
                          <button
                            onClick={() => {
                              setAction({ post, type: "delete" });
                              setMenu(null);
                            }}
                          >
                            Hapus
                          </button>
                        )}
                        {mayModerate(user, "feed.moderate", post) &&
                          ["hidden", "pinned", "commentLocked"].map(
                            (type, i) => (
                              <button
                                key={type}
                                onClick={() => {
                                  setAction({ post, type });
                                  setMenu(null);
                                }}
                              >
                                {post[type]
                                  ? [
                                      "Tampilkan kembali",
                                      "Lepas sematan",
                                      "Buka komentar",
                                    ][i]
                                  : [
                                      "Sembunyikan",
                                      "Sematkan",
                                      "Kunci komentar",
                                    ][i]}
                              </button>
                            ),
                          )}
                      </div>
                    )}
                  </div>
                </header>
                {post.hidden && (
                  <p className="ak-note">
                    Konten ini disembunyikan dari komunitas.
                  </p>
                )}
                {post.caption && (
                  <div className="ak-post-copy">
                    <p>
                      {expanded.has(post.id) || post.caption.length < 360
                        ? post.caption
                        : post.caption.slice(0, 350) + "…"}
                    </p>
                    {post.caption.length >= 360 && !expanded.has(post.id) && (
                      <button
                        className="ak-link"
                        onClick={() =>
                          setExpanded((old) => new Set([...old, post.id]))
                        }
                      >
                        Selengkapnya
                      </button>
                    )}
                  </div>
                )}
                {post.media?.length > 0 && (
                  <MediaCarousel
                    media={post.media}
                    aspect={post.aspect}
                    fit={post.fit}
                    onMediaClick={setPreview}
                  />
                )}
                <footer>
                  <div className="ak-row">
                    <button
                      className={
                        "ak-icon " + (state[post.id]?.liked ? "is-liked" : "")
                      }
                      aria-label={
                        state[post.id]?.liked ? "Batal suka" : "Sukai postingan"
                      }
                      aria-pressed={!!state[post.id]?.liked}
                      onClick={() => like(post)}
                    >
                      <Heart
                        size={21}
                        fill={state[post.id]?.liked ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      className="ak-icon"
                      aria-label="Buka komentar"
                      onClick={() => setComments(post.id)}
                    >
                      <MessageCircle size={21} />
                    </button>
                    <button
                      className="ak-icon"
                      aria-label="Bagikan postingan"
                      onClick={() => share(post)}
                    >
                      <Share2 size={20} />
                    </button>
                    <button
                      className="ak-icon ak-push-right"
                      aria-label="Simpan postingan"
                      aria-pressed={!!state[post.id]?.saved}
                      onClick={() => bookmark(post)}
                    >
                      <Bookmark
                        size={20}
                        fill={state[post.id]?.saved ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <small>
                    {post.likes_count || 0} suka ·{" "}
                    {
                      (post.comments || []).filter((c: any) => !c.deleted)
                        .length
                    }{" "}
                    komentar
                  </small>
                </footer>
              </article>
            ))
          )}
          {list.length > count && (
            <button
              className="ak-button secondary"
              onClick={() => setCount((n) => n + 12)}
            >
              Tampilkan lebih banyak
            </button>
          )}
        </div>
        <aside className="ak-feed-aside">
          <p className="ak-eyebrow">TETAP TERHUBUNG</p>
          <h2>
            Satu angkatan.
            <br />
            Banyak cerita.
          </h2>
          <p>
            Ruang percakapan untuk teman, alumni, dan guru. Tanpa perlu bertukar
            nomor.
          </p>
          <a className="ak-aside-link" href="/chat">
            <Users size={20} />
            Siswa & Alumni
            <ArrowUpRight size={18} />
          </a>
          <a className="ak-aside-link" href="/chat">
            <MessageCircle size={20} />
            Guru & Angkatan
            <ArrowUpRight size={18} />
          </a>
          <hr />
          <a className="ak-link" href="/albums">
            Jelajahi album angkatan →
          </a>
          <small>
            Jaga ruang ini tetap ramah. Cerita yang dibagikan publik juga dapat
            dilihat pengunjung.
          </small>
        </aside>
      </div>
      {composer && (
        <Composer
          existing={composer === true ? undefined : composer}
          onClose={() => setComposer(null)}
          onSuccess={load}
        />
      )}
      {preview && (
        <FullscreenPreview media={preview} onClose={() => setPreview(null)} />
      )}
      {activePost && (
        <Modal
          title="Percakapan di postingan"
          onClose={() => {
            setComments(null);
            setReply(null);
          }}
        >
          <div className="ak-stack">
            {(activePost.comments || []).length === 0 && (
              <p className="ak-muted">
                Belum ada komentar. Mulai dengan sapaan hangat.
              </p>
            )}
            {(activePost.comments || [])
              .filter((c: any) => !c.parentId)
              .map((c: any) => (
                <div key={c.id} className="ak-comment">
                  <strong>
                    {c.author}
                    {c.user_id === activePost.ownerId ? " · Penulis" : ""}
                  </strong>
                  <p>{c.deleted ? "Komentar dihapus" : c.content}</p>
                  <small>{timeLabel(c.created_at)}</small>
                  {commentActions(c)}
                  {user && !c.deleted && (
                    <button className="ak-link" onClick={() => setReply(c.id)}>
                      Balas
                    </button>
                  )}
                  {(activePost.comments || [])
                    .filter((x: any) => x.parentId === c.id)
                    .map((x: any) => (
                      <div key={x.id} className="ak-comment-reply">
                        <strong>{x.author}</strong>
                        <p>{x.deleted ? "Komentar dihapus" : x.content}</p>
                        {commentActions(x)}
                      </div>
                    ))}
                </div>
              ))}
            {activePost.commentLocked ? (
              <p className="ak-note">Komentar dikunci oleh pengelola.</p>
            ) : user ? (
              <form onSubmit={comment} className="ak-stack">
                {reply && (
                  <p className="ak-note">
                    Membalas komentar{" "}
                    <button
                      type="button"
                      className="ak-link"
                      onClick={() => setReply(null)}
                    >
                      Batal
                    </button>
                  </p>
                )}
                <label className="ak-field">
                  Komentar
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={2000}
                    required
                  />
                </label>
                <button className="ak-button" disabled={busy || !text.trim()}>
                  Kirim komentar
                </button>
              </form>
            ) : (
              <a className="ak-button" href="/login">
                Masuk untuk berkomentar
              </a>
            )}
          </div>
        </Modal>
      )}
      {action && (
        <Modal
          title={
            action.type === "report"
              ? "Laporkan postingan"
              : "Konfirmasi perubahan"
          }
          onClose={() => {
            setAction(null);
            setPassword("");
          }}
        >
          <div className="ak-stack">
            <p>
              {action.type === "delete"
                ? "Hapus postingan ini? Media yang masih dipakai konten lain akan tetap disimpan."
                : "Perubahan berlaku sesuai izin akun Anda."}
            </p>
            {action.type === "report" && (
              <label className="ak-field">
                Alasan laporan
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={1000}
                />
              </label>
            )}
            {action.type !== "report" &&
              (action.type === "deleteComment"
                ? action.post.comments?.find(
                    (c: any) => c.id === (action as any).commentId,
                  )?.user_id !== user?.uid
                : action.post.ownerId !== user?.uid) && (
                <label className="ak-field">
                  Konfirmasi kata sandi
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </label>
              )}
            <button
              className="ak-button"
              disabled={
                busy || (action.type === "report" && reason.trim().length < 3)
              }
              onClick={applyAction}
            >
              {busy ? "Menyimpan…" : "Konfirmasi"}
            </button>
            {notice && <p role="status">{notice}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
