import React, { useState, useEffect } from "react";
import { Plus, Images, Share2, MoreHorizontal } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  records,
  ordered,
  shareContent,
  deleteContent,
  type Content,
} from "../lib/community";
import Composer from "../features/social/Composer";
import Modal from "../components/ui/Modal";
import FullscreenPreview from "../components/FullscreenPreview";
export default function Albums() {
  const { user } = useAuth(),
    [items, setItems] = useState<Content[]>([]),
    [error, setError] = useState(""),
    [editing, setEditing] = useState<true | Content | null>(null),
    [active, setActive] = useState<Content | null>(null),
    [preview, setPreview] = useState<any>(null),
    [filter, setFilter] = useState("");
  const load = () =>
    records("albums")
      .then((r) => {
        setItems(
          ordered(
            r.filter(
              (x) =>
                !x.hidden &&
                (!new URLSearchParams(location.search).get("author") ||
                  [x.ownerId, x.profileId].includes(
                    new URLSearchParams(location.search).get("author"),
                  )),
            ),
          ),
        );
        const id = new URLSearchParams(location.search).get("album");
        if (id) setActive(r.find((x) => x.id === id) || null);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [user?.uid]);
  return (
    <section className="ak-albums">
      <header className="ak-page-heading">
        <div>
          <p className="ak-eyebrow">ARSIP PERSONAL & ANGKATAN</p>
          <h1>Kenangan, dalam satu album.</h1>
          <p>Susun cerita yang pantas disimpan lebih lama.</p>
        </div>
        {user && (
          <button className="ak-button" onClick={() => setEditing(true)}>
            <Plus size={18} />
            Buat album
          </button>
        )}
      </header>
      <label className="ak-search">
        <input
          aria-label="Cari album"
          placeholder="Cari judul album…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </label>
      {error && (
        <p className="ak-error" role="alert">
          {error}
        </p>
      )}
      <div className="ak-album-grid">
        {items
          .filter((x) => x.title?.toLowerCase().includes(filter.toLowerCase()))
          .map((a) => {
            const cover = a.media?.[a.coverIndex || 0];
            return (
              <button
                key={a.id}
                className="ak-album-card"
                onClick={() => setActive(a)}
              >
                <div>
                  {cover?.type === "image" ? (
                    <img src={cover.url} alt="" loading="lazy" />
                  ) : (
                    <Images size={38} />
                  )}
                </div>
                <small>
                  {a.media?.length || 0} media ·{" "}
                  {a.audience === "public" ? "Publik" : "Anggota"}
                </small>
                <h2>{a.title}</h2>
                <p>{a.authorName || "AngkatanKU"}</p>
              </button>
            );
          })}
      </div>
      {!items.length && (
        <div className="ak-empty">
          <Images size={36} />
          <h2>Halaman-halaman yang menunggu cerita.</h2>
          <p>Album yang dipublikasikan akan tampil di sini.</p>
          <a href="/galeri" className="ak-link">
            Lihat galeri dokumentasi →
          </a>
        </div>
      )}
      {editing && (
        <Composer
          kind="albums"
          existing={editing === true ? undefined : editing}
          onClose={() => setEditing(null)}
          onSuccess={load}
        />
      )}
      {active && !preview && (
        <Modal title={active.title} onClose={() => setActive(null)} wide>
          <div className="ak-stack">
            <p>{active.caption}</p>
            <div className="ak-row">
              <button
                className="ak-link"
                onClick={() =>
                  shareContent("albums", active.id).catch(() => {})
                }
              >
                <Share2 size={17} />
                Bagikan
              </button>
              {active.ownerId === user?.uid && (
                <>
                  <button
                    className="ak-link"
                    onClick={() => {
                      setEditing(active);
                      setActive(null);
                    }}
                  >
                    Edit album
                  </button>
                  <button
                    className="ak-link"
                    onClick={async () => {
                      if (!confirm("Hapus album ini?")) return;
                      try {
                        await deleteContent("albums", active.id);
                        setActive(null);
                        load();
                      } catch (e: any) {
                        setError(e.message);
                      }
                    }}
                  >
                    Hapus album
                  </button>
                </>
              )}
            </div>
            <div className="ak-media-grid">
              {active.media?.map((m: any, i: number) => (
                <button
                  key={i}
                  className="ak-media-tile"
                  onClick={() => setPreview(m)}
                >
                  {m.type === "image" ? (
                    <img src={m.url} alt={"Foto " + (i + 1)} loading="lazy" />
                  ) : (
                    <video src={m.url} muted preload="metadata" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
      {preview && (
        <FullscreenPreview media={preview} onClose={() => setPreview(null)} />
      )}
    </section>
  );
}
