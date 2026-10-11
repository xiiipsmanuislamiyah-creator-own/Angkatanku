import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft,
  ShieldCheck, 
  School, 
  MapPin,
  ExternalLink,
  Code2,
  Database,
  Sparkles,
  Layers,
  Cpu,
  BadgeCheck,
  Send,
  Heart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from '../lib/data';

interface TentangWebProps {
  onNavigate: (tab: string) => void;
}

export default function TentangWeb({ onNavigate }: TentangWebProps) {
  const { currentStudent } = useAuth();
  const [devPhoto, setDevPhoto] = useState<string>('');
  const [devBio, setDevBio] = useState<any>(null);

  // Ambil data profil foto Rohmatulloh dari Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchDevData = async () => {
      try {
        // Jika akun yang sedang login adalah Rohmatulloh
        if (currentStudent && (currentStudent.induk === '240036' || currentStudent.name?.toLowerCase().includes('rohmat'))) {
          if (isMounted) {
            const photo = currentStudent.avatarUrl || currentStudent.url_gambar || currentStudent.photoUrl || '';
            if (photo) setDevPhoto(photo);
            setDevBio(currentStudent);
          }
          return;
        }

        // Cari di koleksi Firestore 'students' atau 'users'
        const snap = await getDocs(collection(db, 'students'));
        const found = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .find(s => 
            s.induk === '240036' || 
            s.name?.toLowerCase().includes('rohmatulloh') || 
            s.username?.toLowerCase().includes('rohmat') ||
            s.role?.toLowerCase().includes('developer')
          );

        if (found && isMounted) {
          setDevBio(found);
          const photo = found.avatarUrl || found.url_gambar || found.photoUrl || '';
          if (photo) setDevPhoto(photo);
        }
      } catch (err) {
        console.warn('Could not fetch developer profile photo in TentangWeb:', err);
      }
    };

    fetchDevData();
    return () => {
      isMounted = false;
    };
  }, [currentStudent]);

  // Daftar Komponen Stack Gambar resmi Simple Icons sesuai permintaan user
  const TECH_ITEMS = [
    {
      name: 'React',
      label: 'React 19',
      category: 'Frontend UI',
      iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/react.svg',
      color: '#61DAFB',
      desc: 'Library deklaratif berbasis komponen untuk antarmuka web modern reaktif.'
    },
    {
      name: 'TypeScript',
      label: 'TypeScript',
      category: 'Type Safety',
      iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/typescript.svg',
      color: '#3178C6',
      desc: 'Bahasa pemrograman dengan pengetikan statis untuk kehandalan kode jangka panjang.'
    },
    {
      name: 'Vite',
      label: 'Vite',
      category: 'Build Engine',
      iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/vite.svg',
      color: '#646CFF',
      desc: 'Peralatan frontend generasi baru dengan Hot Module Replacement super cepat.'
    },
    {
      name: 'Tailwind CSS',
      label: 'Tailwind CSS',
      category: 'Styling',
      iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/tailwindcss.svg',
      color: '#06B6D4',
      desc: 'Framework utilitas desain sistem responsif yang fleksibel dan efisien.'
    },
    {
      name: 'Firebase',
      label: 'Firebase',
      category: 'Database & Auth',
      iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/firebase.svg',
      color: '#FFCA28',
      desc: 'Firestore NoSQL database real-time cloud terenkripsi & manajemen otentikasi.'
    },
    {
      name: 'Cloudinary',
      label: 'Cloudinary',
      category: 'Media CDN',
      iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/cloudinary.svg',
      color: '#3448C5',
      desc: 'Layanan optimasi dan pengiriman aset gambar foto profil serta galeri digital.'
    },
    {
      name: 'GitHub',
      label: 'GitHub',
      category: 'Version Control',
      iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg',
      color: '#181717',
      desc: 'Platform repositori kolaboratif pelacak versi dan integrasi deployment.'
    },
    {
      name: 'Vercel',
      label: 'Vercel',
      category: 'Hosting & CDN',
      iconSrc: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/vercel.svg',
      color: '#000000',
      desc: 'Infrastruktur cloud berkecepatan tinggi untuk hosting frontend instan.'
    }
  ];

  return (
    <div className="relative min-h-screen pb-16">
      
      {/* 
        Hanya tombol < (icon SVG) di sudut kiri atas untuk kembali ke halaman sebelumnya.
        Tidak ada header bar navigasi yang kompleks.
      */}
      <div className="mb-6 pt-2">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm hover:shadow hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer group"
          title="Kembali ke halaman sebelumnya"
          aria-label="Kembali"
        >
          {/* Custom SVG icon < */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* 
        HERO SECTION DI TENGAH:
        - Logo favicon besar posisi di tengah
        - Background icon sama seperti header diatas (bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border border-sky-500/40)
        - Dibawahnya nama web dengan 2 warna: Angkatan + KU (text-emerald-500)
        - Dibawahnya deskripsi web
      */}
      <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto px-4 pt-2 pb-10">
        
        {/* Logo Favicon Besar */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border-2 border-sky-500/40 shadow-2xl p-2.5 flex items-center justify-center overflow-hidden mb-6 group hover:scale-105 transition-transform duration-300">
          <img 
            src="/gambar/favicon.png" 
            alt="Logo AngkatanKU" 
            className="w-full h-full object-contain drop-shadow-md"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/gambar/favicon.jpeg';
            }}
          />
        </div>

        {/* Nama Web 2 Warna */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display uppercase tracking-wider text-slate-900 dark:text-white mb-3">
          Angkatan<span className="text-emerald-500">KU</span>
        </h1>

        {/* Subtitle / Lembaga */}
        <p className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4">
          XII IPS 1 &amp; 2 &bull; MA NU ISLAMIYAH ASEMBAGUS
        </p>

        {/* Deskripsi Web */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
          <strong>AngkatanKU</strong> adalah portal digital terpadu dan wadah kenangan angkatan XII IPS MA NU Islamiyah Asembagus yang terus diperbarui. Platform ini memadukan direktori resmi 36 siswa, profil dewan guru, sistem Smart Card identitas terenkripsi, jadwal akademik teratur, peta interaktif lokasi sekolah, asisten cerdas Nusa AI, serta mading interaktif struktur angkatan untuk menjaga jalinan silaturahmi abadi.
        </p>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-5">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Versi 2.4.0 (Aktif)
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            36 Siswa &bull; 19 Pendidik
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Terakreditasi "A" (NSM: 131235070001)
          </span>
        </div>

      </div>

      {/* 
        BAGIAN TECH STACK DENGAN KOMPONEN GAMBAR SRC RESMI:
        <img src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/react.svg">
        ...
      */}
      <div className="mt-8 space-y-5 max-w-5xl mx-auto px-4">
        
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Code2 className="w-3.5 h-3.5" />
            <span>ARSITEKTUR &amp; TEKNOLOGI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
            Teknologi &amp; Stack Pengembangan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Komponen teknologi mutakhir yang digunakan untuk membangun sistem AngkatanKU
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 pt-3">
          {TECH_ITEMS.map((item, idx) => (
            <div 
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-center justify-between">
                {/* SVG Icon from Simple Icons CDN */}
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <img 
                    src={item.iconSrc} 
                    alt={item.name} 
                    className="w-full h-full object-contain dark:invert transition-all" 
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {item.category}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                  {item.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* 
        PROFIL PENGEMBANG & PENANGGUNG JAWAB:
        Menampilkan foto profil asli pengembang Rohmatulloh & Pimpinan Madrasah
      */}
      <div className="mt-12 space-y-5 max-w-5xl mx-auto px-4">
        
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
            Profil Pengembang &amp; Penanggung Jawab
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Sosok di balik inisiatif teknis dan pengesahan resmi platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          
          {/* Card 1: Rohmatulloh (Developer) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              
              {/* Foto Profil Pengembang Asli */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/80 shadow-md shrink-0 relative">
                {devPhoto ? (
                  <img 
                    src={devPhoto} 
                    alt="Foto Profil Rohmatulloh" 
                    className="w-full h-full object-cover"
                    onError={() => setDevPhoto('')}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-2xl">
                    R
                  </div>
                )}
              </div>

              {/* Detail Identitas */}
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                  Arsitek Sistem &amp; Pengembang Mandiri
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Rohmatulloh
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Siswa Kelas XII IPS 1 &bull; Angkatan 2026
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 leading-snug">
                  "{devBio?.motto || 'Tetap rendah hati, terus berjuang sampai cita-cita tergapai.'}"
                </p>
              </div>
            </div>

            {/* Link Teks Berwarna Telegram (Bukan icon utama) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Hubungi Pengembang:</span>
              <a
                href="https://t.me/rAiengineer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-500 hover:text-sky-400 font-bold underline underline-offset-4 decoration-sky-500/40 hover:decoration-sky-500 transition-colors cursor-pointer text-xs"
              >
                Telegram
              </a>
            </div>
          </div>

          {/* Card 2: Abdul Kholik, S.Ag. (Kepala Madrasah) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              
              {/* Foto Pimpinan Madrasah */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-500/80 shadow-md shrink-0 relative flex items-center justify-center">
                <span className="font-bold text-white text-xl sm:text-2xl font-mono tracking-wider select-none">
                  AH
                </span>
                <img 
                  src="https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500225/Card%20guru/lktnh3wgbd9ioin4tdli.jpg" 
                  alt="Foto Profil Abdul Kholik, S.Ag." 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Detail Identitas */}
              <div className="space-y-1 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                  Mengetahui &amp; Mengesahkan
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Abdul Kholik, S.Ag.
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kepala Yayasan / Pimpinan Perguruan MA NU Islamiyah Asembagus
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 leading-snug">
                  "Menjaga amanah madrasah, mencetak generasi berilmu amaliyah dan beramal ilmiah."
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Status Legitimasi:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                <BadgeCheck className="w-3.5 h-3.5" /> Resmi Disahkan
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Info Kontak & Alamat Sekolah */}
      <div className="mt-10 max-w-5xl mx-auto px-4">
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Madrasah Aliyah NU Islamiyah Asembagus</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Jl. Raya Pendidikan No. 09, Asembagus, Situbondo, Jawa Timur</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
            >
              Beranda
            </button>
            <button
              onClick={() => onNavigate('mading')}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-semibold transition-colors cursor-pointer"
            >
              Mading
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
