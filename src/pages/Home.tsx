import React, { useEffect, useState, lazy, Suspense } from "react";
import {
  ArrowUpRight,
  Calendar,
  GraduationCap,
  Images,
  Users,
  MessageCircle,
  Sparkles,
  Compass,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { records, ordered, timeLabel, type Content } from "../lib/community";
import StoryRings from "../components/StoryRings";
const NetworkEcosystem = lazy(() => import("../components/NetworkEcosystem"));
export default function Home({
  onNavigate,
  activeTab,
}: {
  onNavigate: (id: string, name?: string, data?: any) => void;
  activeTab: string;
}) {
  const { user, currentStudent } = useAuth();
  const [people, setPeople] = useState<Content[]>([]),
    [posts, setPosts] = useState<Content[]>([]),
    [error, setError] = useState(""),
    [explore, setExplore] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all([records("students"), records("posts")])
      .then(([p, f]) => {
        if (!live) return;
        const offset =
          Math.floor(Date.now() / 86400000) % Math.max(1, p.length);
        setPeople([...p.slice(offset), ...p.slice(0, offset)].slice(0, 6));
        setPosts(ordered(f.filter((x) => !x.hidden)).slice(0, 3));
      })
      .catch(() => {
        if (live)
          setError(
            "Kabar terbaru belum dapat dimuat. Halaman lain tetap dapat dijelajahi.",
          );
      });
    return () => {
      live = false;
    };
  }, [user?.uid]);
  const links = [
    ["anggota", "Angkatan", Users, "Temukan teman sekelas"],
    ["guru", "Dewan guru", GraduationCap, "Orang di balik perjalanan kita"],
    ["jadwal", "Jadwal", Calendar, "Ritme belajar sehari-hari"],
    ["galeri", "Arsip kenangan", Images, "Cerita dalam bingkai"],
  ];
  return (
    <div className="ak-home">
      <header className="ak-home-intro">
        <div>
          <p className="ak-eyebrow">SATU ANGKATAN. SATU RUANG DIGITAL.</p>
          <h1>
            {user ? "Senang bertemu lagi," : "Selamat datang di"}
            <br />
            <em>
              {user
                ? (
                    currentStudent?.nickname ||
                    currentStudent?.name ||
                    user.displayName ||
                    "kawan"
                  ).split(" ")[0] + "."
                : "ruang kita."}
            </em>
          </h1>
          <p>
            Hari berganti. Cerita kita tetap di sini.
            <br />
            XII IPS 1 & 2 · MA NU Islamiyah Asembagus.
          </p>
          <button
            className="ak-button"
            onClick={() => onNavigate(user ? "feed" : "anggota")}
          >
            {user ? "Bagikan kabar" : "Kenali angkatan"}
            <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="ak-year-mark" aria-hidden="true">
          <span>ANGKATAN</span>
          <strong>
            20
            <br />
            26<span>→</span>
          </strong>
          <small>
            ONE GENERATION.
            <br />
            ONE DIGITAL SPACE.
          </small>
        </div>
      </header>
      {error && (
        <p className="ak-note" role="status">
          {error}
        </p>
      )}
      <StoryRings onNavigate={onNavigate} />
      <section className="ak-discovery">
        <div className="ak-section-heading">
          <div>
            <p className="ak-eyebrow">ORANG-ORANG DI BALIK CERITA</p>
            <h2>Teman satu perjalanan.</h2>
          </div>
          <button className="ak-link" onClick={() => onNavigate("anggota")}>
            Lihat direktori <ArrowUpRight size={16} />
          </button>
        </div>
        {people.length > 0 ? (
          <div className="ak-people-row">
            {people.map((p) => (
              <button
                key={p.id}
                className="ak-person"
                onClick={() => onNavigate("public-profile", p.name, p.id)}
              >
                <div className="ak-person-image">
                  {p.avatarUrl || p.url_gambar ? (
                    <img
                      src={p.avatarUrl || p.url_gambar}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span>{(p.name || p.nama || "A").slice(0, 1)}</span>
                  )}
                </div>
                <strong>{p.name || p.nama}</strong>
                <small>
                  {p.classRoom ? "XII " + p.classRoom : "AngkatanKU"}
                </small>
              </button>
            ))}
          </div>
        ) : (
          <div className="ak-directory-note">
            <Users size={28} />
            <div>
              <h3>Kenali keluarga besar XII IPS.</h3>
              <p>
                Direktori siswa dan guru menyimpan identitas yang menjadi awal
                setiap cerita.
              </p>
            </div>
            <button className="ak-link" onClick={() => onNavigate("anggota")}>
              Buka direktori →
            </button>
          </div>
        )}
      </section>
      <div className="ak-home-grid">
        <section>
          <div className="ak-section-heading">
            <h2>Kabar angkatan</h2>
            <button className="ak-link" onClick={() => onNavigate("feed")}>
              Buka Feed →
            </button>
          </div>
          {posts.length ? (
            posts.map((p) => (
              <a href={"/feed?post=" + p.id} key={p.id} className="ak-activity">
                <small>{timeLabel(p.createdAt || p.created_at)}</small>
                <h3>{p.authorName || "AngkatanKU"}</h3>
                <p>{p.caption?.slice(0, 160) || "Membagikan kenangan baru."}</p>
                <ArrowUpRight size={18} />
              </a>
            ))
          ) : (
            <div className="ak-empty compact">
              <MessageCircle size={26} />
              <h3>Selalu ada cerita berikutnya.</h3>
              <p>Postingan yang tersedia untuk Anda akan muncul di sini.</p>
            </div>
          )}
        </section>
        <aside className="ak-home-nusa">
          <span className="ak-eyebrow">KENALAN DENGAN NUSA</span>
          <Sparkles size={28} />
          <h2>
            Ingatan kecil,
            <br />
            cerita panjang.
          </h2>
          <p>
            Tanya jadwal atau temukan kembali cerita angkatan yang sudah
            disetujui.
          </p>
          <button className="ak-button" onClick={() => onNavigate("nusa-ai")}>
            Tanya Nusa <ArrowUpRight size={18} />
          </button>
        </aside>
      </div>
      <section>
        <div className="ak-section-heading">
          <h2>Jelajahi ruang kita</h2>
          <button className="ak-link" onClick={() => setExplore(!explore)}>
            <Compass size={17} />
            {explore ? "Tutup peta" : "Peta ekosistem"}
          </button>
        </div>
        <div className="ak-quick-links">
          {links.map(([id, title, Icon, desc]: any) => (
            <button key={id} onClick={() => onNavigate(id)}>
              <Icon size={24} />
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
        {explore && (
          <Suspense
            fallback={<p className="ak-loading">Memuat peta ekosistem…</p>}
          >
            <NetworkEcosystem onNavigate={onNavigate} />
          </Suspense>
        )}
      </section>
      <div className="ak-home-closing">
        <span>One Generation, One Digital Space.</span>
        <button className="ak-link" onClick={() => onNavigate("landing")}>
          Buka prolog angkatan →
        </button>
      </div>
    </div>
  );
}
