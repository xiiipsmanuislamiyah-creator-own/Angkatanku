import React from 'react';
import { motion } from 'motion/react';
import { 
  Code,
  ArrowRight, 
  Map, 
  Flag, 
  Sparkles, 
  Users, 
  UserCheck,
  Image as ImageIcon, 
  Activity, 
  Clock,
  BookOpen,
  Pin,
  Wrench,
  Gamepad2,
  Award,
  MessageSquare,
  Bot,
  Calendar,
  Compass,
  GraduationCap
} from 'lucide-react';
import NetworkEcosystem from '../components/NetworkEcosystem';
import StoryRings from '../components/StoryRings';

interface HomeProps {
  onNavigate: (tabId: string, pageName?: string) => void;
  activeTab: string;
}

export default function Home({ onNavigate, activeTab }: HomeProps) {
  
  const timelineEvents = [
    {
      title: 'Inisiasi Ruang Digital',
      period: 'Juli 2025',
      desc: 'Sistem web ini mulai dirancang dan dibangun sejak awal bulan Juli sebagai kearsipan memori abadi Angkatan 2026.',
      color: 'bg-indigo-500 text-indigo-500',
      icon: Code
    },
    {
      title: 'Langkah Awal Kelas XII',
      period: 'Juli - Agustus 2025',
      desc: 'Langkah pertama memasuki jenjang akhir sekolah menengah. Masa pengenalan kelas baru, menyatukan ritme belajar, dan menyongsong gerbang kelulusan.',
      color: 'bg-archive-teal text-archive-teal',
      icon: Users
    },
    {
      title: 'Membangun Relasi & Kolaborasi',
      period: 'September - Desember 2025',
      desc: 'Membangun relasi erat dan kolaborasi solid antar kelas (XII IPS 1 & XII IPS 2), bergotong royong, turnamen Class Meeting, serta mempererat tali persaudaraan angkatan.',
      color: 'bg-archive-sky text-archive-sky',
      icon: Activity
    },
    {
      title: 'Pemantapan Belajar Bersama',
      period: 'Januari - Maret 2026',
      desc: 'Menghadapi pemantapan ujian bersama, saling menyemangati belajar, dan mengukir memori terakhir di ruang kelas madrasah tercinta.',
      color: 'bg-amber-500 text-amber-500',
      icon: Sparkles
    },
    {
      title: 'Puncak Kenangan & Kelulusan',
      period: 'April - Mei 2026',
      desc: 'Menuntaskan perjuangan putih abu-abu, wisuda kelulusan madrasah, dan merayakan persahabatan sejati keluarga besar Angkatan 2026.',
      color: 'bg-emerald-500 text-emerald-500',
      icon: Flag
    },
    {
      title: 'Jejak Langkah Abadi',
      period: 'Tahun 2026 & Seterusnya',
      desc: 'Kisah, tawa, dan perjuangan seluruh teman seangkatan akan selalu tersimpan abadi di portal digital ini.',
      color: 'bg-teal-500 text-teal-500',
      icon: Clock
    }
  ];

  const quickStats = [
    { label: 'Siswa Terdaftar', val: '36 Siswa', icon: UserCheck, desc: '18 di IPS 1 & 18 di IPS 2 (15 Putra & 21 Putri)' },
    { label: 'Dewan Guru & Staf', val: '19 Pendidik', icon: GraduationCap, desc: 'Kepala Madrasah & Pengajar' },
    { label: 'Rombongan Belajar', val: '2 Rombel', icon: Users, desc: 'Kelas XII IPS 1 & XII IPS 2' },
    { label: 'Jadwal Akademik', val: '6 Hari KBM', icon: Calendar, desc: 'Senin s/d Sabtu Terjadwal' }
  ];

  const launcherItems = [
    {
      id: 'anggota',
      title: 'Anggota Siswa',
      desc: 'Presensi & biodata siswa-siswi kelas XII IPS 1 & 2.',
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-600',
      badge: '36 Siswa',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'struktur',
      title: 'Struktur Kelas',
      desc: 'Pengurus harian & struktur organisasi kelas.',
      icon: Users,
      color: 'bg-teal-500/10 text-archive-teal',
      badge: 'Aktif',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'jadwal',
      title: 'Jadwal Pelajaran',
      desc: 'Waktu kegiatan belajar mengajar XII IPS.',
      icon: Calendar,
      color: 'bg-sky-500/10 text-archive-sky',
      badge: 'Aktif',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'kegiatan',
      title: 'Kegiatan Kelas',
      desc: 'Dokumentasi agenda, P5, & proyek seru.',
      icon: Activity,
      color: 'bg-teal-500/10 text-archive-teal',
      badge: 'Aktif',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'galeri',
      title: 'Galeri Memori',
      desc: 'Galeri tawa, canda, & album study tour.',
      icon: ImageIcon,
      color: 'bg-emerald-500/10 text-archive-mint',
      badge: 'Aktif',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'prestasi',
      title: 'Papan Prestasi',
      desc: 'Kumpulan torehan prestasi siswa-siswi angkatan.',
      icon: Award,
      color: 'bg-orange-500/10 text-orange-500',
      badge: 'Aktif',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'alat-game',
      title: 'Alat & Game',
      desc: 'Kumpulan alat bantu belajar interaktif & mini game.',
      icon: Wrench,
      color: 'bg-indigo-500/10 text-indigo-600',
      badge: 'Aktif',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'feed',
      title: 'Feed Angkatan',
      desc: 'Ruang interaksi mini & postingan kelas.',
      icon: MessageSquare,
      color: 'bg-amber-500/10 text-amber-500',
      badge: 'Aktif',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'nusa-ai',
      title: 'Nusa AI Bot',
      desc: 'Asisten pintar cerdas pendukung belajar angkatan.',
      icon: Bot,
      color: 'bg-teal-500/10 text-archive-teal',
      badge: 'Aktif',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    },
    {
      id: 'guru',
      title: 'Daftar Guru',
      desc: 'Profil pahlawan tanpa tanda jasa pendidik kita.',
      icon: BookOpen,
      color: 'bg-rose-500/5 text-rose-400',
      badge: 'Segera Hadir',
      badgeColor: 'bg-slate-100 text-slate-400 border-slate-200/60'
    },
    {
      id: 'mading',
      title: 'Mading Digital',
      desc: 'Karya tulis, puisi, opini, & mading digital.',
      icon: Pin,
      color: 'bg-violet-500/5 text-violet-400',
      badge: 'Segera Hadir',
      badgeColor: 'bg-slate-100 text-slate-400 border-slate-200/60'
    },
    {
      id: 'tools',
      title: 'Tools Belajar',
      desc: 'Kalkulator pintar, instrumen riset & utilitas.',
      icon: Wrench,
      color: 'bg-indigo-500/5 text-indigo-400',
      badge: 'Segera Hadir',
      badgeColor: 'bg-slate-100 text-slate-400 border-slate-200/60'
    },
    {
      id: 'game',
      title: 'Game Edukasi',
      desc: 'Trivia asyik, puzzle memori & kuis santai.',
      icon: Gamepad2,
      color: 'bg-fuchsia-500/5 text-fuchsia-400',
      badge: 'Segera Hadir',
      badgeColor: 'bg-slate-100 text-slate-400 border-slate-200/60'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <div className="space-y-12">
      {/* 3 Story Rings Section (Top of Dashboard) */}
      <StoryRings onNavigate={onNavigate} />

      {/* 1. Hero & Network SVG Section */}
      <section className="relative min-h-[calc(100vh-180px)] flex items-center pt-2 lg:pt-4 overflow-visible">
        {/* Modern, soft ambient depth - Ocean Blue & Islamic Emerald Green */}
        <div className="absolute inset-0 -z-10 overflow-visible pointer-events-none">
          {/* Top ethereal spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1)_0%,rgba(14,165,233,0.05)_45%,transparent_75%)] dark:block hidden blur-xl" />
          {/* Left-top soft sky ambient glow */}
          <div className="absolute -left-24 top-1/4 w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1)_0%,rgba(14,165,233,0)_70%)] blur-2xl" />
          {/* Right-bottom soft emerald ambient glow */}
          <div className="absolute -right-24 bottom-1/4 w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,rgba(16,185,129,0)_70%)] blur-2xl" />
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full"
        >
          
          {/* Hero Left Content */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-6 z-10 text-left">
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] sm:text-xs font-mono font-medium shadow-xs dark:shadow-[0_0_20px_-3px_rgba(16,185,129,0.2)] backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>PORTAL DIGITAL ANGKATANKU &bull; XII IPS MA NU ISLAMIYAH</span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] font-display"
            >
              Setiap langkah kita<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400">
                meninggalkan jejak abadi.
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl"
            >
              Wadah kenangan digital resmi milik <span className="font-extrabold text-slate-900 dark:text-white">Angkatan<span className="text-emerald-500">KU</span></span> (XII IPS 1 & 2 MA NU Islamiyah Asembagus). Di sinilah seluruh struktur kelas, jadwal, galeri momen, story interaktif, hingga rekam jejak kita diabadikan hingga momen kelulusan.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap gap-3 sm:gap-4 pt-1 sm:pt-2"
            >
              <button 
                onClick={() => onNavigate('galeri')}
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold transition-all duration-300 shadow-md hover:shadow-emerald-500/25 flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm active:scale-95"
              >
                <span>Jelajahi Arsip</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              
              <a 
                href="#timeline-section"
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-300 flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm active:scale-95 shadow-xs"
              >
                <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                <span>Lihat Kronologi</span>
              </a>
            </motion.div>
          </div>

          {/* SVG Ecosystem Right Content */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-6 flex justify-center items-center relative"
          >
            <NetworkEcosystem onNodeClick={onNavigate} activeTab={activeTab} />
          </motion.div>

        </motion.div>
      </section>

      {/* 2. Official Angkatan Showcase Banner */}
      <motion.section 
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-md bg-slate-900 group"
      >
        <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full overflow-hidden">
          <img 
            src="https://res.cloudinary.com/dhxfke7kq/image/upload/v1791122575/Assest/jfct1twjurj7t3innpzt.jpg" 
            onError={(e) => { e.currentTarget.src = '/gambar/banner.jpeg'; }}
            alt="Banner Angkatan XII IPS MA NU Islamiyah Asembagus" 
            className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-700 ease-out"
          />
        </div>
      </motion.section>

      {/* 3. Quick Metrix Board */}
      <section className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-md">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {quickStats.map((stat, idx) => {
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center md:items-start text-center md:text-left space-y-2.5 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/60 dark:hover:bg-slate-900/90 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/25 dark:border-emerald-700/60 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                  <stat.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
                  {stat.val}
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {stat.label}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-normal">
                  {stat.desc}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Poetic Timeline Section (Jejak Langkah Siswa) */}
      <section id="timeline-section" className="scroll-mt-24 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono font-medium">
            KRONOLOGI ANGKATAN
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            Jejak Langkah Angkatan 2026
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
            Menelusuri rangkaian tonggak romansa pembelajaran selama satu tahun penuh. Dari gugup awal masuk sekolah hingga keabadian memori digital Angkatan 2026.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Center line (only visible on md+) */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-archive-teal via-archive-sky/80 to-transparent -translate-x-1/2 rounded-full hidden md:block"></div>
          {/* Mobile left line */}
          <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-archive-teal via-archive-sky/80 to-transparent rounded-full md:hidden"></div>
 
          <div className="space-y-12">
            {timelineEvents.map((ev, idx) => {
               const isEven = idx % 2 === 0;
               return (
                <div key={idx} className={`relative flex flex-col md:flex-row items-start md:items-stretch gap-6 md:gap-0 ${isEven ? '' : 'md:flex-row-reverse'}`}>
                  
                  {/* Text panel */}
                  <div className="w-full md:w-1/2 pl-14 md:pl-0 pr-0 md:pr-12 md:text-right">
                    {ev.title ? (
                      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-archive-teal/40 dark:hover:border-archive-teal/60 shadow-xs hover:shadow-md transition-all space-y-2">
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-archive-teal bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-archive-teal/20 dark:border-archive-teal/40">
                          {ev.period}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">{ev.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ev.desc}</p>
                      </div>
                    ) : (
                      <div className={`py-4 flex items-center ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                        <div className="border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 rounded-2xl px-5 py-3 w-full max-w-xs text-slate-400 dark:text-slate-500 text-[10px] font-mono tracking-wider text-center md:text-left">
                          LANGKAH_BELUM_DIMULAI
                        </div>
                      </div>
                    )}
                  </div>
 
                  {/* Bullet center dot */}
                  <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-10 flex items-center justify-center">
                    <div className={`w-9 h-9 rounded-full ${(ev.color || 'bg-slate-200').split(' ')[0]} border-4 border-white dark:border-slate-950 flex items-center justify-center shadow-md text-white transition-transform duration-300 transform hover:scale-110`}>
                      <ev.icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="hidden md:block w-1/2" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Quick Portal cards */}
      <section className="space-y-6 sm:space-y-8">
        <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white text-center">Akses Cepat Sistem</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-archive-teal/50 dark:hover:border-archive-teal/60 transition-all flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-mono font-bold text-archive-teal">NUSA_AI_PORTAL</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1 mb-2 font-display">Tanya Nusa AI</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Punya pertanyaan seputar jadwal hari Selasa, struktur pengurus kelas, atau info angkatan? Nusa AI siap menjawab.</p>
            </div>
            <button 
              onClick={() => onNavigate('nusa-ai')}
              className="mt-5 flex items-center gap-1.5 text-xs font-bold text-archive-teal hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer text-left select-none"
            >
              <span>Uji Coba Asisten</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-archive-sky/50 dark:hover:border-archive-sky/60 transition-all flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-mono font-bold text-archive-sky">SOCIAL_HUB</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1 mb-2 font-display">Feed Angkatan</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Intip celotehan, komentar, dan potret kegiatan harian siswa di luar kelas. Kamu juga dapat menambahkan coretan barumu!</p>
            </div>
            <button 
              onClick={() => onNavigate('feed')}
              className="mt-5 flex items-center gap-1.5 text-xs font-bold text-archive-sky hover:text-sky-400 cursor-pointer text-left select-none"
            >
              <span>Gabung Diskusi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-400/60 transition-all flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-mono font-bold text-indigo-500">INSTRUMENT_HUB</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1 mb-2 font-display">Alat &amp; Game</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Nikmati kumpulan instrumen belajar mandiri, kuesioner otomatis, kalkulator Slovin, serta mini trivia game memori.</p>
            </div>
            <button 
              onClick={() => onNavigate('alat-game')}
              className="mt-5 flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 cursor-pointer text-left select-none"
            >
              <span>Buka Hub Alat &amp; Game</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
