import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Save, 
  Coffee, 
  Check, 
  Printer, 
  Share2, 
  Calendar, 
  MapPin, 
  RotateCcw,
  BookOpen,
  Compass,
  Languages,
  Calculator,
  Activity,
  Palette,
  GraduationCap,
  Search,
  FileText,
  X,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Home
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query } from '../lib/data';

export interface ScheduleItem {
  time: string;
  name: string;
  jp?: string;
  isBreak?: boolean;
  topic?: string;
  teacher?: string;
  room?: string;
}

export interface ClassSchedule {
  id?: string;
  className: string;
  schedules: {
    day: string;
    subjects: ScheduleItem[];
  }[];
}

export interface MergedScheduleBlock {
  key: string;
  rawIndices: number[];
  startTime: string;
  endTime: string;
  timeRange: string;
  name: string;
  jpDisplay: string;
  isBreak?: boolean;
  topic?: string;
  teacher?: string;
  room?: string;
}

const DEFAULT_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Standard curriculum timetable for MA NU Islamiyah
const DEFAULT_CLASS_DATA: ClassSchedule[] = [
  {
    className: 'XII IPS 1',
    schedules: [
      {
        day: 'Senin',
        subjects: [
          { 
            time: '07.00 - 07.45', 
            jp: '1 JP', 
            name: 'Upacara Bendera & Pembiasaan', 
            isBreak: true,
            topic: 'Amanat Pembina: Disiplin, Keteladanan & Nasionalisme',
            room: 'Lapangan Utama'
          },
          { 
            time: '07.45 - 08.50', 
            jp: '2 JP', 
            name: 'Sosiologi', 
            topic: 'Bab 3: Dinamika Perubahan Sosial & Globalisasi',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '08.50 - 09.50', 
            jp: '2 JP', 
            name: 'Bahasa Indonesia', 
            topic: 'Menganalisis Sistematika & Kaidah Teks Editorial',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Matematika', 
            topic: 'Program Linear Dua Variabel & Metode Simpleks',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '11.45 - 12.25', 
            jp: 'Ishoma', 
            name: 'Istirahat & Sholat Dzuhur', 
            isBreak: true,
            topic: 'Sholat Dzuhur Berjamaah',
            room: 'Masjid Madrasah'
          },
          { 
            time: '12.25 - 13.45', 
            jp: '2 JP', 
            name: 'Fikih', 
            topic: 'Fikih Muamalah Kontemporer: Riba & Akad Syariah',
            room: 'Ruang XII IPS 1'
          }
        ]
      },
      {
        day: 'Selasa',
        subjects: [
          { 
            time: '07.00 - 08.20', 
            jp: '2 JP', 
            name: 'Pendidikan Jasmani (PJOK)', 
            topic: 'Kebugaran Jasmani & Teknik Dasar Bola Voli',
            room: 'Lapangan Olahraga'
          },
          { 
            time: '08.20 - 09.50', 
            jp: '2 JP', 
            name: 'Bahasa Indonesia', 
            topic: 'Menulis Teks Kritik & Esai Sastra',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Ekonomi', 
            topic: 'Perhitungan Pendapatan Nasional & Indeks Harga',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '11.45 - 12.25', 
            jp: 'Ishoma', 
            name: 'Istirahat & Sholat Dzuhur', 
            isBreak: true,
            topic: 'Sholat Dzuhur Berjamaah',
            room: 'Masjid Madrasah'
          },
          { 
            time: '12.25 - 13.45', 
            jp: '2 JP', 
            name: 'Sejarah Indonesia', 
            topic: 'Diplomasi Mempertahankan Kemerdekaan RI (1945-1949)',
            room: 'Ruang XII IPS 1'
          }
        ]
      },
      {
        day: 'Rabu',
        subjects: [
          { 
            time: '07.00 - 08.25', 
            jp: '2 JP', 
            name: 'Bahasa Inggris', 
            topic: 'Analytical Exposition Text & Public Speaking',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '08.25 - 09.50', 
            jp: '2 JP', 
            name: 'Geografi', 
            topic: 'Pola Keruangan Desa dan Kota serta Perkembangannya',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Sosiologi', 
            topic: 'Metode Penelitian Sosial Berbasis Komunitas Lokal',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '11.45 - 12.25', 
            jp: 'Ishoma', 
            name: 'Istirahat & Sholat Dzuhur', 
            isBreak: true,
            topic: 'Sholat Dzuhur Berjamaah',
            room: 'Masjid Madrasah'
          },
          { 
            time: '12.25 - 13.45', 
            jp: '2 JP', 
            name: "Al-Qur'an Hadis", 
            topic: 'Tafsir Ayat Kewajiban Menuntut Ilmu & Menjaga Alam',
            room: 'Ruang XII IPS 1'
          }
        ]
      },
      {
        day: 'Kamis',
        subjects: [
          { 
            time: '07.00 - 08.25', 
            jp: '2 JP', 
            name: 'Akidah Akhlak', 
            topic: 'Mendalami Asmaul Husna: Al-Adl, Al-Hafizh, dan Al-Ghaffar',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '08.25 - 09.50', 
            jp: '2 JP', 
            name: 'Sejarah Kebudayaan Islam (SKI)', 
            topic: 'Puncak Keemasan Ilmu Pengetahuan Dinasti Abbasiyah',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Bahasa Arab', 
            topic: 'Qira’ah wa Maharatul Kalam: Karangan Budaya Islam',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '11.45 - 12.25', 
            jp: 'Ishoma', 
            name: 'Istirahat & Sholat Dzuhur', 
            isBreak: true,
            topic: 'Sholat Dzuhur Berjamaah',
            room: 'Masjid Madrasah'
          },
          { 
            time: '12.25 - 13.45', 
            jp: '2 JP', 
            name: 'PPKn', 
            topic: 'Penegakan Hukum & Perlindungan Hak Asasi Manusia',
            room: 'Ruang XII IPS 1'
          }
        ]
      },
      {
        day: 'Jumat',
        subjects: [
          { 
            time: '07.00 - 07.45', 
            jp: '1 JP', 
            name: 'Istighosah & Pembiasaan Pagi', 
            isBreak: true,
            topic: 'Kajian Doa Bersama Angkatan & Pembacaan Surat Yasin',
            room: 'Masjid Jami Madrasah'
          },
          { 
            time: '07.45 - 08.50', 
            jp: '2 JP', 
            name: 'Seni Budaya', 
            topic: 'Apresiasi Seni Rupa Murni & Desain Logo Nusantara',
            room: 'Sanggar Seni'
          },
          { 
            time: '08.50 - 09.50', 
            jp: '2 JP', 
            name: 'Ekonomi', 
            topic: 'APBN & APBD: Analisis Sumber Penerimaan dan Belanja',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.30', 
            jp: '2 JP', 
            name: 'Bimbingan Konseling (BK)', 
            topic: 'Strategi Pemilihan Jurusan PTN & Simulasi SNBT/UTBK',
            room: 'Ruang BK'
          },
          { 
            time: '11.30 - 13.00', 
            jp: 'Ishoma', 
            name: 'Sholat Jumat & Istirahat Siang', 
            isBreak: true,
            topic: 'Ibadah Sholat Jumat Berjamaah & Keputrian',
            room: 'Masjid Madrasah'
          }
        ]
      },
      {
        day: 'Sabtu',
        subjects: [
          { 
            time: '07.00 - 08.25', 
            jp: '2 JP', 
            name: 'Bahasa Jawa', 
            topic: 'Unggah-Ungguh Basa & Tembang Macapat Sinom',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '08.25 - 09.50', 
            jp: '2 JP', 
            name: 'Prakarya & Kewirausahaan (PKWU)', 
            topic: 'Perencanaan Usaha Pengolahan Pangan Khas Daerah',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Muatan Lokal (Aswaja)', 
            topic: 'Kajian Ahlussunnah wal Jama’ah dan Sejarah Ke-NU-an',
            room: 'Ruang XII IPS 1'
          },
          { 
            time: '11.45 - 13.00', 
            jp: '2 JP', 
            name: 'Kepramukaan & Minat Bakat', 
            topic: 'Kepemimpinan Penegak Bantara & Pionering Lapangan',
            room: 'Lapangan Utama'
          }
        ]
      }
    ]
  },
  {
    className: 'XII IPS 2',
    schedules: [
      {
        day: 'Senin',
        subjects: [
          { 
            time: '07.00 - 07.45', 
            jp: '1 JP', 
            name: 'Upacara Bendera & Pembiasaan', 
            isBreak: true,
            topic: 'Apel Kedisiplinan Pagi',
            room: 'Lapangan Utama'
          },
          { 
            time: '07.45 - 08.50', 
            jp: '2 JP', 
            name: 'Fikih', 
            topic: 'Fikih Jinayah & Hikmah Hukum Islam',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '08.50 - 09.50', 
            jp: '2 JP', 
            name: 'Sosiologi', 
            topic: 'Kearifan Lokal dan Pemberdayaan Komunitas',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Bahasa Indonesia', 
            topic: 'Menyusun Surat Lamaran Pekerjaan Profesional',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '11.45 - 12.25', 
            jp: 'Ishoma', 
            name: 'Istirahat & Sholat Dzuhur', 
            isBreak: true,
            topic: 'Ishoma Berjamaah',
            room: 'Masjid Madrasah'
          },
          { 
            time: '12.25 - 13.45', 
            jp: '2 JP', 
            name: 'Matematika', 
            topic: 'Matriks & Sistem Persamaan Linear',
            room: 'Ruang XII IPS 2'
          }
        ]
      },
      {
        day: 'Selasa',
        subjects: [
          { 
            time: '07.00 - 08.25', 
            jp: '2 JP', 
            name: 'Geografi', 
            topic: 'Interaksi Keruangan Desa dan Kota',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '08.25 - 09.50', 
            jp: '2 JP', 
            name: 'Bahasa Inggris', 
            topic: 'Formal Letters and Application Emails',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Ekonomi', 
            topic: 'Pasar Modal Syariah & Lembaga Keuangan',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '11.45 - 12.25', 
            jp: 'Ishoma', 
            name: 'Istirahat & Sholat Dzuhur', 
            isBreak: true,
            topic: 'Ishoma Berjamaah',
            room: 'Masjid Madrasah'
          },
          { 
            time: '12.25 - 13.45', 
            jp: '2 JP', 
            name: 'Sejarah Indonesia', 
            topic: 'Dinamika Bangsa Masa Demokrasi Terpimpin',
            room: 'Ruang XII IPS 2'
          }
        ]
      },
      {
        day: 'Rabu',
        subjects: [
          { 
            time: '07.00 - 08.25', 
            jp: '2 JP', 
            name: 'Pendidikan Jasmani (PJOK)', 
            topic: 'Permainan Bola Voli & Daya Tahan',
            room: 'Lapangan Olahraga'
          },
          { 
            time: '08.25 - 09.50', 
            jp: '2 JP', 
            name: 'Akidah Akhlak', 
            topic: 'Perilaku Terpuji: Adil, Ridha, dan Amal Saleh',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: "Al-Qur'an Hadis", 
            topic: 'Tafsir Kewajiban terhadap Alam Semesta',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '11.45 - 12.25', 
            jp: 'Ishoma', 
            name: 'Istirahat & Sholat Dzuhur', 
            isBreak: true,
            topic: 'Ishoma Berjamaah',
            room: 'Masjid Madrasah'
          },
          { 
            time: '12.25 - 13.45', 
            jp: '2 JP', 
            name: 'Sosiologi Peminatan', 
            topic: 'Rancangan Evaluasi Pemberdayaan Komunitas',
            room: 'Ruang XII IPS 2'
          }
        ]
      },
      {
        day: 'Kamis',
        subjects: [
          { 
            time: '07.00 - 08.25', 
            jp: '2 JP', 
            name: 'Sejarah Kebudayaan Islam (SKI)', 
            topic: 'Kiprah Organisasi Islam Modern di Indonesia',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '08.25 - 09.50', 
            jp: '2 JP', 
            name: 'PPKn', 
            topic: 'Mengatasi Ancaman Integrasi Nasional',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Ekonomi Peminatan', 
            topic: 'Akuntansi: Jurnal Penyesuaian Perusahaan Jasa',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '11.45 - 12.25', 
            jp: 'Ishoma', 
            name: 'Istirahat & Sholat Dzuhur', 
            isBreak: true,
            topic: 'Ishoma Berjamaah',
            room: 'Masjid Madrasah'
          },
          { 
            time: '12.25 - 13.45', 
            jp: '2 JP', 
            name: 'Bahasa Arab', 
            topic: 'Tarkib & Budaya Islam Nusantara',
            room: 'Ruang XII IPS 2'
          }
        ]
      },
      {
        day: 'Jumat',
        subjects: [
          { 
            time: '07.00 - 07.45', 
            jp: '1 JP', 
            name: 'Pembiasaan & Istirahat Pagi', 
            isBreak: true,
            topic: 'Kajian Doa Bersama Menjelang Ujian',
            room: 'Masjid Jami'
          },
          { 
            time: '07.45 - 08.50', 
            jp: '2 JP', 
            name: 'Seni Budaya', 
            topic: 'Musik Tradisional & Tari Kreasi',
            room: 'Sanggar Seni'
          },
          { 
            time: '08.50 - 09.50', 
            jp: '2 JP', 
            name: 'Geografi Peminatan', 
            topic: 'Sistem Informasi Geografis (SIG)',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.30', 
            jp: '2 JP', 
            name: 'Bimbingan Konseling (BK)', 
            topic: 'Karier & Persiapan Masa Depan',
            room: 'Ruang BK'
          },
          { 
            time: '11.30 - 13.00', 
            jp: 'Ishoma', 
            name: 'Sholat Jumat & Istirahat Siang', 
            isBreak: true,
            topic: 'Ibadah Sholat Jumat Berjamaah & Keputrian',
            room: 'Masjid Madrasah'
          }
        ]
      },
      {
        day: 'Sabtu',
        subjects: [
          { 
            time: '07.00 - 08.25', 
            jp: '2 JP', 
            name: 'Bahasa Jawa', 
            topic: 'Tembang Macapat Sinom',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '08.25 - 09.50', 
            jp: '2 JP', 
            name: 'Prakarya & Kewirausahaan (PKWU)', 
            topic: 'Desain Kemasan Ramah Lingkungan & BEP',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '09.50 - 10.20', 
            jp: 'Istirahat', 
            name: 'Istirahat', 
            isBreak: true,
            topic: 'Waktu Istirahat & Rehat',
            room: 'Kantin & Area Madrasah'
          },
          { 
            time: '10.20 - 11.45', 
            jp: '2 JP', 
            name: 'Muatan Lokal (Aswaja)', 
            topic: 'Manajemen Waktu & Karakter Aswaja',
            room: 'Ruang XII IPS 2'
          },
          { 
            time: '11.45 - 13.00', 
            jp: '2 JP', 
            name: 'Kepramukaan', 
            topic: 'Simulasi Survival & Pertolongan Pertama',
            room: 'Lapangan Utama'
          }
        ]
      }
    ]
  }
];

function parseTimeToMinutes(t: string): number {
  if (!t || typeof t !== 'string') return -1;
  const clean = t.trim().replace(/WIB/i, '').trim();
  const sep = clean.includes(':') ? ':' : '.';
  const parts = clean.split(sep);
  if (parts.length < 2) return -1;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
}

function normalizeTimeString(t: string): { start: string; end: string; range: string } {
  if (!t || typeof t !== 'string') return { start: '', end: '', range: '' };
  const parts = t.split(/[-–]/).map(p => p.trim());
  if (parts.length >= 2) {
    const s = parts[0].replace(':', '.');
    const e = parts[1].replace(':', '.');
    return { start: s, end: e, range: `${s} – ${e}` };
  }
  return { start: t, end: t, range: t };
}

// Smart merger: combines consecutive raw slots with the same subject name into a single solid session block
// and automatically detects schedule gaps (like 09.50 - 10.20) to insert clear break sessions.
export function mergeConsecutiveSubjects(subjects: ScheduleItem[]): MergedScheduleBlock[] {
  if (!subjects || subjects.length === 0) return [];
  
  // Sort items chronologically based on starting minute
  const sorted = [...subjects].sort((a, b) => {
    const tA = parseTimeToMinutes(a.time ? a.time.split(/[-–]/)[0] : '');
    const tB = parseTimeToMinutes(b.time ? b.time.split(/[-–]/)[0] : '');
    return tA - tB;
  });

  const merged: MergedScheduleBlock[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const { start: curStart, end: curEnd, range: curRange } = normalizeTimeString(current.time);
    const prev = merged[merged.length - 1];
    
    const curNorm = current.name.trim().toLowerCase();
    const prevNorm = prev ? prev.name.trim().toLowerCase() : '';
    
    const currentIsBreak = Boolean(
      current.isBreak || 
      curNorm.includes('istirahat') || 
      curNorm.includes('ishoma') || 
      curNorm.includes('rehat')
    );
    const prevIsBreak = prev ? Boolean(
      prev.isBreak || 
      prevNorm.includes('istirahat') || 
      prevNorm.includes('ishoma') || 
      prevNorm.includes('rehat')
    ) : false;

    const canMerge = prev && 
                     curNorm === prevNorm && 
                     currentIsBreak === prevIsBreak;

    if (canMerge) {
      prev.rawIndices.push(i);
      prev.endTime = curEnd;
      prev.timeRange = `${prev.startTime} – ${curEnd}`;
      
      const totalJP = prev.rawIndices.length;
      prev.jpDisplay = `${totalJP} JP`;
      
      if (current.topic && !prev.topic) {
        prev.topic = current.topic;
      } else if (current.topic && prev.topic && !prev.topic.includes(current.topic)) {
        prev.topic = `${prev.topic} • ${current.topic}`;
      }
      
      if (!prev.room && current.room) {
        prev.room = current.room;
      }
      if (!prev.teacher && current.teacher) {
        prev.teacher = current.teacher;
      }
    } else {
      let initialJP = current.jp || '1 JP';
      if (!initialJP.toLowerCase().includes('jp') && !currentIsBreak) {
        initialJP = `${initialJP} JP`;
      }
      
      merged.push({
        key: `${i}-${current.name}`,
        rawIndices: [i],
        startTime: curStart,
        endTime: curEnd,
        timeRange: curRange,
        name: current.name,
        jpDisplay: currentIsBreak ? (current.jp || 'Istirahat') : initialJP,
        isBreak: currentIsBreak,
        topic: current.topic,
        teacher: current.teacher,
        room: current.room
      });
    }
  }

  // Detect and inject break blocks for any gaps between consecutive classes
  const finalWithGaps: MergedScheduleBlock[] = [];
  for (let i = 0; i < merged.length; i++) {
    finalWithGaps.push(merged[i]);
    
    if (i < merged.length - 1) {
      const cur = merged[i];
      const next = merged[i + 1];
      
      const curEndMin = parseTimeToMinutes(cur.endTime);
      const nextStartMin = parseTimeToMinutes(next.startTime);
      
      // If gap is at least 8 minutes and neither block is already a break
      if (curEndMin > 0 && nextStartMin > 0 && (nextStartMin - curEndMin >= 8)) {
        if (!cur.isBreak && !next.isBreak) {
          let breakTitle = 'Istirahat';
          let breakTopic = 'Waktu Istirahat & Rehat';
          let breakRoom = 'Kantin / Lingkungan Madrasah';
          
          if (curEndMin >= 680 || nextStartMin >= 700) {
            breakTitle = 'Istirahat & Sholat Dzuhur';
            breakTopic = 'Sholat Dzuhur Berjamaah & Makan Siang';
            breakRoom = 'Masjid Madrasah';
          } else if (curEndMin < 530) {
            breakTitle = 'Istirahat Pagi';
            breakTopic = 'Waktu Rehat & Istirahat';
            breakRoom = 'Kantin / Lingkungan Madrasah';
          }
          
          finalWithGaps.push({
            key: `auto-gap-${cur.endTime}-${next.startTime}`,
            rawIndices: [],
            startTime: cur.endTime,
            endTime: next.startTime,
            timeRange: `${cur.endTime} – ${next.startTime}`,
            name: breakTitle,
            jpDisplay: 'Istirahat',
            isBreak: true,
            topic: breakTopic,
            room: breakRoom
          });
        }
      }
    }
  }
  
  return finalWithGaps;
}

// Distinct subject metadata & category styling (clean, fresh, high-contrast)
export function getSubjectMeta(name: string, isBreak?: boolean) {
  const lower = (name || '').toLowerCase();
  const isActualBreak = isBreak || 
    lower.includes('istirahat') || 
    lower.includes('ishoma') || 
    lower.includes('rehat') ||
    lower.includes('dzuhur');

  if (isActualBreak) {
    return {
      categoryId: 'break',
      category: 'Jam Istirahat',
      accentBorder: 'border-l-amber-500',
      badgeClass: 'bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800',
      tagBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
      icon: Coffee
    };
  }

  if (lower.includes('fikih') || lower.includes('qur') || lower.includes('hadis') || lower.includes('akidah') || lower.includes('ski') || lower.includes('arab')) {
    return {
      categoryId: 'agama',
      category: 'Pendidikan Islam',
      accentBorder: 'border-l-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      tagBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200',
      icon: BookOpen
    };
  }

  if (lower.includes('sosiologi') || lower.includes('ekonomi') || lower.includes('geografi') || lower.includes('sejarah') || lower.includes('ppkn')) {
    return {
      categoryId: 'sosial',
      category: 'Rumpun Sosial',
      accentBorder: 'border-l-sky-500',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
      tagBg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200',
      icon: Compass
    };
  }

  if (lower.includes('indonesia') || lower.includes('inggris') || lower.includes('jawa') || lower.includes('daerah') || lower.includes('bahasa')) {
    return {
      categoryId: 'bahasa',
      category: 'Bahasa & Sastra',
      accentBorder: 'border-l-purple-500',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      tagBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200',
      icon: Languages
    };
  }

  if (lower.includes('matematika') || lower.includes('ipa') || lower.includes('fisika') || lower.includes('kimia') || lower.includes('biologi')) {
    return {
      categoryId: 'sains',
      category: 'Matematika & Logika',
      accentBorder: 'border-l-teal-500',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
      tagBg: 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200',
      icon: Calculator
    };
  }

  if (lower.includes('jasmani') || lower.includes('pjok') || lower.includes('penjas') || lower.includes('olahraga') || lower.includes('pramuka')) {
    return {
      categoryId: 'olahraga',
      category: 'Jasmani & Lapangan',
      accentBorder: 'border-l-orange-500',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
      tagBg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200',
      icon: Activity
    };
  }

  if (lower.includes('seni') || lower.includes('budaya') || lower.includes('pkwu') || lower.includes('prakarya')) {
    return {
      categoryId: 'seni',
      category: 'Kreatif & Seni',
      accentBorder: 'border-l-rose-500',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      tagBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200',
      icon: Palette
    };
  }

  return {
    categoryId: 'umum',
    category: 'Mata Pelajaran',
    accentBorder: 'border-l-slate-400',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    tagBg: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
    icon: GraduationCap
  };
}

export default function JadwalPelajaran({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { isAdmin } = useAuth();
  
  const [classesData, setClassesData] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getTodayIndo = () => {
    const dayMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const today = dayMap[new Date().getDay()];
    return DEFAULT_DAYS.includes(today) ? today : 'Senin';
  };

  const [activeClass, setActiveClass] = useState<string>('XII IPS 1');
  const [activeDay, setActiveDay] = useState<string>(getTodayIndo());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Personal notes stored in localStorage per subject
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [selectedBlockDetail, setSelectedBlockDetail] = useState<MergedScheduleBlock | null>(null);
  const [activeNoteText, setActiveNoteText] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user_schedule_notes');
      if (saved) {
        setUserNotes(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveNoteForSubject = (key: string, text: string) => {
    const updated = { ...userNotes, [key]: text };
    setUserNotes(updated);
    localStorage.setItem('user_schedule_notes', JSON.stringify(updated));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Modals state
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<ScheduleItem>({
    time: '',
    name: '',
    jp: '',
    isBreak: false,
    topic: '',
    teacher: '',
    room: ''
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'schedules')));
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassSchedule));
      
      if (data.length === 0) {
        data = DEFAULT_CLASS_DATA;
      } else {
        DEFAULT_CLASS_DATA.forEach(dc => {
          if (!data.some(c => c.className === dc.className)) {
            data.push(dc);
          }
        });
        data.sort((a, b) => a.className.localeCompare(b.className));
      }

      setClassesData(data);
      if (data.length > 0 && !data.find(c => c.className === activeClass)) {
        setActiveClass(data[0].className);
      }
    } catch (err: any) {
      console.warn('Notice: Error fetching schedules, using default schedule dataset:', err?.message || err);
      setClassesData(DEFAULT_CLASS_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const selectedClassSchedule = classesData.find(c => c.className === activeClass) || classesData[0];
  const activeDaySchedule = selectedClassSchedule?.schedules?.find(s => s.day === activeDay);

  const isCurrentDayToday = useMemo(() => {
    const dayMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayMap[new Date().getDay()] === activeDay;
  }, [activeDay]);

  const mergedSubjects: MergedScheduleBlock[] = useMemo(() => {
    if (!activeDaySchedule?.subjects) return [];
    return mergeConsecutiveSubjects(activeDaySchedule.subjects);
  }, [activeDaySchedule]);

  const getBlockStatus = (block: MergedScheduleBlock): 'live' | 'upcoming' | 'past' => {
    if (!isCurrentDayToday) return 'upcoming';
    const startMin = parseTimeToMinutes(block.startTime);
    const endMin = parseTimeToMinutes(block.endTime);
    if (startMin < 0 || endMin < 0) return 'upcoming';

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    if (currentMinutes >= startMin && currentMinutes <= endMin) {
      return 'live';
    } else if (currentMinutes < startMin) {
      return 'upcoming';
    } else {
      return 'past';
    }
  };

  const currentLiveIndex = useMemo(() => {
    if (!isCurrentDayToday || mergedSubjects.length === 0) return -1;
    return mergedSubjects.findIndex(b => getBlockStatus(b) === 'live');
  }, [mergedSubjects, isCurrentDayToday, currentTime]);

  const liveSession = currentLiveIndex !== -1 ? mergedSubjects[currentLiveIndex] : null;
  const nextSession = currentLiveIndex !== -1 && currentLiveIndex + 1 < mergedSubjects.length 
    ? mergedSubjects[currentLiveIndex + 1] 
    : null;

  const liveProgress = useMemo(() => {
    if (!liveSession) return null;
    const startMin = parseTimeToMinutes(liveSession.startTime);
    const endMin = parseTimeToMinutes(liveSession.endTime);
    if (startMin < 0 || endMin < 0 || endMin <= startMin) return null;

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const elapsed = Math.max(0, currentMinutes - startMin);
    const total = endMin - startMin;
    const remaining = Math.max(0, endMin - currentMinutes);
    const percent = Math.min(100, Math.round((elapsed / total) * 100));

    return { elapsed, total, remaining, percent };
  }, [liveSession, currentTime]);

  // Day stats: total JP, jam masuk, jam pulang
  const dayStats = useMemo(() => {
    if (mergedSubjects.length === 0) return null;
    const startTime = mergedSubjects[0].startTime;
    const endTime = mergedSubjects[mergedSubjects.length - 1].endTime;
    const lessonCount = mergedSubjects.filter(s => !s.isBreak).length;
    
    let totalJP = 0;
    mergedSubjects.forEach(s => {
      if (!s.isBreak) {
        const match = s.jpDisplay.match(/(\d+)/);
        totalJP += match ? parseInt(match[1], 10) : 2;
      }
    });

    return {
      startTime,
      endTime,
      lessonCount,
      totalJP
    };
  }, [mergedSubjects]);

  // Filtered subjects by search
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return mergedSubjects;
    const q = searchQuery.toLowerCase();
    return mergedSubjects.filter(b => 
      b.name.toLowerCase().includes(q) || 
      (b.topic && b.topic.toLowerCase().includes(q)) ||
      (b.teacher && b.teacher.toLowerCase().includes(q))
    );
  }, [mergedSubjects, searchQuery]);

  const handleCopySchedule = () => {
    if (mergedSubjects.length === 0) return;

    let text = `*JADWAL PELAJARAN - ${activeClass}*\n`;
    text += `*Hari ${activeDay} • MA NU Islamiyah*\n`;
    text += `----------------------------------------\n\n`;

    mergedSubjects.forEach((sub) => {
      const icon = sub.isBreak ? '☕' : '📖';
      const jp = sub.jpDisplay ? ` (${sub.jpDisplay})` : '';
      text += `${icon} *[${sub.timeRange} WIB]* ${sub.name}${jp}\n`;
      if (sub.teacher) {
        text += `   Guru: ${sub.teacher}\n`;
      }
      if (sub.topic) {
        text += `   Materi: ${sub.topic}\n`;
      }
      text += `\n`;
    });

    text += `----------------------------------------\n`;
    text += `Diakses dari Portal Angkatan`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleResetToStandard = async () => {
    if (!window.confirm('Kembalikan jadwal ke Kurikulum Standar Resmi?')) {
      return;
    }

    setLoading(true);
    try {
      for (const defaultClass of DEFAULT_CLASS_DATA) {
        const existing = classesData.find(c => c.className === defaultClass.className);
        if (existing?.id) {
          await updateDoc(doc(db, 'schedules', existing.id), {
            schedules: defaultClass.schedules
          });
        } else {
          await addDoc(collection(db, 'schedules'), {
            className: defaultClass.className,
            schedules: defaultClass.schedules
          });
        }
      }
      await fetchSchedules();
      alert('Jadwal berhasil diselaraskan ke kurikulum resmi!');
    } catch (err: any) {
      console.warn('Gagal memulihkan jadwal:', err?.message || err);
      alert('Gagal memulihkan jadwal.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    try {
      const newSchedule: Omit<ClassSchedule, 'id'> = {
        className: newClassName.trim(),
        schedules: DEFAULT_DAYS.map(day => ({
          day,
          subjects: []
        }))
      };
      
      await addDoc(collection(db, 'schedules'), newSchedule);
      setNewClassName('');
      setShowClassModal(false);
      fetchSchedules();
    } catch (err: any) {
      console.warn('Gagal menambahkan kelas:', err?.message || err);
      alert('Gagal menambahkan kelas.');
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassSchedule || !activeDaySchedule) return;

    try {
      let updatedSubjects = [...activeDaySchedule.subjects];
      
      if (editingItemIndex !== null) {
        updatedSubjects[editingItemIndex] = formData;
      } else {
        updatedSubjects.push(formData);
      }

      const updatedSchedules = selectedClassSchedule.schedules.map(sch => {
        if (sch.day === activeDay) {
          return { ...sch, subjects: updatedSubjects };
        }
        return sch;
      });

      if (selectedClassSchedule.id) {
        await updateDoc(doc(db, 'schedules', selectedClassSchedule.id), {
          schedules: updatedSchedules
        });
      } else {
        await addDoc(collection(db, 'schedules'), {
          className: selectedClassSchedule.className,
          schedules: updatedSchedules
        });
      }
      
      setShowItemModal(false);
      fetchSchedules();
    } catch (err: any) {
      console.warn('Gagal menyimpan jadwal:', err?.message || err);
      alert('Gagal menyimpan jadwal.');
    }
  };

  const handleDeleteRawItem = async (rawIndex: number) => {
    if (!window.confirm('Hapus sesi ini dari jadwal?')) return;
    if (!selectedClassSchedule || !activeDaySchedule) return;

    try {
      const updatedSchedules = selectedClassSchedule.schedules.map(sch => {
        if (sch.day === activeDay) {
          const newSubjects = sch.subjects.filter((_, i) => i !== rawIndex);
          return { ...sch, subjects: newSubjects };
        }
        return sch;
      });

      if (selectedClassSchedule.id) {
        await updateDoc(doc(db, 'schedules', selectedClassSchedule.id), {
          schedules: updatedSchedules
        });
      }
      fetchSchedules();
    } catch (err: any) {
      console.warn('Gagal menghapus item jadwal:', err?.message || err);
    }
  };

  const openAddItem = () => {
    setEditingItemIndex(null);
    setFormData({
      time: '07.00 - 08.20',
      name: '',
      jp: '2 JP',
      isBreak: false,
      topic: '',
      teacher: '',
      room: `Ruang ${activeClass}`
    });
    setShowItemModal(true);
  };

  const openEditBlock = (block: MergedScheduleBlock, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetIdx = block.rawIndices[0];
    const sourceItem = activeDaySchedule?.subjects[targetIdx];
    if (sourceItem) {
      setEditingItemIndex(targetIdx);
      setFormData({
        time: block.timeRange,
        name: block.name,
        jp: block.jpDisplay,
        isBreak: block.isBreak || false,
        topic: block.topic || '',
        teacher: block.teacher || '',
        room: block.room || `Ruang ${activeClass}`
      });
      setShowItemModal(true);
    }
  };

  const openDetailModal = (block: MergedScheduleBlock) => {
    setSelectedBlockDetail(block);
    const noteKey = `${activeClass}_${activeDay}_${block.name}`;
    setActiveNoteText(userNotes[noteKey] || '');
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 w-full pb-24 font-sans text-slate-800 dark:text-slate-100 space-y-4">
      
      {/* 1. Header Bar: Elegan, Berkarakter & Presisi */}
      <div className="pt-2 pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Jadwal Pelajaran
              </h1>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                MA NU Islamiyah
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kurikulum Semester Genap • {activeClass}
            </p>
          </div>
        </div>

        {/* Right Tools: Live Clock, Mode & Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Jam Madrasah Digital */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
          </div>

          {/* Toggle View Harian vs Sepekan */}
          <div className="inline-flex p-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Sepekan
            </button>
          </div>

          {/* Tombol Salin WA */}
          <button
            onClick={handleCopySchedule}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Salin Jadwal ke WhatsApp"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Cetak */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:inline-flex"
            title="Cetak Jadwal"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Selector Jurusan / Kelas */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0 mr-1">
          Kelas:
        </span>
        {classesData.map((c) => {
          const isSelected = activeClass === c.className;
          return (
            <button
              key={c.className}
              onClick={() => setActiveClass(c.className)}
              className={`shrink-0 px-3.5 py-1 rounded-md text-xs font-bold transition-colors border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {c.className}
            </button>
          );
        })}

        {isAdmin && (
          <div className="shrink-0 flex items-center gap-1.5 ml-auto pl-2">
            <button
              onClick={handleResetToStandard}
              className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
              title="Pulihkan Jadwal Kurikulum Resmi"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Standar</span>
            </button>
            <button
              onClick={() => setShowClassModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Plus className="w-3 h-3" />
              <span>Kelas Baru</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Strip Pemilih Hari */}
      {viewMode === 'daily' && (
        <div className="space-y-3">
          
          {/* Day Selector Strip - Responsive & Low-DPI Friendly */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
            {DEFAULT_DAYS.map((day) => {
              const isActive = day === activeDay;
              const currentToday = (() => {
                const dayMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                return dayMap[new Date().getDay()] === day;
              })();

              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`flex-1 min-w-[62px] sm:min-w-[80px] py-2 px-2 rounded-lg text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-semibold hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className="text-xs font-bold">{day}</span>
                  {currentToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Hari Ini" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Day Summary Ribbon: Low-DPI Adaptive */}
          {dayStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Jam Pelajaran</div>
                  <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                    {dayStats.startTime} – {dayStats.endTime} WIB
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:border-x sm:border-slate-200 sm:dark:border-slate-800 sm:px-3">
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Beban Belajar</div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">
                    {dayStats.lessonCount} Mapel • {dayStats.totalJP} JP
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Waktu Rehat
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    Istirahat Pagi & Siang
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Sesi Sedang Berlangsung (Interactive Spotlight Indicator) */}
          {isCurrentDayToday && liveSession && (
            <div className="p-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Sedang Berlangsung
                  </span>
                </div>
                {liveProgress && (
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200">
                    Tersisa {liveProgress.remaining} menit
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {liveSession.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {liveSession.topic || 'Materi pembelajaran kurikulum reguler semester genap'}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
                  {liveSession.timeRange} WIB
                </span>
              </div>

              {liveProgress && (
                <div className="w-full h-1.5 bg-emerald-200/80 dark:bg-emerald-900 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${liveProgress.percent}%` }}
                  />
                </div>
              )}

              {nextSession && (
                <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="font-bold">Berikutnya:</span>
                  <span>{nextSession.name} ({nextSession.timeRange} WIB)</span>
                </div>
              )}
            </div>
          )}

          {/* Search bar & quick action */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari mapel atau materi..."
                className="w-full pl-8 pr-3 py-1 rounded-md bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {isAdmin && (
              <button
                onClick={openAddItem}
                className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sesi</span>
              </button>
            )}
          </div>

        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span className="text-xs font-medium">Memuat jadwal pembelajaran...</span>
        </div>
      ) : (
        <>
          {/* DAILY VIEW: Daftar Mapel Berbobot dengan Identitas Visual */}
          {viewMode === 'daily' && (
            <div className="space-y-2.5">
              {filteredSubjects.length === 0 ? (
                <div className="py-12 text-center bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {searchQuery ? 'Tidak ada mata pelajaran yang cocok' : `Tidak ada jadwal di hari ${activeDay}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Waktu luang untuk belajar mandiri atau ekstrakurikuler.'}
                  </p>
                </div>
              ) : (
                filteredSubjects.map((block) => {
                  const status = getBlockStatus(block);
                  const isLive = status === 'live';
                  const meta = getSubjectMeta(block.name, block.isBreak);
                  const noteKey = `${activeClass}_${activeDay}_${block.name}`;
                  const hasNote = Boolean(userNotes[noteKey]);

                  // Sesi Rehat / Jam Istirahat (Desain Fresh, Jelas, dan Rileks)
                  if (block.isBreak) {
                    return (
                      <div 
                        key={block.key}
                        className="py-3 px-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 bg-amber-100/70 dark:bg-amber-900/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                            <Coffee className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-amber-950 dark:text-amber-200 text-xs sm:text-sm">
                                {block.timeRange} WIB
                              </span>
                              <span className="font-bold text-amber-900 dark:text-amber-300">
                                • {block.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-700/90 dark:text-amber-400 mt-0.5">
                              {block.topic || 'Waktu Istirahat & Relaksasi'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-400 shrink-0 font-medium self-end sm:self-auto">
                          <span className="bg-amber-100/90 dark:bg-amber-900/50 px-2.5 py-1 rounded-md border border-amber-200/90 dark:border-amber-800 text-[11px]">
                            {block.room || 'Area Madrasah'}
                          </span>
                          {isAdmin && block.rawIndices && block.rawIndices.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRawItem(block.rawIndices[0]);
                              }}
                              className="text-rose-600 hover:text-rose-700 p-1 ml-1 cursor-pointer"
                              title="Hapus Sesi Istirahat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Sesi Mata Pelajaran: Simpel, Jelas, Bersih, dan Fresh (Tanpa teks guru)
                  return (
                    <div
                      key={block.key}
                      onClick={() => openDetailModal(block)}
                      className={`group p-3.5 sm:p-4 rounded-xl border border-l-4 transition-all cursor-pointer ${meta.accentBorder} ${
                        isLive
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Waktu & JP Badge - Responsive on Low-DPI */}
                        <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-1.5 shrink-0 sm:w-36">
                          <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                            {block.timeRange} WIB
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${meta.badgeClass}`}>
                              {block.jpDisplay}
                            </span>
                            {isLive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white animate-pulse">
                                Aktif
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Nama Mapel, Kategori, dan Pokok Bahasan */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                {block.name}
                              </h3>
                              <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded border items-center gap-1 shrink-0 ${meta.badgeClass}`}>
                                <meta.icon className="w-3 h-3" />
                                <span>{meta.category}</span>
                              </span>
                            </div>
                            
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{block.room || `Ruang ${activeClass}`}</span>
                            </span>
                          </div>

                          {/* Topik / Bahasan Silabus */}
                          {block.topic && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                              {block.topic}
                            </p>
                          )}

                          {/* Catatan Pribadi / Badge PR jika ada */}
                          {hasNote && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              <FileText className="w-3 h-3" />
                              <span className="truncate max-w-[220px]">Catatan: {userNotes[noteKey]}</span>
                            </div>
                          )}
                        </div>

                        {/* Aksi Admin atau Panah Detail */}
                        <div className="shrink-0 flex items-center gap-1 sm:pl-2 self-end sm:self-auto">
                          {isAdmin ? (
                            <>
                              <button
                                onClick={(e) => openEditBlock(block, e)}
                                className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                title="Edit Sesi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRawItem(block.rawIndices[0]);
                                }}
                                className="p-1.5 rounded text-rose-400 hover:text-rose-600 cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* WEEKLY OVERVIEW: Matriks Sepekan Rapi & Padat */}
          {viewMode === 'weekly' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ringkasan Jadwal Sepekan ({activeClass})
                </span>
                <span className="text-[11px] text-slate-400">
                  Pilih salah satu hari untuk membuka rincian
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DEFAULT_DAYS.map((day) => {
                  const daySchedule = selectedClassSchedule?.schedules?.find(s => s.day === day);
                  const dayMerged = daySchedule ? mergeConsecutiveSubjects(daySchedule.subjects) : [];
                  const isCurrentDay = (() => {
                    const dayMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    return dayMap[new Date().getDay()] === day;
                  })();

                  return (
                    <div 
                      key={day}
                      onClick={() => {
                        setActiveDay(day);
                        setViewMode('daily');
                      }}
                      className={`p-3 rounded-xl border bg-white dark:bg-slate-850 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors ${
                        isCurrentDay
                          ? 'border-emerald-500/80 ring-1 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {day}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isCurrentDay && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Hari Ini
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-mono">
                            {dayMerged.filter(b => !b.isBreak).length} Mapel
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {dayMerged.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400">Libur / Tidak ada jadwal</div>
                        ) : (
                          dayMerged.map((item, idx) => {
                            return (
                              <div 
                                key={idx} 
                                className={`px-2 py-1 rounded text-xs flex items-center justify-between gap-1.5 ${
                                  item.isBreak 
                                    ? 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300' 
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="truncate flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-slate-400 font-medium">
                                    {item.startTime}
                                  </span>
                                  <span className="font-medium truncate flex items-center gap-1">
                                    {item.name}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {item.jpDisplay}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DETAIL MAPEL & CATATAN PRIBADI (Tugas / PR) */}
      {selectedBlockDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" onClick={() => setSelectedBlockDetail(null)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedBlockDetail.name}
                </h3>
                <p className="text-[11px] text-slate-400">{activeClass} • {activeDay}</p>
              </div>
              <button 
                onClick={() => setSelectedBlockDetail(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Alokasi Waktu</span>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {selectedBlockDetail.timeRange} WIB
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Beban JP</span>
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    {selectedBlockDetail.jpDisplay}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Ruangan</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedBlockDetail.room || `Ruang ${activeClass}`}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Kategori Bidang</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {getSubjectMeta(selectedBlockDetail.name, selectedBlockDetail.isBreak).category}
                  </div>
                </div>
              </div>

              {/* Pokok Bahasan Silabus */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Pokok Bahasan / Silabus:
                </span>
                <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200/70 dark:border-slate-800">
                  {selectedBlockDetail.topic || 'Materi pembelajaran kurikulum reguler semester genap MA NU Islamiyah.'}
                </p>
              </div>

              {/* Catatan Siswa / Pengingat PR (Disimpan ke LocalStorage) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-emerald-600" />
                    <span>Catatan Pribadi / Tugas (PR):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Tersimpan di perangkat</span>
                </div>
                <textarea
                  rows={2}
                  value={activeNoteText}
                  onChange={e => setActiveNoteText(e.target.value)}
                  placeholder="Misal: Tugas halaman 45 dikumpulkan pekan depan..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const noteKey = `${activeClass}_${activeDay}_${selectedBlockDetail.name}`;
                      saveNoteForSubject(noteKey, activeNoteText);
                      setSelectedBlockDetail(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Simpan Catatan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Kelas */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowClassModal(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tambah Kelas Baru</h3>
            </div>
            <form onSubmit={handleAddClass} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kelas
                </label>
                <input 
                  required 
                  type="text" 
                  placeholder="Misal: XII IPS 3"
                  value={newClassName} 
                  onChange={e => setNewClassName(e.target.value)} 
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowClassModal(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100">
                  Batal
                </button>
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Tambah Sesi */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowItemModal(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {editingItemIndex !== null ? 'Edit Sesi' : 'Tambah Sesi Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">{activeClass} • Hari {activeDay}</p>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Sesi
                  </label>
                  <input 
                    required 
                    type="text" 
                    value={formData.time} 
                    onChange={e => setFormData({...formData, time: e.target.value})} 
                    placeholder="07.45 - 09.05" 
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Durasi / JP
                  </label>
                  <input 
                    type="text" 
                    value={formData.jp || ''} 
                    onChange={e => setFormData({...formData, jp: e.target.value})} 
                    placeholder="2 JP" 
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pelajaran
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Contoh: Sosiologi" 
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pokok Bahasan / Materi
                </label>
                <input 
                  type="text" 
                  value={formData.topic || ''} 
                  onChange={e => setFormData({...formData, topic: e.target.value})} 
                  placeholder="Contoh: Bab 3 Perubahan Sosial" 
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ruang Kelas
                </label>
                <input 
                  type="text" 
                  value={formData.room || ''} 
                  onChange={e => setFormData({...formData, room: e.target.value})} 
                  placeholder={`Ruang ${activeClass}`} 
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" 
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                  <input 
                    type="checkbox" 
                    checked={formData.isBreak || false} 
                    onChange={e => setFormData({...formData, isBreak: e.target.checked})} 
                    className="rounded text-emerald-600"
                  />
                  <span>Tandai sebagai Jam Istirahat / Sholat</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100">
                  Batal
                </button>
                <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
