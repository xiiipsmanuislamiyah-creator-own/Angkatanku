import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  BookOpen, 
  Music, 
  Globe, 
  Calendar, 
  User,
  Medal,
  Plus,
  Trash2,
  Loader2,
  Edit2
} from 'lucide-react';
import { Achievement } from '../data/dummyData';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy } from '../lib/data';

export default function Prestasi() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('Semua');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Achievement>>({
    title: '',
    category: 'Akademik',
    winner: '',
    rank: '',
    date: '',
    description: '',
    badge: 'award'
  });

  const categories = ['Semua', 'Akademik', 'Non Akademik', 'Organisasi'];

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'achievements')));
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
      // sort by date desc string comparison (basic)
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.date.localeCompare(a.date));
      setAchievements(data);
    } catch (error: any) {
      console.warn("Notice: Could not fetch achievements from Firestore:", error?.message || error);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const filteredAchievements = activeTab === 'Semua' ? achievements : achievements.filter(a => a.category === activeTab);

  const getAchievementIcon = (badgeName: string) => {
    switch (badgeName) {
      case 'award': return <Award className="w-6 h-6 text-yellow-500" />;
      case 'music': return <Music className="w-6 h-6 text-pink-500" />;
      case 'globe': return <Globe className="w-6 h-6 text-emerald-500" />;
      case 'book-open': return <BookOpen className="w-6 h-6 text-cyan-500" />;
      default: return <Trophy className="w-6 h-6 text-amber-500" />;
    }
  };

  const getBadgeBg = (cat: string) => {
    switch (cat) {
      case 'Akademik': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'Non Akademik': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    }
  };

  
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'achievements', editingId), formData);
      } else {
        await addDoc(collection(db, 'achievements'), formData);
      }
      setShowModal(false);
      setEditingId(null);
      fetchAchievements();
    } catch (err: any) {
      console.warn('Gagal menyimpan prestasi:', err?.message || err);
      alert('Terjadi kesalahan saat menyimpan data.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus prestasi ini?')) return;
    try {
      // If it's a dummy item, we can't delete it from firestore
      if (id.startsWith('ach')) {
         alert('Data bawaan tidak dapat dihapus.');
         return;
      }
      await deleteDoc(doc(db, 'achievements', id));
      fetchAchievements();
    } catch (err: any) {
      console.warn('Gagal menghapus prestasi:', err?.message || err);
      alert('Terjadi kesalahan.');
    }
  };

  const openEdit = (ach: Achievement) => {
     setEditingId(ach.id);
     setFormData(ach);
     setShowModal(true);
  };

  const openAdd = () => {
     setEditingId(null);
     setFormData({
        title: '',
        category: 'Akademik',
        winner: '',
        rank: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        badge: 'award'
     });
     setShowModal(true);
  };

  return (
    <div className="space-y-12 relative pb-24">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-mono font-medium">
          HONORS & MILESTONE TROPHIES
        </div>
        <h2 className="text-3xl font-bold text-slate-800 font-display">Daftar Prestasi & Penghargaan</h2>
        <p className="text-slate-500 text-sm">
          Apresiasi setinggi-tingginya untuk seluruh perwakilan kelas XII IPS yang sukses mendulang medali, mengukir prestasi akademik, maupun menggagas prakarsa sosial.
        </p>
      </div>

      <div className="space-y-8 max-w-5xl mx-auto relative">
        {isAdmin && (
          <div className="flex justify-center mb-4">
             <button
               onClick={openAdd}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
             >
                <Plus className="w-4 h-4" />
                Tambah Prestasi
             </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex justify-start md:justify-center items-center pb-2 overflow-x-auto hide-scrollbar gap-1.5 px-1 border-b border-slate-100 pb-4">
          {categories.map((cat) => {
            const isSelected = cat === activeTab;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold select-none cursor-pointer tracking-wider transition-all uppercase ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {loading ? (
           <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAchievements.map((ach) => {
              return (
                <div 
                  key={ach.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-6 flex items-start gap-4 hover:border-archive-teal/40 hover:shadow-lg transition-all duration-300 group relative"
                >
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => openEdit(ach)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer">
                          <Edit2 className="w-3.5 h-3.5" />
                       </button>
                       <button onClick={() => handleDelete(ach.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  )}

                  {/* Trophy container */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-300">
                    {getAchievementIcon(ach.badge)}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1 pr-10">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm border ${getBadgeBg(ach.category)}`}>
                          {ach.category}
                        </span>
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(ach.date)}
                        </div>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800 leading-snug font-display group-hover:text-archive-teal transition-colors pt-1">
                        {ach.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-archive-sky font-semibold pt-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ach.winner} ({ach.rank})</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal border-t border-slate-100 pt-3">
                      {ach.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredAchievements.length === 0 && (
          <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8 space-y-2">
            <Medal className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-400 font-mono">BELUM_ADA_RIWAYAT_PENYEMATAN</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Papan prestasi saat ini masih kosong. Silakan tambahkan prestasi atau penghargaan baru.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
           <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800">{editingId ? 'Edit Prestasi' : 'Tambah Prestasi'}</h3>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Judul Prestasi</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                        <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                           <option value="Akademik">Akademik</option>
                           <option value="Non Akademik">Non Akademik</option>
                           <option value="Organisasi">Organisasi</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
                        <input required type="text" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} placeholder="Mis: 12 Nov 2025" className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Pemenang</label>
                        <input required type="text" value={formData.winner} onChange={e => setFormData({...formData, winner: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Peringkat / Role</label>
                        <input required type="text" value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Ikon Badge</label>
                    <select required value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                       <option value="award">Award (Kuning)</option>
                       <option value="trophy">Trophy (Oren)</option>
                       <option value="book-open">Buku (Cyan)</option>
                       <option value="music">Seni/Musik (Pink)</option>
                       <option value="globe">Global/Umum (Hijau)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Deskripsi</label>
                    <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 h-20 resize-none"></textarea>
                 </div>
                 <div className="pt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 cursor-pointer">Batal</button>
                    <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">Simpan</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
