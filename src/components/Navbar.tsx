import React, { useState } from 'react';
import {
  User,
  LogIn, 
  LogOut,
  Network, 
  Menu, 
  X, 
  Home, 
  Users, 
  UserCheck,
  Calendar, 
  Activity, 
  Image, 
  Award, 
  MessageSquare, 
  Bot, 
  Wrench,
  GraduationCap,
  Sun,
  Moon,
  ShieldCheck,
  Bell,
  Star,
  Crown,
  FileText,
  Info,
  Compass
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tabId: string, name?: string, uid?: string) => void;
  unlocked?: boolean;
  isDark: boolean;
  toggleTheme: () => void;
}

export default function Navbar({ activeTab, setActiveTab, unlocked = false, isDark, toggleTheme }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  
  const handleLogout = async () => {
    setActiveTab('home');
    await signOut();
  };  
  const handleLogoClick = () => {
    setActiveTab('home');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'mading', label: 'Mading', icon: UserCheck },
    { id: 'anggota', label: 'Siswa', icon: UserCheck },
    { id: 'jadwal', label: 'Jadwal', icon: Calendar },
    { id: 'guru', label: 'Guru', icon: GraduationCap },
    { id: 'galeri', label: 'Galeri', icon: Image },
    { id: 'prestasi', label: 'Prestasi', icon: Award },
    { id: 'rating', label: 'Rating', icon: Star },
    { id: 'feed', label: 'Feed', icon: MessageSquare },
    { id: 'nusa-ai', label: 'Nusa AI', icon: Bot },
    { id: 'alat-game', label: 'Alat & Game', icon: Wrench },
    { id: 'tentang', label: 'Informasi', icon: Info },
  ];

  return (
    <>
      <nav id="navbar" className="fixed top-0 w-full z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo AngkatanKU */}
            <div 
              className="flex items-center gap-3.5 cursor-pointer group"
              onClick={handleLogoClick}
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border border-sky-500/40 shadow-lg p-1 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                <img src="/gambar/favicon.png" alt="Logo AngkatanKU" className="w-full h-full object-contain" />
              </div>

              <div className="flex flex-col">
                <span className="font-extrabold text-xl sm:text-2xl tracking-wider text-slate-900 dark:text-white uppercase font-display flex items-center">
                  Angkatan<span className="text-emerald-500">KU</span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 tracking-wider uppercase font-semibold">
                  XII IPS 1 & 2 &bull; MA NU ISLAMIYAH
                </span>
              </div>
            </div>

            {/* Desktop Theme Toggle & Menu */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3">
              <div className="flex space-x-0.5 xl:space-x-1.5 text-[11px] xl:text-xs 2xl:text-sm font-medium text-slate-500">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const isLockedFeature = (item.id === 'feed' || item.id === 'nusa-ai') && !unlocked;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`px-1.5 xl:px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 xl:gap-1.5 cursor-pointer shrink-0 ${
                        isActive 
                          ? 'bg-teal-500/10 text-archive-teal font-semibold dark:bg-teal-500/20' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <item.icon className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${isActive ? 'text-archive-teal' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {isLockedFeature && (
                        <span className="text-[10px] hidden xl:inline">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin-panel')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    activeTab === 'admin-panel'
                      ? 'border-rose-500 bg-rose-600 text-white shadow-rose-500/20'
                      : 'border-rose-300 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                  }`}
                  title="Buka Admin Panel & Studio"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* Auth Buttons */}
              {user ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveTab('public-profile', 'Profil Saya', user.uid)}
                    className="px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-600 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-400 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Profil Saya"
                  >
                    <User className="w-3.5 h-3.5" /> Profil
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                    title="Keluar"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setActiveTab('login')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Masuk atau Daftar"
                >
                  <LogIn className="w-3.5 h-3.5" /> Login
                </button>
              )}

              {/* Desktop Inbox Button */}
              {user && (
                <button
                  onClick={() => setActiveTab('inbox')}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center relative"
                  title="Notifikasi & Inbox"
                >
                  <Bell className="w-4 h-4" />
                </button>
              )}
              </div>
            </div>

            {/* Mobile Menu Button & Inbox */}
            <div className="flex items-center gap-2 lg:hidden">
              {user && (
                <button
                  onClick={() => setActiveTab('inbox')}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer relative"
                  title="Notifikasi & Inbox"
                >
                  <Bell className="w-4.5 h-4.5" />
                </button>
              )}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-archive-teal rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 h-full w-[280px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800/80 shadow-2xl z-50 p-6 flex flex-col transform transition-transform duration-300 ease-out lg:hidden overflow-y-auto ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-archive-teal" />
              <span className="font-bold text-xs tracking-wider text-slate-800 dark:text-slate-100">MENU DIGITAL</span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isLockedFeature = (item.id === 'feed' || item.id === 'nusa-ai') && !unlocked;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-teal-500/10 text-archive-teal font-semibold dark:bg-teal-500/20' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-archive-teal' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-sm flex-1">{item.label}</span>
                  {isLockedFeature && (
                    <span className="text-xs">🔒</span>
                  )}
                </button>
              );
            })}
            
            {/* Mobile Auth Button */}
            <div className="mt-6 mb-4 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {user ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('public-profile', 'Profil Saya', user.uid);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-semibold"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-semibold flex-1">Profil Saya</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-semibold flex-1">Keluar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                >
                  <LogIn className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm flex-1">Login / Daftar</span>
                </button>
              )}
            </div>

            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider px-4 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> AREA ADMINISTRATOR
                </div>
                <button
                  onClick={() => {
                    setActiveTab('admin-panel');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === 'admin-panel'
                      ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="text-sm font-bold">Admin Panel & Studio</div>
                    <div className="text-[11px] opacity-80 font-normal">Kelola Siswa, Story, Galeri & Notifikasi</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Theme Toggle & Footer info inside Drawer */}
        <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 space-y-4">
          <button
            onClick={toggleTheme}
            className="w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            <span className="text-sm font-semibold flex-1 text-left">
              {isDark ? "Mode Terang" : "Mode Gelap"}
            </span>
          </button>
          
          <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest pb-2">
            MA NU ISLAMIYAH XII IPS
          </p>
        </div>
      </div>
    </>
  );
}
