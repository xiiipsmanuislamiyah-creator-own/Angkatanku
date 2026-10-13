import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare, Send, User, Trash2, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs, setDoc, doc, serverTimestamp, deleteDoc } from '../lib/data';
import { useAuth } from '../contexts/AuthContext';
import { checkRateLimit, sanitizeInput, isUserIdBlocked } from '../lib/security';

interface RatingItem {
  id: string;
  userId: string;
  userName: string;
  nickname?: string;
  username?: string;
  userAvatar?: string;
  role?: string;
  isGuest?: boolean;
  rating: number;
  comment: string;
  createdAt: any;
  updatedAt?: any;
}

export default function Rating() {
  const { user, realRole, isAdmin, currentStudent, visitorId } = useAuth();
  
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
  const [myRating, setMyRating] = useState<number>(0);
  const [myComment, setMyComment] = useState<string>('');
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active identifier: user.uid if authenticated, else visitorId
  const activeUserId = user ? user.uid : visitorId;

  // Listener for students collection to resolve up-to-date nickname & username
  useEffect(() => {
    let isMounted = true;
    if (!user) {
      getDocs(collection(db, 'students')).then((snap) => {
        if (!isMounted) return;
        const map: Record<string, any> = {};
        snap.forEach(d => {
          map[d.id] = d.data();
        });
        setStudentsMap(map);
      }).catch((err) => {
        console.warn("Notice: could not fetch students for rating:", err?.message || err);
      });
      return () => { isMounted = false; };
    }

    const unsub = onSnapshot(collection(db, 'students'), (snap) => {
      const map: Record<string, any> = {};
      snap.forEach(d => {
        map[d.id] = d.data();
      });
      setStudentsMap(map);
    }, (err) => {
      console.warn("Students listener note in Rating:", err.message);
    });
    return () => unsub();
  }, [user]);

  // Listener for app_ratings
  useEffect(() => {
    let isMounted = true;
    const q = query(collection(db, 'app_ratings'), orderBy('createdAt', 'desc'));

    const handleDocs = (docs: any[]) => {
      const data: RatingItem[] = [];
      docs.forEach(d => {
        data.push({ id: d.id, ...d.data() } as RatingItem);
      });
      
      const combined=data;
      setRatings(data);
      const myExisting = combined.find(r => r.userId === activeUserId);
      if (myExisting) {
        setMyRating(myExisting.rating);
        setMyComment(myExisting.comment || '');
      }
    };

    if (!user) {
      getDocs(q).then((snap) => {
        if (!isMounted) return;
        handleDocs(snap.docs);
      }).catch((err) => {
        console.warn("Notice: could not fetch app ratings:", err?.message || err);
      });
      return () => { isMounted = false; };
    }

    const unsub = onSnapshot(q, (snap) => {
      handleDocs(snap.docs);
    }, (err) => {
      console.warn("App ratings listener note in Rating:", err.message);
    });
    return () => unsub();
  }, [user, activeUserId]);

  // Determine current reviewer identity
  const currentIsGuest = !user;
  const currentRawNickname = currentStudent?.nickname?.trim() || '';
  const currentRawUsername = currentStudent?.username?.trim() || (user?.email ? `@${user.email.split('@')[0]}` : '');
  const currentFormattedUsername = currentRawUsername ? (currentRawUsername.startsWith('@') ? currentRawUsername : `@${currentRawUsername}`) : '';
  const currentAvatar = currentStudent?.avatarUrl || user?.photoURL || '';

  const handleSubmit=async(e:React.FormEvent)=>{e.preventDefault();if(!user){alert('Masuk untuk mengirim ulasan.');return;}if(myRating<1||myRating>5)return;setIsSubmitting(true);setSubmitSuccess(false);try{const value={rating:myRating,comment:sanitizeInput(myComment,2000)};await setDoc(doc(db,'app_ratings',user.uid),value);setSubmitSuccess(true);}catch(e:any){alert(e.message||'Ulasan belum tersimpan.');}finally{setIsSubmitting(false);}};
  const handleDelete=async(id:string)=>{setIsDeleting(true);try{await deleteDoc(doc(db,'app_ratings',id));setRatings(prev=>prev.filter(r=>r.id!==id));setConfirmDeleteId(null);}catch(e:any){alert(e.message||'Ulasan belum terhapus.');}finally{setIsDeleting(false);}};

  const avgRating = ratings.length > 0 
    ? (ratings.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / ratings.length).toFixed(1)
    : '0.0';

  const existingMyReview = ratings.find(r => r.userId === activeUserId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black font-display text-slate-800 dark:text-white mb-2">Penilaian & Ulasan</h1>
          <p className="text-slate-500 dark:text-slate-400">Bagikan kesan, pesan, dan pengalaman Anda menggunakan Arsip Digital Angkatan.</p>
          
          <div className="flex flex-col items-center justify-center mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
            <span className="text-5xl font-black text-slate-800 dark:text-white mb-2">{avgRating}</span>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className={`w-6 h-6 ${parseFloat(avgRating) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700'}`} />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-mono">Total {ratings.length} Ulasan</span>
          </div>
        </div>

        {/* Rating Form (Accessible for both Logged-in users and Visitors) */}
        <form onSubmit={handleSubmit} className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 text-center">
            {existingMyReview ? 'Perbarui Ulasan Anda' : 'Tinggalkan Ulasan Anda'}
          </h3>

          {/* Current Reviewer Identity Indicator */}
          <div className="max-w-md mx-auto mb-6">
            {!currentIsGuest ? (
              <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-2xl">
                {currentAvatar && currentAvatar.trim() !== '' ? (
                  <img src={currentAvatar} alt="Profil" className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 tracking-wider">
                    {(currentRawNickname || currentStudent?.name || currentFormattedUsername || 'SW').replace(/^[@#_\s]+/, '').substring(0, 2).toUpperCase() || 'SW'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {currentRawNickname || currentFormattedUsername || currentStudent?.name || 'Siswa'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      {realRole === 'owner' ? 'Owner' : realRole === 'admin' ? 'Admin' : 'Siswa'}
                    </span>
                  </div>
                  {currentRawNickname && currentFormattedUsername && (
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {currentFormattedUsername}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                  ID
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                      {visitorId}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Pengunjung
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sebagai pengunjung, identitas yang tercatat adalah User ID unik Anda.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Star Selection */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setMyRating(star)}
                className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                title={`${star} Bintang`}
              >
                <Star 
                  className={`w-10 h-10 transition-colors ${(hoverRating || myRating) >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-100 dark:fill-slate-800 text-slate-200 dark:text-slate-700'}`} 
                />
              </button>
            ))}
          </div>

          <div className="relative max-w-2xl mx-auto">
            <MessageSquare className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
            <textarea
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              placeholder="Tuliskan kesan, pesan, atau saran untuk website dan angkatan ini..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 dark:text-white resize-none"
            />
          </div>

          {submitSuccess && (
            <div className="max-w-2xl mx-auto mt-3 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Ulasan Anda berhasil disimpan!
            </div>
          )}

          <div className="max-w-2xl mx-auto flex items-center gap-3 mt-4">
            <button
              type="submit"
              disabled={isSubmitting || myRating === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer text-sm"
            >
              {isSubmitting ? 'Menyimpan...' : (
                <>
                  <Send className="w-4 h-4" /> 
                  {existingMyReview ? 'Perbarui Ulasan' : 'Kirim Ulasan'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Ratings List */}
      <div className="space-y-3">
        {(() => {
          const visibleRatings = ratings.filter(r => !isUserIdBlocked(r.userId));
          return (
            <>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                Ulasan Komunitas ({visibleRatings.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleRatings.map((item, idx) => {
                  const isSelf = item.userId === activeUserId;
                  const studentDoc = studentsMap[item.userId];
                  const isGuestItem = item.isGuest || item.userId?.startsWith('USR-') || item.userId?.startsWith('GUEST-') || item.userId?.startsWith('ID-');

            // Resolving nickname and username according to user instructions:
            // 1. If user edited nama panggilan -> display nama panggilan, below it small username
            // 2. If user hasn't edited nama panggilan -> display username
            // 3. If visitor -> display visitor User ID
            let resolvedNickname = item.nickname || studentDoc?.nickname || '';
            let resolvedUsername = item.username || studentDoc?.username || '';
            if (!resolvedUsername && studentDoc?.email) {
              resolvedUsername = `@${studentDoc.email.split('@')[0]}`;
            } else if (!resolvedUsername && isSelf && user?.email) {
              resolvedUsername = `@${user.email.split('@')[0]}`;
            }
            if (resolvedUsername && !resolvedUsername.startsWith('@')) {
              resolvedUsername = `@${resolvedUsername}`;
            }

            const resolvedAvatar = item.userAvatar || studentDoc?.avatarUrl || '';
            const canDelete = isAdmin || realRole === 'owner' || isSelf;

            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                key={item.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {resolvedAvatar && resolvedAvatar.trim() !== '' ? (
                        <img 
                          src={resolvedAvatar} 
                          alt={resolvedNickname || resolvedUsername || item.userName} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : isGuestItem ? (
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                          ID
                        </div>
                      ) : (
                        (() => {
                          const rawName = (resolvedNickname || resolvedUsername || item.userName || '').replace(/^[@#_\s]+/, '').trim();
                          const inits = rawName.length >= 2 ? rawName.substring(0, 2).toUpperCase() : (rawName.length === 1 ? rawName.toUpperCase() : '');
                          return inits ? (
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 tracking-wider">
                              {inits}
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                          );
                        })()
                      )}

                      <div className="min-w-0">
                        {/* User Display Hierarchy */}
                        {isGuestItem ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm font-mono leading-tight">
                                {item.userId || 'USR-GUEST'}
                              </h4>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                                Pengunjung
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-tight mt-0.5">
                              User ID Akses
                            </p>
                          </>
                        ) : resolvedNickname ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                                {resolvedNickname}
                              </h4>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Anda
                                </span>
                              )}
                            </div>
                            {resolvedUsername && (
                              <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                                {resolvedUsername}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight font-mono">
                                {resolvedUsername || item.userName || 'Siswa'}
                              </h4>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                              Siswa Angkatan
                            </p>
                          </>
                        )}

                        {/* Stars */}
                        <div className="flex gap-0.5 mt-1.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              className={`w-3.5 h-3.5 ${item.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 dark:fill-slate-700 text-slate-200 dark:text-slate-700'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {canDelete && (
                      <div className="shrink-0">
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 p-1 rounded-xl border border-rose-200 dark:border-rose-900 animate-in fade-in duration-150">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(item.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                              {isDeleting ? '...' : 'Hapus'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Ulasan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {item.comment && (
                    <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-2">
                      "{item.comment}"
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

