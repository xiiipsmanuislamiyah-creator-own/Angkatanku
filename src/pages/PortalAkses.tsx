import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserCheck,
  Calendar, 
  Award, 
  Image as ImageIcon, 
  MessageSquare, 
  Bot, 
  BookOpen, 
  Pin, 
  Wrench, 
  Gamepad2, 
  ArrowRight, 
  Compass, 
  Sparkles,
  X,
  FileText,
  Bookmark,
  CheckCircle2,
  Lock,
  ArrowLeft
} from 'lucide-react';

interface PortalAksesProps {
  onNavigate: (tabId: string, pageName?: string) => void;
  unlocked?: boolean;
  onUnlock?: () => void;
}

export default function PortalAkses({ onNavigate, unlocked = false, onUnlock }: PortalAksesProps) {
  const [activeModal, setActiveModal] = useState<'none' | 'guru' | 'mading' | 'tools' | 'game'>('none');
  const [clickCount, setClickCount] = useState(0);

  const handleHubClick = () => {
    if (unlocked) return;
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 3) {
      if (onUnlock) onUnlock();
    }
  };

  // List of Mading Posts for "Mading Digital"
  const madingPosts = [
    {
      title: 'Menyambut Generasi Emas Angkatan 2026',
      author: 'Tim Redaksi Kelas',
      date: '23 Juni 2026',
      excerpt: 'Bagaimana peran kita sebagai generasi muda Angkatan 2026 menghadapi tantangan masa depan? Semangat kebersamaan dan karya nyata menjadi kunci...',
      tags: ['Sains', 'Opini']
    },
    {
      title: 'Untaian Puisi: Senja di Lorong MA NU',
      author: 'Andi Pratama',
      date: '18 Juni 2026',
      excerpt: 'Di bawah atap madrasah tercinta, kita merajut mimpi di antara derai tawa dan catatan kenangan belajar yang berserakan...',
      tags: ['Sastra', 'Puisi']
    }
  ];

  // Simple calculator state for "Tools Belajar"
  const [popSample, setPopSample] = useState<string>('120');
  const [marginErr, setMarginErr] = useState<string>('5');
  const [sampleResult, setSampleResult] = useState<number | null>(null);

  const calculateSlovin = () => {
    const N = parseFloat(popSample);
    const e = parseFloat(marginErr) / 100;
    if (isNaN(N) || isNaN(e) || N <= 0 || e <= 0) return;
    // Slovin's formula: n = N / (1 + N * e^2)
    const res = N / (1 + N * e * e);
    setSampleResult(Math.ceil(res));
  };

  return (
    <div className="space-y-10 py-4 relative">
      
      {/* Header section with back to control center button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div className="space-y-2">
          <button
            onClick={handleHubClick}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-teal-300 border border-slate-800 text-[11px] font-mono font-semibold uppercase tracking-wider hover:bg-slate-800 active:scale-95 transition-all cursor-pointer select-none"
          >
            <Compass className="w-3.5 h-3.5 animate-spin text-archive-teal" style={{ animationDuration: '6s' }} />
            {unlocked ? (
              <span>HUB PUSAT AKSES EKOSISTEM (TERBUKA)</span>
            ) : (
              <span>HUB PUSAT AKSES EKOSISTEM (TERBATAS)</span>
            )}
          </button>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 font-display">
            Akses Semua Halaman &amp; Layanan
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Selamat datang di gerbang pusat kendali kelas XII IPS. Di sini Anda dapat langsung melompat ke seluruh halaman operasional aktif atau berinteraksi dengan modul-modul dinamis di bawah ini.
          </p>
        </div>

        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all duration-200 shadow-sm cursor-pointer select-none text-xs self-start md:self-center"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Kembali ke Pusat Kendali</span>
        </button>
      </div>

      {/* PROMOTED / HIGHLIGHTED HERO CARDS (Feed Angkatan & Nusa AI Bot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Prominent Card 1: Feed Angkatan */}
        <div className="lg:col-span-7 rounded-3xl p-6 bg-gradient-to-tr from-slate-900 via-slate-950 to-amber-950 border border-amber-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between group min-h-[290px]">
          {/* Cyber glow background */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-500"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-display">Feed Angkatan</h3>
                  <p className="text-[10px] font-mono text-amber-400/80 tracking-widest uppercase">INTERAKSI UTAMA ANGKATAN</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider border ${
                unlocked 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' 
                  : 'bg-red-500/20 text-red-300 border-red-400/30 animate-pulse'
              }`}>
                {unlocked ? 'PROMOTED / LIVE' : '🔒 TERKUNCI'}
              </span>
            </div>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl">
              Ruang publik murni tempat saling berbagi pesan, pengumuman penting angkatan, diskusi interaktif angkatan, hingga update harian kelas. Dilengkapi dengan forum responsif ramah GPU.
            </p>

            {/* Quick stats teasers */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono text-slate-300">24+ Diskusi Aktif Hari Ini</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-300">Respons Instan 100%</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between relative z-10 mt-4">
            <span className="text-[10px] font-mono text-slate-400">
              {unlocked ? 'STATUS: TERKONEKSI AMAN' : 'STATUS: DIBATASI (Akses Terkunci)'}
            </span>
            <button
              onClick={() => onNavigate('feed')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 flex items-center gap-2 cursor-pointer select-none"
            >
              <span>{unlocked ? 'Buka Feed Angkatan' : 'Akses Terbatas'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prominent Card 2: Nusa AI Bot */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-gradient-to-tr from-slate-900 via-slate-950 to-violet-950 border border-violet-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between group min-h-[290px]">
          {/* Cyber glow background */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/15 transition-all duration-500"></div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-violet-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-display">Nusa AI Bot</h3>
                  <p className="text-[10px] font-mono text-violet-400/80 tracking-widest uppercase">ASISTEN BELAJAR INTELEKTUAL</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider border ${
                unlocked 
                  ? 'bg-violet-500/20 text-violet-300 border-violet-400/30' 
                  : 'bg-red-500/20 text-red-300 border-red-400/30 animate-pulse'
              }`}>
                {unlocked ? 'AI ACTIVE' : '🔒 TERKUNCI'}
              </span>
            </div>

            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-md">
              Kecerdasan buatan cerdas yang didesain khusus untuk membantumu belajar, berdiskusi, merangkum materi sekolah, serta eksplorasi wawasan angkatan secara interaktif.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <span className="bg-white/5 border border-white/5 rounded px-2.5 py-1 text-[9px] font-mono text-violet-300">MODUL BELAJAR</span>
              <span className="bg-white/5 border border-white/5 rounded px-2.5 py-1 text-[9px] font-mono text-violet-300">INFO ANGKATAN</span>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between relative z-10 mt-4">
            <span className="text-[10px] font-mono text-slate-400">
              {unlocked ? 'SISTEM: ONLINE (GEMINI)' : 'SISTEM: DIBATASI (Akses Terkunci)'}
            </span>
            <button
              onClick={() => onNavigate('nusa-ai')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold text-xs hover:from-violet-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300 flex items-center gap-2 cursor-pointer select-none"
            >
              <span>{unlocked ? 'Konsultasi AI' : 'Akses Terbatas'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ALL ACCESS INTERACTIVE GRID OF FEATURES */}
      <div className="space-y-6">
        <div className="space-y-1 text-left">
          <h2 className="text-xl font-bold tracking-tight text-slate-800 font-display">Halaman &amp; Fitur Interaktif Lainnya</h2>
          <p className="text-xs text-slate-500">Semua pintasan halaman aktif, lengkap dengan modul utilitas kelas yang interaktif.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Featured Item 1: Landing Page & Prolog Visual */}
          <div 
            onClick={() => onNavigate('landing')}
            className="group bg-gradient-to-br from-amber-50 to-orange-50/30 dark:from-amber-950/20 dark:to-slate-900 border-2 border-amber-500/40 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center group-hover:scale-105 duration-300 transition-transform shadow-md shadow-amber-500/20">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider bg-amber-500 text-white">
                  HALAMAN MUKA
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display group-hover:text-amber-600 transition-colors flex items-center gap-1.5">
                  Landing Page &amp; Prolog Visual
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  Pameran visual sinematik, slideshow gedung madrasah, dan galeri polaroid kenangan angkatan 2026.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold uppercase">
              <span>BUKA_LANDING_PAGE</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Featured Item 2: Pusat Informasi Ekosistem & Legalitas */}
          <div 
            onClick={() => onNavigate('tentang')}
            className="group bg-gradient-to-br from-emerald-50 to-teal-50/30 dark:from-emerald-950/20 dark:to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 duration-300 transition-transform shadow-md shadow-emerald-600/20">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider bg-emerald-600 text-white">
                  INFORMASI RESMI
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  Pusat Informasi Ekosistem
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  Dokumentasi profil platform, arsitektur inovasi mandiri siswa, kebijakan privasi, serta legitimasi kelembagaan MA NU Islamiyah.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase">
              <span>BUKA_PUSAT_INFORMASI</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Item 0: Anggota Siswa */}
          <div 
            onClick={() => onNavigate('anggota')}
            className="group bg-white border border-slate-200/80 hover:border-emerald-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
                  36 SISWA
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-emerald-600 transition-colors">Anggota Siswa</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Daftar presensi dan biodata resmi seluruh siswa angkatan XII IPS 1 & 2 (15 Laki-Laki, 21 Perempuan).</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>PRESENSI_RESMI</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Item 1: Struktur Kelas */}
          <div 
            onClick={() => onNavigate('struktur')}
            className="group bg-white border border-slate-200/80 hover:border-teal-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
                  AKTIF
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-teal-600 transition-colors">Struktur Kelas</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Organisasi kepengurusan kelas XII IPS, tugas operasional &amp; tanggung jawab kelas.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>NATIVE_NAVIGATION</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Item 2: Jadwal Pelajaran */}
          <div 
            onClick={() => onNavigate('jadwal')}
            className="group bg-white border border-slate-200/80 hover:border-sky-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
                  AKTIF
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-sky-600 transition-colors">Jadwal Pelajaran</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Sistem kalender pelajaran mingguan, guru pengampu, serta waktu pengerjaan tugas akademik.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>NATIVE_NAVIGATION</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Item 3: Guru Ngajar (Daftar Guru) - Beautiful Interactivity with Full Screen Page */}
          <div 
            onClick={() => onNavigate('guru')}
            className="group bg-white border border-slate-200/80 hover:border-rose-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-teal-50 text-teal-600 border-teal-200">
                  BUKA HALAMAN
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-rose-500 transition-colors flex items-center gap-1.5">
                  Guru Ngajar (Daftar Guru)
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Profil pahlawan tanpa tanda jasa pendidik dan tenaga kependidikan MA NU Islamiyah Asembagus.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>NATIVE_NAVIGATION</span>
              <ArrowRight className="w-3.5 h-3.5 text-rose-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Item 4: Papan Prestasi */}
          <div 
            onClick={() => onNavigate('prestasi')}
            className="group bg-white border border-slate-200/80 hover:border-orange-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
                  AKTIF
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-orange-500 transition-colors">Papan Prestasi</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Galeri pencapaian, sertifikat penghargaan, serta kontribusi siswa-siswi berprestasi XII IPS.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>NATIVE_NAVIGATION</span>
              <ArrowRight className="w-3.5 h-3.5 text-orange-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Item 5: Galeri Memori */}
          <div 
            onClick={() => onNavigate('galeri')}
            className="group bg-white border border-slate-200/80 hover:border-emerald-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
                  AKTIF
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-emerald-500 transition-colors">Galeri Memori</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Arsip dokumentasi visual, momen tak terlupakan, kebersamaan, dan petualangan XII IPS.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>NATIVE_NAVIGATION</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Item 6: Alat & Game */}
          <div 
            onClick={() => onNavigate('alat-game')}
            className="group bg-white border border-slate-200/80 hover:border-teal-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-emerald-50 text-emerald-600 border-emerald-200">
                  AKTIF
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-teal-600 transition-colors">Alat &amp; Game</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Modul instrumen akademik, kalkulator statistik belajar, kuesioner, dan trivia game interaktif.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>NATIVE_NAVIGATION</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Item 7: Mading Digital - Interactive Preview Modal */}
          <div 
            onClick={() => setActiveModal('mading')}
            className="group bg-white border border-slate-200/80 hover:border-violet-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <Pin className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-violet-50 text-violet-600 border-violet-200">
                  INTERACTIVE
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-violet-500 transition-colors">Mading Digital</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Kumpulan karya literasi kelas, opini siswa, karikatur kreativitas, &amp; puisi kontemporer.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>INTERACTIVE_PREVIEW</span>
              <span className="text-violet-500 font-bold text-[10px] group-hover:underline">Buka Mading ↗</span>
            </div>
          </div>

          {/* Item 8: Tools Belajar - Interactive Slovin Calculator */}
          <div 
            onClick={() => setActiveModal('tools')}
            className="group bg-white border border-slate-200/80 hover:border-indigo-500/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-indigo-50 text-indigo-600 border-indigo-200">
                  UTILITY TOOL
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-indigo-500 transition-colors">Tools Belajar</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Kalkulator statistik pembelajaran, pembuat angket kuesioner, &amp; kriteria sampel survei.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>RUN_CALCULATOR</span>
              <span className="text-indigo-500 font-bold text-[10px] group-hover:underline">Hitung Sampel riset ↗</span>
            </div>
          </div>

          {/* Item 9: Game Edukasi (Game AI) */}
          <div 
            onClick={() => setActiveModal('game')}
            className="group bg-slate-50/70 border border-slate-200 hover:border-rose-400/40 rounded-2xl p-5 hover:shadow-sm transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-105 duration-300 transition-transform">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border bg-slate-100 text-slate-500 border-slate-300">
                  DEVELOPMENT TEASER
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 font-display group-hover:text-rose-500 transition-colors flex items-center gap-1.5">
                  Game Edukasi AI
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Simulasi interaksi cerdas berbasis kecerdasan buatan, trivia kuis pengetahuan angkatan, &amp; bento game.</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>TEASER_MENU_ONLY</span>
              <span className="text-slate-400 text-[10px]">Detail Teaser</span>
            </div>
          </div>

        </div>
      </div>

      {/* MODALS DRAWERS SYSTEM (Lightweight, beautiful, fully custom-styled overlays) */}
      <AnimatePresence>
        {activeModal !== 'none' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveModal('none')}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-left overflow-hidden max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveModal('none')}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* MODAL 2: Mading Digital */}
              {activeModal === 'mading' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                      <Pin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 font-display">Mading Digital XII IPS</h3>
                      <p className="text-[10px] font-mono text-slate-400 tracking-wider">KARYA TULIS &amp; SASTRA MANDIRI</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {madingPosts.map((post, idx) => (
                      <div key={idx} className="p-5 rounded-2xl border border-slate-150 bg-white shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1.5">
                            {post.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="text-[9px] font-mono font-bold uppercase bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{post.date}</span>
                        </div>
                        <h4 className="font-bold text-base text-slate-800 font-display">{post.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">{post.excerpt}</p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Penulis: <strong className="text-slate-700">{post.author}</strong></span>
                          <span className="text-violet-500 font-semibold hover:underline cursor-pointer">Baca Selengkapnya</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center pt-2">
                    <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-sm">
                      <span>Buat Postingan Baru</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL 3: Tools Belajar (Slovin Calculator) */}
              {activeModal === 'tools' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 font-display">Kalkulator Slovin Riset &amp; Survei</h3>
                      <p className="text-[10px] font-mono text-slate-400 tracking-wider">HITUNG SAMPEL METODE KUANTITATIF</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Gunakan Rumus Slovin (<strong className="font-mono text-slate-700 font-bold">n = N / (1 + N * e²)</strong>) untuk menentukan jumlah sampel ideal kebutuhan survei angkatan secara instan.
                  </p>

                  <div className="space-y-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Jumlah Populasi (N)</label>
                        <input 
                          type="number" 
                          value={popSample}
                          onChange={(e) => setPopSample(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                          placeholder="Contoh: 120"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Batas Kesalahan (e) %</label>
                        <input 
                          type="number" 
                          value={marginErr}
                          onChange={(e) => setMarginErr(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                          placeholder="Contoh: 5"
                        />
                      </div>
                    </div>

                    <button
                      onClick={calculateSlovin}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Kalkulasi Sampel Riset</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {sampleResult !== null && (
                      <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                        <span className="text-[10px] font-mono text-indigo-700 font-bold tracking-wider uppercase block">Sampel Minimum Diperlukan (n)</span>
                        <span className="text-2xl font-bold font-mono text-indigo-700 block mt-1">{sampleResult} <span className="text-xs font-normal">Responden</span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODAL 4: Game AI (Teaser) */}
              {activeModal === 'game' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 font-display">Teaser Game Edukasi AI</h3>
                      <p className="text-[10px] font-mono text-rose-500 tracking-wider">TAHAP PERANCANGAN DESAIN</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-dashed border-rose-300 bg-rose-50/30 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 font-display">Akses Terkunci / Dalam Konstruksi</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Sesuai spesifikasi pengembang, modul game ini hanya ditayangkan sebagai teaser menu interaktif. Nantikan rilis beta game kuis interaktif dan trivia seru angkatan terintegrasi asisten pintar!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-center text-[10px] font-mono text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>HANYA MENAMPILKAN MENU DESAIN</span>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
