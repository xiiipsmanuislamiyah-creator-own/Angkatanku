import TEACHER_CREDENTIALS from '../data/teacherDirectory.json';
import SecurityControlCenter from '../components/SecurityControlCenter';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, query, orderBy, onSnapshot } from '../lib/data';
import { 
  Edit, UserPlus, X, RefreshCw, Activity, ShieldCheck, ShieldAlert, Users, 
  Image as ImageIcon, Trash2, KeyRound, Save, Loader2, ArrowLeft, 
  Bell, Send, MessageSquare, Plus, Eye, Play, Pause, Sparkles, 
  Upload, Link as LinkIcon, School, Code2, Film, CheckCircle2,
  Home, Calendar, GraduationCap, Award, Bot, Wrench, Compass, 
  ExternalLink, UserCheck, User, LayoutGrid, FileJson, Check,
  QrCode, Wifi, WifiOff, Clock, Search, CircleDot, CreditCard, Info, Filter,
  Copy
} from 'lucide-react';
import AdminModerationTab from '../components/AdminModerationTab';
import { OFFICIAL_STUDENTS } from '../data/officialStudents';
import { uploadToCloudinary, deleteFromCloudinary } from '../lib/cloudinary';
import { parseMetadataInput, ParsedMetadataItem } from '../lib/metadataParser';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, isAdmin, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'stories' | 'gallery' | 'broadcast'>('users');
  const [setupRunning, setSetupRunning] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [setupLogs, setSetupLogs] = useState<any[]>([]);
  const [broadcastType, setBroadcastType] = useState<'all' | 'students' | 'personal'>('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTargetId, setBroadcastTargetId] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [editRoleModal, setEditRoleModal] = useState<{isOpen: boolean, user: any, newRole: string, newClassRoom: string}>({isOpen: false, user: null, newRole: '', newClassRoom: ''});
  const [addUserModal, setAddUserModal] = useState(false);
  const [teacherCredsModal, setTeacherCredsModal] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [copiedTeacherId, setCopiedTeacherId] = useState<string | null>(null);
  const [syncingTeachers, setSyncingTeachers] = useState(false);
  const [syncTeachersResult, setSyncTeachersResult] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ induk: '', name: '', username: '', role: 'Anggota Aktif', classRoom: 'IPS 1', password: '' });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Student Presence & Login Tracking States
  const [rawFirestoreUsers, setRawFirestoreUsers] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'online' | 'card' | 'offline' | 'never'>('all');
  const [studentClassFilter, setStudentClassFilter] = useState<'all' | 'IPS 1' | 'IPS 2'>('all');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Story Management States
  const [showStoryUploadModal, setShowStoryUploadModal] = useState(false);
  const [storyTargetIdentity, setStoryTargetIdentity] = useState<'personal' | 'dev-system' | 'ma-nu' | 'angkatan-ku-ips1' | 'angkatan-ku-ips2'>('personal');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video'>('image');
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [storyPublic,setStoryPublic]=useState(false);
  const [metadataPublic,setMetadataPublic]=useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyCaption, setStoryCaption] = useState('');
  const [storyFilter, setStoryFilter] = useState<'all' | 'personal' | 'dev-system' | 'ma-nu' | 'angkatan-ku-ips1' | 'angkatan-ku-ips2' | 'students'>('all');
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);
  const [isUploadingStoryMedia, setIsUploadingStoryMedia] = useState(false);
  const [previewStoryModal, setPreviewStoryModal] = useState<any | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewIsPaused, setPreviewIsPaused] = useState(false);

  // In-App Deletion confirmation states (prevents iframe blocking)
  const [storyToDelete, setStoryToDelete] = useState<{ id: string; url?: string; title?: string } | null>(null);
  const [galleryToDelete, setGalleryToDelete] = useState<{ id: string; url?: string; title?: string } | null>(null);
  const [isDeletingStory, setIsDeletingStory] = useState(false);
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);
  const [confirmBulkSetupOpen, setConfirmBulkSetupOpen] = useState(false);

  // Metadata JSON Import States
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [metadataRawText, setMetadataRawText] = useState('');
  const [metadataTarget, setMetadataTarget] = useState<'gallery' | 'story'>('gallery');
  const [metadataGalleryAlbum, setMetadataGalleryAlbum] = useState('Kelas & Sekolah');
  const [metadataStoryIdentity, setMetadataStoryIdentity] = useState<'personal' | 'dev-system' | 'ma-nu' | 'angkatan-ku-ips1' | 'angkatan-ku-ips2'>('dev-system');
  const [isImportingMetadata, setIsImportingMetadata] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const IDENTITIES = [
    {
      key: 'personal' as const,
      label: 'Profil Saya Sendiri',
      subtitle: 'Developer / Akun Login',
      badge: 'PROFIL SAYA',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      ringColor: 'from-purple-500 via-pink-500 to-rose-500',
      authorId: user?.uid || 'developer',
      authorName: user?.displayName || user?.email?.split('@')[0] || 'Developer',
      authorSubtitle: 'Developer / Admin',
      avatarType: 'dev' as const,
      avatarSrc: user?.photoURL || '/gambar/og.jpeg',
      icon: Code2,
      desc: 'Story diunggah atas nama akun pribadi developer/admin yang sedang login saat ini.'
    },
    {
      key: 'dev-system' as const,
      label: 'Dev System',
      subtitle: 'System & Platform Update',
      badge: 'DEV SYSTEM',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      ringColor: 'from-indigo-500 via-sky-500 to-cyan-500',
      authorId: 'dev-system',
      authorName: 'Dev System',
      authorSubtitle: 'System Update',
      avatarType: 'dev' as const,
      avatarSrc: '/gambar/og.jpeg',
      icon: Sparkles,
      desc: 'Update sistem, rilis fitur baru, pemeliharaan, dan pengumuman teknologi platform.'
    },
    {
      key: 'ma-nu' as const,
      label: 'MA NU Islamiyah',
      subtitle: 'Official Madrasah / Sekolah',
      badge: 'MA ISLAMIYAH',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      ringColor: 'from-emerald-500 via-teal-500 to-green-500',
      authorId: 'ma-nu',
      authorName: 'MA NU Islamiyah',
      authorSubtitle: 'Sekolah',
      avatarType: 'school' as const,
      avatarSrc: '/gambar/logoma.png',
      icon: School,
      desc: 'Pengumuman resmi madrasah, agenda almamater, pesan kepala madrasah atau dewan guru.'
    },
    {
      key: 'angkatan-ku-ips1' as const,
      label: 'AngkatanKU XII IPS 1',
      subtitle: 'Official Kelas XII IPS 1',
      badge: 'XII IPS 1',
      badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
      ringColor: 'from-teal-500 via-emerald-500 to-lime-500',
      authorId: 'angkatan-ku-ips1',
      authorName: 'AngkatanKU IPS 1',
      authorSubtitle: 'XII IPS 1',
      avatarType: 'class' as const,
      avatarSrc: '/logo-ips1.png',
      icon: Users,
      desc: 'Story & agenda resmi perwakilan kelas XII IPS 1 (kegiatan, mading, prestasi, momen kelas).'
    },
    {
      key: 'angkatan-ku-ips2' as const,
      label: 'AngkatanKU XII IPS 2',
      subtitle: 'Official Kelas XII IPS 2',
      badge: 'XII IPS 2',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
      ringColor: 'from-sky-500 via-blue-500 to-indigo-500',
      authorId: 'angkatan-ku-ips2',
      authorName: 'AngkatanKU IPS 2',
      authorSubtitle: 'XII IPS 2',
      avatarType: 'class' as const,
      avatarSrc: '/logo-ips2.jpg',
      icon: Users,
      desc: 'Story & agenda resmi perwakilan kelas XII IPS 2 (kegiatan, mading, prestasi, momen kelas).'
    }
  ];

  const handleStoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setStoryMediaType(isVideo ? 'video' : 'image');

    setIsUploadingStoryMedia(true);
    try {
      const cloudUrl = await uploadToCloudinary(file, isVideo ? 'video' : 'image');
      setStoryMediaUrl(cloudUrl);
    } catch (err: any) {
      console.warn("Gagal upload media story:", err);
      alert("Gagal mengunggah file ke Cloudinary: " + (err.message || 'Error'));
    } finally {
      setIsUploadingStoryMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyMediaUrl.trim()) {
      alert("Harap masukkan URL media atau pilih file gambar/video!");
      return;
    }
    setIsSubmittingStory(true);
    try {
      const selected = IDENTITIES.find(i => i.key === storyTargetIdentity) || IDENTITIES[0];
      const isPersonal = storyTargetIdentity === 'personal';

      const newStory = {
        type: storyMediaType,
        url: storyMediaUrl.trim(),
        audience:storyPublic?'public':'members',
        title: storyTitle.trim() || selected.label,
        caption: storyCaption.trim(),
        timestamp: Date.now(),
        authorId: user?.uid || 'developer',
        identityKey: storyTargetIdentity,
        authorName: isPersonal ? (user?.displayName || user?.email?.split('@')[0] || 'Developer') : selected.authorName,
        subtitle: selected.authorSubtitle,
        avatarSrc: selected.avatarSrc || '',
        avatarType: selected.avatarType,
        uploaderEmail: user?.email || 'admin'
      };

      await addDoc(collection(db, 'stories'), newStory);
      alert(`Story berhasil diunggah atas nama [${selected.label}]!`);
      
      setStoryMediaUrl('');
      setStoryTitle('');
      setStoryCaption('');
      setShowStoryUploadModal(false);
      
      fetchStoriesAndGallery();
    } catch (err: any) {
      console.warn("Gagal mengunggah story:", err);
      alert("Gagal mengunggah story: " + (err.message || 'Error'));
    } finally {
      setIsSubmittingStory(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (previewStoryModal && !previewIsPaused) {
      interval = setInterval(() => {
        setPreviewProgress(prev => {
          if (prev >= 100) {
            setPreviewStoryModal(null);
            return 0;
          }
          return prev + 2;
        });
      }, 70);
    }
    return () => clearInterval(interval);
  }, [previewStoryModal, previewIsPaused]);


    const handleSignOut = async () => {
    onNavigate('home');
    await signOut();
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastContent.trim() || !user) return;
    if (broadcastType === 'personal' && !broadcastTargetId) return;

    setSendingBroadcast(true);
    try {
      await addDoc(collection(db, 'messages'), {
        type: 'notification',
        senderId: user.uid,
        senderName: 'Admin ' + (user.displayName || ''),
        targetAudience: broadcastType,
        receiverId: broadcastType === 'personal' ? broadcastTargetId : null,
        title: broadcastTitle,
        content: broadcastContent,
        createdAt: Date.now(),
        read: false
      });
      alert('Pesan/Notifikasi berhasil dikirim!');
      setBroadcastTitle('');
      setBroadcastContent('');
      setBroadcastTargetId('');
    } catch (err: any) {
      console.warn('Gagal mengirim notifikasi:', err?.message || err);
      alert('Gagal mengirim notifikasi.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const fetchStoriesAndGallery = async () => {
    try {
      const snapS = await getDocs(collection(db, 'stories'));
      setStories(snapS.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const snapG = await getDocs(collection(db, 'gallery'));
      setGallery(snapG.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) {
      console.warn('Fetch stories/gallery note:', e);
    }
  };
  
  const handleDeleteStory = (id: string, mediaUrl?: string, title?: string) => {
    setStoryToDelete({ id, url: mediaUrl, title });
  };

  const confirmDeleteStoryAction = async () => {
    if (!storyToDelete) return;
    setIsDeletingStory(true);
    try {
      const id = storyToDelete.id;
      const mediaUrl = storyToDelete.url;
      await deleteDoc(doc(db, 'stories', id));
      if (mediaUrl) {
        deleteFromCloudinary(mediaUrl).catch(e => console.warn('Cloudinary delete notice:', e));
      }
      setStories(prev => prev.filter(s => s.id !== id));
      setStoryToDelete(null);
      setIsDeletingStory(false);
      if (previewStoryModal?.id === id) {
        setPreviewStoryModal(null);
      }
      fetchStoriesAndGallery();
    } catch (err: any) {
      console.warn("Gagal menghapus story:", err);
      setIsDeletingStory(false);
      alert("Gagal menghapus story: " + (err.message || 'Error'));
    }
  };

  const handleDeleteGallery = (id: string, imageUrl?: string, title?: string) => {
    setGalleryToDelete({ id, url: imageUrl, title });
  };

  const confirmDeleteGalleryAction = async () => {
    if (!galleryToDelete) return;
    setIsDeletingGallery(true);
    try {
      const id = galleryToDelete.id;
      const imageUrl = galleryToDelete.url;
      await deleteDoc(doc(db, 'gallery', id));
      if (imageUrl) {
        deleteFromCloudinary(imageUrl).catch(e => console.warn('Cloudinary delete notice:', e));
      }
      setGallery(prev => prev.filter(g => g.id !== id));
      setGalleryToDelete(null);
      setIsDeletingGallery(false);
      fetchStoriesAndGallery();
    } catch (err: any) {
      console.warn("Gagal menghapus galeri:", err);
      setIsDeletingGallery(false);
      alert("Gagal menghapus galeri: " + (err.message || 'Error'));
    }
  };

  // Live parsed items for Metadata JSON import
  const parsedMetadataItems = React.useMemo(() => {
    return parseMetadataInput(metadataRawText);
  }, [metadataRawText]);

  const handleExecuteMetadataImport = async () => {
    if(!metadataPublic){alert('Konfirmasikan visibilitas publik media CDN.');return;}
    if (parsedMetadataItems.length === 0) {
      alert("Tidak ada item metadata valid yang terdeteksi.");
      return;
    }

    setIsImportingMetadata(true);
    setImportProgress({ current: 0, total: parsedMetadataItems.length });

    let successCount = 0;
    try {
      if (metadataTarget === 'gallery') {
        for (let i = 0; i < parsedMetadataItems.length; i++) {
          const item = parsedMetadataItems[i];
          await addDoc(collection(db, 'gallery'), {
            title: item.name,
            album: metadataGalleryAlbum,
            date: item.date,
            imageUrl: item.url,
            audience:'public',
            uploaderId: user?.uid || 'admin',
            createdAt: Date.now()
          });
          successCount++;
          setImportProgress({ current: i + 1, total: parsedMetadataItems.length });
        }
      } else {
        // Target is story
        const identityConfig = IDENTITIES.find(ident => ident.key === metadataStoryIdentity) || IDENTITIES[1];
        for (let i = 0; i < parsedMetadataItems.length; i++) {
          const item = parsedMetadataItems[i];
          await addDoc(collection(db, 'stories'), {
            title: item.name,
            caption: 'Diimpor via Admin Metadata',
            type: item.type,
            url: item.url,
            audience:'public',
            authorId: user?.uid || 'admin',
            identityKey: metadataStoryIdentity,
            authorName: identityConfig.authorName,
            subtitle: identityConfig.authorSubtitle,
            classRoom: metadataStoryIdentity.includes('ips1') ? 'IPS 1' : metadataStoryIdentity.includes('ips2') ? 'IPS 2' : 'Semua',
            timestamp: Date.now(),
            viewedBy: []
          });
          successCount++;
          setImportProgress({ current: i + 1, total: parsedMetadataItems.length });
        }
      }

      await fetchStoriesAndGallery();
      setShowMetadataModal(false);
      setMetadataRawText('');
      alert(`Berhasil mengimpor ${successCount} item ke ${metadataTarget === 'gallery' ? 'Galeri' : 'Story'}!`);
    } catch (err: any) {
      console.warn("Gagal impor metadata:", err);
      alert("Terjadi kesalahan saat impor: " + (err.message || 'Error'));
    } finally {
      setIsImportingMetadata(false);
      setImportProgress(null);
    }
  };

  // Time ticker to update relative online timestamps in real time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Format relative last online string in Indonesian
  const formatLastOnline = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'Belum pernah aktif';
    const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    if (isNaN(time) || time <= 0) return 'Belum pernah aktif';

    const diffSec = Math.floor((currentTime - time) / 1000);
    if (diffSec < 45) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      const d = new Date(time);
      const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return `Kemarin ${timeStr}`;
    }
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    const d = new Date(time);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Format full date time for details
  const formatFullDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return '-';
    const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    if (isNaN(time) || time <= 0) return '-';
    const d = new Date(time);
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch / Sync students from Firestore with Real-Time onSnapshot
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'students'));
      const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRawFirestoreUsers(fetched);
      setUsers(fetched);
    } catch (err: any) {
      console.warn("Notice fetching students in admin panel:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    
    // Real-time listener ensures online/card changes reflect instantly
    const unsub = onSnapshot(collection(db, 'students'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRawFirestoreUsers(fetched);
      setUsers(fetched);
      setLoading(false);
    }, (err) => {
      console.warn("Notice listening to student updates:", err?.message || err);
      setLoading(false);
    });

    fetchStoriesAndGallery();

    return () => unsub();
  }, [isAdmin]);

  // Merge OFFICIAL_STUDENTS with Firestore docs
  const displayStudents = useMemo(() => {
    const mapped = OFFICIAL_STUDENTS.map((official) => {
      const cleanOfficialUname = official.username?.toLowerCase().replace(/^@/, '');
      const fsMatch = rawFirestoreUsers.find((fs) => {
        const fsUname = fs.username?.toLowerCase().replace(/^@/, '');
        const fsInduk = fs.induk;
        return (fsUname && fsUname === cleanOfficialUname) || (fsInduk && fsInduk === official.induk);
      });

      const hasLoggedIn = Boolean(
        fsMatch?.hasLoggedIn === true ||
        fsMatch?.lastLogin ||
        fsMatch?.lastOnline ||
        fsMatch?.cardScanLogin === true ||
        fsMatch?.cardCreated === true ||
        (fsMatch?.avatarUrl && (fsMatch?.nickname || fsMatch?.quote))
      );

      const isOnline = Boolean(
        hasLoggedIn &&
        fsMatch?.isOnline &&
        fsMatch?.lastOnline &&
        (currentTime - Number(fsMatch.lastOnline) < 3 * 60 * 1000)
      );

      const isCardLogin = Boolean(
        hasLoggedIn && (fsMatch?.cardScanLogin === true || fsMatch?.loginMethod === 'card')
      );

      return {
        id: fsMatch?.id || `official-${official.induk}`,
        firestoreId: fsMatch?.id || null,
        induk: official.induk,
        name: official.name,
        username: official.username,
        classRoom: fsMatch?.classRoom || official.classRoom || 'IPS 1',
        role: fsMatch?.role || official.role || 'Anggota Aktif',
        avatarUrl: fsMatch?.avatarUrl || '',
        nickname: fsMatch?.nickname || '',
        quote: fsMatch?.quote || fsMatch?.motto || official.motto || '',
        favoriteSubject: fsMatch?.favoriteSubject || official.favoriteSubject || '',
        gender: fsMatch?.gender || official.gender || '',
        hasLoggedIn,
        isOnline,
        isCardLogin,
        lastOnline: fsMatch?.lastOnline ? Number(fsMatch.lastOnline) : null,
        lastLogin: fsMatch?.lastLogin ? Number(fsMatch.lastLogin) : null,
        cardLastLogin: fsMatch?.cardLastLogin ? Number(fsMatch.cardLastLogin) : null,
        loginMethod: fsMatch?.loginMethod || (hasLoggedIn ? 'credentials' : null),
        cardCreated: fsMatch?.cardCreated || false,
        raw: fsMatch || null
      };
    });

    // Extra students registered or added manually outside OFFICIAL_STUDENTS
    const extras = rawFirestoreUsers.filter((fs) => {
      const fsUname = fs.username?.toLowerCase().replace(/^@/, '');
      const fsInduk = fs.induk;
      return !OFFICIAL_STUDENTS.some((off) => {
        const offUname = off.username?.toLowerCase().replace(/^@/, '');
        return (offUname && offUname === fsUname) || (off.induk && off.induk === fsInduk);
      });
    }).map((fs) => {
      const hasLoggedIn = true;
      const isOnline = Boolean(
        fs.isOnline &&
        fs.lastOnline &&
        (currentTime - Number(fs.lastOnline) < 3 * 60 * 1000)
      );
      const isCardLogin = Boolean(fs.cardScanLogin === true || fs.loginMethod === 'card');

      return {
        id: fs.id,
        firestoreId: fs.id,
        induk: fs.induk || '-',
        name: fs.name || fs.displayName || 'Akun Ekstra',
        username: fs.username || '@user',
        classRoom: fs.classRoom || 'XII IPS',
        role: fs.role || (fs.username === '@rohmatulloh' ? 'Developer' : 'Siswa'),
        avatarUrl: fs.avatarUrl || '',
        nickname: fs.nickname || '',
        quote: fs.quote || fs.motto || '',
        favoriteSubject: fs.favoriteSubject || '',
        gender: fs.gender || '',
        hasLoggedIn,
        isOnline,
        isCardLogin,
        lastOnline: fs.lastOnline ? Number(fs.lastOnline) : null,
        lastLogin: fs.lastLogin ? Number(fs.lastLogin) : null,
        cardLastLogin: fs.cardLastLogin ? Number(fs.cardLastLogin) : null,
        loginMethod: fs.loginMethod || 'credentials',
        cardCreated: fs.cardCreated || false,
        raw: fs
      };
    });

    return [...mapped, ...extras];
  }, [rawFirestoreUsers, currentTime]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = displayStudents.length;
    const online = displayStudents.filter(s => s.isOnline).length;
    const cardLogin = displayStudents.filter(s => s.isCardLogin).length;
    const loggedIn = displayStudents.filter(s => s.hasLoggedIn).length;
    const neverLoggedIn = total - loggedIn;
    return { total, online, cardLogin, loggedIn, neverLoggedIn };
  }, [displayStudents]);

  // Filtered students according to search, class, and status filter
  const filteredStudents = useMemo(() => {
    return displayStudents.filter(s => {
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchUname = s.username?.toLowerCase().includes(q);
        const matchInduk = s.induk?.includes(q);
        if (!matchName && !matchUname && !matchInduk) return false;
      }

      if (studentClassFilter !== 'all') {
        const cleanClass = s.classRoom?.replace('XII ', '').trim();
        if (cleanClass !== studentClassFilter) return false;
      }

      if (studentStatusFilter === 'online') return s.isOnline;
      if (studentStatusFilter === 'card') return s.isCardLogin;
      if (studentStatusFilter === 'offline') return s.hasLoggedIn && !s.isOnline;
      if (studentStatusFilter === 'never') return !s.hasLoggedIn;

      return true;
    });
  }, [displayStudents, studentSearch, studentClassFilter, studentStatusFilter]);

  
  const handleUpdateRole = async () => {
    if (!editRoleModal.user || !editRoleModal.newRole) return;
    setIsUpdatingUser(true);
    try {
      const targetId = editRoleModal.user.firestoreId || editRoleModal.user.id;
      await setDoc(doc(db, 'students', targetId), {
        induk: editRoleModal.user.induk,
        name: editRoleModal.user.name,
        username: editRoleModal.user.username,
        role: editRoleModal.newRole,
        classRoom: editRoleModal.newClassRoom
      }, { merge: true });
      alert('Berhasil memperbarui data siswa.');
      setEditRoleModal({ isOpen: false, user: null, newRole: '', newClassRoom: '' });
      fetchUsers();
    } catch (err: any) {
      console.warn('Gagal memperbarui data:', err?.message || err);
      alert('Gagal memperbarui data.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleAddUser = async (e:React.FormEvent)=>{e.preventDefault();setAddUserModal(false);alert('Gunakan Manajemen Akun pada Pusat Kontrol Keamanan di atas.');};
  const handleSetup = async ()=>{setConfirmBulkSetupOpen(false);alert('Migrasi akun tersedia melalui prosedur server terlindungi.');};

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ShieldCheck className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold">Akses Ditolak</h2>
        <p className="text-slate-500 mt-2">Hanya developer yang memiliki akses ke Control Panel.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <SecurityControlCenter/>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <h1 className="text-3xl font-black font-display text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Admin Panel <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded text-xs font-mono uppercase tracking-widest">Restricted</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Sistem kontrol terpusat data siswa dan media.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Database Connected</span>
          </div>
          <button 
            onClick={handleSignOut}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Quick App Feature Navigator Hub */}
      <div className="mb-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Navigasi Cepat Fitur AngkatanKU
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Quick Access
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Pindah ke halaman & fitur aplikasi secara instan tanpa perlu kembali ke menu utama.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { id: 'home', label: 'Beranda', icon: Home, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40' },
            { id: 'mading', label: 'Mading', icon: UserCheck, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40' },
            { id: 'anggota', label: 'Siswa', icon: Users, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40' },
            { id: 'jadwal', label: 'Jadwal', icon: Calendar, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20 hover:border-pink-500/40' },
            { id: 'guru', label: 'Guru', icon: GraduationCap, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20 hover:border-teal-500/40' },
            { id: 'galeri', label: 'Galeri', icon: ImageIcon, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40' },
            { id: 'prestasi', label: 'Prestasi', icon: Award, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40' },
            { id: 'feed', label: 'Feed', icon: MessageSquare, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40' },
            { id: 'nusa-ai', label: 'Nusa AI', icon: Bot, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40' },
            { id: 'alat-game', label: 'Alat & Game', icon: Wrench, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40' },
            { id: 'inbox', label: 'Kotak Masuk', icon: Bell, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40' },
            { id: 'profile', label: 'Profil Saya', icon: User, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all group hover:scale-[1.02] cursor-pointer ${item.color}`}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0 group-hover:rotate-6 transition-transform" />
              <span className="truncate text-slate-200 group-hover:text-white">{item.label}</span>
              <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-40 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs for Admin Modules */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 overflow-x-auto hide-scrollbar">
        {[
          { id: 'users', label: 'Manajemen Siswa', icon: Users, count: stats.total },
          { id: 'moderation', label: 'Moderasi Komentar & ID', icon: ShieldAlert },
          { id: 'stories', label: 'Story Studio & Moderasi', icon: Activity, count: stories.length },
          { id: 'gallery', label: 'Moderasi Galeri', icon: ImageIcon, count: gallery.length },
          { id: 'broadcast', label: 'Kirim Notifikasi / Pesan', icon: Bell },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.id === 'users' && stats.online > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {stats.online} Online
              </span>
            )}
            {tab.count !== undefined && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 min-h-[500px]">
        
          {activeTab === 'moderation' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AdminModerationTab />
            </motion.div>
          )}

          {activeTab === 'broadcast' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  Kirim Notifikasi / Pesan Sistem
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pesan ini akan muncul di Kotak Masuk target penerima.</p>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Penerima</label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Semua Pengguna (Broadcast)</option>
                    <option value="students">Hanya Siswa</option>
                    <option value="personal">Personal (Pengguna Spesifik)</option>
                  </select>
                </div>

                {broadcastType === 'personal' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 mt-4">Pilih Pengguna</label>
                    <select
                      value={broadcastTargetId}
                      onChange={(e) => setBroadcastTargetId(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Pilih pengguna...</option>
                      {users.filter(u => u.id !== user?.uid).map(u => (
                        <option key={u.id} value={u.id}>
                          {u.displayName} ({u.username?.startsWith('@') ? u.username : `@${u.username || ''}`})
                        </option>
                      ))}
                    </select>
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Judul Notifikasi (Opsional)</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="cth: Pengumuman Jadwal Ujian"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Isi Pesan</label>
                  <textarea
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    required
                    rows={4}
                    placeholder="Tulis pesan atau pengumuman di sini..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {sendingBroadcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Kirim Pesan
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Header with Title and Action Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Status & Manajemen Siswa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pantau kehadiran online real-time, verifikasi login dari kartu pelajar digital, dan aktivitas akun.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={fetchUsers}
                  disabled={loading}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button 
                  onClick={() => setTeacherCredsModal(true)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Lihat Kredensial & Password Dewan Guru"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Kredensial Guru
                </button>
                <button 
                  onClick={() => setAddUserModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Tambah Manual
                </button>
                <button 
                  onClick={handleSetup}
                  disabled={setupRunning}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {setupRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Setup Database
                </button>
              </div>
            </div>

            {/* Quick Status Cards / Presence & Card Access Badges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Total Siswa */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Terdaftar</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {stats.total}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Siswa terdata di angkatan</p>
              </div>

              {/* Online Sekarang (AKSEN MENYALA HIJAU) */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30 dark:border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.12)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Online Sekarang
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Wifi className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                  {stats.online}
                </div>
                <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-1 font-medium">Aktif di web saat ini</p>
              </div>

              {/* Login dari Kartu (AKSEN MENYALA CYAN) */}
              <div className="p-4 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/30 dark:border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.12)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    Login dari Card
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  {stats.cardLogin}
                </div>
                <p className="text-[11px] text-cyan-600/80 dark:text-cyan-400/70 mt-1 font-medium">Scan QR card terverifikasi</p>
              </div>

              {/* Belum Pernah Login (TANPA AKSEN NYALA / MATTE) */}
              <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Belum Login</span>
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-600 dark:text-slate-400 font-mono">
                  {stats.neverLoggedIn}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Tetap terdaftar, tanpa aksen</p>
              </div>
            </div>

            {setupLogs.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1">
                {setupLogs.map((log, i) => (
                  <div key={i} className={log.status === 'success' ? 'text-emerald-400' : log.status === 'error' ? 'text-rose-400' : 'text-amber-400'}>
                    [{log.status.toUpperCase()}] {log.student} {log.error ? `- ${log.error}` : ''}
                  </div>
                ))}
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 pt-2">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-x-auto hide-scrollbar">
                {[
                  { id: 'all', label: 'Semua', count: stats.total },
                  { id: 'online', label: 'Online', count: stats.online, highlight: 'emerald' },
                  { id: 'card', label: 'Login Card', count: stats.cardLogin, highlight: 'cyan' },
                  { id: 'offline', label: 'Offline', count: stats.loggedIn - stats.online },
                  { id: 'never', label: 'Belum Login', count: stats.neverLoggedIn },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStudentStatusFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      studentStatusFilter === f.id
                        ? f.highlight === 'emerald'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : f.highlight === 'cyan'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {f.id === 'online' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                    {f.id === 'card' && <QrCode className="w-3 h-3" />}
                    <span>{f.label}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/10 dark:bg-white/10">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Class Filter and Search Input */}
              <div className="flex items-center gap-2">
                <select
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Semua Kelas</option>
                  <option value="IPS 1">XII IPS 1</option>
                  <option value="IPS 2">XII IPS 2</option>
                </select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, username, NISN..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  {studentSearch && (
                    <button 
                      onClick={() => setStudentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-400 text-xs">Status Online</th>
                    <th className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-400 text-xs">Akses Kartu</th>
                    <th className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-400 text-xs">Siswa</th>
                    <th className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-400 text-xs">Kelas & Jabatan</th>
                    <th className="px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-400 text-xs">Terakhir Online</th>
                    <th className="px-4 py-3.5 text-right font-semibold text-slate-600 dark:text-slate-400 text-xs">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading && displayStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Sinkronisasi data kehadiran siswa...
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((u) => (
                      <tr 
                        key={u.id} 
                        className={`transition-colors ${
                          u.isOnline 
                            ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] hover:bg-emerald-500/[0.08]' 
                            : u.isCardLogin
                            ? 'bg-cyan-500/[0.02] dark:bg-cyan-500/[0.03] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            : !u.hasLoggedIn
                            ? 'opacity-80 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        {/* 1. Status Online (Aksen Nyala jika Online, redup jika tidak login) */}
                        <td className="px-4 py-3.5">
                          {u.isOnline ? (
                            <div className="flex items-center gap-2.5">
                              <span className="relative flex h-3 w-3 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                              </span>
                              <div>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.35)]">
                                  ONLINE SEKARANG
                                </span>
                                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-mono">
                                  Aktif saat ini
                                </p>
                              </div>
                            </div>
                          ) : u.hasLoggedIn ? (
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>
                              <div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                  Offline
                                </span>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                  {formatLastOnline(u.lastOnline)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* BELUM LOGIN: Tetap terdaftar tapi TIDAK ADA AKSEN YANG NYALA */
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></span>
                              <div>
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                  Belum Login
                                </span>
                                <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                                  Belum ada sesi
                                </p>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 2. Akses Kartu (Aksen Card Nyala jika login dari kartu) */}
                        <td className="px-4 py-3.5">
                          {u.isCardLogin ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                              <QrCode className="w-3.5 h-3.5 text-cyan-500" />
                              <span>Card Aktif</span>
                            </span>
                          ) : u.hasLoggedIn ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <KeyRound className="w-3 h-3 text-slate-400" />
                              <span>Login Akun</span>
                            </span>
                          ) : (
                            /* BELUM LOGIN: Tanpa aksen menyala */
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
                              <span>• Belum Ada Akses</span>
                            </span>
                          )}
                        </td>

                        {/* 3. Identitas Siswa */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {u.avatarUrl && u.avatarUrl.trim() !== '' ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  referrerPolicy="no-referrer"
                                  className={`w-9 h-9 rounded-full object-cover border-2 ${
                                    u.isOnline
                                      ? 'border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                      : u.isCardLogin
                                      ? 'border-cyan-500/60'
                                      : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                  u.isOnline 
                                    ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                                    : u.isCardLogin
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {u.name.charAt(0)}
                                </div>
                              )}
                              {u.isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {(u.role === 'Developer' || u.username === '@rohmatulloh') && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                                <span>{u.username?.startsWith('@') ? u.username : `@${u.username || ''}`}</span>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <span className="text-slate-400 text-[11px]">NISN: {u.induk}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Kelas & Jabatan */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
                              {u.classRoom || 'XII IPS 1'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {u.role || 'Anggota Aktif'}
                            </span>
                          </div>
                        </td>

                        {/* 5. Terakhir Online */}
                        <td className="px-4 py-3.5">
                          {u.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <Wifi className="w-3.5 h-3.5 animate-pulse" />
                              Sedang Aktif
                            </span>
                          ) : u.hasLoggedIn && u.lastOnline ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                                {formatLastOnline(u.lastOnline)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatFullDate(u.lastOnline)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">-</span>
                          )}
                        </td>

                        {/* 6. Aksi */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedStudentDetail(u)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Detail Aktivitas Siswa"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditRoleModal({ isOpen: true, user: u, newRole: u.role || '', newClassRoom: u.classRoom || 'IPS 1' })}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer" 
                              title="Edit Peran & Kelas"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Detail Aktivitas Siswa */}
            <AnimatePresence>
              {selectedStudentDetail && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative"
                  >
                    <button
                      onClick={() => setSelectedStudentDetail(null)}
                      className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        {selectedStudentDetail.avatarUrl && selectedStudentDetail.avatarUrl.trim() !== '' ? (
                          <img
                            src={selectedStudentDetail.avatarUrl}
                            alt={selectedStudentDetail.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                            {selectedStudentDetail.name.charAt(0)}
                          </div>
                        )}
                        {selectedStudentDetail.isOnline && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-md animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{selectedStudentDetail.name}</span>
                          {selectedStudentDetail.isOnline && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              Online
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          {selectedStudentDetail.username} • NISN: {selectedStudentDetail.induk}
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          {selectedStudentDetail.classRoom} — {selectedStudentDetail.role}
                        </p>
                      </div>
                    </div>

                    {/* Status Rinci Aktivitas */}
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
                      {/* Kehadiran Online */}
                      <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5" />
                          Status Aktivitas Web
                        </span>
                        {selectedStudentDetail.isOnline ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Aktif Sekarang
                          </span>
                        ) : selectedStudentDetail.hasLoggedIn ? (
                          <span className="font-medium text-slate-600 dark:text-slate-400">
                            Offline ({formatLastOnline(selectedStudentDetail.lastOnline)})
                          </span>
                        ) : (
                          <span className="font-medium text-slate-400">Belum Pernah Login</span>
                        )}
                      </div>

                      {/* Akses Login Card */}
                      <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-cyan-500" />
                          Akses Kartu Pelajar Digital
                        </span>
                        {selectedStudentDetail.isCardLogin ? (
                          <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Login Card Terverifikasi
                          </span>
                        ) : (
                          <span className="text-slate-400">Belum Login via Card QR</span>
                        )}
                      </div>

                      {/* Terakhir Online */}
                      <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Waktu Terakhir Online
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {selectedStudentDetail.isOnline 
                            ? 'Sedang Berlangsung' 
                            : formatFullDate(selectedStudentDetail.lastOnline)}
                        </span>
                      </div>

                      {/* Sesi Login Terakhir */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5" />
                          Sesi Login Terakhir
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {formatFullDate(selectedStudentDetail.lastLogin)}
                        </span>
                      </div>
                    </div>

                    {selectedStudentDetail.quote && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-500/20 rounded-xl mb-4 text-xs text-indigo-900 dark:text-indigo-200 italic">
                        "{selectedStudentDetail.quote}"
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSelectedStudentDetail(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="space-y-6">
            {/* Header Story Studio */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Story Multi-Identitas Studio
                </div>
                <h3 className="font-bold text-xl text-white">Kelola & Upload Story Resmi</h3>
                <p className="text-xs text-indigo-200/80 max-w-xl mt-1">
                  Upload story ke Story Rings beranda secara resmi atas nama <strong>Profil Saya (Developer)</strong>, <strong>Dev System</strong>, <strong>MA NU Islamiyah</strong>, <strong>XII IPS 1</strong>, atau <strong>XII IPS 2</strong>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button 
                  onClick={fetchStoriesAndGallery}
                  className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetadataTarget('story');
                    setShowMetadataModal(true);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Import Story dari JSON metadata (Cloudinary)"
                >
                  <FileJson className="w-4 h-4" /> Import Metadata
                </button>
                <button 
                  onClick={() => setShowStoryUploadModal(true)}
                  className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Upload Story Baru
                </button>
              </div>
            </div>

            {/* Quick Upload Identity Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {IDENTITIES.map((item) => {
                const count = stories.filter(s => s.authorId === item.authorId || s.identityKey === item.key).length;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setStoryTargetIdentity(item.key);
                      setShowStoryUploadModal(true);
                    }}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 text-left transition-all hover:shadow-md group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.ringColor} flex items-center justify-center text-white shadow-xs`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {count} Story
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {item.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      <Plus className="w-3 h-3 mr-1" /> Buat Story
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 border-b border-slate-200 dark:border-slate-800">
              {[
                { id: 'all', label: 'Semua Story', count: stories.length },
                { id: 'personal', label: '👨‍💻 Profil Saya', count: stories.filter(s => s.identityKey === 'personal' || (s.authorId && s.authorId === user?.uid)).length },
                { id: 'dev-system', label: '⚙️ Dev System', count: stories.filter(s => s.authorId === 'dev-system' || s.identityKey === 'dev-system').length },
                { id: 'ma-nu', label: '🏫 MA Islamiyah', count: stories.filter(s => s.authorId === 'ma-nu' || s.identityKey === 'ma-nu').length },
                { id: 'angkatan-ku-ips1', label: '🟢 XII IPS 1', count: stories.filter(s => s.authorId === 'angkatan-ku-ips1' || s.identityKey === 'angkatan-ku-ips1').length },
                { id: 'angkatan-ku-ips2', label: '🔵 XII IPS 2', count: stories.filter(s => s.authorId === 'angkatan-ku-ips2' || s.identityKey === 'angkatan-ku-ips2').length },
                { id: 'students', label: '👥 Siswa / Lainnya', count: stories.filter(s => !['dev-system', 'ma-nu', 'angkatan-ku-ips1', 'angkatan-ku-ips2'].includes(s.authorId) && s.authorId !== user?.uid).length },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStoryFilter(f.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    storyFilter === f.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80'
                  }`}
                >
                  {f.label}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    storyFilter === f.id
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Story Grid */}
            {(() => {
              const filteredStories = stories.filter(s => {
                if (storyFilter === 'all') return true;
                if (storyFilter === 'personal') return s.identityKey === 'personal' || (s.authorId && s.authorId === user?.uid);
                if (storyFilter === 'dev-system') return s.authorId === 'dev-system' || s.identityKey === 'dev-system';
                if (storyFilter === 'ma-nu') return s.authorId === 'ma-nu' || s.identityKey === 'ma-nu';
                if (storyFilter === 'angkatan-ku-ips1') return s.authorId === 'angkatan-ku-ips1' || s.identityKey === 'angkatan-ku-ips1';
                if (storyFilter === 'angkatan-ku-ips2') return s.authorId === 'angkatan-ku-ips2' || s.identityKey === 'angkatan-ku-ips2';
                if (storyFilter === 'students') return !['dev-system', 'ma-nu', 'angkatan-ku-ips1', 'angkatan-ku-ips2'].includes(s.authorId) && s.authorId !== user?.uid;
                return true;
              });

              if (filteredStories.length === 0) {
                return (
                  <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 mx-auto flex items-center justify-center mb-3">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Belum Ada Story pada Kategori Ini</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Mulai buat dan publikasikan story baru untuk kategori ini agar tampil di beranda aplikasi.
                    </p>
                    <button
                      onClick={() => setShowStoryUploadModal(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Upload Story Sekarang
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredStories.map((s: any) => {
                    const iden = IDENTITIES.find(i => i.authorId === s.authorId || i.key === s.identityKey);
                    const formattedDate = s.timestamp ? new Date(s.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Waktu tidak tersedia';

                    return (
                      <div 
                        key={s.id} 
                        className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md aspect-[9/16] flex flex-col justify-between"
                      >
                        {/* Media Background */}
                        <div className="absolute inset-0 z-0 bg-slate-950">
                          {s.type === 'video' ? (
                            <video 
                              src={s.url || undefined} 
                              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                              muted 
                              playsInline 
                            />
                          ) : (
                            <img 
                              src={s.url || undefined} 
                              alt={s.title || 'Story'} 
                              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" 
                              onError={(e) => {
                                (e.target as HTMLElement).setAttribute('src', '/gambar/og.jpeg');
                              }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
                        </div>

                        {/* Top Header inside story card */}
                        <div className="relative z-10 p-3 flex items-start justify-between gap-2">
                          <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-xs shadow-xs ${
                            iden ? iden.badgeColor : 'bg-slate-800/80 text-slate-300 border-slate-700'
                          }`}>
                            {iden ? iden.badge : 'SISWA'}
                          </span>

                          <div className="flex items-center gap-1">
                            {s.type === 'video' && (
                              <span className="p-1 rounded-full bg-black/60 text-white text-[10px]" title="Video Story">
                                <Film className="w-3 h-3" />
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStory(s.id, s.url, s.title || s.authorName);
                              }}
                              className="p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-full transition-all shadow-md active:scale-95 cursor-pointer"
                              title="Hapus Story"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Center Hover Action */}
                        <div className="relative z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setPreviewStoryModal(s);
                              setPreviewProgress(0);
                              setPreviewIsPaused(false);
                            }}
                            className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" /> Preview
                          </button>
                        </div>

                        {/* Bottom Info */}
                        <div className="relative z-10 p-3">
                          <p className="text-white text-xs font-bold truncate">
                            {s.title || s.authorName || 'Story'}
                          </p>
                          {s.caption && (
                            <p className="text-slate-300 text-[11px] line-clamp-2 mt-0.5 leading-snug">
                              {s.caption}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span className="truncate">{s.authorName || 'Official'}</span>
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Moderasi Galeri Publik</h3>
                <p className="text-xs text-slate-500">Daftar foto galeri yang diunggah pengguna atau diimpor dari Cloudinary.</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={fetchStoriesAndGallery}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMetadataTarget('gallery');
                    setShowMetadataModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Import Foto Galeri dari JSON metadata"
                >
                  <FileJson className="w-4 h-4" /> Import Metadata JSON
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.length === 0 ? (
                <div className="col-span-full py-10 text-center text-slate-500">Belum ada foto galeri.</div>
              ) : (
                gallery.map((g: any) => (
                  <div key={g.id} className="relative group rounded-xl overflow-hidden bg-slate-900 aspect-square border border-slate-800 shadow-sm">
                    <img src={g.imageUrl || undefined} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end">
                       <p className="text-white text-xs font-bold truncate">{g.title}</p>
                       <p className="text-white/70 text-[10px]">{g.album}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteGallery(g.id, g.imageUrl, g.title)}
                      className="absolute top-2 right-2 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Hapus Foto Galeri"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editRoleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setEditRoleModal({...editRoleModal, isOpen: false})} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Pengangkatan Titel / Role</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama</label>
                <input type="text" disabled value={editRoleModal.user?.name || ''} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
                <select 
                  value={editRoleModal.newClassRoom}
                  onChange={(e) => setEditRoleModal({...editRoleModal, newClassRoom: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="IPS 1">IPS 1</option>
                  <option value="IPS 2">IPS 2</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Posisi / Titel</label>
                  <button 
                    onClick={() => setEditRoleModal({...editRoleModal, newRole: 'Anggota Biasa'})}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
                  >
                    Cabut Titel (Reset)
                  </button>
                </div>
                <input 
                  type="text" 
                  value={editRoleModal.newRole}
                  onChange={(e) => setEditRoleModal({...editRoleModal, newRole: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  placeholder="Misal: Ketua Kelas, Wakil Ketua, Anggota Aktif"
                  list="role-suggestions"
                />
                <datalist id="role-suggestions">
                  <option value="Ketua Kelas" />
                  <option value="Wakil Ketua" />
                  <option value="Sekretaris" />
                  <option value="Bendahara" />
                  <option value="Anggota Aktif" />
                  <option value="Anggota Biasa" />
                </datalist>
              </div>
              <button 
                onClick={handleUpdateRole}
                disabled={isUpdatingUser}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-4"
              >
                {isUpdatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {teacherCredsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl p-6 relative my-8 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col">
            <button 
              onClick={() => {
                setTeacherCredsModal(false);
                setSyncTeachersResult(null);
              }} 
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manajemen Akun Resmi Dewan Guru</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daftar akun dan sinkronisasi autentikasi aman untuk 20 Dewan Guru MA NU Islamiyah.
                </p>
              </div>
            </div>

            {/* Standard Notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  Keamanan Terenkripsi (Zero Plaintext)
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  Kata sandi akun dilindungi dengan salted hashing Firebase Auth dan tidak disimpan dalam kode sumber ataupun inspeksi browser.
                </p>
              </div>
              <button
                onClick={async () => {
                  setSyncingTeachers(true);
                  try {
                    const results:any[] = []; throw new Error('Gunakan migrasi server terlindungi.');
                    const successCount = results.filter(r => r.status === 'success').length;
                    setSyncTeachersResult(`Sinkronisasi selesai! ${successCount}/${results.length} akun guru tersinkron.`);
                    fetchUsers();
                  } catch (err: any) {
                    setSyncTeachersResult(`Gagal sinkron: ${err.message}`);
                  } finally {
                    setSyncingTeachers(false);
                  }
                }}
                disabled={syncingTeachers}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {syncingTeachers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sinkronkan ke Auth
              </button>
            </div>

            {syncTeachersResult && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                {syncTeachersResult}
              </div>
            )}

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Cari guru berdasarkan nama, NIP, jabatan, atau username..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* List of Teachers */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {(TEACHER_CREDENTIALS as any[])
                .filter(t => {
                  if (!teacherSearch) return true;
                  const q = teacherSearch.toLowerCase();
                  return (
                    t.nama?.toLowerCase().includes(q) ||
                    t.nip?.toLowerCase().includes(q) ||
                    t.title?.toLowerCase().includes(q) ||
                    t.jabatan?.toLowerCase().includes(q) ||
                    t.username?.toLowerCase().includes(q)
                  );
                })
                .map((t, idx) => {
                  return (
                    <div 
                      key={t.id || idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {t.nama}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {t.jabatan || t.title || 'Guru'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                            <span>NIP: <strong className="text-slate-700 dark:text-slate-300">{t.nip}</strong></span>
                            <span>•</span>
                            <span>{t.username}</span>
                          </div>
                        </div>
                      </div>

                      {/* Account Status Badge */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Akun Terdaftar
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 relative my-8">
            <button onClick={() => setAddUserModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Tambah Siswa Manual</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor Induk Siswa (NIS)</label>
                <input 
                  type="text" required
                  value={newUser.induk}
                  onChange={(e) => setNewUser({...newUser, induk: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input 
                  type="text" required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username (Tanpa @)</label>
                <input 
                  type="text" required
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input 
                  type="text" required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
                <select 
                  value={newUser.classRoom}
                  onChange={(e) => setNewUser({...newUser, classRoom: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="IPS 1">IPS 1</option>
                  <option value="IPS 2">IPS 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Posisi / Role</label>
                <input 
                  type="text" 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  placeholder="Misal: Ketua Kelas, Wakil Ketua, Anggota Aktif"
                />
              </div>
              <button 
                type="submit"
                disabled={isAddingUser}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-4"
              >
                {isAddingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tambahkan Siswa'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Story Upload Modal */}
      {showStoryUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 sm:p-8 text-white shadow-2xl relative my-8">
            <button 
              onClick={() => {
                setShowStoryUploadModal(false);
                setStoryMediaUrl('');
              }} 
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Upload Story Multi-Identitas</h2>
                <p className="text-xs text-slate-400">Pilih identitas pengunggah, jenis media foto/video, lalu publikasikan.</p>
              </div>
            </div>

            <form onSubmit={handleUploadStory} className="space-y-6">
              {/* Step 1: Identity Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Pilih Identitas Pengunggah (Author Story)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {IDENTITIES.map((item) => {
                    const isSelected = storyTargetIdentity === item.key;
                    return (
                      <div
                        key={item.key}
                        onClick={() => setStoryTargetIdentity(item.key)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.ringColor} flex items-center justify-center text-white text-xs`}>
                            <item.icon className="w-3.5 h-3.5" />
                          </div>
                          {isSelected ? (
                            <span className="text-emerald-400 flex items-center text-[10px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> Terpilih
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">{item.badge}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{item.label}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Media Type and Input */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      2. Tipe Media
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStoryMediaType('image')}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                          storyMediaType === 'image'
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" /> Foto / Gambar
                      </button>
                      <button
                        type="button"
                        onClick={() => setStoryMediaType('video')}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                          storyMediaType === 'video'
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Film className="w-4 h-4" /> Video (MP4)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        3. Media (Cloudinary / File)
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingStoryMedia}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold disabled:opacity-50"
                      >
                        {isUploadingStoryMedia ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                            <span>Mengunggah ke Cloudinary...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3" /> 
                            <span>Upload File ke Cloudinary</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleStoryFileChange}
                      className="hidden"
                    />

                    <div className="relative">
                      <label className="flex gap-2 text-xs mb-2"><input type="checkbox" checked={storyPublic} onChange={e=>setStoryPublic(e.target.checked)}/>Story ini boleh dilihat publik.</label>
                      <input 
                        type="text" inputMode="url" 
                        value={storyMediaUrl}
                        onChange={(e) => setStoryMediaUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/... atau pilih file untuk upload otomatis"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 outline-none focus:border-indigo-500 text-xs text-white"
                      />
                      <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    </div>

                    {isUploadingStoryMedia && (
                      <div className="mt-2 p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-center gap-2 text-indigo-300 text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sedang mengunggah media ke Cloudinary server... Mohon tunggu.</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500 self-center">Preset cepat:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setStoryMediaType('image');
                          setStoryMediaUrl('/gambar/og.jpeg');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Banner Angkatan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStoryMediaType('image');
                          setStoryMediaUrl('/gambar/logoma.png');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Logo MA
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStoryMediaType('image');
                          setStoryMediaUrl('/logo-ips1.png');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Logo IPS 1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStoryMediaType('image');
                          setStoryMediaUrl('/logo-ips2.jpg');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Logo IPS 2
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      4. Judul Story (Headline)
                    </label>
                    <input 
                      type="text" 
                      value={storyTitle}
                      onChange={(e) => setStoryTitle(e.target.value)}
                      placeholder="Misal: Update Sistem v2.5 / Pengumuman Ujian"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      5. Keterangan / Pesan Caption
                    </label>
                    <textarea 
                      rows={3}
                      value={storyCaption}
                      onChange={(e) => setStoryCaption(e.target.value)}
                      placeholder="Tulis pesan lengkap story yang ingin dibagikan ke seluruh siswa..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 text-xs text-white resize-none"
                    />
                  </div>
                </div>

                {/* Right Side: Live Story Mockup */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" /> Live Preview Tampilan Story
                  </span>
                  
                  <div className="w-56 aspect-[9/16] rounded-2xl bg-slate-900 border-2 border-slate-700 overflow-hidden relative shadow-2xl flex flex-col justify-between p-3">
                    {storyMediaUrl ? (
                      storyMediaType === 'video' ? (
                        <video src={storyMediaUrl || undefined} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
                      ) : (
                        <img src={storyMediaUrl || undefined} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 p-4 text-center">
                        <ImageIcon className="w-8 h-8 mb-2 stroke-[1.5]" />
                        <span className="text-[10px]">Media belum dipilih</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/70 pointer-events-none" />

                    {/* Progress Bar Mockup */}
                    <div className="relative z-10 w-full h-1 bg-white/30 rounded-full overflow-hidden mb-2">
                      <div className="h-full w-1/3 bg-white rounded-full" />
                    </div>

                    {/* Header in Mockup */}
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {storyTargetIdentity === 'dev-system' ? '⚙️' : storyTargetIdentity === 'ma-nu' ? '🏫' : '👨‍💻'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-white text-[10px] font-bold truncate">
                          {IDENTITIES.find(i => i.key === storyTargetIdentity)?.label}
                        </p>
                        <p className="text-white/60 text-[8px] truncate">
                          {IDENTITIES.find(i => i.key === storyTargetIdentity)?.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Caption in Mockup */}
                    <div className="relative z-10 mt-auto">
                      <p className="text-white text-xs font-bold leading-tight line-clamp-1">
                        {storyTitle || 'Judul Story'}
                      </p>
                      <p className="text-white/80 text-[10px] line-clamp-2 mt-0.5 leading-snug">
                        {storyCaption || 'Keterangan story akan muncul di sini...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setShowStoryUploadModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingStory || !storyMediaUrl.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmittingStory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Publikasikan Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Interactive Story Preview Modal */}
      {previewStoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-4">
            {/* Background Media */}
            <div className="absolute inset-0 z-0 bg-slate-950">
              {previewStoryModal.type === 'video' ? (
                <video 
                  src={previewStoryModal.url || undefined} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  playsInline 
                  muted={false}
                />
              ) : (
                <img 
                  src={previewStoryModal.url || undefined} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/80 pointer-events-none" />
            </div>

            {/* Top Bar: Progress & Header */}
            <div className="relative z-10 space-y-2">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 border border-white/20 flex items-center justify-center text-white text-xs font-bold">
                    {previewStoryModal.authorName?.[0] || 'A'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none truncate max-w-[150px]">
                      {previewStoryModal.authorName || 'Official'}
                    </p>
                    <p className="text-[10px] text-white/70 mt-0.5 leading-none">
                      {previewStoryModal.subtitle || 'Story'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewIsPaused(true);
                      handleDeleteStory(previewStoryModal.id, previewStoryModal.url, previewStoryModal.title);
                    }}
                    className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                    title="Hapus Story Ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewIsPaused(!previewIsPaused)}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer"
                    title={previewIsPaused ? "Mainkan" : "Jeda"}
                  >
                    {previewIsPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewStoryModal(null)}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Caption */}
            <div className="relative z-10 mt-auto bg-black/50 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
              <h4 className="text-sm font-bold text-white">{previewStoryModal.title || 'Story'}</h4>
              {previewStoryModal.caption && (
                <p className="text-xs text-white/90 mt-1 leading-relaxed">{previewStoryModal.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Story Delete In-App Confirmation Modal */}
      {storyToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hapus Story?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Story "{storyToDelete.title || 'ini'}" akan dihapus permanen dari Firestore dan media server.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingStory}
                onClick={() => setStoryToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingStory}
                onClick={confirmDeleteStoryAction}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isDeletingStory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghapus...
                  </>
                ) : (
                  'Hapus Permanen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Delete In-App Confirmation Modal */}
      {galleryToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hapus Foto Galeri?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Foto "{galleryToDelete.title || 'ini'}" akan dihapus permanen dari memori galeri angkatan.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingGallery}
                onClick={() => setGalleryToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingGallery}
                onClick={confirmDeleteGalleryAction}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isDeletingGallery ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghapus...
                  </>
                ) : (
                  'Hapus Permanen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Setup In-App Confirmation Modal */}
      {confirmBulkSetupOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto border border-teal-500/20">
              <Save className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jalankan Setup Siswa?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Ini akan mendaftarkan seluruh siswa resmi dari daftar official ke akun autentikasi dan database secara otomatis.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={setupRunning}
                onClick={() => setConfirmBulkSetupOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={setupRunning}
                onClick={handleSetup}
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-teal-600/30 cursor-pointer"
              >
                {setupRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menjalankan...
                  </>
                ) : (
                  'Mulai Setup'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata JSON Import Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Import Metadata JSON (Tools Pribadi)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ekstrak otomatis URL gambar dan nama foto dari metadata JSON Cloudinary/alat Anda.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (!isImportingMetadata) {
                    setShowMetadataModal(false);
                    setMetadataRawText('');
                  }
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Destination Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tujuan Impor</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetadataTarget('gallery')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      metadataTarget === 'gallery'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" /> Galeri Angkatan
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetadataTarget('story')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      metadataTarget === 'story'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" /> Story Angkatan
                  </button>
                </div>
              </div>

              {/* Dynamic Target Options */}
              {metadataTarget === 'gallery' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Album Galeri</label>
                  <select
                    value={metadataGalleryAlbum}
                    onChange={(e) => setMetadataGalleryAlbum(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  >
                    {['Kelas & Sekolah', 'P5', 'Class Meeting', 'Study Tour', 'Graduation Prep'].map(alb => (
                      <option key={alb} value={alb}>{alb}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Identitas Penerbit Story</label>
                  <select
                    value={metadataStoryIdentity}
                    onChange={(e) => setMetadataStoryIdentity(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  >
                    {IDENTITIES.map(id => (
                      <option key={id.key} value={id.key}>{id.label} ({id.subtitle})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Raw JSON Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tempel JSON Metadata Di Sini
                  </label>
                  {parsedMetadataItems.length > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ✓ {parsedMetadataItems.length} Media Valid
                    </span>
                  )}
                </div>
                <label className="flex gap-2 text-xs mb-2"><input type="checkbox" checked={metadataPublic} onChange={e=>setMetadataPublic(e.target.checked)}/>Media CDN yang diimpor ditetapkan publik.</label>
                    <textarea
                  value={metadataRawText}
                  onChange={(e) => setMetadataRawText(e.target.value)}
                  placeholder={`Contoh format:\n{\n  "id": "ast-1788532684812-3wm7",\n  "name": "Ngatau-068.jpg",\n  "url": "https://res.cloudinary.com/.../ns4bsr3vmhvcior6l7o4.jpg",\n  "uploadedAt": "2026-09-04T14:38:07Z"\n}\n\n(Bisa satu objek JSON atau array [ { ... }, { ... } ] berisi banyak foto sekaligus)`}
                  className="w-full h-36 font-mono text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              {/* Live Preview of parsed items */}
              {parsedMetadataItems.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Preview Media yang Ditemukan ({parsedMetadataItems.length})</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-44 overflow-y-auto p-1">
                    {parsedMetadataItems.map((item, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-square bg-slate-100 dark:bg-slate-950 group">
                        {item.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                            <Film className="w-6 h-6 text-indigo-400" />
                          </div>
                        ) : (
                          <img 
                            src={item.thumbnailUrl || item.url} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', '/gambar/og.jpeg');
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-1.5 flex flex-col justify-end">
                          <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                          <p className="text-[8px] font-mono text-white/70">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress if importing */}
              {isImportingMetadata && importProgress && (
                <div className="space-y-1.5 bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-500/20">
                  <div className="flex justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <span>Mengimpor media ke database...</span>
                    <span>{importProgress.current} / {importProgress.total}</span>
                  </div>
                  <div className="w-full h-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-150"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2.5">
              <button
                type="button"
                disabled={isImportingMetadata}
                onClick={() => {
                  setShowMetadataModal(false);
                  setMetadataRawText('');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isImportingMetadata || parsedMetadataItems.length === 0}
                onClick={handleExecuteMetadataImport}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                {isImportingMetadata ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mengimpor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Impor {parsedMetadataItems.length > 0 ? `${parsedMetadataItems.length} Media` : 'Media'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
