import React from 'react';
import { Lock, Compass, ArrowRight, Sparkles, AlertCircle, IdCard } from 'lucide-react';
import { motion } from 'motion/react';

interface LockScreenProps {
  featureName: string;
  onNavigate: (tabId: string, pageName?: string) => void;
  cardRequired?: boolean;
  onOpenCreateCard?: () => void;
}

export default function LockScreen({ featureName, onNavigate, cardRequired, onOpenCreateCard }: LockScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden text-slate-900 dark:text-white"
      >
        {/* Subtle decorative background gradient */}
        <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-20 -top-20 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header Icon */}
        <div className="relative">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
            cardRequired 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
          }`}>
            {cardRequired ? (
              <IdCard className="w-8 h-8 animate-pulse" />
            ) : (
              <Lock className="w-8 h-8 animate-pulse" />
            )}
          </div>
          <span className="absolute top-0 right-[38%] flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              cardRequired ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              cardRequired ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-display">
            {cardRequired ? 'Wajib Membuat Kartu Siswa' : 'Akses Terkunci'}
          </h2>
          <p className={`text-[10px] font-mono font-bold tracking-widest uppercase ${
            cardRequired ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {featureName} • {cardRequired ? 'STUDENT_CARD_REQUIRED' : 'SECURE_GATE'}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {cardRequired ? (
            <>
              Untuk menggunakan dan berinteraksi di <span className="font-semibold text-slate-800 dark:text-white">{featureName}</span>, Anda wajib membuat Kartu Pelajar Digital terlebih dahulu sebagai identitas resmi siswa.
            </>
          ) : (
            <>
              Fitur <span className="font-semibold text-slate-800 dark:text-white">{featureName}</span> saat ini dibatasi untuk umum demi menjaga keamanan dan privasi arsip digital angkatan.
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => onNavigate('home')}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs md:text-sm transition-all active:scale-95 cursor-pointer"
          >
            Kembali ke Beranda
          </button>
          
          {cardRequired && onOpenCreateCard ? (
            <button
              onClick={onOpenCreateCard}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Buat Kartu Sekarang</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('portal')}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Portal Akses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

