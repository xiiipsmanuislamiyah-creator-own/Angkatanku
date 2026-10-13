import React, { useState, useEffect, useRef } from "react";
import {
  ImagePlus,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Check,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { saveContent, type Content } from "../../lib/community";
import {
  STORY_STYLES,
  STORY_FONTS,
  STORY_ALIGNS,
} from "../../../shared/social";
import Modal from "../../components/ui/Modal";
type Selected = {
  id: string;
  file?: File;
  preview: string;
  url?: string;
  type: "image" | "video";
  progress: number;
  error?: string;
};
export default function Composer({
  kind = "posts",
  existing,
  onClose,
  onSuccess,
}: {
  kind?: "posts" | "stories" | "albums";
  existing?: Content;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth(),
    requestId = useRef(existing?.id || crypto.randomUUID());
  const [caption, setCaption] = useState(
      existing?.caption || existing?.text || "",
    ),
    [title, setTitle] = useState(existing?.title || "");
  const [audience, setAudience] = useState(existing?.audience || "members"),
    [identity, setIdentity] = useState(existing?.identityKey || "personal");
  const [aspect, setAspect] = useState(existing?.aspect || "portrait"),
    [fit, setFit] = useState(existing?.fit || "contain");
  const [textMode, setTextMode] = useState(
      existing?.type === "text" || kind === "stories",
    ),
    [preset, setPreset] = useState<keyof typeof STORY_STYLES>(
      existing?.stylePreset || "navy",
    );
  const [font, setFont] = useState(existing?.fontStyle || "sans"),
    [align, setAlign] = useState<any>(existing?.align || "center"),
    [cover, setCover] = useState(existing?.coverIndex || 0);
  const [files, setFiles] = useState<Selected[]>(
    (existing?.media || []).map((m: any, i: number) => ({
      id: String(i),
      preview: m.url,
      url: m.url,
      type: m.type,
      progress: 100,
    })),
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [review, setReview] = useState(false),
    urls = useRef<string[]>([]);
  useEffect(
    () => () => urls.current.forEach((u) => URL.revokeObjectURL(u)),
    [],
  );
  const select = (incoming: FileList | null) => {
    if (!incoming) return;
    setError("");
    const added: Selected[] = [];
    for (const file of Array.from(incoming)) {
      if (
        ![
          "image/png",
          "image/jpeg",
          "image/webp",
          "video/mp4",
          "video/webm",
        ].includes(file.type) ||
        file.size > (file.type.startsWith("image/") ? 8 : 20) * 1024 * 1024
      ) {
        setError(
          "Gunakan gambar JPEG/PNG/WebP hingga 8 MB atau video MP4/WebM hingga 20 MB.",
        );
        continue;
      }
      const preview = URL.createObjectURL(file);
      urls.current.push(preview);
      added.push({
        id: crypto.randomUUID(),
        file,
        preview,
        type: file.type.startsWith("video/") ? "video" : "image",
        progress: 0,
      });
    }
    setFiles((old) =>
      [...old, ...added].slice(0, kind === "stories" ? 10 : 20),
    );
  };
  const reorder = (i: number, delta: number) =>
    setFiles((old) => {
      const next = [...old],
        target = i + delta;
      if (target < 0 || target >= next.length) return old;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  async function publish() {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const ready = kind === "stories" && textMode ? [] : [...files];
      // Three files in flight; keep completed uploads for a retry after any failure.
      let cursor = 0;
      await Promise.all(
        Array.from({ length: Math.min(3, ready.length) }, async () => {
          while (cursor < ready.length) {
            const i = cursor++,
              entry = ready[i];
            if (entry.url) continue;
            try {
              entry.url = await uploadToCloudinary(
                entry.file!,
                entry.type,
                (progress) =>
                  setFiles((old) =>
                    old.map((x) =>
                      x.id === entry.id
                        ? { ...x, progress, error: undefined }
                        : x,
                    ),
                  ),
              );
              entry.progress = 100;
              setFiles((old) =>
                old.map((x) => (x.id === entry.id ? { ...entry } : x)),
              );
            } catch (e: any) {
              entry.error = e.message;
              setFiles((old) =>
                old.map((x) => (x.id === entry.id ? { ...entry } : x)),
              );
            }
          }
        }),
      );
      if (ready.some((x) => !x.url))
        throw new Error(
          "Sebagian file belum terunggah. Coba lagi; file yang berhasil tetap tersimpan.",
        );
      const common = {
        audience,
        ...(!existing ? { identityKey: identity } : {}),
      };
      if (kind === "stories") {
        if (textMode)
          await saveContent(
            kind,
            requestId.current,
            {
              ...common,
              type: "text",
              text: caption,
              caption,
              stylePreset: preset,
              fontStyle: font,
              align,
            },
            existing,
          );
        else
          for (let i = 0; i < ready.length; i++)
            await saveContent(kind, requestId.current + "-" + i, {
              ...common,
              type: ready[i].type,
              url: ready[i].url,
              caption,
            });
      } else
        await saveContent(
          kind,
          requestId.current,
          {
            ...common,
            caption,
            title,
            aspect,
            fit,
            coverIndex: Math.min(cover, Math.max(0, ready.length - 1)),
            media: ready.map((m, i) => ({
              url: m.url,
              type: m.type,
              order: i,
            })),
          },
          existing,
        );
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "Publikasi belum berhasil. Draft tetap ada.");
    } finally {
      setBusy(false);
    }
  }
  const valid =
    kind === "stories"
      ? textMode
        ? caption.trim().length > 0
        : files.length > 0
      : kind === "albums"
        ? title.trim().length > 0 && files.length > 0
        : caption.trim().length > 0 || files.length > 0;
  const identities =
    user?.role === "owner"
      ? ["angkatan-ku-ips1", "angkatan-ku-ips2", "ma-nu"]
      : user?.permissions?.includes("identity.publish")
        ? user.scope === "school"
          ? ["angkatan-ku-ips1", "angkatan-ku-ips2", "ma-nu"]
          : (user.classRooms || []).flatMap((c: string) =>
              c === "IPS 1"
                ? ["angkatan-ku-ips1"]
                : c === "IPS 2"
                  ? ["angkatan-ku-ips2"]
                  : [],
            )
        : [];
  return (
    <Modal
      title={
        (existing
          ? "Edit "
          : kind === "albums"
            ? "Buat album"
            : kind === "stories"
              ? "Tambah Story"
              : "Bagikan kabar") +
        (existing ? (kind === "albums" ? "album" : "postingan") : "")
      }
      onClose={() => {
        if (
          !busy &&
          ((!caption && !files.length) ||
            confirm("Tutup editor? Draft yang belum diterbitkan akan ditutup."))
        )
          onClose();
      }}
      wide
    >
      <div className="ak-stack">
        {kind === "stories" && (
          <div className="ak-tabs">
            <button aria-pressed={textMode} onClick={() => setTextMode(true)}>
              Teks
            </button>
            <button aria-pressed={!textMode} onClick={() => setTextMode(false)}>
              Foto / video
            </button>
          </div>
        )}
        {kind === "albums" && (
          <label className="ak-field">
            Judul album
            <input
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kenangan yang ingin disimpan"
            />
          </label>
        )}
        <label className="ak-field">
          {kind === "stories" && textMode
            ? "Teks Story"
            : kind === "albums"
              ? "Cerita di balik album"
              : "Apa kabar, angkatan?"}
          <textarea
            aria-label={
              kind === "stories" && textMode ? "Teks Story" : "Caption"
            }
            rows={4}
            maxLength={kind === "stories" ? 700 : 4000}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ceritakan dengan kata-katamu sendiri…"
          />
        </label>
        {kind === "stories" && textMode ? (
          <>
            <div className="ak-row">
              <span>Warna</span>
              {Object.keys(STORY_STYLES).map((k) => (
                <button
                  key={k}
                  className="ak-swatch"
                  style={{
                    background: STORY_STYLES[k].background,
                    color: STORY_STYLES[k].color,
                  }}
                  aria-label={"Warna " + k}
                  aria-pressed={preset === k}
                  onClick={() => setPreset(k as any)}
                >
                  {preset === k && <Check size={16} />}
                </button>
              ))}
              <label className="ak-field">
                Font
                <select value={font} onChange={(e) => setFont(e.target.value)}>
                  {STORY_FONTS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label className="ak-field">
                Rata
                <select
                  value={align}
                  onChange={(e) => setAlign(e.target.value)}
                >
                  {STORY_ALIGNS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
            </div>
            <div
              className={"ak-story-text ak-font-" + font}
              style={{
                background: STORY_STYLES[preset].background,
                color: STORY_STYLES[preset].color,
                textAlign: align,
              }}
            >
              {caption || "Satu hari. Banyak cerita."}
            </div>
          </>
        ) : (
          <>
            <label className="ak-upload">
              <ImagePlus size={26} />
              <strong>Pilih foto atau video</strong>
              <span>Gambar hingga 8 MB · Video hingga 20 MB</span>
              <input
                type="file"
                aria-label="Pilih media"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={(e) => select(e.target.files)}
                disabled={busy}
              />
            </label>
            {files.length > 0 && (
              <div className="ak-media-grid">
                {files.map((m, i) => (
                  <div key={m.id} className="ak-media-tile">
                    {m.type === "image" ? (
                      <img src={m.preview} alt={"Media " + (i + 1)} />
                    ) : (
                      <video src={m.preview} muted preload="metadata" />
                    )}
                    <div className="ak-row">
                      <button
                        className="ak-icon"
                        aria-label={"Geser media " + (i + 1) + " ke kiri"}
                        disabled={i === 0 || busy}
                        onClick={() => reorder(i, -1)}
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button
                        className="ak-icon"
                        aria-label={"Geser media " + (i + 1) + " ke kanan"}
                        disabled={i === files.length - 1 || busy}
                        onClick={() => reorder(i, 1)}
                      >
                        <ArrowRight size={16} />
                      </button>
                      <button
                        className="ak-icon"
                        aria-label={"Hapus media " + (i + 1)}
                        disabled={busy}
                        onClick={() =>
                          setFiles((old) => old.filter((x) => x.id !== m.id))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {kind === "albums" && (
                      <button className="ak-link" onClick={() => setCover(i)}>
                        {cover === i ? "✓ Sampul album" : "Jadikan sampul"}
                      </button>
                    )}
                    {busy && <progress max={100} value={m.progress} />}
                    {m.error && <small role="alert">{m.error}</small>}
                  </div>
                ))}
              </div>
            )}
            {kind !== "stories" && files.length > 0 && (
              <div className="ak-row">
                <label className="ak-field">
                  Rasio
                  <select
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value)}
                  >
                    <option value="portrait">Potret 4:5</option>
                    <option value="square">Persegi 1:1</option>
                    <option value="landscape">Lanskap 16:9</option>
                    <option value="original">Asli</option>
                  </select>
                </label>
                <label className="ak-field">
                  Tampilan
                  <select value={fit} onChange={(e) => setFit(e.target.value)}>
                    <option value="contain">Utuh</option>
                    <option value="cover">Penuhi bingkai</option>
                  </select>
                </label>
              </div>
            )}
          </>
        )}
        <div className="ak-row">
          <label className="ak-field">
            Dapat dilihat
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="members">Anggota</option>
              <option value="public">Publik</option>
            </select>
          </label>
          {identities.length > 0 && !existing && (
            <label className="ak-field">
              Publikasikan sebagai
              <select
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
              >
                <option value="personal">Akun pribadi</option>
                {identities.map((id) => (
                  <option key={id} value={id}>
                    {id === "ma-nu"
                      ? "Sekolah Official"
                      : id.endsWith("1")
                        ? "XII IPS 1 Official"
                        : "XII IPS 2 Official"}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {audience === "public" && (
          <p className="ak-note">
            Publikasi ini dapat dilihat pengunjung. Pastikan semua orang yang
            tampil setuju.
          </p>
        )}
        {review && (
          <div className="ak-review">
            <strong>Siap dibagikan</strong>
            <p>{caption || title}</p>
            <span>
              {files.length} media ·{" "}
              {audience === "public" ? "Publik" : "Anggota"}
              {kind === "stories" ? " · 24 jam" : ""}
            </span>
          </div>
        )}
        {error && (
          <p className="ak-error" role="alert">
            {error}
          </p>
        )}
        <div className="ak-actions">
          <button
            className="ak-button secondary"
            disabled={!valid || busy}
            onClick={() => setReview(!review)}
          >
            Pratinjau
          </button>
          <button
            className="ak-button"
            disabled={!valid || busy}
            onClick={publish}
          >
            <UploadCloud size={18} />
            {busy
              ? "Menerbitkan…"
              : error
                ? "Coba terbitkan lagi"
                : "Publikasikan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
