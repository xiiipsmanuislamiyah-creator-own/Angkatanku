import {api} from '../lib/api';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, X, Play, Pause, ChevronLeft, ChevronRight, Sparkles, ExternalLink, Plus, Trash2, User, Loader2, AlertTriangle, Flame, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { INITIAL_TEACHERS } from '../data/teachersData';
import { OFFICIAL_STUDENTS } from '../data/officialStudents';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc, arrayUnion } from '../lib/data';
import { deleteFromCloudinary, uploadToCloudinary } from '../lib/cloudinary';


// Helper for retroactive compression on old Cloudinary URLs
const optimizeMediaUrl = (url?: string, type?: 'video' | 'image' | string) => {
  if (!url) return undefined;
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    // If it doesn't already have our compression tags, inject them
    if (!url.includes('q_auto')) {
      const transform = type === 'video' ? 'q_auto,f_auto,w_720,vc_auto' : 'q_auto,f_auto,w_1080';
      return url.replace('/upload/', `/upload/${transform}/`);
    }
  }
  return url;
};

// Helper to extract crisp video thumbnail frame at 1.0 second offset
const getVideoThumbnail = (url?: string) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    if (url.includes('/video/upload/')) {
      return url
        .replace('/video/upload/', '/video/upload/so_1,w_400,c_limit,f_jpg,q_auto/')
        .replace(/\.[^/.]+$/, '.jpg');
    }
    if (url.includes('/upload/')) {
      return url
        .replace('/upload/', '/upload/so_1,w_400,c_limit,f_jpg,q_auto/')
        .replace(/\.[^/.]+$/, '.jpg');
    }
  }
  return url;
};
function formatTimeAgo(timestamp: number | string | undefined): string {
  if (!timestamp) return 'Baru saja';
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  if (isNaN(time)) return 'Baru saja';
  
  const now = Date.now();
  const diffInSeconds = Math.floor((now - time) / 1000);
  
  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  
  return new Date(time).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// Calculate total cumulative flame views counting every unique day each visitor views
export function getStoryViewerCount(story:StoryItem|null){return story?.viewCount||0;}

export interface StoryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  caption: string;
  timestamp: string;
  authorId?: string;
  identityKey?: string;
  viewedBy?: string[];
  viewCount?: number;
}

export interface StoryCategory {
  id: string;
  name: string;
  subtitle: string;
  avatarType: 'dev' | 'class' | 'school';
  avatarSrc?: string;
  hasUnread: boolean;
  stories: StoryItem[];
}

export default function StoryRings({ onNavigate }: { onNavigate?: (tab: string, name?: string, data?: any) => void }) {
  const { user, currentStudent, isAdmin, role, hasCreatedCard, openCreateCard } = useAuth();
  
  const [categories, setCategories] = useState<StoryCategory[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<string>('personal');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [storyCaption, setStoryCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [storyToDelete, setStoryToDelete] = useState<any | null>(null);
  const [isDeletingStory, setIsDeletingStory] = useState<boolean>(false);

  const officialCategoriesConfig: Record<string, { name: string; subtitle: string; avatarType: 'dev' | 'class' | 'school'; avatarSrc?: string }> = {
    'dev-system': {
      name: 'Dev System',
      subtitle: 'System Update',
      avatarType: 'dev',
      avatarSrc: ''
    },
    'ma-nu': {
      name: 'MA NU Islamiyah',
      subtitle: 'Sekolah',
      avatarType: 'school',
      avatarSrc: '/gambar/logoma.png'
    },
    'angkatan-ku-ips1': {
      name: 'AngkatanKU IPS 1',
      subtitle: 'XII IPS 1',
      avatarType: 'class',
      avatarSrc: '/logo-ips1.png'
    },
    'angkatan-ku-ips2': {
      name: 'AngkatanKU IPS 2',
      subtitle: 'XII IPS 2',
      avatarType: 'class',
      avatarSrc: '/logo-ips2.jpg'
    }
  };

  const resolveAuthorProfile = (
    authorId: string, 
    authorName?: string, 
    uploaderEmail?: string, 
    existingAvatar?: string,
    usersList: any[] = []
  ) => {
    const cleanId = (authorId || '').toLowerCase().trim();
    const cleanName = (authorName || '').toLowerCase().trim();
    const cleanEmail = (uploaderEmail || '').toLowerCase().trim();
    const emailPrefix = cleanEmail.split('@')[0].replace(/^@/, '');

    const hasCustomExisting = existingAvatar && !existingAvatar.includes('og.jpeg') && !existingAvatar.includes('og-banner');

    // 1. If this is the current logged-in user
    if (user && (authorId === user.uid || (cleanEmail && cleanEmail === user.email?.toLowerCase()))) {
      const myPhoto = currentStudent?.avatarUrl || currentStudent?.url_gambar || user.photoURL;
      if (myPhoto) {
        return {
          avatarSrc: myPhoto,
          name: currentStudent?.name || currentStudent?.nama || user.displayName || authorName || 'Profil Saya',
          subtitle: currentStudent?.role || (isAdmin ? 'Admin / Developer' : (currentStudent?.classRoom ? `Kelas XII ${currentStudent.classRoom}` : 'Story Siswa'))
        };
      }
    }

    // 2. Check if author is Abdul Holik (Kepala Madrasah)
    const isAbdulHolik = 
      cleanId.includes('abdul_holik') || 
      cleanId === 'guru-1' || 
      cleanId === '190001' || 
      cleanName.includes('abdul_holik') || 
      cleanName.includes('abdul holik') || 
      cleanEmail.includes('abdul_holik') || 
      emailPrefix === 'abdul_holik';

    if (isAbdulHolik) {
      const teacherDoc = usersList.find(u => 
        u.id === 'guru-1' || 
        (u.username && u.username.toLowerCase().includes('abdul_holik')) || 
        (u.name && u.name.toLowerCase().includes('abdul holik')) || 
        (u.email && u.email.toLowerCase().includes('abdul_holik'))
      );
      const photo = teacherDoc?.avatarUrl || teacherDoc?.url_gambar || 
        INITIAL_TEACHERS.find(t => t.id === 'guru-1')?.url_gambar || 
        'https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500225/Card%20guru/lktnh3wgbd9ioin4tdli.jpg';
      return {
        avatarSrc: photo,
        name: teacherDoc?.nama || teacherDoc?.name || 'Abdul Holik, S.Ag.',
        subtitle: 'Kepala Madrasah'
      };
    }

    // 3. Search in usersList (students collection)
    const matchedStudent = usersList.find(u => {
      if (!u) return false;
      const uId = (u.id || '').toLowerCase();
      const uUid = (u.uid || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uUsername = (u.username || '').toLowerCase().replace(/^@/, '');
      const uName = (u.name || u.nama || '').toLowerCase();
      const uInduk = (u.induk || '').toLowerCase();

      return (
        (cleanId && (uId === cleanId || uUid === cleanId || uUsername === cleanId || uInduk === cleanId)) ||
        (cleanEmail && uEmail === cleanEmail) ||
        (emailPrefix && uUsername === emailPrefix) ||
        (cleanName && (uName === cleanName || uUsername === cleanName.replace(/^@/, '') || uName.includes(cleanName) || cleanName.includes(uName)))
      );
    });

    if (matchedStudent) {
      const official = OFFICIAL_STUDENTS.find(s => 
        (matchedStudent.induk && s.induk === matchedStudent.induk) ||
        (matchedStudent.username && s.username.toLowerCase() === matchedStudent.username.toLowerCase()) ||
        (matchedStudent.name && s.name.toLowerCase() === matchedStudent.name.toLowerCase())
      );
      const rawName = official?.name || (matchedStudent.name === 'Aqry Adia Meica' ? 'Agys Adia Meica' : matchedStudent.name) || matchedStudent.nama || matchedStudent.username || authorName;
      const finalName = rawName === 'Aqry Adia Meica' ? 'Agys Adia Meica' : rawName;
      const photo = matchedStudent.avatarUrl || matchedStudent.url_gambar || (hasCustomExisting ? existingAvatar : '');
      return {
        avatarSrc: photo || '',
        name: finalName && finalName !== 'Siswa' ? finalName : (official?.name || 'Siswa Angkatan'),
        subtitle: matchedStudent.role || official?.role || (matchedStudent.classRoom || official?.classRoom ? `Kelas XII ${matchedStudent.classRoom || official?.classRoom}` : 'Story Siswa')
      };
    }

    // 4. Search in OFFICIAL_STUDENTS
    const matchedOfficial = OFFICIAL_STUDENTS.find(s => {
      const sInduk = (s.induk || '').toLowerCase();
      const sUsername = (s.username || '').toLowerCase().replace(/^@/, '');
      const sName = (s.name || '').toLowerCase();
      return (
        (cleanId && (sInduk === cleanId || sUsername === cleanId)) ||
        (cleanEmail && emailPrefix === sUsername) ||
        (cleanName && (sName === cleanName || sUsername === cleanName || sName.includes(cleanName) || cleanName.includes(sName))) ||
        (cleanName.includes('aqry') && sName.includes('agys'))
      );
    });

    if (matchedOfficial) {
      return {
        avatarSrc: hasCustomExisting ? existingAvatar : '',
        name: matchedOfficial.name,
        subtitle: matchedOfficial.role || (matchedOfficial.classRoom ? `Kelas XII ${matchedOfficial.classRoom}` : 'Story Siswa')
      };
    }

    // 5. Search in INITIAL_TEACHERS
    const matchedTeacher = INITIAL_TEACHERS.find(t => {
      const tId = t.id.toLowerCase();
      const tUsername = (t.username || '').toLowerCase().replace(/^@/, '');
      const tName = t.nama.toLowerCase();
      const tNip = (t.nip || '').toLowerCase();
      return (
        (cleanId && (tId === cleanId || tUsername === cleanId || tNip === cleanId)) ||
        (emailPrefix && (tUsername === emailPrefix || tId === emailPrefix)) ||
        (cleanName && (tName.includes(cleanName) || tUsername === cleanName || cleanName.includes(tUsername)))
      );
    });

    if (matchedTeacher) {
      return {
        avatarSrc: matchedTeacher.avatarUrl || matchedTeacher.url_gambar || (hasCustomExisting ? existingAvatar : ''),
        name: matchedTeacher.nama,
        subtitle: matchedTeacher.title || matchedTeacher.jabatan || 'Dewan Guru'
      };
    }

    const fallbackName = authorName === 'Aqry Adia Meica' ? 'Agys Adia Meica' : authorName;
    return {
      avatarSrc: hasCustomExisting ? existingAvatar : '',
      name: fallbackName && fallbackName !== 'Siswa' ? fallbackName : 'Anggota Angkatan',
      subtitle: 'Story'
    };
  };

  const fetchStories = async () => {
    try {
      const [snap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'stories'), orderBy('timestamp', 'asc'))),
        getDocs(collection(db, 'students'))
      ]);
      const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const fetchedDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const rawUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Clean & enhance users list using OFFICIAL_STUDENTS to prevent missing/empty names or 'Siswa' fallback
      const userMap = new Map<string, any>();

      // Seed with official students so everyone has a verified profile name
      OFFICIAL_STUDENTS.forEach(os => {
        userMap.set(os.induk, {
          id: os.induk,
          induk: os.induk,
          name: os.name,
          username: os.username,
          classRoom: os.classRoom,
          role: os.role,
          avatarUrl: ''
        });
      });

      // Merge Firestore documents
      rawUsers.forEach((u: any) => {
        // Skip junk/test accounts without identifiers
        if (!u.induk && !u.name && !u.username) return;
        if (u.name === 'Test') return;

        let uName = u.name || u.nama;
        if (uName === 'Aqry Adia Meica') uName = 'Agys Adia Meica';

        const official = OFFICIAL_STUDENTS.find(s => 
          (u.induk && s.induk === u.induk) || 
          (u.username && s.username?.toLowerCase() === u.username?.toLowerCase()) ||
          (uName && s.name.toLowerCase() === uName.toLowerCase())
        );

        const finalName = official?.name || uName;
        if (!finalName || finalName === 'Siswa') return;

        const key = u.induk || u.id;
        userMap.set(key, {
          ...(userMap.get(key) || {}),
          ...u,
          name: finalName,
          induk: u.induk || official?.induk,
          classRoom: u.classRoom || official?.classRoom,
          role: u.role || official?.role,
          avatarUrl: u.avatarUrl || u.url_gambar || userMap.get(key)?.avatarUrl || ''
        });
      });

      const usersList = Array.from(userMap.values());
      setAllUsers(usersList);

      // Initialize official categories with no stories by default
      const officialMap: Record<string, StoryCategory> = {
        'dev-system': {
          id: 'dev-system',
          name: 'Dev System',
          subtitle: 'System Update',
          avatarType: 'dev',
          hasUnread: false,
          stories: []
        },
        'ma-nu': {
          id: 'ma-nu',
          name: 'MA NU Islamiyah',
          subtitle: 'Sekolah',
          avatarType: 'school',
          avatarSrc: '/gambar/logoma.png',
          hasUnread: false,
          stories: []
        },
        'angkatan-ku-ips1': {
          id: 'angkatan-ku-ips1',
          name: 'AngkatanKU IPS 1',
          subtitle: 'XII IPS 1',
          avatarType: 'class',
          avatarSrc: '/logo-ips1.png',
          hasUnread: false,
          stories: []
        },
        'angkatan-ku-ips2': {
          id: 'angkatan-ku-ips2',
          name: 'AngkatanKU IPS 2',
          subtitle: 'XII IPS 2',
          avatarType: 'class',
          avatarSrc: '/logo-ips2.jpg',
          hasUnread: false,
          stories: []
        }
      };

      const userGrouped: Record<string, StoryCategory> = {};

      fetchedDocs.forEach((s: any) => {
        // Skip default dummy stories
        if (s.id.includes('-default')) return;

        const item: StoryItem = {
          id: s.id,
          type: s.type || 'image',
          url: s.url,
          title: s.title || 'Story',
          caption: s.caption || '',
          timestamp: s.timestamp || Date.now(),
          authorId: s.authorId,
          identityKey: s.identityKey,
          viewCount: Number(s.viewCount)||0
        };

        const categoryKey = (s.identityKey && s.identityKey !== 'personal') 
          ? s.identityKey 
          : (officialMap[s.authorId] ? s.authorId : null);

        if (categoryKey && officialMap[categoryKey]) {
          officialMap[categoryKey].stories.push(item);
          officialMap[categoryKey].hasUnread = true;
        } else {
          const authorKey = s.authorId || 'unknown';
          if (!userGrouped[authorKey]) {
            const resolved = resolveAuthorProfile(s.authorId, s.authorName, s.uploaderEmail, s.avatarSrc, usersList);
            userGrouped[authorKey] = {
              id: authorKey,
              name: resolved.name || s.authorName || 'Siswa',
              subtitle: resolved.subtitle || s.subtitle || 'Story Siswa',
              avatarType: s.authorId === 'dev-system' || s.identityKey === 'dev-system' ? 'dev' : 'class',
              avatarSrc: resolved.avatarSrc || s.avatarSrc || '',
              hasUnread: true,
              stories: []
            };
          }
          userGrouped[authorKey].stories.push(item);
        }
      });

      // Get or create current user's personal category (Status saya) ONLY if logged in
      let myCategory: StoryCategory | null = null;
      if (user) {
        if (userGrouped[user.uid]) {
          myCategory = userGrouped[user.uid];
          delete userGrouped[user.uid];
        } else {
          const myPhoto = currentStudent?.avatarUrl || currentStudent?.url_gambar || user.photoURL || '';
          const myName = currentStudent?.name || currentStudent?.nama || user.displayName || user.email?.split('@')[0] || 'Profil Saya';
          myCategory = {
            id: user.uid,
            name: myName,
            subtitle: 'Status saya',
            avatarType: 'class',
            avatarSrc: myPhoto,
            hasUnread: false,
            stories: []
          };
        }
      }

      // Assemble other categories
      let otherList: StoryCategory[] = [
        officialMap['ma-nu'],
        officialMap['angkatan-ku-ips1'],
        officialMap['angkatan-ku-ips2'],
        ...Object.values(userGrouped)
      ];

      // Sort other categories by latest story timestamp (jam) descending
      otherList.sort((a, b) => {
        const aHasStories = a.stories.length > 0;
        const bHasStories = b.stories.length > 0;
        
        if (aHasStories && !bHasStories) return -1;
        if (!aHasStories && bHasStories) return 1;
        
        if (aHasStories && bHasStories) {
          const aLatest = Math.max(...a.stories.map(s => typeof s.timestamp === 'number' ? s.timestamp : 0));
          const bLatest = Math.max(...b.stories.map(s => typeof s.timestamp === 'number' ? s.timestamp : 0));
          return bLatest - aLatest;
        }
        return 0;
      });

      // If Dev System has stories, place it at the front of other list
      if (officialMap['dev-system'].stories.length > 0) {
        otherList = [officialMap['dev-system'], ...otherList];
      }

      // Current user's card ALWAYS appears first at index 0 so user doesn't have to scroll to search
      const finalList = myCategory ? [myCategory, ...otherList] : otherList;

      setCategories(finalList);
    } catch (err: any) {
      console.warn("Notice: Stories could not be fetched from Firestore (using fallback defaults):", err?.message || err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [user, isAdmin, currentStudent]);

  const allCategories = categories;

  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [customMediaFile, setCustomMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showAddMediaModal, setShowAddMediaModal] = useState<boolean>(false);

  useEffect(() => {
    if (!customMediaFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(customMediaFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [customMediaFile]);

  const currentCategory = activeCategoryIndex !== null && activeCategoryIndex >= 0 && activeCategoryIndex < allCategories.length
    ? allCategories[activeCategoryIndex]
    : null;

  const currentStory = currentCategory && currentCategory.stories && activeStoryIndex >= 0 && activeStoryIndex < currentCategory.stories.length
    ? currentCategory.stories[activeStoryIndex]
    : null;

  useEffect(()=>{if(!currentStory||!user||currentStory.id.includes('-default'))return;let live=true;api('/interactions',{collection:'stories',id:currentStory.id,action:'view'}).then(r=>{if(live){currentStory.viewCount=r.viewCount;setCategories(prev=>[...prev]);}}).catch(()=>{});return()=>{live=false;};},[currentStory?.id,user?.uid]);

  const handleDeleteStoryClick = (story: any) => {
    setIsPaused(true);
    setStoryToDelete(story);
  };

  const confirmDeleteStory = async () => {
    if (!storyToDelete) return;
    setIsDeletingStory(true);
    try {
      const idToDelete = storyToDelete.id;
      const mediaUrl = storyToDelete.url;

      // Delete from Firestore directly
      await deleteDoc(doc(db, 'stories', idToDelete));

      // Asynchronously attempt to clean up from Cloudinary if possible
      if (mediaUrl) {
        deleteFromCloudinary(mediaUrl).catch(e => console.warn('Cloudinary delete warning:', e));
      }

      setStoryToDelete(null);
      setIsDeletingStory(false);
      await fetchStories();
      handleCloseViewer();
    } catch (err: any) {
      console.warn('Failed to delete story:', err?.message || err);
      setIsDeletingStory(false);
      alert('Gagal menghapus story: ' + (err.message || 'Periksa izin Anda'));
    }
  };

  const handleCloseViewer = () => {
    setActiveCategoryIndex(null);
    setActiveStoryIndex(0);
    setProgress(0);
    setIsPaused(false);
  };

  const handleNextStory = () => {
    if (activeCategoryIndex === null) return;
    const cat = allCategories[activeCategoryIndex];
    if (!cat || !cat.stories || cat.stories.length === 0) {
      handleCloseViewer();
      return;
    }

    if (activeStoryIndex < cat.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (activeCategoryIndex < allCategories.length - 1) {
      // Find next category with stories
      let nextIdx = activeCategoryIndex + 1;
      while (nextIdx < allCategories.length && allCategories[nextIdx].stories.length === 0) {
         nextIdx++;
      }
      if (nextIdx < allCategories.length) {
         setActiveCategoryIndex(nextIdx);
         setActiveStoryIndex(0);
         setProgress(0);
      } else {
         handleCloseViewer();
      }
    } else {
      handleCloseViewer();
    }
  };

  const handlePrevStory = () => {
    if (activeCategoryIndex === null) return;
    const cat = allCategories[activeCategoryIndex];
    if (!cat) {
      handleCloseViewer();
      return;
    }

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (activeCategoryIndex > 0) {
      let prevIdx = activeCategoryIndex - 1;
      while (prevIdx >= 0 && allCategories[prevIdx].stories.length === 0) {
         prevIdx--;
      }
      if (prevIdx >= 0) {
         setActiveCategoryIndex(prevIdx);
         setActiveStoryIndex(allCategories[prevIdx].stories.length - 1);
         setProgress(0);
      } else {
         handleCloseViewer();
      }
    } else {
      handleCloseViewer();
    }
  };

  useEffect(() => {
    if (activeCategoryIndex === null || isPaused || !currentCategory || currentCategory.stories.length === 0) return;
    
    // For video stories, progress is handled by onTimeUpdate in the video element
    if (currentStory?.type === 'video') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + 2; 
      });
    }, 50);

    return () => clearInterval(interval);
  }, [activeCategoryIndex, activeStoryIndex, isPaused, currentCategory, currentStory]);

  const handleOpenCategory = (index: number) => {
    const cat = allCategories[index];
    if (cat.stories.length === 0) {
      if (!user) {
        return;
      }
      if (role === 'student' && !hasCreatedCard) {
        openCreateCard('Wajib membuat Kartu Siswa terlebih dahulu sebelum mengunggah story angkatan!');
        return;
      }
      setActiveCategoryIndex(index);
      setShowAddMediaModal(true);
      return;
    }
    setActiveCategoryIndex(index);
    setActiveStoryIndex(0);
    setProgress(0);
    setIsPaused(false);
  };

  const handleAddCloudinaryMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMediaFile) {
      alert("Pilih file media terlebih dahulu.");
      return;
    }
    
    // Validate file size
    const isVidCheck = customMediaFile.type.startsWith('video/');
    const maxVideoSize = 25 * 1024 * 1024; // 25 MB max
    const maxImageSize = 10 * 1024 * 1024; // 10 MB max

    if (isVidCheck && customMediaFile.size > maxVideoSize) {
      alert("Ukuran video terlalu besar. Maksimal 25MB untuk memastikan kelancaran pemutaran.");
      return;
    }
    if (!isVidCheck && customMediaFile.size > maxImageSize) {
      alert("Ukuran gambar terlalu besar. Maksimal 10MB.");
      return;
    }
    
    if (!user) {
      alert("Harap login untuk menambahkan story.");
      return;
    }

    const targetCat = currentCategory;
    const isTargetAdminCat = targetCat && ['dev-system', 'ma-nu', 'angkatan-ku-ips1', 'angkatan-ku-ips2'].includes(targetCat.id);

    // If not admin and trying to add to another's story, reject
    if (!isAdmin && targetCat && targetCat.id !== user.uid) {
      alert("Anda hanya dapat menambahkan story ke kategori profil Anda sendiri.");
      return;
    }

    setIsUploading(true);
    
    try {
      const fileType = customMediaFile.type.startsWith('video/') ? 'video' : 'image';
      const uploadedUrl = await uploadToCloudinary(customMediaFile, fileType);
      const isVid = fileType === 'video';

      const userRealPhoto = currentStudent?.avatarUrl || currentStudent?.url_gambar || user.photoURL || '';
      const userRealName = currentStudent?.name || currentStudent?.nama || user.displayName || user.email?.split('@')[0] || 'Siswa';
      const userRealSubtitle = currentStudent?.role || (isAdmin ? 'Admin' : (currentStudent?.classRoom ? `Kelas XII ${currentStudent.classRoom}` : 'Story Siswa'));

      let targetAuthorName = userRealName;
      let targetSubtitle = userRealSubtitle;
      let targetAvatarSrc = userRealPhoto;
      let targetAvatarType: 'dev' | 'class' | 'school' = 'class';
      const targetIdentityKey = (isAdmin && selectedIdentity !== 'personal') ? selectedIdentity : 'personal';

      if (isAdmin && selectedIdentity !== 'personal') {
        const conf = officialCategoriesConfig[selectedIdentity];
        if (conf) {
          targetAuthorName = conf.name;
          targetSubtitle = conf.subtitle;
          targetAvatarSrc = conf.avatarSrc || '';
          targetAvatarType = conf.avatarType;
        }
      }

      await addDoc(collection(db, 'stories'), {
        type: isVid ? 'video' : 'image',
        url: uploadedUrl,
        title: '',
        caption: '',
        timestamp: Date.now(),
        authorId: user.uid,
        identityKey: targetIdentityKey,
        authorName: targetAuthorName,
        subtitle: targetSubtitle,
        avatarSrc: targetAvatarSrc,
        avatarType: targetAvatarType,
        uploaderEmail: user.email || '',
        viewedBy: []
      });

      setCustomMediaFile(null);
      setStoryTitle('');
      setStoryCaption('');
      setShowAddMediaModal(false);
      
      await fetchStories();
    } catch (err: any) {
      console.warn('Gagal mengupload story:', err?.message || err);
      alert('Gagal mengupload story');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full -mt-2 pb-1 mb-2">
      <div className="flex items-center justify-start gap-4 overflow-x-auto hide-scrollbar px-4 py-2 pb-4">
        {allCategories.map((cat, idx) => {
          const isMyStatus = Boolean(user && cat.id === user.uid);
          const hasStories = cat.stories.length > 0;
          
          if (hasStories || isMyStatus) {
            // WhatsApp Status Card Style
            const lastStory = hasStories ? cat.stories[cat.stories.length - 1] : null;
            const isVideoStory = lastStory?.type === 'video' || (lastStory?.url && (lastStory.url.includes('.mp4') || lastStory.url.includes('/video/')));
            const bgImage = lastStory ? (isVideoStory ? getVideoThumbnail(lastStory.url) : lastStory.url) : '';
            return (
              <button
                key={cat.id}
                onClick={() => handleOpenCategory(idx)}
                className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-2xl overflow-hidden shrink-0 group focus:outline-none shadow-md border border-slate-200/50 dark:border-slate-800/50 cursor-pointer"
              >
                {bgImage ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }}>
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-3 text-center transition-colors border-2 border-dashed border-emerald-500/50 group-hover:border-emerald-500 rounded-2xl group-hover:bg-emerald-500/5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform shadow-xs">
                      <Plus className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      Tambah Story
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      Foto / Video
                    </span>
                  </div>
                )}

                {/* For video story, display video frame at 1s in case image poster is loading or blank */}
                {isVideoStory && lastStory?.url && (
                  <video
                    src={`${lastStory.url}#t=1`}
                    preload="metadata"
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                )}
                
                {/* Avatar Top Left */}
                <div className={`absolute top-2 left-2 p-[2px] rounded-full ${cat.hasUnread && hasStories ? 'bg-emerald-500' : 'bg-transparent border-2 border-white/50'}`}>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900 border border-white/20 relative">
                    {cat.avatarSrc && cat.avatarSrc.trim() !== '' ? (
                      <img 
                        src={cat.avatarSrc} 
                        alt={cat.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} 
                      />
                    ) : cat.id === 'dev-system' || cat.avatarType === 'dev' ? (
                      <Code2 className="w-full h-full p-2 text-emerald-400 bg-slate-900" />
                    ) : (
                      <User className="w-full h-full p-2 text-slate-500 bg-slate-800" />
                    )}
                    {isMyStatus && (
                      <div className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-800 shadow-xs">
                        <Plus className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name Bottom Left */}
                <div className="absolute bottom-2 left-2 right-2 text-left">
                  <span className="block text-xs font-semibold text-white drop-shadow-md truncate">
                    {isMyStatus ? (user ? 'Status saya' : 'Tambah Story') : cat.name}
                  </span>
                </div>
              </button>
            );
          }
          return null;
        })}

        {/* Users without stories: prioritized with uploaded profile (like Kholifah) first */}
        {allUsers
          .filter(u => {
            const hasValidName = u.name && u.name.trim() !== '' && u.name !== 'Test' && u.name !== 'Siswa' && u.name !== 'undefined';
            return hasValidName && !allCategories.some(c => c.id === u.id || (u.induk && c.id === u.induk));
          })
          .sort((a, b) => {
            const aHasPhoto = Boolean(a.avatarUrl && typeof a.avatarUrl === 'string' && a.avatarUrl.trim().length > 5 && !a.avatarUrl.includes('og.jpeg') && !a.avatarUrl.includes('favicon'));
            const bHasPhoto = Boolean(b.avatarUrl && typeof b.avatarUrl === 'string' && b.avatarUrl.trim().length > 5 && !b.avatarUrl.includes('og.jpeg') && !b.avatarUrl.includes('favicon'));
            if (aHasPhoto && !bHasPhoto) return -1;
            if (!aHasPhoto && bHasPhoto) return 1;
            return (a.name || '').localeCompare(b.name || '');
          })
          .map(u => {
            const displayName = u.nickname || u.name || u.nama || u.username;
            const firstName = (displayName || '').replace(/^@/, '').split(' ')[0];
            return (
              <button
                key={u.id || u.induk}
                onClick={() => onNavigate && onNavigate('public-profile', 'Profil Siswa', u.id || u.induk)}
                className="flex flex-col items-center gap-1 shrink-0 w-16 group cursor-pointer focus:outline-none"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                  {u.avatarUrl && u.avatarUrl.trim() !== '' ? (
                    <img 
                      src={u.avatarUrl} 
                      alt={u.name || 'Pengguna'} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      onError={(e) => { (e.target as HTMLElement).style.display='none' }}
                    />
                  ) : (
                    <User className="w-full h-full p-3 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full text-center">
                  {firstName}
                </span>
              </button>
            );
          })}
</div>

      <AnimatePresence>
        {currentCategory && currentCategory.stories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none"
          >
            <div className="absolute inset-0" onClick={handleCloseViewer} />
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={(_e, info) => {
                if (info.offset.y > 90 || info.velocity.y > 350) {
                  handleCloseViewer();
                }
              }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md h-full sm:h-[85vh] sm:max-h-[750px] bg-slate-950 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between z-10 border border-slate-800 touch-pan-y"
            >
              {/* Swipe down drag indicator */}
              <div className="w-12 h-1 bg-white/40 rounded-full mx-auto mt-2 mb-0.5 shrink-0 z-40 cursor-grab active:cursor-grabbing" />
              <div className="absolute top-0 left-0 right-0 p-4 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex gap-1 mb-3">
                  {(currentCategory.stories || []).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <div
                        className="h-full bg-white transition-all duration-75"
                        style={{
                          width:
                            idx < activeStoryIndex
                              ? '100%'
                              : idx === activeStoryIndex
                              ? `${progress}%`
                              : '0%'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-900 flex items-center justify-center">
                      {currentCategory.avatarSrc && currentCategory.avatarSrc.trim() !== '' ? (
                        <img
                          src={currentCategory.avatarSrc}
                          alt={currentCategory.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : currentCategory.id === 'dev-system' || currentCategory.avatarType === 'dev' ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-emerald-400">
                          <Code2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-bold flex items-center gap-1.5">
                        {currentCategory.name}
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-normal">
                          {currentCategory.subtitle}
                        </span>
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-slate-300 font-mono">
                          {formatTimeAgo(currentStory?.timestamp)}
                        </p>
                        {currentStory && (
                          <span className="text-[10px] bg-black/50 text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10 font-mono">
                            <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{getStoryViewerCount(currentStory)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isAdmin || role === 'owner' || role === 'admin' || (user && (currentStory?.authorId === user.uid || currentStory?.uploaderEmail === user.email || (user.email && currentStory?.authorId === user.email.split('@')[0])))) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentStory) handleDeleteStoryClick(currentStory);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 bg-red-900/40 hover:bg-red-900/60 rounded-full backdrop-blur-xs cursor-pointer transition-colors"
                        title="Hapus Story"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {user && currentCategory.id === user.uid && (
                      <button
                        onClick={() => { 
                          if (role === 'student' && !hasCreatedCard) {
                            openCreateCard('Wajib membuat Kartu Siswa terlebih dahulu sebelum mengunggah story angkatan!');
                            return;
                          }
                          setIsPaused(true); 
                          setShowAddMediaModal(true); 
                        }}
                        className="p-2 text-emerald-400 hover:text-emerald-300 bg-emerald-900/40 rounded-full backdrop-blur-xs cursor-pointer"
                        title="Tambah Story"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="p-2 text-white/80 hover:text-white bg-black/40 rounded-full backdrop-blur-xs cursor-pointer"
                      title={isPaused ? "Mainkan" : "Jeda"}
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleCloseViewer}
                      className="p-2 text-white/80 hover:text-white bg-black/40 rounded-full backdrop-blur-xs cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                <button
                  onClick={handlePrevStory}
                  className="absolute left-0 top-0 bottom-0 w-1/3 z-20 focus:outline-none flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="p-2 rounded-full bg-black/40 text-white backdrop-blur-xs">
                    <ChevronLeft className="w-6 h-6" />
                  </div>
                </button>
                <button
                  onClick={handleNextStory}
                  className="absolute right-0 top-0 bottom-0 w-1/3 z-20 focus:outline-none flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="p-2 rounded-full bg-black/40 text-white backdrop-blur-xs">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </button>
                {currentStory?.type === 'video' ? (
                  <>
                    <video
                      src={optimizeMediaUrl(currentStory?.url, currentStory?.type)}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      ref={(el) => {
                        if (el) {
                          if (isPaused) el.pause();
                          else el.play().catch(() => {});
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const target = e.target as HTMLVideoElement;
                        const current = target.currentTime;
                        const duration = target.duration || 1;
                        const actualDuration = Math.min(duration, 60);
                        const pct = (current / actualDuration) * 100;
                        setProgress(pct);
                        
                        if (current >= 60) {
                           handleNextStory();
                        }
                      }}
                      onEnded={() => handleNextStory()}
                    />
                    {/* Preload Next Story */}
                    {currentCategory.stories[activeStoryIndex + 1] && currentCategory.stories[activeStoryIndex + 1].type === 'video' && currentCategory.stories[activeStoryIndex + 1].url && (
                      <video 
                        src={optimizeMediaUrl(currentCategory.stories[activeStoryIndex + 1].url, 'video') || undefined} 
                        preload="auto" 
                        className="hidden" 
                        muted 
                      />
                    )}
                  </>
                ) : (
                  currentStory?.url ? (
                    <img
                      src={optimizeMediaUrl(currentStory?.url, currentStory?.type) || undefined}
                      alt=""
                      className="w-full h-full object-contain max-h-[80vh]"
                    />
                  ) : null
                )}
              </div>
              {/* Discreet caption overlay only if legacy story had caption */}
              {currentStory?.caption && currentStory.caption !== 'Story baru diunggah' && currentStory.caption.trim().length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 text-white text-xs text-center border border-white/10 max-w-md mx-auto">
                    {currentStory.caption}
                  </div>
                </div>
              )}

              {/* In-App Story Delete Confirmation Modal */}
              {storyToDelete && (
                <div 
                  className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-xs w-full text-center space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">Hapus Story?</h3>
                      <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                        Story ini akan dihapus permanen dari mading angkatan dan server media.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        disabled={isDeletingStory}
                        onClick={() => {
                          setStoryToDelete(null);
                          setIsPaused(false);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingStory}
                        onClick={confirmDeleteStory}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
                      >
                        {isDeletingStory ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menghapus...</span>
                          </>
                        ) : (
                          'Hapus'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddMediaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Unggah Story Baru
                </h3>
                <button
                  onClick={() => { setShowAddMediaModal(false); setCustomMediaFile(null); }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCloudinaryMedia} className="space-y-4">
                {isAdmin && (
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Identitas Pengunggah
                    </label>
                    <select
                      value={selectedIdentity}
                      onChange={(e) => setSelectedIdentity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="personal">👤 Profil Saya ({currentStudent?.name || user?.displayName || user?.email?.split('@')[0] || 'User'})</option>
                      <option value="dev-system">⚙️ Dev System</option>
                      <option value="ma-nu">🏫 MA NU Islamiyah</option>
                      <option value="angkatan-ku-ips1">🟢 AngkatanKU XII IPS 1</option>
                      <option value="angkatan-ku-ips2">🔵 AngkatanKU XII IPS 2</option>
                    </select>
                  </div>
                )}

                {/* Media Picker Zone with Live Preview Before Upload */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                    {customMediaFile ? 'Pratinjau Media Sebelum Upload' : 'Pilih Foto atau Video Story'}
                  </label>
                  
                  {customMediaFile && previewUrl ? (
                    <div className="space-y-3 p-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl">
                      <div className="relative rounded-xl overflow-hidden bg-black/90 border border-slate-800 flex items-center justify-center max-h-56 aspect-[9/16] mx-auto w-full max-w-[210px] shadow-inner">
                        {customMediaFile.type.startsWith('video/') ? (
                          <video 
                            src={previewUrl} 
                            controls 
                            autoPlay 
                            muted 
                            playsInline 
                            className="w-full h-full object-contain" 
                          />
                        ) : (
                          <img 
                            src={previewUrl} 
                            alt="Pratinjau Story" 
                            className="w-full h-full object-contain" 
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {customMediaFile.type.startsWith('video/') ? (
                            <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-200 truncate max-w-[170px]">
                            {customMediaFile.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                          {(customMediaFile.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setCustomMediaFile(null); }}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Ganti File Media
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-colors group">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        required
                        onChange={(e) => setCustomMediaFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="text-center space-y-1">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mx-auto transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-medium text-slate-200">
                          Pilih dari Galeri Perangkat
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Maksimal Foto 10MB, Video 25MB
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddMediaModal(false); setCustomMediaFile(null); setIsPaused(false); }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !customMediaFile}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-bold transition-all shadow-md disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      'Unggah Story'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) for Upload Story in bottom right corner (Hanya untuk pengguna login) */}
      {user && (
        <button
          onClick={() => {
            if (role === 'student' && !hasCreatedCard) {
              openCreateCard('Wajib membuat Kartu Siswa terlebih dahulu sebelum mengunggah story angkatan!');
              return;
            }
            setIsPaused(true);
            setShowAddMediaModal(true);
          }}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:shadow-emerald-500/40 flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/30 cursor-pointer select-none"
          title="Upload Story Baru"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          <span className="hidden sm:inline font-bold text-xs pr-1">Tambah Story</span>
        </button>
      )}
    </div>
  );
}
