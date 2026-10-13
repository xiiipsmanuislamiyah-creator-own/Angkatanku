import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Trash2,
  Flag,
  Eye,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import {
  records,
  deleteContent,
  timeLabel,
  mayModerate,
  type Content,
} from "../lib/community";
import Composer from "../features/social/Composer";
import Modal from "./ui/Modal";
import { STORY_STYLES } from "../../shared/social";
export interface StoryItem {
  id: string;
  type: "image" | "video" | "text";
  url: string;
  title: string;
  caption: string;
  timestamp: string;
  authorId?: string;
  identityKey?: string;
  viewCount?: number;
  text?: string;
  stylePreset?: string;
  fontStyle?: string;
  align?: string;
  [key: string]: any;
}
export interface StoryCategory {
  id: string;
  name: string;
  subtitle: string;
  avatarType: "dev" | "class" | "school";
  avatarSrc?: string;
  hasUnread: boolean;
  stories: StoryItem[];
}
export const getStoryViewerCount = (s: StoryItem | null) => s?.viewCount || 0;
export function StoryText({ story }: { story: any }) {
  const style =
    STORY_STYLES[story.stylePreset as keyof typeof STORY_STYLES] ||
    STORY_STYLES.navy;
  return (
    <div
      className={"ak-story-text ak-font-" + (story.fontStyle || "sans")}
      style={{
        background: style.background,
        color: style.color,
        textAlign: ["left", "right", "center"].includes(story.align)
          ? story.align
          : "center",
      }}
    >
      {story.text}
    </div>
  );
}
export default function StoryRings({
  onNavigate,
}: {
  onNavigate?: (tab: string, name?: string, data?: any) => void;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<Content[]>([]),
    [current, setCurrent] = useState<string | null>(null),
    [composer, setComposer] = useState(false),
    [paused, setPaused] = useState(false),
    [muted, setMuted] = useState(true),
    [progress, setProgress] = useState(0),
    [seen, setSeen] = useState<Set<string>>(new Set()),
    [error, setError] = useState(""),
    [report, setReport] = useState(false),
    [deleteConfirm, setDeleteConfirm] = useState(false),
    [password, setPassword] = useState(""),
    [deleting, setDeleting] = useState(false),
    [reason, setReason] = useState("");
  const video = useRef<HTMLVideoElement>(null),
    touch = useRef(0);
  const load = () =>
    records("stories")
      .then((rows) =>
        setItems(
          rows
            .filter((r) => !r.hidden && r.expiresAt > Date.now())
            .sort((a, b) => a.createdAt - b.createdAt),
        ),
      )
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const tick = setInterval(() => {
      if (!document.hidden) load();
    }, 60000);
    return () => clearInterval(tick);
  }, [user?.uid]);
  const index = items.findIndex((s) => s.id === current),
    story = items[index];
  const next = (delta: number) => {
    setProgress(0);
    setReport(false);
    setDeleteConfirm(false);
    setPassword("");
    setPaused(false);
    const target = index + delta;
    if (target < 0 || target >= items.length) setCurrent(null);
    else setCurrent(items[target].id);
  };
  useEffect(() => {
    if (!story) return;
    setProgress(0);
    setSeen((old) => new Set([...old, story.id]));
    if (user)
      api("/interactions", {
        collection: "stories",
        id: story.id,
        action: "view",
      }).catch(() => {});
  }, [current, user?.uid]);
  useEffect(() => {
    if (!story || paused || report || deleteConfirm || story.type === "video") return;
    const t = setInterval(() => {
      if (document.hidden) return;
      setProgress((p) => Math.min(100, p + 2));
    }, 100);
    return () => clearInterval(t);
  }, [current, paused, report, deleteConfirm, story?.type]);
  useEffect(() => {
    if (progress >= 100 && story) next(1);
  }, [progress]);
  useEffect(() => {
    if (!story) return;
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      )
        return;
      if (e.key === "ArrowRight") next(1);
      if (e.key === "ArrowLeft") next(-1);
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [current, index]);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (paused || report || deleteConfirm) v.pause();
    else v.play().catch(() => {});
  }, [paused, report, deleteConfirm, current]);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("story");
    if (id && items.some((s) => s.id === id)) setCurrent(id);
  }, [items.length]);
  useEffect(() => {
    if (!story) return;
    const check = () => {
      if (story.expiresAt <= Date.now()) {
        setCurrent(null);
        load();
      }
      if (video.current && document.hidden) video.current.pause();
      else if (video.current && !paused && !report && !deleteConfirm)
        video.current.play().catch(() => {});
    };
    const tick = setInterval(check, 1000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", check);
    };
  }, [current, paused, report, deleteConfirm]);
  const groups = [
    ...new Map<string, Content>(
      items.map((s) => [
        s.identityKey && s.identityKey !== "personal"
          ? s.identityKey
          : s.ownerId || s.authorId,
        s,
      ]),
    ).values(),
  ];
  if (!user && !items.length && !error) return null;
  return (
    <section className="ak-stories" aria-label="Cerita angkatan">
      <div className="ak-section-heading">
        <h2>Cerita hari ini</h2>
        <small>Hadir selama 24 jam</small>
      </div>
      <div className="ak-story-rail">
        {user && (
          <button
            className="ak-story-card ak-story-add"
            onClick={() => setComposer(true)}
          >
            <span className="ak-story-plus">
              <Plus size={25} />
            </span>
            <strong>Tambah Story</strong>
            <small>Teks, foto, video</small>
          </button>
        )}
        {groups.map((s) => (
          <button
            key={s.id}
            className={"ak-story-card " + (seen.has(s.id) ? "seen" : "unseen")}
            onClick={() => {
              setCurrent(
                items.find(
                  (x) =>
                    (x.ownerId || x.authorId) === (s.ownerId || s.authorId) &&
                    !seen.has(x.id),
                )?.id || s.id,
              );
              setPaused(false);
            }}
            aria-label={"Lihat Story " + s.authorName}
          >
            {s.type === "text" ? (
              <StoryText story={s} />
            ) : s.type === "video" ? (
              <div className="ak-story-video">
                <Play size={30} />
                <span>Video</span>
              </div>
            ) : (
              <img src={s.url} alt="" loading="lazy" />
            )}
            <span className="ak-story-initial">
              {(s.authorName || "A").slice(0, 1)}
            </span>
            <strong>{s.authorName || "Anggota AngkatanKU"}</strong>
          </button>
        ))}
      </div>
      {error && (
        <p className="ak-error" role="alert">
          {error}
        </p>
      )}
      {composer && (
        <Composer
          kind="stories"
          onClose={() => setComposer(false)}
          onSuccess={load}
        />
      )}
      {story && (
        <Modal
          title={story.authorName || "Story angkatan"}
          onClose={() => {
            setCurrent(null);
            setReport(false);
          }}
        >
          <div
            className="ak-story-viewer"
            onTouchStart={(e) => {
              touch.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const d = e.changedTouches[0].clientX - touch.current;
              if (Math.abs(d) > 60) next(d < 0 ? 1 : -1);
            }}
          >
            <div className="ak-story-progress" aria-label="Progres Story">
              <span style={{ width: progress + "%" }} />
            </div>
            <div className="ak-row">
              <small>{timeLabel(story.createdAt)}</small>
              <button
                className="ak-icon"
                aria-label={paused ? "Lanjutkan Story" : "Jeda Story"}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              {story.type === "video" && (
                <button
                  className="ak-icon"
                  aria-label={muted ? "Nyalakan suara" : "Bisukan"}
                  onClick={() => setMuted((m) => !m)}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
            </div>
            <div
              className="ak-story-stage"
              onPointerDown={() => setPaused(true)}
              onPointerUp={() => setPaused(false)}
              onPointerCancel={() => setPaused(false)}
            >
              {story.type === "text" ? (
                <StoryText story={story} />
              ) : story.type === "video" ? (
                <video
                  ref={video}
                  src={story.url}
                  muted={muted}
                  playsInline
                  autoPlay
                  onTimeUpdate={(e) =>
                    setProgress(
                      (e.currentTarget.currentTime /
                        Math.min(e.currentTarget.duration || 30, 30)) *
                        100,
                    )
                  }
                  onEnded={() => next(1)}
                  onError={() => setError("Video belum dapat dimuat.")}
                />
              ) : (
                <img src={story.url} alt={story.caption || "Story angkatan"} />
              )}
            </div>
            {story.caption && story.type !== "text" && <p>{story.caption}</p>}
            <div className="ak-row">
              <button
                className="ak-icon"
                aria-label="Story sebelumnya"
                onClick={() => next(-1)}
              >
                <ChevronLeft />
              </button>
              <span className="ak-muted">
                {index + 1} / {items.length}
              </span>
              <button
                className="ak-icon"
                aria-label="Story berikutnya"
                onClick={() => next(1)}
              >
                <ChevronRight />
              </button>
              {user && (
                <button
                  className="ak-icon"
                  aria-label="Laporkan Story"
                  onClick={() => {
                    setPaused(true);
                    setReport(true);
                  }}
                >
                  <Flag size={18} />
                </button>
              )}
              {(story.ownerId === user?.uid ||
                mayModerate(user, "story.moderate", story)) && (
                <button
                  className="ak-icon"
                  aria-label="Hapus Story"
                  onClick={() => {
                    setPaused(true);
                    setPassword("");
                    setError("");
                    setDeleteConfirm(true);
                  }}
                >
                  <Trash2 size={18} />
                </button>
              )}
              {story.ownerId === user?.uid && (
                <small className="ak-row">
                  <Eye size={16} />
                  {story.viewCount || 0}
                </small>
              )}
            </div>
            {report && (
              <form
                className="ak-stack"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await api("/reports", {
                      collection: "stories",
                      id: story.id,
                      reason,
                    });
                    setReport(false);
                    setReason("");
                    setError("Laporan diterima.");
                  } catch (e: any) {
                    setError(e.message);
                  }
                }}
              >
                <label className="ak-field">
                  Alasan laporan
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    minLength={3}
                    maxLength={1000}
                  />
                </label>
                <button className="ak-button">Kirim laporan</button>
              </form>
            )}
          </div>
        </Modal>
      )}
      {deleteConfirm && story && (
        <Modal title="Konfirmasi hapus Story" onClose={() => { setDeleteConfirm(false); setPassword(""); }}>
          <form className="ak-stack" onSubmit={async (e) => {
            e.preventDefault();
            setDeleting(true);
            try {
              if (story.ownerId !== user?.uid) await api("/auth/reauth", { password });
              await deleteContent("stories", story.id);
              setDeleteConfirm(false);
              setCurrent(null);
              load();
            } catch (e: any) { setError(e.message); }
            finally { setPassword(""); setDeleting(false); }
          }}>
            <p>Story ini akan dihapus. Tindakan moderasi dicatat dalam audit.</p>
            {story.ownerId !== user?.uid && <label className="ak-field">Kata sandi Anda<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>}
            {error && <p role="alert">{error}</p>}
            <button className="ak-button" disabled={deleting}>{deleting ? "Menghapus…" : "Ya, hapus Story"}</button>
          </form>
        </Modal>
      )}
    </section>
  );
}
