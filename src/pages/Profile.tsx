import AccountSecurity from '../components/AccountSecurity';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  LogOut, 
  Camera, 
  Save, 
  Loader2, 
  BookOpen, 
  Quote, 
  Target, 
  IdCard, 
  AtSign, 
  ShieldAlert, 
  Eye, 
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ArrowLeft,
  LogIn,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, collection, getDocs } from '../lib/data';
import { uploadToCloudinary } from '../lib/cloudinary';
import { validateMediaFile, compressImageIfNeeded } from '../lib/mediaValidator';

export default function Profile({ onNavigate }: { onNavigate: (tab: string, pageName?: string, profileId?: string) => void }) {
  const { user, role, realRole, isTeacher, currentStudent, signOut, hasCreatedCard, openCreateCard } = useAuth();
  const [usersList, setUsersList] = useState<{id: string, name: string}[]>([]);

  const [profileData, setProfileData] = useState({ 
    induk: '',
    gender: '',
    name: '', 
    motto: '', 
    favoriteSubject: '', 
    socialTag: '',
    hobbies: [] as string[], 
    avatarUrl: '',
    bannerUrl: '',
    socialLinks: {
      wa: '',
      ig: '',
      tiktok: '',
      x: '',
      fb: '',
      yt: '',
      telegram: ''
    },
    views: 0
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (realRole === 'owner') {
      getDocs(collection(db, 'students')).then(snap => {
        const list = snap.docs.map(d => ({id: d.id, name: d.data().name}));
        setUsersList(list);
      }).catch(err => {
        console.warn("Could not fetch students list in Profile:", err);
      });
    }
  }, [realRole]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'students', user.uid);
        const docSnap = await getDoc(docRef);
        let data: any = null;

        if (docSnap.exists()) {
          data = docSnap.data();
        } else {
          // Check if teacher from currentStudent or teachers collection
          if (currentStudent) {
            data = { ...currentStudent };
          }
          try {
            const tDoc = await getDoc(doc(db, 'teachers', user.uid));
            if (tDoc.exists()) {
              data = { ...(data || {}), ...tDoc.data() };
            }
          } catch {}
        }

        if (data) {
          setProfileData({
            induk: data.induk || data.nip || '',
            gender: data.gender || '',
            name: data.name || data.nama || '',
            motto: data.motto || data.quote || '',
            favoriteSubject: data.favoriteSubject || data.mapel || '',
            socialTag: data.socialTag || (data.username ? (data.username.startsWith('@') ? data.username : `@${data.username}`) : ''),
            hobbies: data.hobbies || [],
            avatarUrl: data.avatarUrl || data.url_gambar || '',
            bannerUrl: data.bannerUrl || '',
            socialLinks: data.socialLinks || { wa: '', ig: '', tiktok: '', x: '', fb: '', yt: '', telegram: '' },
            views: data.viewCount || 0
          });
        }
      } catch (err: any) {
        console.warn("Notice fetching profile from Firestore:", err?.message || err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, currentStudent]);

  // Handle Avatar Selection with Media Validator
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setWarningMessage('');

    const validation = validateMediaFile(file);
    if (!validation.allowed) {
      setErrorMessage(validation.error || 'File foto ditolak karena ukuran atau resolusi terlalu besar.');
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    if (validation.shouldCompress) {
      setWarningMessage(validation.warning || 'Foto beresolusi tinggi terdeteksi, dikompresi otomatis.');
    }

    try {
      const processedFile = await compressImageIfNeeded(file);
      setAvatarFile(processedFile);
      setAvatarPreview(URL.createObjectURL(processedFile));
    } catch {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle Banner Selection with Media Validator
  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setWarningMessage('');

    const validation = validateMediaFile(file);
    if (!validation.allowed) {
      setErrorMessage(validation.error || 'File banner ditolak karena ukuran melebihi batas 8 MB.');
      if (bannerInputRef.current) bannerInputRef.current.value = '';
      return;
    }

    if (validation.shouldCompress) {
      setWarningMessage(validation.warning || 'Banner beresolusi tinggi terdeteksi, dikompresi otomatis.');
    }

    try {
      const processedFile = await compressImageIfNeeded(file, 1920, 0.85);
      setBannerFile(processedFile);
      setBannerPreview(URL.createObjectURL(processedFile));
    } catch {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage('');
    setErrorMessage('');
    
    try {
      let finalAvatarUrl = profileData.avatarUrl || '';
      let finalBannerUrl = profileData.bannerUrl || '';

      if (avatarFile) {
        finalAvatarUrl = await uploadToCloudinary(avatarFile);
      }
      if (bannerFile) {
        finalBannerUrl = await uploadToCloudinary(bannerFile);
      }

      const docRef = doc(db, 'students', user.uid);
      const updatePayload: Record<string, any> = {
        name: profileData.name || (currentStudent?.name || currentStudent?.nama || ''),
        motto: profileData.motto || '',
        quote: profileData.motto || '',
        favoriteSubject: profileData.favoriteSubject || '',
        hobbies: profileData.hobbies || [],
        avatarUrl: finalAvatarUrl,
        bannerUrl: finalBannerUrl,
        socialTag: profileData.socialTag || '',
        socialLinks: profileData.socialLinks || {},
        updatedAt: Date.now()
      };

      if (currentStudent?.isTeacher || isTeacher) {
        updatePayload.isTeacher = true;
        updatePayload.url_gambar = finalAvatarUrl;
        if (currentStudent?.nip) updatePayload.nip = currentStudent.nip;
      }

      // Strip any undefined value
      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined) {
          delete updatePayload[key];
        }
      });

      await setDoc(docRef, updatePayload, { merge: true });



      setProfileData(prev => ({
        ...prev,
        avatarUrl: finalAvatarUrl,
        bannerUrl: finalBannerUrl
      }));
      setAvatarFile(null);
      setBannerFile(null);
      setMessage('Profil berhasil diperbarui!');
    } catch (err: any) {
      console.warn('Gagal menyimpan profil:', err?.message || err);
      setErrorMessage(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    onNavigate('home');
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
            Akses Pengaturan Profil Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Silakan masuk dengan akun terdaftar untuk mengedit identitas, foto profil, kartu pelajar digital, dan tautan sosial media Anda.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Akun</span>
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  const currentBanner = bannerPreview || profileData.bannerUrl;
  const currentAvatar = avatarPreview || profileData.avatarUrl;

  const isTeacherEffective = Boolean(
    isTeacher || 
    currentStudent?.isTeacher || 
    currentStudent?.isKepsek || 
    role === 'teacher' || 
    (currentStudent?.nip && String(currentStudent.nip).length > 0) ||
    user?.email?.includes('abdul_holik')
  );

  const isKepsekUser = Boolean(
    currentStudent?.isKepsek || 
    currentStudent?.nip === '190001' || 
    currentStudent?.id === 'guru-1' ||
    user?.email?.includes('abdul_holik') ||
    (profileData.name && profileData.name.toLowerCase().includes('abdul holik')) ||
    (currentStudent?.name && currentStudent.name.toLowerCase().includes('abdul holik'))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Top Bar: Action Buttons & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase">
              {isTeacherEffective ? 'PENGATURAN IDENTITAS PENDIDIK' : 'PENGATURAN IDENTITAS'}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white font-display mt-0.5">
              Kelola Profil {isKepsekUser ? 'Pimpinan & Kepala Madrasah' : isTeacherEffective ? 'Dewan Guru / Pendidik' : 'Siswa'}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Button 1: Kartu Pelajar Digital (HANYA untuk Siswa, Guru TIDAK ADA pembuatan card) */}
          {!isTeacherEffective && (
            <button
              type="button"
              onClick={() => onNavigate('setup')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <IdCard className="w-4 h-4" />
              <span>{hasCreatedCard ? 'Sesuaikan Kartu Pelajar' : 'Buat Kartu Pelajar Digital'}</span>
            </button>
          )}

          {/* Button 2: Lihat Profil Publik */}
          {user && (
            <button
              type="button"
              onClick={() => onNavigate('public-profile', profileData.name || 'Profil Publik', user.uid)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title="Buka tampilan profil publik Anda"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">Lihat Tampilan Publik</span>
            </button>
          )}

          {/* Button 3: Keluar */}
          <button
            type="button"
            onClick={handleSignOut}
            className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl transition-all"
            title="Keluar dari akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AccountSecurity/>

      {/* Hidden File Inputs for Banner and Avatar */}
      <input 
        type="file" 
        accept="image/*" 
        ref={bannerInputRef} 
        onChange={handleBannerSelect} 
        className="hidden" 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={avatarInputRef} 
        onChange={handleAvatarSelect} 
        className="hidden" 
      />

      {/* Notifications: Warning or Error */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {warningMessage && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{warningMessage}</span>
        </div>
      )}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Facebook-style Cover and Avatar (100% Matching PublicProfile layout) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Banner with Direct Edit Trigger */}
        <div className="w-full h-48 md:h-64 bg-slate-200 dark:bg-slate-800 relative group overflow-hidden">
          {currentBanner && currentBanner.trim() !== '' ? (
            <img src={currentBanner} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-500 text-xs">
              Belum ada sampul/banner
            </div>
          )}

          {/* Quick Edit Banner Overlay Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Ganti Banner</span>
            </button>
          </div>
          
          {bannerFile && (
            <div className="absolute bottom-3 left-4 bg-emerald-600/90 text-white text-[10px] font-mono px-2.5 py-1 rounded-md backdrop-blur-sm">
              ✓ Banner baru siap disimpan
            </div>
          )}
        </div>
        
        {/* Profile Info & Avatar Overlay */}
        <div className="px-6 pb-6 pt-4 relative">
          <div className="flex flex-col items-center text-center -mt-16 sm:-mt-20 mb-4">
            
            {/* Avatar (Centered) */}
            <div className="relative inline-block z-10 p-1 bg-white dark:bg-slate-900 rounded-full shadow-lg border-2 border-white dark:border-slate-800 shrink-0 group">
              <div className={`w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center font-bold text-4xl text-white shadow-inner overflow-hidden relative ${
                profileData.gender === 'L' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'
              }`}>
                {currentAvatar && currentAvatar.trim() !== '' ? (
                  <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(profileData.name || 'S').charAt(0).toUpperCase()}</span>
                )}

                {/* Floating Camera Button on Avatar */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span>Ganti Foto</span>
                </button>
              </div>

              {/* Quick camera icon button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-md cursor-pointer transition-all"
                title="Ganti Foto Profil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* User Title and Meta */}
            <div className="space-y-1.5 text-center mt-3 max-w-xl mx-auto w-full">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white text-center">
                  {profileData.name || currentStudent?.name || currentStudent?.nama || (isTeacherEffective ? (isKepsekUser ? 'Abdul Kholik, S.Ag.' : 'Dewan Guru') : 'Nama Siswa')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {isKepsekUser ? 'KEPALA MADRASAH' : isTeacherEffective ? 'DEWAN GURU' : role.toUpperCase()}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-center">
                {profileData.socialTag || currentStudent?.username || `@${user?.email?.split('@')[0]}`}
              </p>
              {isTeacherEffective ? (
                <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>NIP: <strong className="text-slate-800 dark:text-slate-200 font-mono">{profileData.induk || currentStudent?.nip || '-'}</strong></span>
                  <span>•</span>
                  <span>Amanah: <strong className="text-slate-800 dark:text-slate-200">{currentStudent?.role || currentStudent?.jabatan || (isKepsekUser ? 'Pimpinan Madrasah' : 'Dewan Pendidik')}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Pendidik Aktif</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>NIS: <strong className="text-slate-800 dark:text-slate-200 font-mono">{profileData.induk || '-'}</strong></span>
                  <span>•</span>
                  <span>Gender: <strong className="text-slate-800 dark:text-slate-200">{profileData.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</strong></span>
                  <span>•</span>
                  <span>{profileData.views} tayangan profil</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Edit Form Body */}
        <form onSubmit={handleSave} className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Motto Hidup / Visi Pendidik */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-emerald-600" /> {isTeacherEffective ? 'MOTTO & PESAN INSPIRATIF PENDIDIK' : 'MOTTO / KUTIPAN HIDUP'}
              </label>
              <textarea
                value={profileData.motto}
                onChange={(e) => setProfileData({...profileData, motto: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-white h-24 resize-none"
                placeholder={isTeacherEffective ? "Tuliskan visi mengajar atau pesan inspiratif bagi para santri/siswa..." : "Tuliskan motto atau kutipan hidup Anda..."}
              />
            </div>

            {/* Social Tag & Subject */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> {isTeacherEffective ? 'MATA PELAJARAN YANG DIAMPU' : 'MATA PELAJARAN FAVORIT'}
                </label>
                <input
                  type="text"
                  value={profileData.favoriteSubject}
                  onChange={(e) => setProfileData({...profileData, favoriteSubject: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-white"
                  placeholder={isTeacherEffective ? "Contoh: Sosiologi / Al-Qur'an Hadits / Fiqih" : "Contoh: Sosiologi"}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600" /> {isTeacherEffective ? 'AMANAH / TUGAS TAMBAHAN (Pisahkan Koma)' : 'HOBI & MINAT (Pisahkan Koma)'}
                </label>
                <input
                  type="text"
                  value={profileData.hobbies.join(', ')}
                  onChange={(e) => setProfileData({...profileData, hobbies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-white"
                  placeholder={isTeacherEffective ? "Contoh: Kepala Madrasah, Wali Kelas XII IPS 1, Pembina OSIS" : "Contoh: Membaca, Olahraga, Musik"}
                />
              </div>
            </div>

          </div>

          {/* Social Media Links */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white font-mono flex items-center gap-2">
              <AtSign className="w-3.5 h-3.5 text-emerald-600" /> TAUTAN MEDIA SOSIAL (Username / Nomor)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'wa', label: 'WhatsApp', placeholder: '628...' },
                { key: 'ig', label: 'Instagram', placeholder: 'username' },
                { key: 'tiktok', label: 'TikTok', placeholder: 'username' },
                { key: 'x', label: 'X (Twitter)', placeholder: 'username' },
                { key: 'fb', label: 'Facebook', placeholder: 'username' },
                { key: 'yt', label: 'YouTube', placeholder: '@username' },
                { key: 'telegram', label: 'Telegram', placeholder: 'username' },
              ].map(social => (
                <div key={social.key} className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{social.label}</label>
                  <input
                    type="text"
                    value={(profileData.socialLinks as any)[social.key] || ''}
                    onChange={(e) => setProfileData({
                      ...profileData, 
                      socialLinks: {...profileData.socialLinks, [social.key]: e.target.value}
                    })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-800 dark:text-white"
                    placeholder={social.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
