import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX, 
  Ban, 
  CheckCircle2, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  MessageSquare, 
  Star, 
  AlertTriangle, 
  User, 
  Lock, 
  Unlock, 
  Plus, 
  X, 
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from '../lib/data';
import { databaseService, PostItem, CommentItem } from '../lib/supabaseClient';
import { 
  getBlockedUserIds, 
  isUserIdBlocked, 
  blockUserIdPersisted, 
  unblockUserIdPersisted, 
  syncBlockedUserIdsFromFirestore 
} from '../lib/security';
import { useAuth } from '../contexts/AuthContext';

interface RatingItem {
  id: string;
  userId: string;
  userName: string;
  nickname?: string;
  username?: string;
  rating: number;
  comment: string;
  category?: string;
  createdAt: number;
  isGuest?: boolean;
  role?: string;
}

interface FlattenedComment {
  id: string;
  postId: string;
  postCaption?: string;
  author: string;
  content: string;
  user_id?: string;
  created_at?: string;
  is_guest?: boolean;
}

export default function AdminModerationTab() {
  const { isAdmin } = useAuth();
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [feedComments, setFeedComments] = useState<FlattenedComment[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'ratings' | 'comments' | 'blacklist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'guest' | 'student' | 'blocked'>('all');

  // Manual Block State
  const [manualIdInput, setManualIdInput] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // In-app Deletion Modal States (Iframe safe, no native alert/confirm)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'rating' | 'comment';
    id: string;
    postId?: string;
    author: string;
    userId: string;
    snippet: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load blocked user IDs from local storage & sync with Firestore
  const loadBlockedList = async () => {
    try {
      const synced = await syncBlockedUserIdsFromFirestore();
      setBlockedIds(synced);
    } catch {
      setBlockedIds(getBlockedUserIds());
    }
  };

  // Load Ratings from Firestore real-time listener
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadBlockedList();

    const q = query(collection(db, 'app_ratings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: RatingItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId || d.id,
            userName: data.userName || 'Pengguna',
            nickname: data.nickname || '',
            username: data.username || '',
            rating: Number(data.rating) || 5,
            comment: data.comment || '',
            category: data.category || 'Umum',
            createdAt: data.createdAt || Date.now(),
            isGuest: Boolean(data.isGuest || (data.userId && /^USR-|^GUEST-|^ID-/.test(data.userId))),
            role: data.role || 'guest',
          };
        });
        setRatings(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Admin moderation ratings listener warning:', err);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin]);

  // Fetch comments from Feed posts
  const fetchComments = async () => {
    try {
      setRefreshing(true);
      const posts: PostItem[] = await databaseService.fetchPosts(true);
      const flat: FlattenedComment[] = [];

      posts.forEach((p) => {
        if (p.comments && Array.isArray(p.comments)) {
          p.comments.forEach((c: CommentItem) => {
            flat.push({
              id: c.id,
              postId: p.id,
              postCaption: p.caption ? p.caption.slice(0, 45) + (p.caption.length > 45 ? '...' : '') : 'Postingan Feed',
              author: c.author || 'Anonim',
              content: c.content || '',
              user_id: c.user_id || '',
              created_at: c.created_at,
              is_guest: Boolean(c.is_guest || (c.user_id && /^USR-|^GUEST-|^ID-/.test(c.user_id))),
            });
          });
        }
      });

      // Sort comments newest first if possible
      flat.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setFeedComments(flat);
    } catch (err) {
      console.warn('Failed to load feed comments:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 3500);
  };

  // Block & Unblock handlers
  const handleBlockUser = async (userId: string, label?: string) => {
    if (!userId) return;
    const cleanId = userId.trim();
    await blockUserIdPersisted(cleanId);
    setBlockedIds(getBlockedUserIds());
    showNotification(`User ID "${cleanId}" ${label ? `(${label})` : ''} berhasil DIBLOKIR. Semua interaksinya disembunyikan.`);
  };

  const handleUnblockUser = async (userId: string) => {
    if (!userId) return;
    const cleanId = userId.trim();
    await unblockUserIdPersisted(cleanId);
    setBlockedIds(getBlockedUserIds());
    showNotification(`User ID "${cleanId}" berhasil DIBUKA DARI BLOKIR.`);
  };

  const handleManualBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIdInput.trim()) return;
    const target = manualIdInput.trim();
    await handleBlockUser(target);
    setManualIdInput('');
  };

  // Execute in-app confirmed delete
  const confirmExecuteDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      if (itemToDelete.type === 'rating') {
        await deleteDoc(doc(db, 'app_ratings', itemToDelete.id));
        showNotification('Ulasan rating berhasil dihapus dari database.');
      } else if (itemToDelete.type === 'comment') {
        await databaseService.deleteComment(itemToDelete.id);
        setFeedComments((prev) => prev.filter((c) => c.id !== itemToDelete.id));
        showNotification('Komentar feed berhasil dihapus.');
      }
      setItemToDelete(null);
    } catch (err: any) {
      console.warn('Failed to delete item:', err?.message || err);
      showNotification('Gagal menghapus: ' + (err.message || 'Periksa koneksi'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Combined and filtered streams
  const filteredRatings = useMemo(() => {
    return ratings.filter((r) => {
      const isGuest = r.isGuest || (r.userId && /^USR-|^GUEST-|^ID-/.test(r.userId));
      const isBlocked = isUserIdBlocked(r.userId);

      if (typeFilter === 'guest' && !isGuest) return false;
      if (typeFilter === 'student' && isGuest) return false;
      if (typeFilter === 'blocked' && !isBlocked) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = r.userId.toLowerCase().includes(q);
        const matchesName = r.userName.toLowerCase().includes(q);
        const matchesNick = (r.nickname || '').toLowerCase().includes(q);
        const matchesComment = r.comment.toLowerCase().includes(q);
        return matchesUser || matchesName || matchesNick || matchesComment;
      }
      return true;
    });
  }, [ratings, typeFilter, searchQuery, blockedIds]);

  const filteredComments = useMemo(() => {
    return feedComments.filter((c) => {
      const effectiveId = c.user_id || c.author;
      const isGuest = c.is_guest || /^USR-|^GUEST-|^ID-/.test(effectiveId);
      const isBlocked = isUserIdBlocked(effectiveId);

      if (typeFilter === 'guest' && !isGuest) return false;
      if (typeFilter === 'student' && isGuest) return false;
      if (typeFilter === 'blocked' && !isBlocked) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUser = effectiveId.toLowerCase().includes(q);
        const matchesAuthor = c.author.toLowerCase().includes(q);
        const matchesContent = c.content.toLowerCase().includes(q);
        const matchesPost = (c.postCaption || '').toLowerCase().includes(q);
        return matchesUser || matchesAuthor || matchesContent || matchesPost;
      }
      return true;
    });
  }, [feedComments, typeFilter, searchQuery, blockedIds]);

  return (
    <div className="space-y-6">
      
      {/* Toast notification banner */}
      <AnimatePresence>
        {actionSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button 
              onClick={() => setActionSuccessMsg(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Fast Actions */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3 h-3 text-indigo-400" />
              MODERASI PENGGUNA & USER ID TAMU
            </div>
            <h2 className="text-xl font-bold font-display text-white">
              Pusat Kendali Moderasi & Anti-Spam
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Seluruh aktivitas komentar dan rating terikat dengan <strong>User ID</strong> unik. Untuk tamu/pengunjung yang belum login, hanya User ID yang ditampilkan. Anda dapat memblokir User ID tertentu seketika jika terindikasi komentar tidak pantas.
            </p>
          </div>

          <button
            onClick={() => {
              loadBlockedList();
              fetchComments();
            }}
            disabled={refreshing}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] text-slate-400 block font-mono">TOTAL RATING</span>
            <span className="text-lg font-extrabold text-white font-mono">{ratings.length}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] text-slate-400 block font-mono">TOTAL KOMENTAR FEED</span>
            <span className="text-lg font-extrabold text-white font-mono">{feedComments.length}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] text-slate-400 block font-mono">ID DIBLOKIR</span>
            <span className="text-lg font-extrabold text-rose-400 font-mono">{blockedIds.length}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[10px] text-slate-400 block font-mono">STATUS SERVER</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Aktif & Terproteksi
            </span>
          </div>
        </div>
      </div>

      {/* Manual User ID Blocking Form */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-500" />
              Blokir Manual User ID / Tamu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Masukkan ID pengguna atau tamu (contoh: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">USR-GUEST-1234</code>) untuk memblokir secara manual.
            </p>
          </div>
        </div>

        <form onSubmit={handleManualBlock} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualIdInput}
              onChange={(e) => setManualIdInput(e.target.value)}
              placeholder="Ketik atau tempel User ID yang ingin diblokir..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!manualIdInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Blokir User ID</span>
          </button>
        </form>

        {/* Blacklisted User IDs Quick Bar */}
        {blockedIds.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5">
                <ShieldX className="w-3.5 h-3.5 text-rose-500" />
                DAFTAR HITAM USER ID AKTIF ({blockedIds.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockedIds.map((id) => (
                <div
                  key={id}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-mono"
                >
                  <span className="font-bold">{id}</span>
                  <button
                    type="button"
                    onClick={() => handleUnblockUser(id)}
                    title="Buka blokir User ID ini"
                    className="p-0.5 hover:bg-rose-200 dark:hover:bg-rose-900 rounded text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 transition-colors cursor-pointer"
                  >
                    <Unlock className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs & Filtering */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { id: 'all', label: 'Semua Aktivitas', count: ratings.length + feedComments.length },
              { id: 'ratings', label: 'Ulasan Rating', count: ratings.length },
              { id: 'comments', label: 'Komentar Feed', count: feedComments.length },
              { id: 'blacklist', label: 'User ID Terblokir', count: blockedIds.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  activeSubTab === tab.id
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search bar & Type filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari User ID atau teks..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">Semua Tipe</option>
              <option value="guest">Hanya Tamu</option>
              <option value="student">Hanya Siswa</option>
              <option value="blocked">Hanya Terblokir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Stream Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-500 font-mono">Memuat data moderasi...</p>
        </div>
      ) : activeSubTab === 'blacklist' ? (
        /* Blacklist Dedicated View */
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                Daftar Lengkap User ID yang Diblokir ({blockedIds.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semua User ID di bawah ini dilarang mengirim rating atau komentar di seluruh aplikasi.
              </p>
            </div>
          </div>

          {blockedIds.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada User ID yang diblokir saat ini.
              </p>
              <p className="text-[11px] text-slate-400">
                Komunitas bersih dan kondusif.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {blockedIds.map((id, idx) => (
                <div key={id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-6">#{idx + 1}</span>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">{id}</span>
                      <span className="text-[10px] text-slate-400">
                        {id.startsWith('USR-') ? 'Tamu / Pengunjung' : 'Akun Terdaftar / Siswa'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblockUser(id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Buka Blokir</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Stream of Ratings & Comments */
        <div className="space-y-6">
          
          {/* 1. App Ratings Section */}
          {(activeSubTab === 'all' || activeSubTab === 'ratings') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  ULASAN & RATING APLIKASI ({filteredRatings.length})
                </h3>
              </div>

              {filteredRatings.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400 font-mono">Tidak ada ulasan rating yang cocok dengan filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredRatings.map((item) => {
                    const isGuest = item.isGuest || (item.userId && /^USR-|^GUEST-|^ID-/.test(item.userId));
                    const isBlocked = isUserIdBlocked(item.userId);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between gap-3 ${
                          isBlocked
                            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* User ID Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                                isGuest 
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' 
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
                              }`}>
                                {isGuest ? 'ID' : 'SW'}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Strictly show User ID if guest */}
                                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {isGuest ? item.userId : (item.nickname || item.username || item.userName)}
                                  </span>

                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                    isGuest
                                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                      : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400'
                                  }`}>
                                    {isGuest ? 'Tamu' : 'Siswa'}
                                  </span>

                                  {isBlocked && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono font-bold">
                                      DIBLOKIR
                                    </span>
                                  )}
                                </div>

                                {!isGuest && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    User ID: {item.userId}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Stars rating */}
                            <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Comment Content */}
                          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                              "{item.comment}"
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 font-mono">
                              <span>Kategori: {item.category || 'Umum'}</span>
                              <span>{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {isBlocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnblockUser(item.userId)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Buka Blokir</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBlockUser(item.userId, isGuest ? 'Tamu' : item.userName)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Blokir User ID</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setItemToDelete({
                              type: 'rating',
                              id: item.id,
                              author: isGuest ? item.userId : item.userName,
                              userId: item.userId,
                              snippet: item.comment
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Ulasan Rating"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. Feed Comments Section */}
          {(activeSubTab === 'all' || activeSubTab === 'comments') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  KOMENTAR FEED ANGKATAN ({filteredComments.length})
                </h3>
              </div>

              {filteredComments.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400 font-mono">Tidak ada komentar feed yang cocok dengan filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredComments.map((comm) => {
                    const effectiveId = comm.user_id || comm.author;
                    const isGuest = comm.is_guest || /^USR-|^GUEST-|^ID-/.test(effectiveId);
                    const isBlocked = isUserIdBlocked(effectiveId);

                    return (
                      <div
                        key={comm.id}
                        className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between gap-3 ${
                          isBlocked
                            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Comment Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                                isGuest 
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' 
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              }`}>
                                {isGuest ? 'ID' : 'SW'}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Guest only shows User ID as mandated */}
                                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {isGuest ? effectiveId : comm.author}
                                  </span>

                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                    isGuest
                                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                      : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                  }`}>
                                    {isGuest ? 'Tamu' : 'Siswa'}
                                  </span>

                                  {isBlocked && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono font-bold">
                                      DIBLOKIR
                                    </span>
                                  )}
                                </div>

                                {!isGuest && comm.user_id && (
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    User ID: {comm.user_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Post reference tag */}
                          {comm.postCaption && (
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              Pada post: <span className="italic">{comm.postCaption}</span>
                            </div>
                          )}

                          {/* Comment Content */}
                          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                              "{comm.content}"
                            </p>
                            {comm.created_at && (
                              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                {new Date(comm.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {isBlocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnblockUser(effectiveId)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Buka Blokir</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBlockUser(effectiveId, isGuest ? 'Tamu' : comm.author)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Blokir User ID</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setItemToDelete({
                              type: 'comment',
                              id: comm.id,
                              postId: comm.postId,
                              author: isGuest ? effectiveId : comm.author,
                              userId: effectiveId,
                              snippet: comm.content
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Komentar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* In-App Deletion Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                    Konfirmasi Hapus {itemToDelete.type === 'rating' ? 'Ulasan Rating' : 'Komentar Feed'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tindakan ini permanen dan menghapus pesan dari database.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-500 font-mono text-[10px]">
                  <span>PENGIRIM: {itemToDelete.author}</span>
                  <span>ID: {itemToDelete.userId}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  "{itemToDelete.snippet}"
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmExecuteDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ya, Hapus Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
