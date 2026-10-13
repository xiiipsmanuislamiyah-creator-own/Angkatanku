import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Square,
  Copy,
  RefreshCw,
  BookOpen,
  Sparkles,
  Calendar,
  Flag,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import MemoryPanel from "../features/knowledge/MemoryPanel";
export default function NusaAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [tab, setTab] = useState(
      new URLSearchParams(location.search).has("memory") ? "memory" : "chat",
    );
  const controller = useRef<AbortController | null>(null),
    anchor = useRef<HTMLDivElement>(null),
    lastPrompt = useRef("");
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const viewport = anchor.current?.parentElement;
    if (viewport && (messages.length || busy))
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
  }, [messages, busy]);
  async function ask(prompt: string, retry = false) {
    if (!prompt.trim() || busy) return;
    if (!user) {
      setError("Masuk dengan kartu AngkatanKU untuk bertanya kepada Nusa.");
      return;
    }
    setBusy(true);
    setError("");
    lastPrompt.current = prompt;
    const history = messages
      .slice(-10)
      .map(({ sender, text }) => ({ sender, text }));
    if (!retry)
      setMessages((old) => [
        ...old,
        { id: crypto.randomUUID(), sender: "user", text: prompt },
      ]);
    setText("");
    controller.current = new AbortController();
    try {
      const r = await api("/nusa-ai", { message: prompt, history }, "POST", {
        signal: controller.current.signal,
      });
      setMessages((old) => [
        ...old,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          text: r.text,
          sources: r.sources || [],
        },
      ]);
    } catch (e: any) {
      setError(
        e.name === "AbortError"
          ? "Jawaban dihentikan."
          : e.message || "Nusa belum dapat menjawab. Coba lagi nanti.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ak-nusa">
      <header className="ak-page-heading">
        <div>
          <p className="ak-eyebrow">ASISTEN & INGATAN ANGKATAN</p>
          <h1>Mau cari tahu apa hari ini?</h1>
          <p>
            Info akademik, cerita yang disetujui, dan hal-hal yang membuat kita
            tetap dekat.
          </p>
        </div>
        <span className="ak-nusa-symbol">
          <Sparkles size={34} />
        </span>
      </header>
      <div className="ak-tabs">
        <button aria-pressed={tab === "chat"} onClick={() => setTab("chat")}>
          Tanya Nusa
        </button>
        <button
          aria-pressed={tab === "memory"}
          onClick={() => setTab("memory")}
        >
          Nusa Memory
        </button>
      </div>
      {tab === "memory" ? (
        <MemoryPanel />
      ) : (
        <div className="ak-nusa-layout">
          <aside>
            <p className="ak-eyebrow">MULAI DARI SINI</p>
            {[
              ["Bagaimana jadwal pelajaran kelas saya?", Calendar],
              ["Ada cerita angkatan yang sudah dicatat?", BookOpen],
              ["Ceritakan jokes angkatan yang disetujui.", Sparkles],
            ].map(([question, Icon]: any) => (
              <button
                key={question}
                className="ak-prompt"
                disabled={busy}
                onClick={() => ask(question)}
              >
                <Icon size={19} />
                <span>{question}</span>
              </button>
            ))}
            <p className="ak-muted">
              Nusa memakai data akademik dan catatan yang telah disetujui. Ia
              tidak membaca pesan pribadi.
            </p>
            <button className="ak-link" onClick={() => setTab("memory")}>
              Kontribusi cerita →
            </button>
          </aside>
          <div className="ak-ai-panel">
            <header>
              <strong>Nusa</strong>
              <button
                className="ak-icon"
                aria-label="Percakapan baru"
                disabled={busy}
                onClick={() => {
                  setMessages([]);
                  setError("");
                }}
              >
                <RefreshCw size={18} />
              </button>
            </header>
            <div className="ak-ai-messages" aria-live="polite">
              {messages.length === 0 && (
                <div className="ak-ai-welcome">
                  <span className="ak-eyebrow">HALO, ANGKATAN.</span>
                  <h2>
                    Apa yang ingin
                    <br />
                    kita temukan?
                  </h2>
                  <p>
                    Tanya jadwal, cari informasi, atau buka kembali cerita yang
                    pernah kita simpan.
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <article key={m.id} className={"ak-ai-message " + m.sender}>
                  <small>{m.sender === "ai" ? "Nusa" : "Anda"}</small>
                  <p>{m.text}</p>
                  {m.sources?.length > 0 && (
                    <details>
                      <summary>Sumber yang tersedia</summary>
                      <ul>
                        {m.sources.map((s: any) => (
                          <li key={s.collection + s.id}>
                            <a href={s.url}>{s.title}</a>
                            {s.factType && <span> · {s.factType}</span>}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {m.sender === "ai" && (
                    <div className="ak-row">
                      <button
                        className="ak-icon"
                        aria-label="Salin jawaban"
                        onClick={() =>
                          navigator.clipboard
                            .writeText(m.text)
                            .catch(() =>
                              setError("Tidak dapat menyalin jawaban."),
                            )
                        }
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="ak-link"
                        onClick={() => setTab("memory")}
                      >
                        Koreksi sumber
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {busy && (
                <p className="ak-note" role="status">
                  Nusa sedang menyiapkan jawaban…
                </p>
              )}
              {error && (
                <div className="ak-error" role="alert">
                  {error}
                  <div className="ak-row">
                    {user && lastPrompt.current && (
                      <button
                        className="ak-link"
                        disabled={busy}
                        onClick={() => ask(lastPrompt.current, true)}
                      >
                        Coba lagi
                      </button>
                    )}
                    {!user && (
                      <a href="/login" className="ak-link">
                        Masuk dengan kartu
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div ref={anchor} />
            </div>
            <form
              className="ak-chat-compose"
              onSubmit={(e) => {
                e.preventDefault();
                ask(text);
              }}
            >
              <textarea
                aria-label="Pertanyaan untuk Nusa"
                placeholder="Tanyakan pada Nusa…"
                maxLength={2000}
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(text);
                  }
                }}
              />
              {busy ? (
                <button
                  type="button"
                  className="ak-button secondary"
                  aria-label="Hentikan jawaban"
                  onClick={() => controller.current?.abort()}
                >
                  <Square size={18} />
                </button>
              ) : (
                <button
                  className="ak-button"
                  disabled={!text.trim()}
                  aria-label="Kirim pertanyaan"
                >
                  <Send size={20} />
                </button>
              )}
            </form>
            <small className="ak-ai-note">
              Periksa sumber untuk informasi penting. Cerita pribadi dan humor
              bukan fakta resmi.
            </small>
          </div>
        </div>
      )}
    </section>
  );
}
