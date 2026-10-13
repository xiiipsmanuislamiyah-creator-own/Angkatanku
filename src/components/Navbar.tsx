import React, { useState } from "react";
import {
  Home,
  Users,
  MessageCircle,
  Images,
  Sparkles,
  Menu,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Calendar,
  GraduationCap,
  Network,
  Compass,
  Award,
  Wrench,
  Info,
  Star,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Modal from "./ui/Modal";
interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string, name?: string, uid?: string) => void;
  unlocked?: boolean;
  isDark: boolean;
  toggleTheme: () => void;
}
export default function Navbar({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
}: NavbarProps) {
  const { user, isAdmin, signOut } = useAuth(),
    [open, setOpen] = useState(false);
  const nav = [
    { id: "home", label: "Beranda", icon: Home },
    { id: "anggota", label: "Angkatan", icon: Users },
    { id: "feed", label: "Komunitas", icon: MessageCircle },
    { id: "galeri", label: "Arsip", icon: Images },
    { id: "nusa-ai", label: "Nusa", icon: Sparkles },
  ];
  const more = [
    { id: "chat", label: "Chat angkatan", icon: MessageCircle },
    { id: "albums", label: "Album", icon: Images },
    { id: "guru", label: "Direktori guru", icon: GraduationCap },
    { id: "jadwal", label: "Jadwal", icon: Calendar },
    { id: "mading", label: "Peta angkatan", icon: Network },
    { id: "prestasi", label: "Prestasi", icon: Award },
    { id: "alat-game", label: "Alat & game", icon: Wrench },
    { id: "rating", label: "Ulasan", icon: Star },
    { id: "portal", label: "Jelajah ekosistem", icon: Compass },
    { id: "tentang", label: "Tentang AngkatanKU", icon: Info },
  ];
  const go = (id: string) => {
    setActiveTab(id);
    setOpen(false);
  };
  return (
    <>
      <nav id="navbar" className="ak-nav" aria-label="Navigasi utama">
        <div className="ak-nav-inner">
          <button className="ak-brand" onClick={() => go("home")}>
            <img src="/gambar/favicon.png" alt="" width={40} height={40} />
            <span>
              ANGKATAN<b>KU</b>
              <small>XII IPS · MA NU ISLAMIYAH</small>
            </span>
          </button>
          <div className="ak-desktop-nav">
            {nav.map((n) => (
              <button
                key={n.id}
                aria-current={activeTab === n.id ? "page" : undefined}
                onClick={() => go(n.id)}
              >
                {n.label}
              </button>
            ))}
          </div>
          <div className="ak-nav-actions">
            {user && (
              <button
                className="ak-icon"
                title="Notifikasi & Inbox"
                onClick={() => go("inbox")}
              >
                <Bell size={20} />
              </button>
            )}
            <button
              className="ak-icon ak-profile-nav"
              title={user ? "Profil Saya" : "Masuk dengan kartu"}
              onClick={() => go(user ? "profile" : "login")}
            >
              <User size={20} />
            </button>
            <button
              className="ak-icon"
              aria-label="Buka menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>
      <nav className="ak-bottom-nav" aria-label="Navigasi mobile">
        {nav.map((n) => (
          <button
            key={n.id}
            aria-current={activeTab === n.id ? "page" : undefined}
            onClick={() => go(n.id)}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      {open && (
        <Modal title="Jelajahi AngkatanKU" onClose={() => setOpen(false)}>
          <div className="ak-nav-grid">
            {[...nav, ...more].map((n) => (
              <button key={n.id} onClick={() => go(n.id)}>
                <n.icon size={20} />
                {n.label}
              </button>
            ))}
            {isAdmin && (
              <button onClick={() => go("admin-panel")}>
                <ShieldCheck size={20} />
                Pusat pengelolaan
              </button>
            )}
          </div>
          <hr />
          <div className="ak-stack">
            <button className="ak-button secondary" onClick={toggleTheme}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}Mode{" "}
              {isDark ? "terang" : "gelap"}
            </button>
            <button
              className="ak-button"
              onClick={() => go(user ? "profile" : "login")}
            >
              <User size={18} />
              {user ? "Profil Saya" : "Masuk dengan kartu"}
            </button>
            {user && (
              <button
                className="ak-link"
                onClick={async () => {
                  await signOut();
                  go("home");
                }}
              >
                <LogOut size={17} /> Keluar
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
