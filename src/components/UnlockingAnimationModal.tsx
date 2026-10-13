import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  School,
  Award,
  QrCode,
  Users,
  FileText,
  Lock,
  Unlock,
  Check
} from 'lucide-react';

interface UnlockingAnimationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  studentName?: string;
}

interface VerificationStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: 'verify_id',
    title: 'Validasi Integritas Identitas Siswa',
    subtitle: 'Mencocokkan nomor induk dan data pangkalan madrasah',
    icon: ShieldCheck
  },
  {
    id: 'issue_cert',
    title: 'Penerbitan Kredensial Digital & QR Code',
    subtitle: 'Menyematkan sertifikat otentikasi resmi angkatan 2026',
    icon: QrCode
  },
  {
    id: 'sync_modules',
    title: 'Aktivasi Hak Akses Ekosistem Kelas',
    subtitle: 'Membuka izin akses mading digital, galeri memori, & direktori',
    icon: Users
  }
];

export const UnlockingAnimationModal: React.FC<UnlockingAnimationModalProps> = ({
  isOpen,
  onComplete,
  studentName = 'Siswa'
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
      setIsCompleted(false);
      return;
    }

    // Step 1: Step 0 is active immediately
    // Step 2: Transition to step 1 after 700ms
    const t1 = setTimeout(() => {
      setActiveStep(1);
    }, 700);

    // Step 3: Transition to step 2 after 1400ms
    const t2 = setTimeout(() => {
      setActiveStep(2);
    }, 1400);

    // Final: Complete ceremony after 2100ms
    const t3 = setTimeout(() => {
      setActiveStep(3);
      setIsCompleted(true);
    }, 2100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="card-upgrade-modal-overlay"
        className="fixed inset-0 z-[230] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden select-none"
      >
        <motion.div
          id="card-upgrade-modal"
          initial={{ scale: 0.95, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        >
          {/* Institutional Emblem & Status */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm">
                <School className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase block font-mono">
                  MA NU Islamiyah
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Otentikasi Kartu Digital
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono font-bold uppercase">
              <Award className="w-3.5 h-3.5" />
              <span>Resmi Angkatan 2026</span>
            </div>
          </div>

          {/* Stately Announcement & Card Elevation */}
          <div className="pt-5 pb-3 text-center">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 mb-3 shadow-inner"
            >
              <ShieldCheck className="w-7 h-7" />
            </motion.div>
            
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
              Aktivasi Kartu Pelajar Digital
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Memproses pendaftaran dan sinkronisasi kartu untuk <strong className="text-slate-900 dark:text-white">{studentName}</strong> ke sistem portal madrasah.
            </p>
          </div>

          {/* Verification Milestones */}
          <div className="my-5 space-y-2.5">
            {VERIFICATION_STEPS.map((step, idx) => {
              const isDone = activeStep > idx;
              const isCurrent = activeStep === idx && !isCompleted;
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.1 }}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/70 shadow-sm'
                      : isCurrent
                      ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                      : 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? 'bg-emerald-700 text-white'
                        : isCurrent
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      <StepIcon className="w-4 h-4" />
                    </div>

                    <div className="text-left min-w-0">
                      <h4 className={`text-xs sm:text-sm font-semibold truncate ${
                        isDone 
                          ? 'text-slate-900 dark:text-white' 
                          : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Selesai</span>
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[11px] font-mono text-slate-500 animate-pulse">
                        Memvalidasi...
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Menunggu
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Formal Confirmation Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            {isCompleted ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Kartu pelajar digital Anda telah terverifikasi dan siap digunakan.
                </p>

                <button
                  id="btn-complete-upgrade"
                  onClick={onComplete}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Mulai Jelajahi Ekosistem Angkatan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 py-3">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Menyinkronkan data kartu ke pangkalan resmi...</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
