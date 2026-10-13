import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Calendar, Clock, BookOpen, Quote, Target, Image as ImageIcon, PlayCircle, Plus, Link as LinkIcon, Instagram, Github, Facebook, Twitter, Youtube, MessageCircle, Send, X, ChevronLeft, ChevronRight, User, UserCheck, ShieldCheck, Crown, Settings, Users, Edit3 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc, arrayUnion } from '../lib/data';
import { useAuth } from '../contexts/AuthContext';
import { IDCardCanvas } from '../components/IDCardCanvas';
import { StoryItem, StoryText } from '../components/StoryRings';
import { GalleryPhoto } from '../data/dummyData';
import { uploadToCloudinary } from '../lib/cloudinary';
import { OFFICIAL_STUDENTS } from '../data/officialStudents';
import { INITIAL_TEACHERS, getTeacherInitials, getTeacherAvatarColor } from '../data/teachersData';


const optimizeMediaUrl = (url?: string, type?: 'video' | 'image' | string) => {
  if (!url) return undefined;
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    if (type === 'video') {
      return url.replace('/upload/', '/upload/q_auto,f_auto,c_limit,w_720,vc_auto/');
    }
    return url.replace('/upload/', '/upload/q_auto,f_auto,c_limit,w_1080/');
  }
  return url;
};

export default function PublicProfile({ userId, onNavigate }: { userId: string, onNavigate: (tab: string, name?: string, data?: any) => void }) {
  const { user, role, hasCreatedCard, openCreateCard, currentStudent, isTeacher, isKepsek } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ type: 'story' | 'gallery', index: number } | null>(null);
  
  // Album Upload States
  const [showAlbumUpload, setShowAlbumUpload] = useState(false);
  const [albumFile, setAlbumFile] = useState<File | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumFile) return alert("Pilih foto terlebih dahulu");
    setIsUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(albumFile, 'image');
      // Basic formatting for ID
      const newId = Date.now().toString();
      await import('../lib/data').then(async ({ setDoc, doc }) => {
        await setDoc(doc(db, 'personal_albums', newId), {
          imageUrl: imageUrl,
          title: albumTitle.trim() || 'Foto Album',
          date: new Date().toISOString().split('T')[0],
          uploaderId: user.uid,
          album: 'Personal'
        });
      });
      // Refetch
      const photoQ = query(collection(db, 'personal_albums'), where('uploaderId', '==', userId), orderBy('date', 'desc'));
      const photoSnap = await getDocs(photoQ);
      const pt: GalleryPhoto[] = [];
      photoSnap.forEach(d => {
        pt.push({ id: d.id, ...d.data() } as GalleryPhoto);
      });
      setPhotos(pt);
      
      setAlbumFile(null);
      setAlbumTitle('');
      setShowAlbumUpload(false);
      alert('Foto berhasil ditambahkan ke album!');
    } catch (err: any) {
      console.warn('Gagal upload album:', err?.message || err);
      alert('Gagal mengupload: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        let data: any = null;
        let foundId = userId;

        const decodedUserId = decodeURIComponent(userId).trim();
        const cleanUserId = decodedUserId.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9]/g, '');

        // A. Cek apakah ini akun Pengguna yang sedang login dan merupakan Guru / Kepsek
        const isAuthTeacher = Boolean(
          user && (user.uid === userId) && (currentStudent?.isTeacher || isTeacher || isKepsek)
        );

        if (isAuthTeacher && currentStudent) {
          const isKepsekUser = Boolean(
            isKepsek || 
            currentStudent.isKepsek || 
            currentStudent.id === 'guru-1' || 
            currentStudent.nip === '190001' ||
            (currentStudent.name && currentStudent.name.toLowerCase().includes('abdul holik'))
          );

          let customFromTeachers: any = null;
          if (currentStudent.id) {
            try {
              const tSnap = await getDoc(doc(db, 'teachers', currentStudent.id));
              if (tSnap.exists()) customFromTeachers = tSnap.data();
            } catch {}
          }

          let customFromStudents: any = null;
          try {
            const sSnap = await getDoc(doc(db, 'students', user.uid));
            if (sSnap.exists()) customFromStudents = sSnap.data();
          } catch {}

          const mergedAuthTeacher = { 
            ...currentStudent, 
            ...(customFromTeachers || {}), 
            ...(customFromStudents || {}) 
          };

          data = {
            id: mergedAuthTeacher.id || 'guru-1',
            name: mergedAuthTeacher.name || mergedAuthTeacher.nama || 'Pendidik',
            nickname: (mergedAuthTeacher.name || mergedAuthTeacher.nama || 'Pendidik').split(' ')[0],
            role: isKepsekUser ? 'Kepala Madrasah' : (mergedAuthTeacher.role || mergedAuthTeacher.title || 'Dewan Pendidik'),
            title: isKepsekUser ? 'Kepala Madrasah' : (mergedAuthTeacher.title || 'Guru'),
            jabatan: isKepsekUser ? 'Pimpinan Lembaga & Administrator' : (mergedAuthTeacher.jabatan || null),
            nip: mergedAuthTeacher.nip || (isKepsekUser ? '190001' : mergedAuthTeacher.id),
            username: mergedAuthTeacher.username || (isKepsekUser ? '@abdul_holik' : `@${mergedAuthTeacher.id}`),
            mapel: mergedAuthTeacher.mapel || mergedAuthTeacher.favoriteSubject || '',
            motto: mergedAuthTeacher.motto || mergedAuthTeacher.quote || (isKepsekUser ? 'Memimpin dengan keteladanan, mengantarkan madrasah menuju generasi unggul berakhlak mulia.' : 'Mendidik dengan ketulusan hati, menginspirasi generasi madrasah.'),
            avatarUrl: mergedAuthTeacher.avatarUrl || mergedAuthTeacher.url_gambar || '',
            classRoom: isKepsekUser ? 'Pimpinan MA NU Islamiyah Asembagus' : 'Dewan Pendidik MA NU Islamiyah',
            quote: mergedAuthTeacher.quote || mergedAuthTeacher.motto || (isKepsekUser ? 'Memimpin dengan keteladanan, mengantarkan madrasah menuju generasi unggul berakhlak mulia.' : 'Mendidik dengan ketulusan hati, menginspirasi generasi madrasah.'),
            bannerUrl: mergedAuthTeacher.bannerUrl || '',
            socialLinks: mergedAuthTeacher.socialLinks || {},
            isTeacher: true,
            isKepsek: isKepsekUser,
            cardCreated: true,
            hasLoggedIn: true
          };
          foundId = mergedAuthTeacher.id || userId;
        }

        // B. Cek apakah ini profil Guru dari INITIAL_TEACHERS
        if (!data) {
          const foundTeacher = INITIAL_TEACHERS.find(t => {
            const u = t.username ? t.username.replace(/^@/, '').toLowerCase() : '';
            const cleanName = t.nama.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (
              t.id === userId || 
              t.id.toLowerCase() === userId.toLowerCase() ||
              t.nip === decodedUserId ||
              (u && (u === cleanUserId || cleanUserId.includes(u))) ||
              t.nama.toLowerCase() === decodedUserId.toLowerCase() ||
              (cleanUserId.length >= 4 && cleanName.includes(cleanUserId)) ||
              (cleanUserId.includes('abdul_holik') && t.id === 'guru-1') ||
              (cleanUserId === '190001' && t.id === 'guru-1')
            );
          });

          if (foundTeacher) {
            let teacherFirestore = null;
            try {
              const tSnap = await getDoc(doc(db, 'teachers', foundTeacher.id));
              if (tSnap.exists()) {
                teacherFirestore = tSnap.data();
              }
            } catch {}

            // If logged in as this teacher, merge student doc as well
            let studentFirestore = null;
            if (user) {
              try {
                const sSnap = await getDoc(doc(db, 'students', user.uid));
                if (sSnap.exists() && (sSnap.data()?.isTeacher || sSnap.data()?.nip === foundTeacher.nip)) {
                  studentFirestore = sSnap.data();
                }
              } catch {}
            }

            const merged = { ...foundTeacher, ...(teacherFirestore || {}), ...(studentFirestore || {}) };
            const mergedTeacherName = merged.nama || (merged as any).name || 'Pendidik';
            const isKepsekTeacher = 
              merged.id === 'guru-1' || 
              merged.nip === '190001' || 
              mergedTeacherName.toLowerCase().includes('abdul holik') ||
              cleanUserId.includes('abdul_holik');

            let teacherImg = merged.avatarUrl || merged.url_gambar || '';
            if (!teacherImg || teacherImg.includes('manuislamiyahasembagus.sch.id')) {
              teacherImg = foundTeacher.url_gambar || '';
            }

            data = {
              id: merged.id,
              name: mergedTeacherName,
              nickname: mergedTeacherName.split(' ')[0],
              role: isKepsekTeacher ? 'Kepala Madrasah' : (merged.role || merged.title || 'Dewan Pendidik'),
              title: isKepsekTeacher ? 'Kepala Madrasah' : (merged.title || 'Guru'),
              jabatan: isKepsekTeacher ? 'Pimpinan Lembaga & Administrator' : (merged.jabatan || null),
              nip: merged.nip || (isKepsekTeacher ? '190001' : merged.id),
              username: merged.username || (isKepsekTeacher ? '@abdul_holik' : `@${merged.id}`),
              mapel: merged.mapel || '',
              motto: merged.motto || (merged as any).quote || (isKepsekTeacher ? 'Memimpin dengan keteladanan, mengantarkan madrasah menuju generasi unggul berakhlak mulia.' : 'Mendidik dengan ketulusan hati, menginspirasi generasi madrasah.'),
              avatarUrl: teacherImg,
              classRoom: isKepsekTeacher ? 'Pimpinan MA NU Islamiyah Asembagus' : 'Dewan Pendidik MA NU Islamiyah',
              quote: (merged as any).quote || merged.motto || (isKepsekTeacher ? 'Memimpin dengan keteladanan, mengantarkan madrasah menuju generasi unggul berakhlak mulia.' : 'Mendidik dengan ketulusan hati, menginspirasi generasi madrasah.'),
              bannerUrl: (merged as any).bannerUrl || '',
              socialLinks: (merged as any).socialLinks || {},
              isTeacher: true,
              isKepsek: isKepsekTeacher,
              cardCreated: true,
              hasLoggedIn: true
            };
            foundId = merged.id;
          } else {
            // Cek koleksi teachers Firestore secara langsung
            try {
              const tDocDirect = await getDoc(doc(db, 'teachers', userId));
              if (tDocDirect.exists()) {
                const tData = tDocDirect.data();
                const tTeacherName = tData.nama || tData.name || 'Pendidik';
                const isKepsekTeacher = 
                  tDocDirect.id === 'guru-1' || 
                  tData.nip === '190001' || 
                  tTeacherName.toLowerCase().includes('abdul holik') ||
                  cleanUserId.includes('abdul_holik');

                const directFound = INITIAL_TEACHERS.find(t => t.id === tDocDirect.id || t.nama.toLowerCase() === tTeacherName.toLowerCase());
                let directImg = tData.avatarUrl || tData.url_gambar || '';
                if (!directImg || directImg.includes('manuislamiyahasembagus.sch.id')) {
                  directImg = directFound?.url_gambar || '';
                }

                data = {
                  id: tDocDirect.id,
                  name: tTeacherName,
                  nickname: tTeacherName.split(' ')[0],
                  role: isKepsekTeacher ? 'Kepala Madrasah' : (tData.role || tData.title || 'Dewan Pendidik'),
                  title: isKepsekTeacher ? 'Kepala Madrasah' : (tData.title || 'Guru'),
                  jabatan: isKepsekTeacher ? 'Pimpinan Lembaga & Administrator' : (tData.jabatan || null),
                  nip: tData.nip || (isKepsekTeacher ? '190001' : tDocDirect.id),
                  username: tData.username || (isKepsekTeacher ? '@abdul_holik' : `@${tDocDirect.id}`),
                  mapel: tData.mapel || '',
                  motto: tData.motto || tData.quote || (isKepsekTeacher ? 'Memimpin dengan keteladanan, mengantarkan madrasah menuju generasi unggul berakhlak mulia.' : 'Mendidik dengan ketulusan hati, menginspirasi generasi madrasah.'),
                  avatarUrl: directImg,
                  classRoom: isKepsekTeacher ? 'Pimpinan MA NU Islamiyah Asembagus' : 'Dewan Pendidik MA NU Islamiyah',
                  quote: tData.quote || tData.motto || (isKepsekTeacher ? 'Memimpin dengan keteladanan, mengantarkan madrasah menuju generasi unggul berakhlak mulia.' : 'Mendidik dengan ketulusan hati, menginspirasi generasi madrasah.'),
                  bannerUrl: tData.bannerUrl || '',
                  socialLinks: tData.socialLinks || {},
                  isTeacher: true,
                  isKepsek: isKepsekTeacher,
                  cardCreated: true,
                  hasLoggedIn: true
                };
                foundId = tDocDirect.id;
              }
            } catch {}
          }
        }

        // B. Cek Siswa di Firestore jika belum ditemukan data Guru
        if (!data) {
          // 1. Try finding by document id directly
          const studentDoc = await getDoc(doc(db, 'students', userId));
          if (studentDoc.exists()) {
            data = studentDoc.data();
            foundId = studentDoc.id;
          } else {
            // Check by induk (NISN)
            const qInduk = query(collection(db, 'students'), where('induk', '==', userId));
            const snapInduk = await getDocs(qInduk);
            if (!snapInduk.empty) {
              data = snapInduk.docs[0].data();
              foundId = snapInduk.docs[0].id;
            } else {
              // Check by username
              const cleanUname = userId.startsWith('@') ? userId.toLowerCase() : `@${userId.toLowerCase()}`;
              const qUname = query(collection(db, 'students'), where('username', '==', cleanUname));
              const snapUname = await getDocs(qUname);
              if (!snapUname.empty) {
                data = snapUname.docs[0].data();
                foundId = snapUname.docs[0].id;
              }
            }
          }
        }

        // 2. Fallback to OFFICIAL_STUDENTS if needed
        const os = OFFICIAL_STUDENTS.find(s => 
          s.induk === userId || 
          (s.username && s.username.toLowerCase() === userId.toLowerCase()) ||
          (s.username && `@${s.username.toLowerCase()}` === userId.toLowerCase())
        );

        if (!data && os) {
          data = { ...os };
        } else if (data && os) {
          data = { ...os, ...data };
        }

        // 3. If viewing own profile or matching current logged in student, merge fresh auth data
        const isCurrentAuthUser = Boolean(
          user && (
            user.uid === foundId || 
            user.uid === userId || 
            (currentStudent?.induk && data?.induk === currentStudent.induk) ||
            (user.email && data?.email && user.email.toLowerCase() === data.email.toLowerCase())
          )
        );

        if (data && isCurrentAuthUser) {
          data.email = data.email || user?.email || currentStudent?.email;
          data.cardCreated = true;
          if (currentStudent) {
            data = { ...data, ...currentStudent, cardCreated: true };
          }
        }

        if (data) {
          setProfile({ id: foundId, ...data });

          // Update profile views if logged in and not the owner
          if (user && user.uid !== foundId) {
            const viewedBy = data.viewedBy || [];
            if (!viewedBy.includes(user.uid)) {
              try {
                await updateDoc(doc(db, 'students', foundId), {
                  viewedBy: arrayUnion(user.uid)
                });
                const latest=await getDoc(doc(db, 'students',foundId));
                setProfile((prev:any)=>prev?{...prev,viewCount:latest.data()?.viewCount||0}:prev);
              } catch {}
            }
          }
        }
        
        // Fetch Stories
        const storyQ = query(collection(db, 'stories'), where('authorId', '==', foundId), orderBy('timestamp', 'desc'));
        const storySnap = await getDocs(storyQ);
        const st: StoryItem[] = [];
        storySnap.forEach(d => {
          st.push({ id: d.id, ...d.data() } as StoryItem);
        });
        setStories(st);

        // Fetch Gallery Photos
        const photoQ = query(collection(db, 'personal_albums'), where('uploaderId', '==', foundId), orderBy('date', 'desc'));
        const photoSnap = await getDocs(photoQ);
        const pt: GalleryPhoto[] = [];
        photoSnap.forEach(d => {
          pt.push({ id: d.id, ...d.data() } as GalleryPhoto);
        });
        setPhotos(pt);
        
      } catch (err: any) {
        console.warn("Notice fetching public profile data:", err?.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, user, currentStudent]);

  const isOwner = Boolean(
    user && (
      user.uid === userId || 
      profile?.id === user.uid || 
      (currentStudent?.id && profile?.id === currentStudent.id) ||
      (currentStudent?.induk && profile?.induk === currentStudent.induk) ||
      (currentStudent?.username && profile?.username && currentStudent.username.toLowerCase() === profile.username.toLowerCase()) ||
      (user.email && profile?.email && user.email.toLowerCase() === profile.email.toLowerCase())
    )
  );

  const isKepsekProfile = Boolean(
    profile?.isKepsek === true ||
    profile?.id === 'guru-1' ||
    profile?.nip === '190001' ||
    profile?.role === 'Kepala Madrasah' ||
    profile?.title === 'Kepala Madrasah' ||
    (profile?.name && profile.name.toLowerCase().includes('abdul holik'))
  );

  // KETENTUAN UTAMA:
  // Kartu tampil untuk Guru (resmi terdaftar) dan Siswa yang telah memiliki kartu/akun aktif.
  const isCardActive = Boolean(
    profile?.isTeacher === true ||
    isKepsekProfile ||
    profile?.cardCreated === true ||
    profile?.hasLoggedIn === true ||
    (profile?.email && String(profile.email).trim().length > 0) ||
    isOwner ||
    role === 'owner'
  );

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading profil...</div>;
  }

  if (!profile) {
    return <div className="min-h-[60vh] flex items-center justify-center">Profil tidak ditemukan.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Activation Notice for Owner without Card */}
      {isOwner && role === 'student' && !hasCreatedCard && !isCardActive && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
              ID
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Kartu Pelajar Belum Dibuat</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">Lengkapi data untuk mengaktifkan kartu digital dan membuka seluruh fitur angkatan.</p>
            </div>
          </div>
          <button
            onClick={() => openCreateCard('Silakan buat Kartu Siswa untuk mengaktifkan kartu dan seluruh akses fitur angkatan.')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
          >
            Buat Kartu Sekarang
          </button>
        </div>
      )}

      {/* Header with Smart Back & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate(profile?.isTeacher ? 'guru' : 'anggota', profile?.isTeacher ? 'Daftar Guru' : 'Direktori Siswa')} 
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
            title={profile?.isTeacher ? "Kembali ke Daftar Guru" : "Kembali ke Direktori Siswa"}
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-display flex items-center gap-2">
              <span>Profil {profile.nickname || profile.name}</span>
              {isKepsekProfile && (
                <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400" title="Kepala Madrasah">
                  <Crown className="w-5 h-5" />
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isKepsekProfile
                ? 'Profil Eksekutif Pimpinan Lembaga • MA NU Islamiyah Asembagus'
                : profile.isTeacher
                ? 'Profil Resmi Tenaga Pendidik • MA NU Islamiyah Asembagus'
                : 'Jejak Digital, Memori & Kartu Siswa'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isKepsekProfile && (
            <button
              onClick={() => onNavigate('admin', 'Panel Kontrol Web')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Akses Penuh Pusat Kontrol Web"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panel Kontrol Web</span>
            </button>
          )}
          <button
            onClick={() => onNavigate(profile?.isTeacher ? 'guru' : 'anggota', profile?.isTeacher ? 'Daftar Guru' : 'Direktori Siswa')}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {profile?.isTeacher ? 'Daftar Guru' : 'Direktori Siswa'}
          </button>
          <button
            onClick={() => onNavigate('home', 'Beranda Angkatan')}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs"
          >
            Ke Beranda
          </button>
        </div>
      </div>
      {/* Facebook-style Cover and Avatar */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden mb-8 ${
        isKepsekProfile
          ? 'border-2 border-amber-500/40 shadow-lg shadow-amber-500/5'
          : 'border border-slate-100 dark:border-slate-800'
      }`}>
        {/* Banner */}
        <div className="w-full h-48 md:h-64 bg-slate-200 dark:bg-slate-800 relative">
          {profile.bannerUrl && profile.bannerUrl.trim() !== '' ? (
            <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : isKepsekProfile ? (
            <div className="w-full h-full bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/80 relative overflow-hidden flex items-center justify-between px-8">
              <div className="space-y-1.5 relative z-10 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  PIMPINAN MADRASAH & ADMINISTRATOR UTAMA
                </div>
                <h3 className="text-white text-lg sm:text-xl font-bold font-display">
                  MA NU ISLAMIYAH ASEMBAGUS
                </h3>
                <p className="text-white/80 text-xs sm:text-sm italic font-sans max-w-lg">
                  "Memimpin dengan keteladanan, mengantarkan madrasah menuju generasi unggul berakhlak mulia."
                </p>
              </div>
              <div className="opacity-15 pointer-events-none hidden sm:block">
                <Crown className="w-48 h-48 text-amber-400" />
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800"></div>
          )}
        </div>
        
        
        {/* Profile Info Overlay */}
        {/* Profile Info Overlay */}
        <div className="px-6 pb-6 pt-4 relative">
          <div className="ak-row mb-5 mt-16 sm:mt-20 justify-center">
            {user&&profile.ownerId&&profile.ownerId!==user.uid&&<a className="ak-button" href={'/chat?to='+encodeURIComponent(profile.ownerId)}><MessageCircle size={18}/>Kirim pesan</a>}
            <a className="ak-button secondary" href={'/feed?author='+encodeURIComponent(profile.ownerId||userId)}>Postingan</a>
            <a className="ak-button secondary" href={'/albums?author='+encodeURIComponent(profile.ownerId||userId)}>Album</a>
          </div>
          {/* Top-Right Action Buttons (Edit Profil & Admin Panel) */}
          {(isOwner || isKepsekProfile) && (
            <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20 flex items-center gap-2">
              {isOwner && (
                <button 
                  onClick={() => onNavigate('profile')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shadow-xs cursor-pointer"
                  title="Buka Pengaturan & Edit Profil Anda"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </button>
              )}
              {isKepsekProfile && (
                <button 
                  onClick={() => onNavigate('admin', 'Panel Kontrol Web')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold border border-amber-400 shadow-xs transition-all cursor-pointer"
                  title="Khusus Kepala Madrasah: Akses Panel Kontrol Web"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Panel Kontrol Web</span>
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col items-center text-center -mt-16 sm:-mt-20 mb-4">
            {/* Avatar (Centered) */}
            <div className={`relative inline-block z-10 p-1 bg-white dark:bg-slate-900 rounded-full shadow-lg shrink-0 ${
              isKepsekProfile
                ? 'ring-4 ring-amber-400/80 shadow-[0_10px_35px_rgba(245,158,11,0.25)] border-2 border-amber-500/50'
                : 'border-2 border-white dark:border-slate-800'
            }`}>
              <div className={`relative w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center font-bold text-4xl text-white shadow-inner overflow-hidden ${
                isKepsekProfile
                  ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900'
                  : profile.isTeacher
                  ? `bg-gradient-to-br ${getTeacherAvatarColor(profile.name)}`
                  : profile.gender === 'L' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-pink-400 to-pink-600'
              }`}>
                {profile.isTeacher ? (
                  <span className="font-bold text-white text-3xl md:text-4xl font-mono tracking-wider select-none">
                    {getTeacherInitials(profile.name)}
                  </span>
                ) : (
                  <User className="w-16 h-16 text-white/70" />
                )}
                {profile.avatarUrl && profile.avatarUrl.trim() !== '' && (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.name} 
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover object-top" 
                    onError={(e) => { 
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }} 
                  />
                )}
              </div>
              {isKepsekProfile && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-bold font-mono px-3 py-0.5 rounded-full border border-amber-200 shadow-md flex items-center gap-1 whitespace-nowrap">
                  <Crown className="w-3 h-3 text-slate-950" />
                  KEPALA MADRASAH
                </div>
              )}
            </div>
            
            {/* Name and Info (Cleanly centered underneath the avatar) */}
            <div className="z-10 text-center space-y-1.5 mt-3 max-w-xl mx-auto w-full">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white leading-tight text-center">
                {profile.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
                {profile.username && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {profile.username.startsWith('@') ? profile.username : `@${profile.username}`}
                  </span>
                )}
                {isKepsekProfile ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-400/40 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    Pimpinan Lembaga & Administrator Web
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    {profile.classRoom}
                  </span>
                )}
                {profile.role && !isKepsekProfile && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Target className="w-3 h-3" /> {profile.role}
                  </span>
                )}
                {profile.isTeacher && profile.jabatan && !isKepsekProfile && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                    {profile.jabatan}
                  </span>
                )}
                {isKepsekProfile ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Otoritas Penuh Web
                  </span>
                ) : profile.isTeacher ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Tenaga Pendidik Terverifikasi
                  </span>
                ) : !isCardActive ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Belum Login
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    Akun Terverifikasi
                  </span>
                )}
                {!profile.isTeacher && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center gap-1.5" title="Total Pengunjung Profil">
                    <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{profile.viewCount || 0} Pengunjung</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
               <Target className="w-5 h-5 text-emerald-500" />
               Informasi Profil
             </h3>
             <div className="space-y-4">
               <div>
                 <p className="text-xs text-slate-500 mb-1">Nama Lengkap</p>
                 <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{profile.name}</p>
               </div>
               <div>
                 <p className="text-xs text-slate-500 mb-1">{profile.isTeacher ? 'Satuan Pendidikan' : 'Kelas'}</p>
                 <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{profile.classRoom}</p>
               </div>
               {profile.isTeacher && (
                 <div>
                   <p className="text-xs text-slate-500 mb-1">Amanah / Tugas</p>
                   <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                     {profile.title} {profile.jabatan ? `• ${profile.jabatan}` : ''}
                   </p>
                 </div>
               )}
               {profile.quote ? (
                 <div>
                   <p className="text-xs text-slate-500 mb-1">{profile.isTeacher ? 'Motto Pendidik' : 'Motto'}</p>
                   <p className="text-sm italic text-slate-700 dark:text-slate-300">"{profile.quote}"</p>
                 </div>
               ) : !profile.isTeacher ? (
                 <div>
                   <p className="text-xs text-slate-500 mb-1">Motto</p>
                   <p className="text-sm italic text-slate-400">Belum ada motto.</p>
                 </div>
               ) : null}
               {profile.isTeacher && (
                 <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                   <p className="text-xs text-slate-500 mb-1">Status Sistem & Hak Akses</p>
                   {isKepsekProfile ? (
                     <div className="text-xs text-amber-900 dark:text-amber-200 bg-amber-500/10 p-3 rounded-xl border border-amber-400/40 leading-relaxed space-y-1">
                       <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                         <Crown className="w-3.5 h-3.5" />
                         <span>Otoritas Eksekutif Pimpinan Web</span>
                       </div>
                       <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80">
                         Kepala Madrasah memegang hak setara Administrator Utama untuk mengontrol dan mengelola seluruh konten dan fitur sistem.
                       </p>
                     </div>
                   ) : (
                     <div className="text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-200/60 dark:border-teal-900/60 leading-relaxed space-y-1">
                       <div className="font-bold flex items-center gap-1.5 text-teal-800 dark:text-teal-300">
                         <ShieldCheck className="w-3.5 h-3.5" />
                         <span>Dewan Guru Resmi Madrasah</span>
                       </div>
                       <p className="text-[11px] text-teal-800/90 dark:text-teal-300/80">
                         Akun resmi tenaga pendidik MA NU Islamiyah Asembagus dengan kartu digital dan identitas resmi aktif.
                       </p>
                     </div>
                   )}
                 </div>
               )}
             </div>
          </div>
          
          {/* Social Media Links */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(val => !!val) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 mt-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-500" />
                Sosial Media Terhubung
              </h3>
              <div className="flex flex-col gap-3">
                {profile.socialLinks.ig && (
                  <a href={`https://instagram.com/${profile.socialLinks.ig.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-pink-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">@{profile.socialLinks.ig.replace('@', '')}</span>
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a href={`https://github.com/${profile.socialLinks.github.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Github className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">@{profile.socialLinks.github.replace('@', '')}</span>
                  </a>
                )}
                {profile.socialLinks.tiktok && (
                  <a href={`https://tiktok.com/@${profile.socialLinks.tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.89-2.88 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.12V9.41a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.28 8.28 0 004.77 1.5V7.1a4.84 4.84 0 01-1.01-.41z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">@{profile.socialLinks.tiktok.replace('@', '')}</span>
                  </a>
                )}
                {profile.socialLinks.x && (
                  <a href={`https://x.com/${profile.socialLinks.x.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                      <Twitter className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">@{profile.socialLinks.x.replace('@', '')}</span>
                  </a>
                )}
                {profile.socialLinks.yt && (
                  <a href={`https://youtube.com/${profile.socialLinks.yt}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                      <Youtube className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{profile.socialLinks.yt}</span>
                  </a>
                )}
                {profile.socialLinks.facebook && (
                  <a href={`https://facebook.com/${profile.socialLinks.facebook}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <Facebook className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{profile.socialLinks.facebook}</span>
                  </a>
                )}
                {profile.socialLinks.telegram && (
                  <a href={`https://t.me/${profile.socialLinks.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
                      <Send className="w-4 h-4 text-sky-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">@{profile.socialLinks.telegram.replace('@', '')}</span>
                  </a>
                )}
                {profile.socialLinks.wa && (
                  <a href={`https://wa.me/${profile.socialLinks.wa.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{profile.socialLinks.wa}</span>
                  </a>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Stories & Gallery and Teacher Dedication */}
        <div className="md:col-span-2 space-y-6">
          
          {profile.isTeacher && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Dedikasi & Pengabdian Pendidik</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  Kredensial Aktif
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Bapak/Ibu <strong>{profile.name}</strong> mengemban amanah sebagai pendidik di <strong>MA NU Islamiyah Asembagus</strong>. Kartu identitas digital di bawah ini dapat dipindai untuk verifikasi profil resmi dan proses autentikasi sistem.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {profile.mapel && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Bidang Pengajaran</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{profile.mapel}</p>
                  </div>
                )}
                {profile.nip && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">NIP / Identitas Pendidik</p>
                    <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{profile.nip}</p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/40 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-200">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Alur Kartu Digital & Scan Identitas
                </div>
                <p className="text-xs text-teal-800/80 dark:text-teal-300/80 leading-relaxed">
                  Kartu digital guru terintegrasi penuh dengan sistem barcode dan QR scanner. Saat dipindai melalui menu Pindai Kartu atau kamera, kartu akan secara otomatis memverifikasi profil resmi pendidik.
                </p>
              </div>
            </div>
          )}

          {/* Stories */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
               <PlayCircle className="w-5 h-5 text-teal-500" />
               Story Terbaru
             </h3>
             {stories.length === 0 ? (
               <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                 <p className="text-sm text-slate-500">Belum ada story yang diunggah.</p>
               </div>
             ) : (
               <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                 {stories.map((story, idx) => (
                   <button 
                     key={story.id} 
                     onClick={() => setLightbox({ type: 'story', index: idx })}
                     className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-2xl overflow-hidden shrink-0 group focus:outline-none shadow-md border border-slate-200/50 dark:border-slate-800/50 snap-start"
                   >
                     {story.type==='text'?<StoryText story={story}/>:story.url ? (
                       story.type === 'image' ? (
                         <img src={optimizeMediaUrl(story.url, story.type) || undefined} alt={story.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       ) : (
                         <video src={optimizeMediaUrl(story.url, story.type) || undefined} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       )
                     ) : null}
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                     <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-left">
                       <p className="text-white text-xs font-semibold leading-tight line-clamp-2 drop-shadow-md">{story.title}</p>
                     </div>
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* Gallery Album */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <ImageIcon className="w-5 h-5 text-indigo-500" />
                 Album Foto
               </h3>
               {isOwner && (
                 <button
                   onClick={() => setShowAlbumUpload(true)}
                   className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                   title="Tambah Foto ke Album"
                 >
                   <Plus className="w-4 h-4" />
                 </button>
               )}
             </div>
             {photos.length === 0 ? (
               <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                 <p className="text-sm text-slate-500">Belum ada foto album.</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {photos.map((photo, idx) => (
                   <div 
                     key={photo.id} 
                     onClick={() => setLightbox({ type: 'gallery', index: idx })}
                     className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden group cursor-pointer relative shadow-sm border border-slate-200 dark:border-slate-700"
                   >
                     <img src={photo.imageUrl || undefined} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>


      
      {/* ID Card Display:
          HANYA untuk Siswa (Untuk Guru tidak ada pembuatan card).
          Tampil bagi siswa yang sudah login web dan membuat profil & card.
      */}
      {!profile.isTeacher && (
        isCardActive ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 mb-8 flex items-center justify-center relative overflow-hidden">
            <div className="w-full max-w-2xl transform scale-100">
              <IDCardCanvas student={profile} />
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center max-w-2xl mx-auto">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
              <UserCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-2">
              Kartu Pelajar Digital Belum Aktif
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {profile.name} belum pernah login ke website dan belum membuat kartu profil digital. Kartu dan profil penuh akan tampil otomatis setelah siswa masuk ke sistem.
            </p>
          </div>
        )
      )}

      
      
      </div>

      {/* Album Upload Modal */}
      <AnimatePresence>
        {showAlbumUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Foto ke Album</h3>
                <button onClick={() => setShowAlbumUpload(false)} className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleUploadAlbum} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    File Foto <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setAlbumFile(e.target.files?.[0] || null)}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Foto (Opsional)
                  </label>
                  <input
                    type="text"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    placeholder="Kenangan indah..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUploading || !albumTitle.trim()}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Upload
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
          <button 
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-50 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setLightbox(prev => prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 bg-white/10 rounded-full hover:bg-white/20 z-50 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setLightbox(prev => {
              if (!prev) return null;
              const max = prev.type === 'story' ? stories.length - 1 : photos.length - 1;
              return { ...prev, index: Math.min(max, prev.index + 1) };
            })}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 bg-white/10 rounded-full hover:bg-white/20 z-50 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[80vh] w-full flex flex-col items-center justify-center relative">
            {lightbox.type === 'story' && stories[lightbox.index] && (
              <div className="w-full max-w-sm aspect-[9/16] bg-slate-950 rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl flex items-center justify-center">
                {stories[lightbox.index].type==='text'?<StoryText story={stories[lightbox.index]}/>:stories[lightbox.index].url ? (
                  stories[lightbox.index].type === 'image' ? (
                    <img src={optimizeMediaUrl(stories[lightbox.index].url, stories[lightbox.index].type) || undefined} className="w-full h-full object-contain" />
                  ) : (
                    <video src={optimizeMediaUrl(stories[lightbox.index].url, stories[lightbox.index].type) || undefined} controls autoPlay loop playsInline className="w-full h-full object-contain" />
                  )
                ) : null}
                <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
                   <p className="text-white font-bold">{stories[lightbox.index].title}</p>
                   <p className="text-white/80 text-xs">{stories[lightbox.index].caption}</p>
                </div>
              </div>
            )}
            
            {lightbox.type === 'gallery' && photos[lightbox.index] && (
              <div className="w-full flex flex-col items-center gap-4">
                <img src={photos[lightbox.index].imageUrl || undefined} className="max-h-[75vh] object-contain rounded-lg" />
                <div className="text-center">
                  <h3 className="text-white font-bold text-lg">{photos[lightbox.index].title}</h3>
                  <p className="text-slate-400 text-sm">{photos[lightbox.index].date} - {photos[lightbox.index].album}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
