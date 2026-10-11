import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ArrowRight, Award, Crown, GraduationCap, School, BookOpen, Settings, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginWelcomeModalProps {
  onNavigate: (tab: string) => void;
}

export const LoginWelcomeModal: React.FC<LoginWelcomeModalProps> = ({ onNavigate }) => {
  const { user, currentStudent, isKepsek, isTeacher, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user just logged in via session flag or local storage backup
    const checkGreeting = () => {
      const sFlag = sessionStorage.getItem('just_logged_in_greeting');
      const lFlag = localStorage.getItem('pending_welcome_greeting');
      if ((sFlag === 'true' || lFlag === 'true') && user) {
        setIsOpen(true);
      }
    };

    if (user) {
      checkGreeting();
    }

    const handleCustomLoginEvent = () => {
      setTimeout(checkGreeting, 350);
    };

    window.addEventListener('app_user_logged_in', handleCustomLoginEvent);
    return () => {
      window.removeEventListener('app_user_logged_in', handleCustomLoginEvent);
    };
  }, [user, currentStudent]);

  const handleClose = () => {
    sessionStorage.removeItem('just_logged_in_greeting');
    localStorage.removeItem('pending_welcome_greeting');
    setIsOpen(false);
  };

  const handleGoToProfile = () => {
    handleClose();
    onNavigate('profile');
  };

  const handleGoToAdmin = () => {
    handleClose();
    onNavigate('admin');
  };

  if (!isOpen || !user) return null;

  // Determine user identity
  const isPrincipal = Boolean(
    isKepsek || 
    currentStudent?.isKepsek === true ||
    currentStudent?.role === 'Kepala Madrasah' ||
    (user?.email && user.email.toLowerCase().includes('abdul_holik')) ||
    (currentStudent?.name && currentStudent.name.toLowerCase().includes('abdul holik'))
  );

  const isTeacherUser = Boolean(
    !isPrincipal && (isTeacher || currentStudent?.isTeacher === true)
  );

  const displayName = currentStudent?.name || currentStudent?.nama || user?.displayName || user?.email?.split('@')[0] || (isPrincipal ? 'Bapak ABDUL HOLIK S.Ag.' : 'Pengguna');
  const nickname = currentStudent?.nickname || (displayName || 'Pengguna').split(' ')[0];
  const nipOrInduk = currentStudent?.nip || currentStudent?.induk || (isPrincipal ? '190001' : (currentStudent?.username?.replace(/^@/, '') || '-'));
  const avatarUrl = currentStudent?.avatarUrl || currentStudent?.url_gambar || null;

  return (
    <AnimatePresence>
      <div 
        id="login-welcome-overlay"
        className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
      >
        <motion.div
          id="login-welcome-modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 border ${
            isPrincipal 
              ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white border-amber-400/40 shadow-amber-950/40' 
              : isTeacherUser
              ? 'bg-slate-900 text-white border-emerald-500/30 shadow-emerald-950/30'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Top Decorative Glow for Principal */}
          {isPrincipal && (
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Tutup Sambutan"
            className={`absolute top-4 right-4 p-2 rounded-xl transition-colors cursor-pointer z-10 ${
              isPrincipal || isTeacherUser 
                ? 'text-slate-400 hover:text-slate-200 hover:bg-white/10' 
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Institutional Header */}
          <div className={`flex items-center justify-between pb-4 border-b ${
            isPrincipal || isTeacherUser ? 'border-white/10' : 'border-slate-100 dark:border-slate-800'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${
                isPrincipal
                  ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-400/30'
                  : isTeacherUser
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {isPrincipal ? <Crown className="w-5 h-5" /> : isTeacherUser ? <School className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
              </div>
              <div>
                <span className={`text-[11px] font-bold tracking-widest uppercase block font-mono ${
                  isPrincipal ? 'text-amber-300' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  MA NU Islamiyah Asembagus
                </span>
                <span className={`text-xs block ${isPrincipal || isTeacherUser ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {isPrincipal ? 'Pusat Kendali & Pimpinan Lembaga' : isTeacherUser ? 'Portal Resmi Tenaga Pendidik' : 'Portal Resmi Angkatan 2026'}
                </span>
              </div>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isPrincipal
                ? 'bg-amber-400/15 border border-amber-400/40 text-amber-300'
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isPrincipal ? 'Akses Eksekutif' : 'Terautentikasi'}</span>
            </div>
          </div>

          {/* Main Greeting Content */}
          <div className="py-6 text-center">
            {(isPrincipal || isTeacherUser) && (
              <p className={`text-xs sm:text-sm font-medium mb-1.5 tracking-wide ${
                isPrincipal ? 'text-amber-300/90' : 'text-emerald-400'
              }`}>
                Assalamu'alaikum Warahmatullahi Wabarakatuh
              </p>
            )}

            <h2 className={`text-2xl sm:text-3xl font-bold font-display tracking-tight ${
              isPrincipal || isTeacherUser ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}>
              {isPrincipal ? (
                <>Ahlan wa Sahlan,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 font-serif">Bapak ABDUL HOLIK S.Ag.</span></>
              ) : isTeacherUser ? (
                <>Selamat Datang, Bapak/Ibu<br /><span className="text-emerald-300 font-serif">{displayName}</span></>
              ) : (
                <>Selamat Datang, <span className="text-emerald-600 dark:text-emerald-400">{nickname}</span>!</>
              )}
            </h2>

            <p className={`text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed ${
              isPrincipal || isTeacherUser ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'
            }`}>
              {isPrincipal 
                ? 'Selamat datang di Ruang Kendali Web MA NU Islamiyah. Sebagai Kepala Madrasah, Anda memiliki kedudukan penuh setara Administrator untuk mengontrol dan mengelola seluruh sistem web, mading, galeri, dan data madrasah.'
                : isTeacherUser
                ? 'Identitas pendidik Anda telah terverifikasi resmi oleh sistem. Profil dan kartu digital pengajar Anda aktif di direktori dewan guru dan mading madrasah.'
                : 'Sistem resmi madrasah telah memverifikasi identitas Anda untuk Tahun Ajaran 2025/2026. Selamat bernostalgia dan melihat karya angkatan!'}
            </p>
          </div>

          {/* Role-Specific Credential Summary Card */}
          <div className={`rounded-2xl p-4 mb-6 border ${
            isPrincipal 
              ? 'bg-slate-900/90 border-amber-500/30 ring-1 ring-amber-500/20' 
              : isTeacherUser
              ? 'bg-slate-800/80 border-emerald-500/20'
              : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80'
          }`}>
            <div className="flex items-center gap-3.5">
              {avatarUrl && avatarUrl.trim() !== '' ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  className={`w-14 h-14 rounded-2xl object-cover border shrink-0 ${
                    isPrincipal ? 'border-amber-400/60 shadow-md shadow-amber-500/20' : 'border-slate-200 dark:border-slate-700'
                  }`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${
                  isPrincipal
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-serif'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-bold truncate ${
                    isPrincipal ? 'text-amber-200' : isTeacherUser ? 'text-white' : 'text-slate-900 dark:text-white'
                  }`}>
                    {displayName}
                  </h3>
                  {isPrincipal && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
                      Kepala Madrasah
                    </span>
                  )}
                  {isTeacherUser && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                      Dewan Guru
                    </span>
                  )}
                </div>

                <div className={`flex flex-wrap items-center gap-2 text-xs mt-1 ${
                  isPrincipal || isTeacherUser ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  <span>
                    {isPrincipal || isTeacherUser ? 'NIP:' : 'No. Induk:'}{' '}
                    <strong className={`font-mono ${isPrincipal || isTeacherUser ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{nipOrInduk}</strong>
                  </span>
                  <span>•</span>
                  <span className="truncate">
                    {isPrincipal 
                      ? 'Pimpinan Lembaga' 
                      : (currentStudent?.jabatan || currentStudent?.title || (isTeacherUser ? 'Tenaga Pendidik' : (currentStudent?.classRoom || 'XII IPS')))}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-status badge */}
            <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
              isPrincipal || isTeacherUser 
                ? 'border-white/10 text-slate-300' 
                : 'border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
            }`}>
              <span className="flex items-center gap-1.5">
                {isPrincipal ? (
                  <>
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-200/90 font-medium">Hak Akses: Administrator Web Penuh</span>
                  </>
                ) : isTeacherUser ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-200/90 font-medium">Status: Pendidik Aktif MA NU Islamiyah</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium">Status: Anggota Terverifikasi</span>
                  </>
                )}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Sesi Aktif
              </span>
            </div>
          </div>

          {/* Action Buttons tailored to role */}
          <div className="space-y-2.5">
            {isPrincipal ? (
              <>
                <button
                  id="btn-welcome-admin-panel"
                  onClick={handleGoToAdmin}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-950" />
                  <span>Buka Pusat Kontrol Web (Admin Panel)</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 ml-1" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-welcome-profile-kepsek"
                    onClick={handleGoToProfile}
                    className="py-2.5 px-3 rounded-xl border border-amber-500/30 hover:bg-amber-500/10 text-amber-200 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Atur Profil Kepala Madrasah</span>
                  </button>
                  <button
                    id="btn-welcome-home-kepsek"
                    onClick={handleClose}
                    className="py-2.5 px-3 rounded-xl border border-white/15 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Lanjut ke Beranda Portal</span>
                  </button>
                </div>
              </>
            ) : isTeacherUser ? (
              <>
                <button
                  id="btn-welcome-profile-teacher"
                  onClick={handleGoToProfile}
                  className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Lihat & Kelola Profil Pendidik</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  id="btn-welcome-enter-home"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl border border-white/15 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Lanjut ke Beranda Portal
                </button>
              </>
            ) : (
              <>
                <button
                  id="btn-welcome-enter-home"
                  onClick={handleClose}
                  className="w-full py-3 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-semibold shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Mulai Masuk ke Beranda Angkatan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="btn-welcome-view-profile"
                  onClick={handleGoToProfile}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  Lihat Profil & Kartu Pelajar Digital Saya
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
