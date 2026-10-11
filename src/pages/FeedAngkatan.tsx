import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Download, 
  Pin, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Send, 
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  User,
  Check,
  MoreVertical,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {databaseService, PostItem, MediaItem} from '../lib/supabaseClient';
import MediaCarousel from '../components/MediaCarousel';
import FullscreenPreview from '../components/FullscreenPreview';
import PublishPanel from '../components/PublishPanel';
import { useAuth } from '../contexts/AuthContext';
import { isUserIdBlocked, sanitizeInput } from '../lib/security';

export default function FeedAngkatan() {
  const { user, realRole, currentStudent, visitorId, isAdmin } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Comments state input map per postId
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentNames, setCommentNames] = useState<{ [postId: string]: string }>({});

  // Active Bottom Sheet Post ID for Comments
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);

  // Expandable caption states
  const [expandedCaptions, setExpandedCaptions] = useState<{ [postId: string]: boolean }>({});

  const [isDevMode, setIsDevMode] = useState(false);
  // Active dropdown menu for individual post controls
  const [activeDropdownPostId, setActiveDropdownPostId] = useState<string | null>(null);

  // Inline editing states for developer caption updates
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState('');

  // Fullscreen Preview states
  const [previewMedia, setPreviewMedia] = useState<{ type: 'image' | 'video'; url: string } | null>(null);

  // In-app Deletion states
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{ postId: string; commentId: string } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Alert/Toast states
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch posts from database
  const loadPosts = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // DevMode can see hidden/unpublished posts
      const fetched = await databaseService.fetchPosts(isDevMode);
      setPosts(fetched);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Feed belum dapat dimuat.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger load on mount and when DevMode toggles
  useEffect(() => {
    loadPosts();
  }, [isDevMode, user?.uid, isAdmin]);

  // Session auto-expiry for Developer Mode (10 minutes)
  useEffect(() => {
    if (isDevMode) {
      const timer = setTimeout(() => {
        setIsDevMode(false);
        showToast('error', 'Sesi Developer Mode telah berakhir.');
      }, 600000); // 10 minutes
      return () => clearTimeout(timer);
    }
  }, [isDevMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownPostId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Helper to trigger toast notifications
  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLogoTap=()=>{if(isAdmin)setIsDevMode(v=>!v);};
  // Like action
  const handleLike = async (postId: string) => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, likes_count: (p.likes_count || 0) + 1 };
        }
        return p;
      }));
      
      const count = await databaseService.toggleLike(postId);
      setPosts(prev=>prev.map(p=>p.id===postId?{...p,likes_count:count}:p));
    } catch (err: any) {
      console.warn('Like process handled gracefully:', err);
      const detail = err?.message || JSON.stringify(err);
      showToast('error', `Gagal memproses like: ${detail}`);
      await loadPosts();
    }
  };

  // Add Comment action
  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;
    
    // Determine commenter identity and User ID
    let authorName = '';
    let commenterUserId = '';
    let isGuest = false;

    if (user) {
      commenterUserId = user.uid;
      isGuest = false;
      const nickname = currentStudent?.nickname?.trim();
      const rawUsername = currentStudent?.username?.trim() || (user.email ? `@${user.email.split('@')[0]}` : '');
      const formattedUser = rawUsername ? (rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`) : '';
      if (nickname) {
        authorName = formattedUser ? `${nickname} (${formattedUser})` : nickname;
      } else if (formattedUser) {
        authorName = formattedUser;
      } else {
        authorName = currentStudent?.name || user.displayName || 'Siswa';
      }
    } else {
      // Guest: strictly identified only by their unique User ID
      commenterUserId = visitorId;
      isGuest = true;
      authorName = visitorId;
    }

    // Check if User ID is blocked by Admin
    if (isUserIdBlocked(commenterUserId)) {
      showToast('error', `Akses dibatasi: User ID (${commenterUserId}) telah diblokir oleh Admin.`);
      return;
    }

    try {
      const sanitizedText = sanitizeInput(text, 300);
      const newComment = await databaseService.addComment(postId, authorName, sanitizedText, commenterUserId, isGuest);
      
      // Update UI state instantly
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));

      // Clear comments input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setCommentNames(prev => ({ ...prev, [postId]: '' }));
      showToast('success', 'Komentar berhasil ditambahkan!');
    } catch (err: any) {
      console.warn('Comment process handled gracefully:', err);
      const detail = err?.message || JSON.stringify(err);
      showToast('error', `Gagal menambahkan komentar: ${detail}`);
    }
  };

  // Download media action
  const handleDownload = (mediaUrl: string, index: number) => {
    try {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = `digital-legacy-media-${index + 1}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', 'Membuka media untuk diunduh.');
    } catch (err) {
      showToast('error', 'Gagal memproses unduhan.');
    }
  };

  // Developer Control: Delete Post
  const handleDeletePost = (postId: string) => {
    setActiveDropdownPostId(null);
    setPostToDelete(postId);
  };

  const executeDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingItem(true);
    try {
      await databaseService.deletePost(postToDelete);
      setPosts(prev => prev.filter(p => p.id !== postToDelete));
      showToast('success', 'Postingan berhasil dihapus secara permanen.');
      setPostToDelete(null);
    } catch (err: any) {
      console.warn('Delete post handled gracefully:', err);
      const detail = err?.message || JSON.stringify(err);
      showToast('error', `Gagal menghapus postingan: ${detail}`);
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Developer Control: Delete Comment
  const handleDeleteComment = (postId: string, commentId: string) => {
    setCommentToDelete({ postId, commentId });
  };

  const executeDeleteComment = async () => {
    if (!commentToDelete) return;
    setIsDeletingItem(true);
    const { postId, commentId } = commentToDelete;
    try {
      await databaseService.deleteComment(commentId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: (p.comments || []).filter(c => c.id !== commentId)
          };
        }
        return p;
      }));
      showToast('success', 'Komentar berhasil dihapus.');
      setCommentToDelete(null);
    } catch (err: any) {
      console.warn('Delete comment handled gracefully:', err);
      const detail = err?.message || JSON.stringify(err);
      showToast('error', `Gagal menghapus komentar: ${detail}`);
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Developer Control: Toggle Pin
  const handleTogglePin = async (post: PostItem) => {
    const nextPinned = !post.pinned;
    try {
      await databaseService.updatePost(post.id, { pinned: nextPinned });
      setPosts(prev => {
        const updated = prev.map(p => p.id === post.id ? { ...p, pinned: nextPinned } : p);
        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });
      showToast('success', nextPinned ? 'Postingan berhasil dipin!' : 'Pin dilepas.');
    } catch (err: any) {
      console.warn('Toggle pin handled gracefully:', err);
      const detail = err?.message || JSON.stringify(err);
      showToast('error', `Gagal memproses pin: ${detail}`);
    }
  };

  // Developer Control: Toggle Hide/Unpublish
  const handleToggleHide = async (post: PostItem) => {
    const nextHidden = !post.hidden;
    try {
      await databaseService.updatePost(post.id, { hidden: nextHidden });
      
      if (nextHidden && !isDevMode) {
        setPosts(prev => prev.filter(p => p.id !== post.id));
      } else {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, hidden: nextHidden } : p));
      }
      
      showToast('success', nextHidden ? 'Postingan disembunyikan.' : 'Postingan diterbitkan kembali.');
    } catch (err: any) {
      console.warn('Toggle hide handled gracefully:', err);
      const detail = err?.message || JSON.stringify(err);
      showToast('error', `Gagal mengubah visibilitas: ${detail}`);
    }
  };

  // Developer Control: Edit caption inline
  const handleStartEdit = (post: PostItem) => {
    setEditingPostId(post.id);
    setEditingCaption(post.caption);
    setActiveDropdownPostId(null);
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editingCaption.trim()) {
      showToast('error', 'Caption tidak boleh kosong.');
      return;
    }

    try {
      await databaseService.updatePost(postId, { caption: editingCaption });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, caption: editingCaption } : p));
      setEditingPostId(null);
      showToast('success', 'Caption berhasil diperbarui!');
    } catch (err: any) {
      console.warn('Inline edit caption handled gracefully:', err);
      const detail = err?.message || JSON.stringify(err);
      showToast('error', `Gagal memperbarui caption: ${detail}`);
    }
  };

  // Dynamic user profile mapper to preserve beautiful, authentic labels
  const getPostProfile = (post: PostItem) => {
    const profiles = [
      { username: '@xii_ips_solid', role: 'Akun Kelas', avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=150' },
      { username: '@r_hmt', role: 'Developer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' },
      { username: '@rina_slstr', role: 'Ketua Kelas', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' },
      { username: '@dimas_arya', role: 'Siswa', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150' },
      { username: '@bu_sosiologi', role: 'Guru Pendamping', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150' }
    ];
    
    let hash = 0;
    for (let i = 0; i < post.id.length; i++) {
      hash = post.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % profiles.length;
    return profiles[index];
  };

  // Dynamic commenter profile mapper
  const getCommenterProfile = (authorName: string) => {
    const raw = (authorName || '').trim();
    const normalized = raw.toLowerCase();

    // Check if authorName contains format "Nickname (@username)"
    const parenMatch = raw.match(/^([^(]+)\s*\((@[^)]+)\)$/);
    let nickname = '';
    let username = '';
    if (parenMatch) {
      nickname = parenMatch[1].trim();
      username = parenMatch[2].trim();
    } else if (raw.startsWith('@')) {
      username = raw;
    }

    const isVisitorId = /^USR-|^GUEST-|^ID-/.test(raw.toUpperCase());

    let role = 'Siswa';
    let avatarColor = 'bg-indigo-600';

    if (isVisitorId) {
      role = 'Pengunjung';
      avatarColor = 'bg-slate-500';
    } else if (normalized.includes('rina') || normalized.includes('slstr')) {
      role = 'Ketua Kelas';
      avatarColor = 'bg-amber-500';
    } else if (normalized.includes('hmt') || normalized.includes('rohmat') || normalized.includes('admin') || normalized.includes('developer')) {
      role = 'Developer';
      avatarColor = 'bg-slate-900';
    } else if (normalized.includes('guru') || normalized.includes('pak') || normalized.includes('bu ')) {
      role = 'Guru';
      avatarColor = 'bg-emerald-600';
    } else if (normalized.includes('tamu') || normalized.includes('anon')) {
      role = 'Pengunjung';
      avatarColor = 'bg-slate-400';
    }

    let initials = 'SW';
    if (isVisitorId) {
      initials = 'ID';
    } else if (nickname) {
      initials = nickname.replace(/^[@#_\s]+/, '').substring(0, 2).toUpperCase() || 'SW';
    } else if (username) {
      initials = username.replace(/^[@#_\s]+/, '').substring(0, 2).toUpperCase() || 'SW';
    } else {
      initials = raw.replace(/^[@#_\s]+/, '').substring(0, 2).toUpperCase() || 'SW';
    }

    return { 
      role, 
      avatarColor, 
      initials, 
      nickname, 
      username, 
      isVisitorId, 
      displayName: nickname || (username || raw) 
    };
  };

  // Formatting date string nicely
  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Baru saja';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
      if (diffInSeconds < 172800) return 'Kemarin';
      
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) + ' • ' + d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(isoStr || '');
    }
  };

  const activePost = posts.find(p => p.id === activeCommentsPostId);

  return (
    <div className="min-h-screen bg-slate-50 select-none pb-24">
      <div className="max-w-xl mx-auto px-4 space-y-6 pt-4">
        
        {/* Toast Alert floating */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border animate-bounce ${toast.type === 'success' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-rose-950 border-rose-800 text-rose-100'}`}>
            <div className="text-xs font-semibold font-mono tracking-wide">{toast.text}</div>
          </div>
        )}

        {/* Header section with Interactive Logo to trigger Developer Password Dialog */}
        <div className="flex flex-col items-center text-center space-y-2.5 pb-2 border-b border-slate-200/60">
          <div 
            onClick={handleLogoTap}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-[10px] font-mono font-bold tracking-wider hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-2xs uppercase"
            title="Kontrol moderator"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>DIGITAL LEGACY TIMELINE</span>
          </div>

          <h2 
            onClick={handleLogoTap}
            className="text-2xl font-black text-slate-900 font-display tracking-tight cursor-pointer"
          >
            Feed Angkatan XII IPS
          </h2>
          <p className="text-slate-500 text-[11px] max-w-sm mx-auto leading-relaxed">
            Kaleidoskop & arsip digital autentik kelas XII IPS MA NU Islamiyah Asembagus.
          </p>

          {isDevMode && (
            <div className="flex flex-wrap gap-2 justify-center items-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                <Unlock className="w-3 h-3 text-indigo-400" />
                <span>MODERASI AKTIF</span>
                <button
                  onClick={() => {
                    setIsDevMode(false);
                    showToast('success', 'Developer Mode dinonaktifkan.');
                  }}
                  className="ml-2 text-indigo-400 hover:text-white underline text-[9px] cursor-pointer"
                >
                  KLUAR
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Conditional Publish Panel for Developer Mode */}
        {isDevMode && (
          <div className="border-b border-slate-200 pb-6">
            <PublishPanel onPublishSuccess={loadPosts} />
          </div>
        )}

        {/* Posts Feed Stream */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-100">
              <div className="inline-block w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-mono tracking-wider">MEMULIHKAN_ARSIP_DOKUMENTASI...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-8 border border-rose-100 rounded-3xl bg-white text-center space-y-4">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-800">Gagal Memuat Linimasa</h3>
                <p className="text-xs text-rose-600 leading-relaxed max-w-xs mx-auto">
                  {errorMsg} Periksa koneksi atau setelan database Anda.
                </p>
              </div>
              <button
                onClick={loadPosts}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : posts.length === 0 ? (
            /* Empty State strictly following requirements - no fake / demo cards */
            <div className="py-20 bg-white border border-slate-200/80 rounded-3xl text-center space-y-4 p-6">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 text-slate-300" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-800 font-display">Feed Masih Kosong</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-sans">
                  Belum ada arsip dokumentasi angkatan yang dipublikasikan di linimasa saat ini.
                </p>
              </div>
              {isDevMode ? (
                <p className="text-[10px] text-indigo-500 font-mono">Gunakan modul publisher di atas untuk menambahkan media JSON.</p>
              ) : (
                <p className="text-[10px] text-slate-500 font-mono">Developer/Admin dapat mengaktifkan panel penerbit untuk memposting media baru.</p>
              )}
            </div>
          ) : (
            posts.map((post) => {
              const hasMedia = post.media && post.media.length > 0;
              const profile = getPostProfile(post);
              const isExpanded = expandedCaptions[post.id];

              // Handle elegant truncation for captions
              const isLongCaption = post.caption.length > 120;
              const displayCaption = isExpanded || !isLongCaption 
                ? post.caption 
                : `${post.caption.substring(0, 110)}...`;

              return (
                <div 
                  key={post.id}
                  className={`bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs relative ${post.pinned ? 'ring-2 ring-amber-400/50' : ''} ${post.hidden ? 'opacity-80' : ''}`}
                >
                  
                  {/* HEADER POSTING (Instagram Style) */}
                  <div className="p-3 px-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {profile.avatar && profile.avatar.trim() !== '' ? (
                        <img 
                          src={profile.avatar} 
                          alt={profile.username}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200/80"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center border border-slate-200/80">
                          {(profile.username || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 font-display hover:underline cursor-pointer">
                            @{profile.username}
                          </span>
                          {post.pinned && (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500 text-white text-[7px] font-mono font-bold uppercase leading-none">
                              <Pin className="w-2 h-2 fill-current" /> PIN
                            </span>
                          )}
                          {post.hidden && (
                            <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-600 text-white text-[7px] font-mono font-bold uppercase leading-none">
                              DRAFT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-medium block leading-none mt-0.5">
                          {profile.role}
                        </span>
                      </div>
                    </div>

                    {/* Developer dropdown triggers & actions */}
                    {isDevMode && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownPostId(activeDropdownPostId === post.id ? null : post.id);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Menu Dropdown - only visible if active & devmode */}
                        {activeDropdownPostId === post.id && (
                          <div 
                            className="absolute right-0 mt-1 w-44 bg-slate-900 text-slate-100 rounded-xl shadow-xl border border-slate-800 z-30 py-1.5 text-xs font-mono"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleTogglePin(post)}
                              className="w-full px-3.5 py-2 hover:bg-slate-800 text-left flex items-center gap-2 cursor-pointer text-slate-200"
                            >
                              <Pin className={`w-3.5 h-3.5 ${post.pinned ? 'text-amber-400 fill-current' : 'text-slate-400'}`} />
                              <span>{post.pinned ? 'Unpin Post' : 'Pin Post'}</span>
                            </button>

                            <button
                              onClick={() => handleToggleHide(post)}
                              className="w-full px-3.5 py-2 hover:bg-slate-800 text-left flex items-center gap-2 cursor-pointer text-slate-200"
                            >
                              {post.hidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Publish Post</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Hide/Draft</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleStartEdit(post)}
                              className="w-full px-3.5 py-2 hover:bg-slate-800 text-left flex items-center gap-2 cursor-pointer text-slate-200"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit Caption</span>
                            </button>

                            <div className="border-t border-slate-800 my-1"></div>

                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="w-full px-3.5 py-2 hover:bg-red-950/40 text-left flex items-center gap-2 cursor-pointer text-rose-400 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Post</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* MEDIA SECTION (Preserve ratio, dark background if necessary) */}
                  {hasMedia && (
                    <div className="bg-slate-950 flex items-center justify-center">
                      <MediaCarousel 
                        media={post.media} 
                        onMediaClick={(m) => setPreviewMedia(m)} 
                      />
                    </div>
                  )}

                  {/* ACTION BAR (Instagram Style) */}
                  <div className="p-3.5 px-4 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      {/* Like Trigger Button */}
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 group cursor-pointer"
                        title="Sukai"
                      >
                        <Heart className="w-5 h-5 text-slate-700 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all" />
                      </button>
                      
                      {/* Bottom Sheet Comment Trigger */}
                      <button 
                        onClick={() => setActiveCommentsPostId(post.id)}
                        className="flex items-center gap-1.5 group cursor-pointer"
                        title="Komentar"
                      >
                        <MessageCircle className="w-5 h-5 text-slate-700 hover:text-indigo-600 hover:scale-110 active:scale-95 transition-all" />
                      </button>
                    </div>

                    {/* Download Trigger */}
                    {hasMedia && (
                      <button
                        onClick={() => handleDownload(post.media[0].url, 0)}
                        className="p-1 text-slate-700 hover:text-indigo-600 active:scale-90 transition-all cursor-pointer"
                        title="Unduh media"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* LIKES COUNTER under action bar */}
                  <div className="px-4 pb-1 text-xs font-extrabold text-slate-900 font-display">
                    {post.likes_count || 0} suka
                  </div>

                  {/* CAPTION & EXPANSE Mechanism */}
                  <div className="px-4 pb-3 pt-1 space-y-1.5">
                    {editingPostId === post.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={editingCaption}
                          onChange={(e) => setEditingCaption(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 text-[10px] font-mono">
                          <button
                            onClick={() => setEditingPostId(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold cursor-pointer"
                          >
                            BATAL
                          </button>
                          <button
                            onClick={() => handleSaveEdit(post.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> SIMPAN
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans select-text break-words">
                        <span className="font-bold text-slate-900 font-display mr-2 hover:underline cursor-pointer">
                          @{profile.username}
                        </span>
                        {displayCaption}
                        
                        {isLongCaption && !isExpanded && (
                          <button
                            onClick={() => setExpandedCaptions({ ...expandedCaptions, [post.id]: true })}
                            className="text-slate-400 font-semibold text-xs ml-1 hover:text-indigo-500 cursor-pointer"
                          >
                            ...selengkapnya
                          </button>
                        )}
                        {isLongCaption && isExpanded && (
                          <button
                            onClick={() => setExpandedCaptions({ ...expandedCaptions, [post.id]: false })}
                            className="text-slate-400 font-semibold text-xs ml-1 hover:text-indigo-500 cursor-pointer"
                          >
                            Sembunyikan
                          </button>
                        )}
                      </div>
                    )}

                    {/* Quick indicator of comment volume */}
                    {post.comments && post.comments.length > 0 && (
                      <button
                        onClick={() => setActiveCommentsPostId(post.id)}
                        className="text-[11px] text-slate-400 font-mono hover:text-indigo-500 cursor-pointer block"
                      >
                        Lihat semua {post.comments.length} komentar
                      </button>
                    )}

                    {/* PUBLISH TIME */}
                    <div className="text-[9px] text-slate-400 font-mono tracking-wider flex items-center gap-1 pt-1.5 uppercase">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COMMENTS BOTTOM SHEET DRAWER */}
      {activeCommentsPostId && activePost && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 flex items-end justify-center"
          onClick={() => setActiveCommentsPostId(null)}
        >
          {/* Animated Slide Up Drawer Panel */}
          <div 
            className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl h-[80vh] flex flex-col animate-slideUp relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top rounded notch indicator */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 cursor-pointer" onClick={() => setActiveCommentsPostId(null)} />
            
            {/* Drawer Header */}
            <div className="px-5 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-slate-900 font-display">Komentar Angkatan</span>
                <span className="text-[10px] text-slate-400 font-mono">POSTING_ID: {activePost.id.substring(0, 8)}</span>
              </div>
              <button 
                onClick={() => setActiveCommentsPostId(null)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable comments stream area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {(() => {
                const visibleComments = (activePost.comments || []).filter(c => !isUserIdBlocked(c.user_id || c.author));
                if (visibleComments.length === 0) {
                  return (
                    <div className="py-16 text-center space-y-2">
                      <MessageCircle className="w-10 h-10 text-slate-200 mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">Belum ada komentar untuk postingan ini.</p>
                      <p className="text-[10px] text-slate-300">Jadilah yang pertama untuk meninggalkan pesan hangat!</p>
                    </div>
                  );
                }

                return visibleComments.map((comment) => {
                  const isGuestComment = Boolean(
                    comment.is_guest || 
                    (comment.user_id && /^USR-|^GUEST-|^ID-/.test(comment.user_id.toUpperCase())) ||
                    /^USR-|^GUEST-|^ID-/.test(comment.author.toUpperCase())
                  );
                  const effectiveUserId = comment.user_id || (isGuestComment ? comment.author : '');
                  const commProfile = getCommenterProfile(comment.author);

                  return (
                    <div key={comment.id} className="flex gap-3 items-start text-xs">
                      {/* Dynamic letter avatar */}
                      <div className={`w-8.5 h-8.5 rounded-full ${isGuestComment ? 'bg-slate-500' : commProfile.avatarColor} text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-black/5`}>
                        {isGuestComment ? 'ID' : commProfile.initials}
                      </div>
                      
                      <div className="flex-1 space-y-0.5 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isGuestComment ? (
                              <span className="font-bold text-slate-900 font-mono text-xs">
                                {effectiveUserId || comment.author}
                              </span>
                            ) : commProfile.nickname ? (
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 font-display leading-tight">{commProfile.nickname}</span>
                                {commProfile.username && (
                                  <span className="text-[10px] text-slate-400 font-mono leading-none">{commProfile.username}</span>
                                )}
                              </div>
                            ) : (
                              <span className="font-bold text-slate-900 font-display">
                                {commProfile.displayName}
                              </span>
                            )}
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              isGuestComment 
                                ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isGuestComment ? 'Tamu' : commProfile.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-mono text-slate-400">{(formatDate(comment.created_at) || '').split(' • ')[0]}</span>
                            {isDevMode && (
                              <button
                                onClick={() => handleDeleteComment(activePost.id, comment.id)}
                                className="p-0.5 hover:bg-rose-50 text-rose-500 rounded transition-colors cursor-pointer"
                                title="Hapus Komentar"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-700 leading-relaxed bg-slate-50/80 px-3.5 py-2.5 rounded-2xl border border-slate-100/60 select-text break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Bottom Form Section */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2.5">
              <form 
                onSubmit={(e) => handleAddComment(activePost.id, e)}
                className="space-y-2"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  {user ? (
                    <div className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-sans sm:w-1/3 text-slate-800 flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate font-semibold">
                        {currentStudent?.nickname || currentStudent?.name || user.displayName || user.email?.split('@')[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl py-2 px-3 text-[11px] font-mono sm:w-1/3 text-amber-900 flex items-center justify-between gap-1.5 shrink-0 shadow-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-800 font-bold uppercase tracking-wider">Tamu</span>
                        <span className="font-bold tracking-wider truncate">{visitorId}</span>
                      </div>
                      <span className="text-[9px] text-amber-600 font-sans">User ID</span>
                    </div>
                  )}
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      value={commentInputs[activePost.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [activePost.id]: e.target.value })}
                      placeholder="Ketik pesan kenangan Anda..."
                      maxLength={300}
                      className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-[11px] focus:outline-none focus:border-indigo-500 font-sans text-slate-800"
                      required
                    />
                    <button 
                      type="submit"
                      className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox Zoomable Modal */}
      {previewMedia && (
        <FullscreenPreview 
          media={previewMedia} 
          onClose={() => setPreviewMedia(null)} 
          />
      )}

      {/* In-App Delete Post Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hapus Postingan?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Postingan ini beserta media dan komentar di dalamnya akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={executeDeletePost}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isDeletingItem ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghapus...
                  </>
                ) : (
                  'Hapus Postingan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Comment Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hapus Komentar?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Komentar ini akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={() => setCommentToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingItem}
                onClick={executeDeleteComment}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isDeletingItem ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghapus...
                  </>
                ) : (
                  'Hapus Komentar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
