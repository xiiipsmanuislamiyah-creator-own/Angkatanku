import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Compass, 
  ChevronDown, 
  ArrowRight, 
  ArrowUp,
  X,
  Maximize2
} from 'lucide-react';
import SchoolLocationMap from '../components/SchoolLocationMap';

interface LandingPageProps {
  onNavigate: (tab: string, pageName?: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  // Hero Carousel State
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; caption: string; sub?: string } | null>(null);

  const heroImages = [
    {
      src: 'https://res.cloudinary.com/dhxfke7kq/image/upload/v1791122575/Assest/jfct1twjurj7t3innpzt.jpg',
      alt: 'Banner Resmi Angkatan XII IPS MA NU Islamiyah Asembagus'
    },
    {
      src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000fe60820b81ace890328ee35.jpeg',
      alt: 'Gedung Utama MA NU Islamiyah'
    },
    {
      src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000e3d88209baeee4472c42b644.jpg',
      alt: 'Kubah Masjid Madrasah'
    },
    {
      src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_0000000030348211bd9c6c6bde019aa3.jpg',
      alt: 'Suasana Canda Pelataran'
    },
    {
      src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000ed5c81faa6b4ce014deb29c3.jpg',
      alt: 'Lorong dan Koridor Sekolah'
    }
  ];

  // Auto cycle hero images every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Scroll listener for sticky navbar blur and subtle parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FCFCF8] text-[#121212] font-['Manrope',sans-serif] min-h-screen overflow-x-hidden selection:bg-[#121212] selection:text-[#FCFCF8]">
      
      {/* 1. FIXED NAVBAR DENGAN EFEK TRANSISI SCROLL */}
      <nav 
        className={`fixed top-0 w-full z-50 px-4 sm:px-8 transition-all duration-300 flex justify-between items-center ${
          scrollY > 80 
            ? 'bg-black/85 backdrop-blur-md shadow-lg py-3 border-b border-white/10' 
            : 'py-4 sm:py-6'
        }`}
      >
        <div 
          onClick={() => onNavigate('home', 'Beranda Angkatan')}
          className="flex items-center gap-3 cursor-pointer group"
          title="Masuk ke Beranda Angkatan (/home)"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 backdrop-blur-md p-1 border border-white/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <img 
              src="https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/favicon.png" 
              alt="Logo AngkatanKU" 
              className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            />
          </div>
          
          <div className="flex flex-col">
            <span className="font-sans font-extrabold text-lg sm:text-xl tracking-tight uppercase text-white drop-shadow-md leading-none">
              ANGKATAN<span className="text-emerald-500">KU</span>
            </span>
            <span className="text-[9px] font-bold tracking-widest text-gray-300 uppercase leading-tight mt-0.5">
              XII IPS 1 &amp; 2 • MA NU ISLAMIYAH
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden md:flex gap-8 font-sans text-xs tracking-[0.2em] uppercase font-bold text-white drop-shadow-md">
            <button 
              onClick={() => scrollToSection('prolog')} 
              className="hover:text-[#B89B5E] transition-colors cursor-pointer"
            >
              Prolog
            </button>
            <button 
              onClick={() => scrollToSection('ruang')} 
              className="hover:text-[#B89B5E] transition-colors cursor-pointer"
            >
              Saksi
            </button>
            <button 
              onClick={() => scrollToSection('kenangan')} 
              className="hover:text-[#B89B5E] transition-colors cursor-pointer"
            >
              Kenangan
            </button>
            <button 
              onClick={() => scrollToSection('lokasi')} 
              className="hover:text-[#B89B5E] transition-colors cursor-pointer"
            >
              Lokasi
            </button>
          </div>

          {/* Tombol Masuk Beranda Angkatan (Story, Feed, & Kelas) */}
          <button 
            onClick={() => onNavigate('home', 'Beranda Angkatan')}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
          >
            <span>Beranda Angkatan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION DENGAN SLIDESHOW FULL BLEED & TIPOGRAFI ASLI */}
      <section className="relative w-full h-[100svh] min-h-[640px] flex items-center justify-center overflow-hidden bg-black">
        
        {/* Background Images Slideshow Full Bleed */}
        <div className="absolute inset-0 z-0 bg-black">
          {heroImages.map((img, idx) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              style={{
                transform: `translateY(${Math.min(scrollY * 0.25, 200)}px) scale(1.05)`,
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out z-0 ${
                currentHeroIndex === idx ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          
          {/* Lapisan Kontras Khusus: Mencegah teks bertabrakan dengan tulisan di dinding gedung */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75 z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/50 via-black/20 to-transparent z-10" />
        </div>

        {/* Hero Content: Tipografi Megah Asli dengan Proteksi Kontras */}
        <div className="relative z-20 w-full px-5 sm:px-6 flex flex-col items-center text-center mt-12">
          {/* Asset Grafis Judul Angkatan */}
          <div className="max-w-[88vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto my-2">
            <img 
              src="https://res.cloudinary.com/dhxfke7kq/image/upload/v1788992142/Assest/mgdqwfulzzr3drhqbqll.png" 
              alt="XII IPS Satu Keluarga" 
              className="w-full max-w-[480px] md:max-w-[850px] lg:max-w-[1000px] h-auto object-contain mx-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]"
            />
          </div>
          
          <p className="font-sans text-xs sm:text-base md:text-lg font-medium tracking-wide text-gray-200 max-w-2xl mx-auto mt-6 sm:mt-10 leading-relaxed drop-shadow-md">
            Merayakan memori, ruang, dan waktu. Arsip digital abadi untuk XII IPS 1 &amp; XII IPS 2 MA NU Islamiyah Asembagus.
          </p>

          {/* Tombol Navigasi Cepat Masuk Langsung ke Beranda Angkatan (Stories, Feed, Kelas) */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 mt-8 w-full sm:w-auto">
            <button 
              onClick={() => onNavigate('home', 'Beranda Angkatan')}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2.5 px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-xl hover:shadow-emerald-500/30 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Masuk ke Beranda Angkatan</span>
            </button>
            <button 
              onClick={() => scrollToSection('prolog')}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wider uppercase border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              <span>Buka Lembar Cerita</span>
              <ChevronDown className="w-4 h-4 text-[#B89B5E]" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. BANNER TEKS BERJALAN (MARQUEE) */}
      <div className="w-full bg-[#121212] text-[#FCFCF8] py-4 overflow-hidden flex whitespace-nowrap items-center border-y border-[#121212]/20 relative z-30 shadow-lg">
        <div className="animate-marquee flex gap-12 font-sans text-sm tracking-widest uppercase items-center font-bold text-[#B89B5E]">
          <span>MA NU Islamiyah Asembagus</span> <span>•</span>
          <span>Angkatan 2026</span> <span>•</span>
          <span>XII IPS 1</span> <span>•</span>
          <span>XII IPS 2</span> <span>•</span>
          <span>Satu Keluarga</span> <span>•</span>
          <span>MA NU Islamiyah Asembagus</span> <span>•</span>
          <span>Angkatan 2026</span> <span>•</span>
          <span>XII IPS 1</span> <span>•</span>
          <span>XII IPS 2</span> <span>•</span>
          <span>Satu Keluarga</span> <span>•</span>
        </div>
      </div>

      {/* 4. BAGIAN 01: PROLOG (Penyempurnaan Area Album: Rapi di HP, Artistik di Desktop) */}
      <section id="prolog" className="py-20 md:py-32 px-5 sm:px-10 lg:px-20 bg-[#FCFCF8] relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          {/* Teks Prolog */}
          <div className="w-full lg:w-5/12">
            <span className="font-sans text-xs tracking-widest font-extrabold text-[#B89B5E] uppercase mb-4 sm:mb-6 block">
              01. Prolog
            </span>
            <h2 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl md:text-6xl text-[#121212] leading-tight mb-6 sm:mb-8 font-bold">
              Lebih dari<br />sekadar nama.
            </h2>
            <p className="font-sans text-[#121212]/90 text-base sm:text-lg leading-relaxed mb-5 font-medium">
              Di balik dinding MA NU Islamiyah Asembagus, kita datang dari latar belakang yang berbeda, disatukan oleh waktu, dan diikat oleh kenangan. 
            </p>
            <p className="font-sans text-[#121212]/80 text-base sm:text-lg leading-relaxed font-medium mb-8">
              Baik IPS 1 maupun IPS 2, kita adalah satu angkatan yang bernapas dalam ritme yang sama. Arsip ini adalah mesin waktu kita ke masa lalu, tempat semua cerita bermula.
            </p>

            {/* Statistik Simpel */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-black/10">
              <div>
                <span className="block font-['Playfair_Display',serif] text-3xl sm:text-4xl font-bold text-[#121212]">2</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#121212]/50 mt-1 block">Ruang Kelas</span>
              </div>
              <div>
                <span className="block font-['Playfair_Display',serif] text-3xl sm:text-4xl font-bold text-emerald-600">1</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#121212]/50 mt-1 block">Keluarga</span>
              </div>
              <div>
                <span className="block font-['Playfair_Display',serif] text-3xl sm:text-4xl font-bold text-[#121212]">2026</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#121212]/50 mt-1 block">Kelulusan</span>
              </div>
            </div>
          </div>
          
          {/* Area Album Meja Kenangan — Responsif untuk HP, Tablet, & Desktop */}
          <div className="w-full lg:w-7/12 mt-8 lg:mt-0">
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:gap-6 max-w-lg md:max-w-xl lg:max-w-none mx-auto relative p-1 sm:p-2">
              
              {/* Foto 1 (Taman Sekolah) */}
              <div 
                onClick={() => setSelectedPhoto({
                  src: 'https://res.cloudinary.com/dhxfke7kq/image/upload/v1786532394/i0hsts28xu4epus7eb5j.jpg',
                  caption: 'Taman Sekolah',
                  sub: 'Pelataran Asri MA NU Islamiyah'
                })}
                className="landing-polaroid -rotate-2 md:-rotate-3 hover:rotate-0 hover:scale-[1.03] hover:z-30 cursor-pointer"
              >
                <img 
                  src="https://res.cloudinary.com/dhxfke7kq/image/upload/v1786532394/i0hsts28xu4epus7eb5j.jpg" 
                  alt="Taman Sekolah" 
                  className="w-full aspect-[4/3] object-cover" 
                />
                <p className="text-[10px] sm:text-xs md:text-sm font-['Playfair_Display',serif] italic text-center text-[#121212]/80 py-1.5 sm:py-2 bg-white">
                  Taman Sekolah
                </p>
              </div>
              
              {/* Foto 2 (Suasana Canda) */}
              <div 
                onClick={() => setSelectedPhoto({
                  src: 'https://res.cloudinary.com/dhxfke7kq/image/upload/v1786533095/jriouf29qydkbgyogkjx.jpg',
                  caption: 'Suasana Canda',
                  sub: 'Tawa dan Cerita Sahabat'
                })}
                className="landing-polaroid rotate-2 md:rotate-3 md:translate-y-2 hover:rotate-0 hover:scale-[1.03] hover:z-30 cursor-pointer"
              >
                <img 
                  src="https://res.cloudinary.com/dhxfke7kq/image/upload/v1786533095/jriouf29qydkbgyogkjx.jpg" 
                  alt="Suasana" 
                  className="w-full aspect-[4/3] object-cover" 
                />
                <p className="text-[10px] sm:text-xs md:text-sm font-['Playfair_Display',serif] italic text-center text-[#121212]/80 py-1.5 sm:py-2 bg-white">
                  Suasana Canda
                </p>
              </div>
              
              {/* Foto 3 (Lorong) */}
              <div 
                onClick={() => setSelectedPhoto({
                  src: 'https://res.cloudinary.com/dhxfke7kq/image/upload/v1786533288/gbcnqgydh0pbrsq6zrse.jpg',
                  caption: 'Langkah Koridor',
                  sub: 'Lorong Kenangan Kelas XII'
                })}
                className="landing-polaroid rotate-1 md:rotate-2 md:-translate-y-2 hover:rotate-0 hover:scale-[1.03] hover:z-30 cursor-pointer"
              >
                <img 
                  src="https://res.cloudinary.com/dhxfke7kq/image/upload/v1786533288/gbcnqgydh0pbrsq6zrse.jpg" 
                  alt="Lorong Sekolah" 
                  className="w-full aspect-[4/3] object-cover" 
                />
                <p className="text-[10px] sm:text-xs md:text-sm font-['Playfair_Display',serif] italic text-center text-[#121212]/80 py-1.5 sm:py-2 bg-white">
                  Langkah Koridor
                </p>
              </div>

              {/* Foto 4 (Foto Utama: Keluarga 2026) */}
              <div 
                onClick={() => setSelectedPhoto({
                  src: 'https://res.cloudinary.com/dhxfke7kq/image/upload/v1786532983/vgkrwppmcdaxvf40i80r.jpg',
                  caption: 'Keluarga 2026',
                  sub: 'XII IPS MA NU Islamiyah'
                })}
                className="landing-polaroid -rotate-1 md:-rotate-2 hover:rotate-0 hover:scale-[1.03] hover:z-30 border border-emerald-500/30 ring-1 ring-emerald-500/20 cursor-pointer"
              >
                <img 
                  src="https://res.cloudinary.com/dhxfke7kq/image/upload/v1786532983/vgkrwppmcdaxvf40i80r.jpg" 
                  onError={(e) => {
                    e.currentTarget.src = 'https://res.cloudinary.com/dhxfke7kq/image/upload/v1786533095/jriouf29qydkbgyogkjx.jpg';
                  }}
                  alt="Foto Angkatan" 
                  className="w-full aspect-[4/3] object-cover" 
                />
                <p className="text-[10px] sm:text-xs md:text-sm font-['Playfair_Display',serif] italic text-center font-bold text-emerald-600 py-1.5 sm:py-2 bg-white">
                  Keluarga 2026
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5. BAGIAN TENGAH: Latar Gelap Parallax */}
      <section 
        className="relative py-28 sm:py-32 bg-[#121212] bg-cover bg-center border-y border-[#121212]/20 z-10" 
        style={{ 
          backgroundImage: `url('https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000ed5c81faa6b4ce014deb29c3.jpg')`,
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay Gelap */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px]" />
        
        <div className="relative z-20 max-w-6xl mx-auto px-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 divide-y md:divide-y-0 md:divide-x divide-[#B89B5E]/30">
            <div className="py-4">
              <h3 className="font-['Playfair_Display',serif] text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">2</h3>
              <p className="font-sans text-xs sm:text-sm tracking-widest uppercase text-[#B89B5E] font-extrabold">Ruang Kelas</p>
            </div>
            <div className="py-4">
              <h3 className="font-['Playfair_Display',serif] text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">1</h3>
              <p className="font-sans text-xs sm:text-sm tracking-widest uppercase text-[#B89B5E] font-extrabold">Keluarga Besar</p>
            </div>
            <div className="py-4">
              <h3 className="font-['Playfair_Display',serif] text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">&infin;</h3>
              <p className="font-sans text-xs sm:text-sm tracking-widest uppercase text-[#B89B5E] font-extrabold">Kenangan Abadi</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BAGIAN 02: RUANGAN (Layout majalah split) */}
      <section id="ruang" className="py-20 md:py-32 bg-[#FCFCF8] relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-20">
          <span className="font-sans text-xs tracking-widest font-extrabold text-[#B89B5E] uppercase mb-6 block">
            02. Saksi Belajar
          </span>
          
          {/* Layout Split / Magazine */}
          <div className="flex flex-col md:flex-row-reverse border-2 border-[#121212]/90 rounded-sm overflow-hidden mt-6 shadow-xl bg-white">
            <div className="w-full md:w-3/5 relative min-h-[320px] md:min-h-[480px] overflow-hidden border-b-2 md:border-b-0 md:border-l-2 border-[#121212]/90 bg-black group">
              {/* Foto pintu kelas */}
              <img 
                src="https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000f8d481fa82f3b31a54a7e9ed.jpg" 
                alt="Ruang Kelas" 
                onClick={() => setSelectedPhoto({
                  src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000f8d481fa82f3b31a54a7e9ed.jpg',
                  caption: 'Pintu Ruang Kelas',
                  sub: 'XII IPS MA NU Islamiyah Asembagus'
                })}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 cursor-pointer"
              />
            </div>
            <div className="w-full md:w-2/5 p-8 sm:p-10 lg:p-14 flex flex-col justify-center bg-[#FCFCF8]">
              <h3 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl md:text-5xl text-[#121212] mb-5 leading-tight font-bold">
                Ruang<br />Kelas.
              </h3>
              <p className="font-sans text-[#121212]/80 text-base sm:text-lg leading-relaxed font-medium">
                Bukan sekadar empat dinding. Ini adalah markas di mana canda, tawa, dan mimpi masa depan dirangkai bersama. Saksi bisu dari setiap ujian, tugas, dan kebersamaan kita.
              </p>
              <div className="mt-8 pt-6 border-t border-black/10 flex items-center justify-between text-xs font-sans text-[#121212]/60 font-semibold">
                <span>XII IPS 1 &amp; 2</span>
                <span className="text-emerald-600 font-bold">MA NU ISLAMIYAH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BAGIAN 03: KILAS BALIK VISUAL (Galeri Polaroid Berserakan layaknya Scrapbook) */}
      <section id="kenangan" className="pt-8 pb-28 md:pb-32 bg-[#FCFCF8] relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-20">
          
          {/* Header Galeri */}
          <div className="mb-14 md:mb-20 text-center">
            <span className="font-sans text-xs tracking-widest font-extrabold text-[#B89B5E] uppercase mb-4 block">
              03. Kilas Balik Visual
            </span>
            <h2 className="font-['Playfair_Display',serif] text-3xl sm:text-5xl lg:text-6xl text-[#121212] leading-tight max-w-3xl mx-auto font-bold">
              "Setiap sudut punya cerita, setiap langkah merekam masa lalu."
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#121212]/50 mt-4 uppercase tracking-widest font-bold">
              * Sentuh foto untuk melihat lebih dekat
            </p>
          </div>

          {/* Struktur Grid Asimetris dengan rotasi berbeda di tiap foto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4 lg:gap-8 px-2 relative mt-8">
            
            {/* Foto 1 (Kubah Masjid) - Miring ke kiri */}
            <div 
              onClick={() => setSelectedPhoto({
                src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000e3d88209baeee4472c42b644.jpg',
                caption: 'Titik Kumpul',
                sub: 'Kubah & Ketenangan'
              })}
              className="mt-0 md:mt-10 cursor-pointer"
            >
              <div className="landing-polaroid -rotate-3">
                <img 
                  src="https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000e3d88209baeee4472c42b644.jpg" 
                  alt="Masjid" 
                  className="w-full aspect-[4/5] object-cover" 
                />
                <div className="py-3 px-2 text-center bg-white border-t border-gray-100">
                  <p className="font-['Playfair_Display',serif] text-base sm:text-lg font-bold text-[#121212]">Titik Kumpul</p>
                  <p className="text-[10px] text-[#121212]/50 uppercase tracking-wider font-sans mt-0.5">Kubah &amp; Ketenangan</p>
                </div>
              </div>
            </div>

            {/* Foto 2 (Suasana Santai) - Miring ke kanan */}
            <div 
              onClick={() => setSelectedPhoto({
                src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_0000000030348211bd9c6c6bde019aa3.jpg',
                caption: 'Sudut Cerita',
                sub: 'Pelataran & Tawa'
              })}
              className="mt-0 md:-mt-6 cursor-pointer"
            >
              <div className="landing-polaroid rotate-2">
                <img 
                  src="https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_0000000030348211bd9c6c6bde019aa3.jpg" 
                  alt="Suasana" 
                  className="w-full aspect-[4/5] object-cover" 
                />
                <div className="py-3 px-2 text-center bg-white border-t border-gray-100">
                  <p className="font-['Playfair_Display',serif] text-base sm:text-lg font-bold text-[#121212]">Sudut Cerita</p>
                  <p className="text-[10px] text-[#121212]/50 uppercase tracking-wider font-sans mt-0.5">Pelataran &amp; Tawa</p>
                </div>
              </div>
            </div>

            {/* Foto 3 (Gedung Sekolah) - Miring tajam ke kiri */}
            <div 
              onClick={() => setSelectedPhoto({
                src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_000000001f00820b84d479c4ead55a00.jpg',
                caption: 'Langkah Awal',
                sub: 'Gedung Perjuangan'
              })}
              className="mt-0 md:mt-12 cursor-pointer"
            >
              <div className="landing-polaroid -rotate-6">
                <img 
                  src="https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_000000001f00820b84d479c4ead55a00.jpg" 
                  alt="Gedung" 
                  className="w-full aspect-[4/5] object-cover" 
                />
                <div className="py-3 px-2 text-center bg-white border-t border-gray-100">
                  <p className="font-['Playfair_Display',serif] text-base sm:text-lg font-bold text-[#121212]">Langkah Awal</p>
                  <p className="text-[10px] text-[#121212]/50 uppercase tracking-wider font-sans mt-0.5">Gedung Perjuangan</p>
                </div>
              </div>
            </div>

            {/* Foto 4 (Lorong Kelas) - Miring ke kanan */}
            <div 
              onClick={() => setSelectedPhoto({
                src: 'https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000ed5c81faa6b4ce014deb29c3.jpg',
                caption: 'Saksi Bisu',
                sub: 'Langkah Koridor'
              })}
              className="mt-0 md:-mt-2 cursor-pointer"
            >
              <div className="landing-polaroid rotate-4">
                <img 
                  src="https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/Public/file_00000000ed5c81faa6b4ce014deb29c3.jpg" 
                  alt="Lorong" 
                  className="w-full aspect-[4/5] object-cover" 
                />
                <div className="py-3 px-2 text-center bg-white border-t border-gray-100">
                  <p className="font-['Playfair_Display',serif] text-base sm:text-lg font-bold text-[#121212]">Saksi Bisu</p>
                  <p className="text-[10px] text-[#121212]/50 uppercase tracking-wider font-sans mt-0.5">Langkah Koridor</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. BAGIAN 04: GOOGLE MAPS LOKASI SEKOLAH */}
      <SchoolLocationMap />

      {/* 8. GERBANG MASUK KE PORTAL APLIKASI UTAMA */}
      <section id="portal" className="py-20 sm:py-28 px-6 bg-[#121212] text-white relative z-20 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-sans font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pintu Masuk Ruang Digital</span>
          </div>
          
          <h2 className="font-['Playfair_Display',serif] text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Jelajahi Angkatan<span className="text-emerald-500">KU</span>
          </h2>
          
          <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 font-normal">
            Masuk ke hub sistem utama untuk melihat struktur organisasi kelas, jadwal harian, linimasa kegiatan, ruang curhat, dan obrolan Nusa AI.
          </p>

          {/* Tombol CTA Utama */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button 
              onClick={() => onNavigate('home', 'Beranda Angkatan')}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-sans font-bold text-sm tracking-wider uppercase transition-all shadow-xl hover:shadow-emerald-500/30 cursor-pointer"
            >
              <span>Masuk Beranda Angkatan (Story &amp; Feed)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onNavigate('portal', 'Portal Semua Halaman')}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-sans font-semibold text-sm tracking-wider uppercase border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              <span>Direktori Lengkap Portal</span>
              <ArrowUpRight className="w-4 h-4 text-[#B89B5E]" />
            </button>
          </div>
        </div>
      </section>

      {/* 9. TRANSISI OMBAK (Wave) HANYA untuk masuk ke Footer */}
      <div className="w-full leading-[0] bg-[#121212] relative z-20">
        <svg className="w-full h-auto text-[#0a0c0a]" viewBox="0 0 1440 200" preserveAspectRatio="none">
          <path fill="currentColor" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,122.7C384,117,480,75,576,64C672,53,768,75,864,96C960,117,1056,139,1152,128C1248,117,1344,75,1392,53.3L1440,32L1440,200L1392,200C1344,200,1248,200,1152,200C1056,200,960,200,864,200C768,200,672,200,576,200C480,200,384,200,288,200C192,200,96,200,48,200L0,200Z" />
        </svg>
      </div>

      {/* 10. ZONE GELAP DENGAN EFEK AURORA & FOOTER */}
      <div className="relative bg-[#0a0c0a] text-[#FCFCF8] overflow-hidden">
        {/* Blobs Aurora */}
        <div 
          className="absolute -top-[20%] left-[10%] w-[50vw] h-[50vw] rounded-full blur-[100px] opacity-40 pointer-events-none z-0 bg-[#1B2E1C] animate-float-aurora-1"
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-25 pointer-events-none z-0 bg-[#B89B5E] animate-float-aurora-2"
        />

        <footer className="pt-20 pb-12 px-6 md:px-12 lg:px-24 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            
            {/* Logo Asli */}
            <img 
              src="https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/logoma.png" 
              alt="Logo MA" 
              className="w-28 sm:w-32 h-28 sm:h-32 object-contain mb-8 relative z-20 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
            />
            
            <h2 className="font-sans text-[11vw] md:text-[8vw] font-black tracking-tight leading-none mb-10 select-none relative z-20 uppercase text-white drop-shadow-2xl">
              ANGKATAN<span className="text-emerald-500">KU</span>
            </h2>
            
            <p className="font-['Playfair_Display',serif] text-xl sm:text-2xl md:text-3xl text-white/90 italic max-w-2xl mx-auto mb-14 font-light relative z-20 drop-shadow-lg">
              &ldquo;Tidak ada yang benar-benar hilang selama kita masih mengingatnya.&rdquo;
            </p>

            <div className="w-full flex flex-col md:flex-row justify-between items-center border-t border-white/20 pt-8 mt-4 gap-6 relative z-20">
              <div className="flex items-center gap-3">
                <img 
                  src="https://raw.githubusercontent.com/xiiipsmanuislamiyah-creator-own/Src-gambar/refs/heads/main/kelaslogo.png" 
                  alt="Logo Kelas" 
                  className="w-7 h-7 object-contain"
                />
                <p className="font-sans text-xs tracking-[0.15em] text-[#B89B5E] font-extrabold uppercase">
                  &copy; 2026 XII IPS MA NU Islamiyah
                </p>
              </div>
              
              <button 
                onClick={scrollToTop}
                className="group flex items-center gap-3 font-sans text-xs tracking-widest font-extrabold uppercase text-[#B89B5E] hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full border border-white/20 backdrop-blur-sm shadow-lg cursor-pointer"
              >
                <span>Kembali ke Atas</span>
                <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* LIGHTBOX MODAL UNTUK PREVIEW FOTO POLAROID */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white text-slate-900 rounded-lg overflow-hidden shadow-2xl p-4 sm:p-6"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 text-slate-700 flex items-center justify-center transition-colors cursor-pointer z-10"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-hidden rounded bg-slate-100 max-h-[70vh] flex items-center justify-center">
              <img 
                src={selectedPhoto.src} 
                alt={selectedPhoto.caption}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            <div className="mt-4 text-center">
              <h4 className="font-['Playfair_Display',serif] text-xl font-bold text-slate-900">
                {selectedPhoto.caption}
              </h4>
              {selectedPhoto.sub && (
                <p className="text-xs text-slate-500 font-sans uppercase tracking-wider mt-1">
                  {selectedPhoto.sub}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
