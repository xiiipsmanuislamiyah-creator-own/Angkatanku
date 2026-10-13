import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Page Imports
const Home = lazy(() => import('./pages/Home'));
const JadwalPelajaran = lazy(() => import('./pages/JadwalPelajaran'));
const Galeri = lazy(() => import('./pages/Galeri'));
const Prestasi = lazy(() => import('./pages/Prestasi'));
const FeedAngkatan = lazy(() => import('./pages/FeedAngkatan'));
const NusaAI = lazy(() => import('./pages/NusaAI'));
const AlatGame = lazy(() => import('./pages/AlatGame'));
const PortalAkses = lazy(() => import('./pages/PortalAkses'));
const LockScreen = lazy(() => import('./pages/LockScreen'));
const Guru = lazy(() => import('./pages/Guru'));
const Anggota = lazy(() => import('./pages/Anggota'));
const Mading = lazy(() => import('./pages/Mading'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const Rating = lazy(() => import('./pages/Rating'));
import { SystemNotification } from './SystemNotification';
const Inbox = lazy(() => import('./pages/Inbox'));
const CardSetup = lazy(() => import('./pages/CardSetup'));
const TentangWeb = lazy(() => import('./pages/TentangWeb'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
import { EditCardModal } from './components/EditCardModal';
import { LoginWelcomeModal } from './components/LoginWelcomeModal';
import CinematicRevealIntro from './components/CinematicRevealIntro';

const ChatHub=lazy(()=>import('./pages/ChatHub'));
const Albums=lazy(()=>import('./pages/Albums'));

// Known route mapping to support direct URLs like /jadwal, /mading, /home
const ROUTE_MAP: Record<string, string> = {
  '': 'landing',
  landing: 'landing',
  home: 'home',
  beranda: 'home',
  jadwal: 'jadwal',
  mading: 'mading',
  struktur: 'mading',
  kegiatan: 'home',
  anggota: 'anggota',
  siswa: 'anggota',
  'public-profile': 'public-profile',
  guru: 'guru',
  galeri: 'galeri',
  prestasi: 'prestasi',
  feed: 'feed',
  rating: 'rating',
  'nusa-ai': 'nusa-ai',
  ai: 'nusa-ai',
  'alat-game': 'alat-game',
  game: 'alat-game',
  tentang: 'tentang',
  informasi: 'tentang',
  info: 'tentang',
  portal: 'portal',
  'admin-panel': 'admin-panel',
  admin: 'admin-panel',
  login: 'login',
  profile: 'profile',
  profil: 'profile',
  setup: 'setup',
  inbox: 'inbox', chat:'chat', albums:'albums'
};

const parseLocationFromUrl = (): { tab: string; profileId?: string } => {
  if (typeof window === 'undefined') return { tab: 'landing' };

  // 1. Check pathname first (e.g. /jadwal, /mading, /siswa/123, /profile/123)
  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, '');
  const segments = pathname.split('/');
  const primary = (segments[0] || '').toLowerCase();

  if ((primary === 'siswa' || primary === 'profil' || primary === 'profile') && segments[1]) {
    return { tab: 'public-profile', profileId: segments[1] };
  }

  if (primary && ROUTE_MAP[primary]) {
    return { tab: ROUTE_MAP[primary] };
  }

  // 2. Fallback to hash if present (e.g. #jadwal)
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash && ROUTE_MAP[hash]) {
    return { tab: ROUTE_MAP[hash] };
  }

  return { tab: 'landing' };
};

export default function App() {
  const { 
    role, 
    loading: authLoading,
    currentStudent, 
    hasCreatedCard, 
    isCreateCardOpen, 
    createCardReason, 
    openCreateCard, 
    closeCreateCard, 
    refreshStudent 
  } = useAuth();

  const initialLoc = parseLocationFromUrl();
  const [activeTab, setActiveTab] = useState<string>(initialLoc.tab);
  const [publicProfileId, setPublicProfileId] = useState<string | null>(initialLoc.profileId || null);
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('ekosistem_features_unlocked') === 'true';
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Sync browser URL whenever page changes
  const updateBrowserUrl = (targetTab: string, profileId?: string) => {
    if (typeof window === 'undefined') return;
    let targetPath = '/';
    if (targetTab === 'landing') {
      targetPath = '/';
    } else if (targetTab === 'home') {
      targetPath = '/home';
    } else if (targetTab === 'public-profile' && profileId) {
      targetPath = `/siswa/${profileId}`;
    } else {
      targetPath = `/${targetTab}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: targetTab, profileId }, '', targetPath);
    }
  };

  // Listen to browser Back and Forward navigation buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
        if (event.state.profileId) {
          setPublicProfileId(event.state.profileId);
        } else {
          setPublicProfileId(null);
        }
        return;
      }
      const loc = parseLocationFromUrl();
      setActiveTab(loc.tab);
      if (loc.profileId) {
        setPublicProfileId(loc.profileId);
      } else {
        setPublicProfileId(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ensure browser URL aligns with initial load if needed (normalize /landing to /)
  useEffect(() => {
    if (window.location.pathname === '/landing') {
      window.history.replaceState({ tab: 'landing' }, '', '/');
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleUnlock = () => {
    setUnlocked(true);
    localStorage.setItem('ekosistem_features_unlocked', 'true');
  };

  const [portalState, setPortalState] = useState<{
    isActive: boolean;
    targetTab: string;
    pageName: string;
    step: 'idle' | 'expanding' | 'revealing';
  }>({
    isActive: false,
    targetTab: 'home',
    pageName: '',
    step: 'idle',
  });

  // Automatically scroll to top on tab transitions to keep the mobile experience comfortable
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const navigateWithPortal = (targetTab: string, pageName?: string, data?: any) => {
    if (targetTab === 'public-profile' && data) {
      setPublicProfileId(data);
    }
    
    updateBrowserUrl(targetTab, targetTab === 'public-profile' ? data : undefined);

    if (portalState.isActive) return;
    if (targetTab === activeTab && targetTab !== 'public-profile') return;

    const pageNameMap: Record<string, string> = {
      home: 'Pusat Kendali',
      anggota: 'Direktori Siswa',
      jadwal: 'Jadwal Pelajaran',
      galeri: 'Galeri Memori',
      prestasi: 'Papan Prestasi',
      feed: 'Feed Angkatan',
      'nusa-ai': 'Nusa AI Bot',
      'alat-game': 'Alat & Game',
      guru: 'Daftar Guru',
      rating: 'Rating & Ulasan',
      portal: 'Portal Semua Halaman',
      'admin-panel': 'Control Panel',
      tentang: 'Pusat Informasi',
      landing: 'Halaman Utama & Prolog'
    };

    const finalName = pageName || pageNameMap[targetTab] || 'Arsip Digital';

    // ONLY trigger the heavy cinematic portal animation when opening the portal hub itself
    if (targetTab === 'portal') {
      setPortalState({
        isActive: true,
        targetTab,
        pageName: finalName,
        step: 'expanding',
      });

      setTimeout(() => {
        setActiveTab(targetTab);
        setPortalState((prev) => ({ ...prev, step: 'revealing' }));

        setTimeout(() => {
          setPortalState({
            isActive: false,
            targetTab: 'home',
            pageName: '',
            step: 'idle',
          });
        }, 500); // Snappy finish
      }, 900); // Faster expansion timing for extremely crisp performance
    } else {
      // Instant transition for other pages
      setActiveTab(targetTab);
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={navigateWithPortal} activeTab={activeTab} />;
      case 'anggota':
        return <Anggota onNavigate={navigateWithPortal} />;
      case 'mading':
      case 'struktur':
        return <Mading onNavigate={navigateWithPortal} />;
      case 'kegiatan':
        return <Home onNavigate={navigateWithPortal} activeTab="home" />;
      case 'jadwal':
        return <JadwalPelajaran onNavigate={navigateWithPortal} />;
      case 'galeri':
        return <Galeri />;
      case 'prestasi':
        return <Prestasi />;
      case 'setup':
        return <CardSetup onNavigate={navigateWithPortal} />;
      case 'feed': return <FeedAngkatan />;
      case 'nusa-ai': return <NusaAI />;
      case 'chat': return <ChatHub />;
      case 'albums': return <Albums />;
      case 'alat-game':
        return <AlatGame />;
      case 'guru':
        return <Guru onNavigate={navigateWithPortal} />;
      case 'portal':
        return <PortalAkses onNavigate={navigateWithPortal} unlocked={unlocked} onUnlock={handleUnlock} />;
      case 'admin-panel':
        return <AdminPanel onNavigate={navigateWithPortal} />;
      case 'inbox':
        return <Inbox />;
      case 'rating':
        return <Rating />;
      case 'login':
        return <Login onNavigate={navigateWithPortal} />;
      case 'profile':
        return <Profile onNavigate={navigateWithPortal} />;
      case 'tentang':
        return <TentangWeb onNavigate={navigateWithPortal} />;
      case 'landing':
        return <LandingPage onNavigate={navigateWithPortal} />;
      case 'public-profile':
        return publicProfileId ? <PublicProfile userId={publicProfileId} onNavigate={navigateWithPortal} /> : <Home onNavigate={navigateWithPortal} activeTab={activeTab} />;
      default:
        return <Home onNavigate={navigateWithPortal} activeTab={activeTab} />;
    }
  };

  return (
    <div className={`${activeTab === 'mading' ? 'h-dvh overflow-hidden' : 'min-h-screen'} bg-slate-50/40 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-teal-500 selection:text-white overflow-x-hidden transition-colors duration-300`}>
      
      <a className="ak-skip" href="#main-content">Lewati ke konten</a>
      {/* 1. Frosted Navigation bar (hidden on 'landing' and 'tentang' to keep tentang page with only the centered big logo) */}
      {activeTab !== 'landing' && activeTab !== 'tentang' && (
        <Navbar activeTab={activeTab} setActiveTab={navigateWithPortal} unlocked={unlocked} isDark={isDark} toggleTheme={toggleTheme} />
      )}
      <SystemNotification />

      {/* 2. Main Page Container with transition space for fixed header */}
      <main id="main-content" tabIndex={-1} className={`flex-1 w-full ${activeTab === 'landing' ? 'p-0' : activeTab === 'tentang' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12' : activeTab === 'mading' ? 'p-0 pt-20 h-dvh overflow-hidden relative' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 lg:pb-12'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <Suspense fallback={<div className="ak-loading" role="status">Memuat halaman…</div>}>{renderActivePage()}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Footer (hidden on 'mading' and 'landing') */}
      {activeTab !== 'mading' && activeTab !== 'landing' && <Footer setActiveTab={navigateWithPortal} />}

      {/* 4. Cinematic Fullscreen Portal Overlay */}
      <AnimatePresence>
        {portalState.isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 backdrop-blur-xs pointer-events-auto select-none overflow-hidden"
          >
            {/* The dramatic growing circle */}
            <motion.div
              initial={{ scale: 0, opacity: 0.9 }}
              animate={portalState.step === 'expanding' ? { scale: 55, opacity: 1 } : { scale: 55, opacity: [1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={
                portalState.step === 'expanding' 
                  ? { duration: 1.35, ease: [0.16, 1, 0.3, 1] } 
                  : { duration: 0.7, ease: 'easeOut' }
              }
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-teal-950 shadow-2xl border border-teal-500/10"
            />

            {/* Central Info Label during transition */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={portalState.step === 'expanding' ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute text-center max-w-md px-6 pointer-events-none"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-archive-teal text-[10px] font-mono font-bold tracking-widest mb-3 animate-pulse">
                SINKRONISASI MEMORI KELAS
              </div>
              <h2 className="text-2xl font-bold font-display text-white tracking-wider uppercase drop-shadow-sm">
                {portalState.pageName}
              </h2>
              <p className="text-xs text-slate-400 mt-2 font-mono tracking-wide">
                Mengalihkan kesadaran digital... mohon tunggu
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Post-Login Professional Welcome Greeting Modal */}
      <LoginWelcomeModal onNavigate={navigateWithPortal} />

      {/* Cinematic Reveal Intro Animation on First Visit */}
      <CinematicRevealIntro />

      {/* Global Student Card Setup & Gate Modal (Teachers do not require student card) */}
      {isCreateCardOpen && currentStudent && !currentStudent.isTeacher && !currentStudent.isKepsek && (
        <EditCardModal
          student={currentStudent}
          onClose={closeCreateCard}
          onSuccess={async () => {
            await refreshStudent();
            closeCreateCard();
          }}
          reason={createCardReason}
          isNewCard={!hasCreatedCard}
        />
      )}
    </div>
  );
}
