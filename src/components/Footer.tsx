import React from "react";
import { Send, Code2, FileText, Info } from "lucide-react";

interface FooterProps {
  setActiveTab: (tabId: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 py-10 pb-24 md:pb-10 mt-8 relative z-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 pb-7 border-b border-slate-900">
          {/* Column 1: App Branding with 4 Logos */}
          <div className="md:col-span-5 space-y-4">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveTab("home")}
            >
              {/* 4 Logos Row in Footer (Enlarged) */}
              <div className="flex items-center -space-x-2">
                {/* 1. Web Logo (Mercusuar) */}
                <div
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border-2 border-sky-500/40 overflow-hidden p-1 shadow-md relative z-30 flex items-center justify-center"
                  title="Logo Web AngkatanKU"
                >
                  <img
                    src="/gambar/favicon.png"
                    alt="Logo Web"
                    className="w-full h-full object-contain"
                  />
                </div>
                {/* 2. IPS 1 Logo */}
                <div
                  className="w-11 h-11 rounded-xl bg-slate-900 border-2 border-sky-500/50 overflow-hidden shadow-md relative z-20"
                  title="Logo Kelas IPS 1"
                >
                  <img
                    src="/logo-ips1.png"
                    alt="Logo IPS 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 3. IPS 2 Logo */}
                <div
                  className="w-11 h-11 rounded-xl bg-slate-900 border-2 border-emerald-500/50 overflow-hidden shadow-md relative z-10"
                  title="Logo Kelas IPS 2"
                >
                  <img
                    src="/logo-ips2.jpg"
                    alt="Logo IPS 2"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 4. MA Logo */}
                <div
                  className="w-11 h-11 rounded-xl bg-slate-900 border-2 border-slate-500/50 overflow-hidden shadow-md relative z-0"
                  title="Logo MA NU Islamiyah"
                >
                  <img
                    src="/gambar/logoma.png"
                    alt="Logo Sekolah"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-wider text-white uppercase font-display flex items-center">
                  Angkatan<span className="text-emerald-500">KU</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">
                  XII IPS 1 & 2 &bull; MA NU ISLAMIYAH
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Portal kenangan digital angkatan XII IPS 1 & 2 MA NU Islamiyah
              Asembagus. Tempat mengabadikan rekam jejak, cerita, tawa, dan
              persaudaraan hingga momen kelulusan.
            </p>

            <div className="flex gap-2 items-center bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-mono text-slate-300">
                Satu Angkatan, Satu Cerita.
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
              Navigasi Utama
            </h4>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-400 font-medium">
              <button
                onClick={() => setActiveTab("landing")}
                className="text-amber-400 hover:text-amber-300 transition-colors text-left select-none cursor-pointer font-bold"
              >
                Prolog Angkatan
              </button>
              <button
                onClick={() => setActiveTab("home")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Beranda
              </button>
              <button
                onClick={() => setActiveTab("mading")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Struktur Kelas
              </button>
              <button
                onClick={() => setActiveTab("jadwal")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Jadwal
              </button>
              <button
                onClick={() => setActiveTab("home")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Kegiatan
              </button>
              <button
                onClick={() => setActiveTab("galeri")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Galeri
              </button>
              <button
                onClick={() => setActiveTab("prestasi")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Papan Prestasi
              </button>
              <button
                onClick={() => setActiveTab("feed")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Feed Angkatan
              </button>
              <button
                onClick={() => setActiveTab("nusa-ai")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Nusa AI
              </button>
              <button
                onClick={() => setActiveTab("alat-game")}
                className="hover:text-white transition-colors text-left select-none cursor-pointer"
              >
                Alat & Game
              </button>
              <button
                onClick={() => setActiveTab("tentang")}
                className="text-emerald-400 hover:text-emerald-300 transition-colors text-left select-none cursor-pointer flex items-center gap-1 font-semibold col-span-2 mt-1 pt-1 border-t border-slate-900"
              >
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tentang AngkatanKU</span>
              </button>
            </div>
          </div>

          {/* Column 3: Contact & Developer */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
              Hubungi Pengembang
            </h4>
            <div className="text-xs text-slate-400 space-y-3">
              <p className="leading-relaxed">
                Punya foto atau video kenangan kelas XII IPS 1 & 2? Kirimkan atau hubungi pengembang portal AngkatanKU.
              </p>
              <div className="pt-1 text-xs">
                <span className="text-slate-400">Kontak: </span>
                <a
                  href="https://t.me/rAiengineer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4 decoration-sky-500/40 hover:decoration-sky-400 transition-colors cursor-pointer"
                >
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom line: discreet watermark above copyright */}
        <div className="pt-8 border-t border-slate-900/80 flex flex-col items-center justify-center text-center gap-2 text-xs">
          <p className="text-[11px] text-slate-400 font-normal">
            Didesain &amp; Dikembangkan oleh <span className="text-slate-300 font-medium">Rohmatulloh</span> &bull; Hubungi:{' '}
            <a
              href="https://t.me/rAiengineer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-4 decoration-sky-500/40 hover:decoration-sky-400 transition-colors cursor-pointer"
            >
              Telegram
            </a>
          </p>

          <p className="text-[11px] text-slate-500">
            &copy; {currentYear} AngkatanKU &bull; XII IPS 1 &amp; 2 MA NU Islamiyah Asembagus.
          </p>
        </div>
      </div>
    </footer>
  );
}
