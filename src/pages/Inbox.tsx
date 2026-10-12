import {api} from '../lib/api';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Send, User, Reply, CheckCircle2, Loader2, X, AlertTriangle, ShieldCheck, Mail, Info } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, addDoc, onSnapshot } from '../lib/data';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { checkRateLimit, sanitizeInput } from '../lib/security';

export default function Inbox() {
  const { user, realRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'notifications' | 'dm'>('notifications');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dms, setDms] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  
  const [isComposing, setIsComposing] = useState(false);
  const [targetType, setTargetType] = useState<'dm' | 'broadcast'>('dm');
  const [composeReceiver, setComposeReceiver] = useState('');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [sending, setSending] = useState(false);
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null);

  const canSend = realRole === 'owner' || realRole === 'admin';

  useEffect(() => {
    if (!user) return;

    // Fetch Notifications (strictly for current user or broadcast 'all')
    const qNotif = query(
      collection(db, 'messages'),
      where('receiverId', 'in', [user.uid, 'all']),
      where('type', '==', 'notification'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Notifications listener note:", err.message);
    });

    // PRIVACY: Listen ONLY to messages where user is sender or receiver
    let receivedMap = new Map<string, any>();
    let sentMap = new Map<string, any>();

    const updateCombinedDMs = () => {
      const merged = new Map([...receivedMap, ...sentMap]);
      const list = Array.from(merged.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setDms(list);
    };

    const qReceived = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.uid),
      where('type', '==', 'dm')
    );
    const unsubReceived = onSnapshot(qReceived, (snap) => {
      receivedMap.clear();
      snap.docs.forEach(d => receivedMap.set(d.id, { id: d.id, ...d.data() }));
      updateCombinedDMs();
    }, (err) => console.warn("Received DMs listener error:", err.message));

    const qSent = query(
      collection(db, 'messages'),
      where('senderId', '==', user.uid),
      where('type', '==', 'dm')
    );
    const unsubSent = onSnapshot(qSent, (snap) => {
      sentMap.clear();
      snap.docs.forEach(d => sentMap.set(d.id, { id: d.id, ...d.data() }));
      updateCombinedDMs();
    }, (err) => console.warn("Sent DMs listener error:", err.message));

    // Fetch Users for DM compose (only needed if admin/owner)
    if (canSend) {
      const fetchUsers = async () => {
        try {
          const snap = await getDocs(collection(db, 'students'));
          setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.uid));
        } catch (e) {
          console.warn("Could not fetch students for inbox:", e);
        }
      };
      fetchUsers();
    }

    return () => {
      unsubNotif();
      unsubReceived();
      unsubSent();
    };
  }, [user, canSend]);

  const markAsRead = async (msgId: string) => {
    try {
      await updateDoc(doc(db, 'messages', msgId), { read: true });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSend) return;
    if (targetType === 'dm' && !composeReceiver) {
      alert('Pilih siswa tujuan pesan!');
      return;
    }
    if (!composeContent.trim()) return;

    // Rate Limiting check
    const rl = checkRateLimit('send_dm');
    if (!rl.allowed) {
      setRateLimitWarning(`Terlalu cepat mengirim pesan. Harap tunggu ${rl.retryAfterSec} detik lagi.`);
      setTimeout(() => setRateLimitWarning(null), 5000);
      return;
    }

    const cleanContent = sanitizeInput(composeContent, 2000);
    const cleanTitle = sanitizeInput(composeTitle, 200);
    if (!cleanContent) return;

    setSending(true);
    setRateLimitWarning(null);

    try {
      const senderName = realRole === 'owner' ? 'Kepala Madrasah / Pengelola Angkatan' : 'Pengurus Angkatan (Admin)';

      if (targetType === 'broadcast') {
        // Broadcast notification to all
        await addDoc(collection(db, 'messages'), {
          type: 'notification',
          title: cleanTitle || 'Pemberitahuan Resmi',
          senderId: user.uid,
          senderName,
          receiverId: 'all',
          content: cleanContent,
          createdAt: Date.now(),
          read: false
        });
      } else {
        // Direct administrative message
        await addDoc(collection(db, 'messages'), {
          type: 'dm',
          title: cleanTitle || 'Pesan Administrator',
          senderId: user.uid,
          senderName,
          receiverId: composeReceiver,
          content: cleanContent,
          createdAt: Date.now(),
          read: false
        });
      }

      setIsComposing(false);
      setComposeContent('');
      setComposeTitle('');
      setComposeReceiver('');
    } catch (err: any) {
      console.warn('Gagal mengirim pesan:', err?.message || err);
      setRateLimitWarning('Gagal mengirim pesan: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!user) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <Mail className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-slate-600 dark:text-slate-300 font-medium">Harap scan kartu dan login terlebih dahulu untuk mengakses kotak masuk.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-800 dark:text-white flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Kotak Masuk Resmi
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pusat notifikasi, maklumat angkatan, dan pesan administratif resmi
          </p>
        </div>

        {canSend && (
          <button
            onClick={() => setIsComposing(!isComposing)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all self-start md:self-auto"
          >
            {isComposing ? <X className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {isComposing ? 'Batal' : 'Kirim Maklumat / Pesan'}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Tabs Header */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3.5 text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'notifications' 
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Bell className="w-4 h-4" /> 
            <span>Pemberitahuan Angkatan</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('dm')}
            className={`flex-1 py-3.5 text-xs md:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'dm' 
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 
            <span>Pesan dari Pengurus</span>
            {dms.filter(d => !d.read && d.receiverId === user.uid).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 min-h-[380px]">
          {/* Admin Composer */}
          <AnimatePresence>
            {isComposing && canSend && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSendAdminMessage} 
                className="mb-6 p-4 md:p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl space-y-3.5"
              >
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-900/40">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Form Pengiriman Maklumat (Admin Only)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetType('broadcast')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${targetType === 'broadcast' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                      Broadcast Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('dm')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${targetType === 'dm' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                      Pesan Khusus Siswa
                    </button>
                  </div>
                </div>

                {targetType === 'dm' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Pilih Siswa Penerima</label>
                    <select 
                      value={composeReceiver} 
                      onChange={e => setComposeReceiver(e.target.value)} 
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.displayName || u.username} ({u.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Judul / Perihal</label>
                  <input
                    type="text"
                    value={composeTitle}
                    onChange={e => setComposeTitle(e.target.value)}
                    placeholder="Contoh: Pengumuman Pengisian Data Ijazah"
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Isi Pesan / Maklumat</label>
                  <textarea 
                    value={composeContent} 
                    onChange={e => setComposeContent(e.target.value)} 
                    rows={3}
                    className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="Tuliskan isi instruksi atau pengumuman resmi di sini..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={sending} 
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Kirim Sekarang
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {rateLimitWarning && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{rateLimitWarning}</span>
            </div>
          )}

          {/* Regular Student Info Banner */}
          {!canSend && (
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2.5 text-slate-600 dark:text-slate-300 text-xs">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Sistem pesan dibuat searah dari Pengurus/Admin Madrasah guna menjaga ketertiban, keamanan data, dan menghindari spam antar siswa.</span>
            </div>
          )}

          {/* TAB 1: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  Belum ada maklumat atau pengumuman angkatan saat ini.
                </div>
              ) : (
                notifications.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      !msg.read 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 shadow-sm' 
                        : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5" />
                        {msg.title || 'Maklumat Angkatan'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <button className="text-[10px] text-slate-500 mt-2 underline" onClick={async()=>{const reason=window.prompt('Laporkan pesan ini. Hanya pesan yang dipilih beserta alasan Anda yang akan dibagikan kepada moderator. Tuliskan alasan:');if(!reason)return;try{await api('/reports',{collection:'messages',id:msg.id,reason});alert('Laporan terkirim.');}catch(e:any){alert(e.message||'Laporan belum terkirim.');}}}>Laporkan pesan ini</button>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Pengirim: <span className="font-semibold text-slate-600 dark:text-slate-300">{msg.senderName || 'Admin'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Direct Admin Messages */}
          {activeTab === 'dm' && (
            <div className="space-y-3">
              {dms.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  Tidak ada pesan pribadi khusus dari Pengurus atau Admin.
                </div>
              ) : (
                dms.map(msg => (
                  <div 
                    key={msg.id} 
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {msg.senderId === user.uid ? 'Pesan Keluar (Admin)' : `Dari: ${msg.senderName || 'Pengurus'}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    {msg.title && (
                      <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">{msg.title}</h4>
                    )}
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <button className="text-[10px] text-slate-500 mt-2 underline" onClick={async()=>{const reason=window.prompt('Laporkan pesan ini. Hanya pesan yang dipilih beserta alasan Anda yang akan dibagikan kepada moderator. Tuliskan alasan:');if(!reason)return;try{await api('/reports',{collection:'messages',id:msg.id,reason});alert('Laporan terkirim.');}catch(e:any){alert(e.message||'Laporan belum terkirim.');}}}>Laporkan pesan ini</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

