import React from 'react';
import { 
  Wrench, 
  Gamepad2, 
  Calculator, 
  CheckCircle2, 
  HelpCircle, 
  Dices, 
  Sparkles, 
  ChevronRight,
  Cpu,
  BarChart2,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function AlatGame() {
  const tools: any[] = [];
  const games: any[] = [];

  return (
    <div className="space-y-12 py-4">
      
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-teal-300 border border-slate-800 text-[11px] font-mono font-semibold uppercase tracking-wider">
          <Wrench className="w-3.5 h-3.5 text-archive-teal animate-pulse" />
          MODUL UTILITY &amp; SIMULASI
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 dark:text-white font-display">
          Alat Belajar &amp; Game Edukasi
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Ruang ekosistem digital untuk mengakses instrumen belajar mandiri dan simulasi interaktif. Halaman ini dipersiapkan sebagai wadah integrasi utilitas belajar Angkatan 2026.
        </p>
      </div>

      {/* Main Grid split for Tools and Games */}
      <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-2">
        <Wrench className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-xs text-slate-400 font-mono">BELUM_ADA_MODUL_ALAT_DAN_GAME</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Modul alat bantu belajar dan simulasi game edukasi saat ini masih dalam perancangan.</p>
      </div>

      {/* Info Warning Footnote */}
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <h4 className="font-bold text-xs text-slate-700 font-display flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Catatan Desain Arsitektur Sistem
          </h4>
          <p className="text-[11px] text-slate-500 max-w-xl">
            Sesuai dengan spesifikasi terbaru, halaman ini menyajikan layout desain konseptual yang ringan (clean menu placeholder). Modul-modul ini akan diaktifkan secara bertahap pada fase rilis berikutnya.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 font-semibold border border-slate-200 bg-white rounded-lg px-3 py-1.5">
          <span>ALAT_GAME_LAYOUT_ONLY</span>
        </div>
      </div>

    </div>
  );
}
