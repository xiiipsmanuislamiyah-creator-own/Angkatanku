import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Network, 
  LayoutGrid, 
  Briefcase, 
  BookOpen, 
  School
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query } from '../lib/data';
import { INITIAL_TEACHERS, Teacher, getTeacherInitials, getTeacherAvatarColor } from '../data/teachersData';

interface ConceptNodeProps {
  teacher: Teacher; 
  level?: 'kepala' | 'pimpinan' | 'guru';
  customBadge?: string;
  isDimmed?: boolean;
  isAdmin?: boolean;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

function ConceptNode({ 
  teacher, 
  level = 'guru',
  customBadge,
  isDimmed,
  isAdmin,
  onClick,
  onEdit,
  onDelete
}: ConceptNodeProps) {
  const initials = getTeacherInitials(teacher.nama);
  const bgGrad = getTeacherAvatarColor(teacher.nama);

  return (
    <div
      onClick={onClick}
      className={`group relative transition-all duration-200 select-none cursor-pointer ${
        isDimmed ? 'opacity-30 grayscale' : 'opacity-100'
      }`}
    >
      <div className={`flex items-center gap-2.5 p-2 rounded-xl border bg-white dark:bg-slate-900 transition-all group-hover:border-teal-500/60 group-hover:shadow-xs ${
        level === 'kepala'
          ? 'border-amber-400/80 dark:border-amber-500/60 shadow-xs ring-1 ring-amber-400/20'
          : level === 'pimpinan'
          ? 'border-teal-400/60 dark:border-teal-500/50 shadow-2xs'
          : 'border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}>
        
        {/* Avatar Squircle Kecil dengan Fallback Inisial Resmi */}
        <div className={`relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br ${bgGrad} flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-2xs`}>
          <span className="font-bold text-white text-[11px] font-mono tracking-wider select-none">
            {initials}
          </span>
          {teacher.url_gambar && teacher.url_gambar.trim() !== '' && (
            <img 
              src={teacher.url_gambar} 
              alt={teacher.nama} 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          )}
        </div>

        {/* Data Teks Kecil Ringkas */}
        <div className="min-w-0 flex-1 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.2 rounded ${
              level === 'kepala'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : level === 'pimpinan'
                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {customBadge || teacher.jabatan || teacher.title}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
            {teacher.nama}
          </p>
        </div>

        {/* Admin Controls */}
        {isAdmin && onEdit && onDelete && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 shrink-0 ml-1">
            <button
              onClick={onEdit}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              title="Edit"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
              title="Hapus"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Guru({ onNavigate }: { onNavigate?: (tab: string, name?: string, data?: any) => void }) {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'mindmap' | 'grid'>('grid');
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [loading, setLoading] = useState(false);

  // Admin states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>({
    nama: '',
    title: 'Guru',
    jabatan: '',
    url_gambar: ''
  });

  const fetchTeachers=async()=>{setLoading(true);try{const snap=await getDocs(collection(db,'teachers'));setTeachers(snap.empty?INITIAL_TEACHERS:snap.docs.map(d=>({...d.data(),id:d.id,nama:d.data().nama||d.data().name||'Guru',title:d.data().title||'Guru',url_gambar:d.data().url_gambar||d.data().avatarUrl||''})) as Teacher[]);}catch{setTeachers(INITIAL_TEACHERS);}finally{setLoading(false);}};

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Hierarchical clustering for concept map
  const { kepalaSekolah, pimpinanStaf, dewanGuru } = useMemo(() => {
    const kepala = teachers.find(t => 
      t.title.toLowerCase().includes('kepala sekolah') || 
      t.title.toLowerCase().includes('kepala madrasah') || 
      t.nama.toLowerCase().includes('abdul holik')
    ) || teachers[0];
    const staf = teachers.filter(t => 
      t.id !== kepala?.id && (
        t.title.toLowerCase().includes('operator') || 
        t.title.toLowerCase().includes('wakil kepala') ||
        (t.jabatan && (t.jabatan.toLowerCase().includes('kurikulum') || t.jabatan.toLowerCase().includes('kesiswaan') || t.jabatan.toLowerCase().includes('humas') || t.jabatan.toLowerCase().includes('bendahara') || t.jabatan.toLowerCase().includes('waka')))
      )
    );
    const guru = teachers.filter(t => t.id !== kepala?.id && !staf.some(s => s.id === t.id));
    return { kepalaSekolah: kepala, pimpinanStaf: staf, dewanGuru: guru };
  }, [teachers]);

  const matchesSearch = (t: Teacher) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.nama.toLowerCase().includes(term) ||
      t.title.toLowerCase().includes(term) ||
      (t.jabatan && t.jabatan.toLowerCase().includes(term))
    );
  };

  const filteredTeachers = teachers.filter(matchesSearch);

  const handleSave=async(e:React.FormEvent)=>{e.preventDefault();if(!editingId){alert('Buat akun guru melalui Pusat Kontrol Keamanan.');return;}try{await updateDoc(doc(db,'teachers',editingId),{nama:formData.nama||'',title:formData.title||'Guru',jabatan:formData.jabatan||'',url_gambar:formData.url_gambar||''});setShowModal(false);setEditingId(null);await fetchTeachers();}catch(e:any){alert(e.message||'Perubahan belum tersimpan.');}};
  const handleDelete=async(_id:string,e:React.MouseEvent)=>{e.stopPropagation();alert('Untuk mencabut akses guru, gunakan suspend atau ban di Pusat Kontrol Keamanan.');};

  const openEdit = (t: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(t.id);
    setFormData({
      nama: t.nama,
      title: t.title,
      jabatan: t.jabatan || '',
      url_gambar: t.url_gambar
    });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      nama: '',
      title: 'Guru',
      jabatan: '',
      url_gambar: ''
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 pb-28 max-w-7xl mx-auto">
      {/* Control Bar: Ringkas & Elegan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white leading-none">
              Peta Struktur Dewan Pendidik
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              {teachers.length} Pendidik &bull; MA NU Islamiyah Asembagus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pencarian */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Sorot nama guru..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs focus:outline-none focus:border-slate-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Toggle View Mode */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('mindmap')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'mindmap' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Tampilan Peta Konsep"
            >
              <Network className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono hidden md:inline">Peta</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Tampilan Kotak Mini"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono hidden md:inline">Grid</span>
            </button>
          </div>

          {/* Admin Tambah */}
          {isAdmin && (
            <button
              onClick={openAdd}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
              title="Tambah Data"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : viewMode === 'mindmap' ? (
        /* ================= TAMPILAN PETA KONSEP (MIND MAP / TREE) ================= */
        <div className="relative bg-slate-50/50 dark:bg-slate-950/40 p-4 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-x-auto min-w-[320px]">
          
          {/* 1. NODE INDUK UTAMA (Madrasah) */}
          <div className="flex flex-col items-center">
            <div className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-xs">
              <School className="w-3.5 h-3.5 text-emerald-400" />
              <span>MA NU ISLAMIYAH ASEMBAGUS</span>
            </div>

            {/* Garis Vertikal Induk Bermotif Glowing Seperti Mading IPS 1 & 2 */}
            <div className="relative flex flex-col items-center py-1">
              <svg width="24" height="32" viewBox="0 0 24 32" fill="none" className="overflow-visible">
                <defs>
                  <linearGradient id="tree-grad-vert" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <line x1="12" y1="0" x2="12" y2="32" stroke="url(#tree-grad-vert)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="16" r="6" fill="#10b981" opacity="0.25" />
                <circle cx="12" cy="16" r="3" fill="#10b981" stroke="#34d399" strokeWidth="1.5" />
              </svg>
            </div>

            {/* 2. NODE KEPALA MADRASAH (Tanpa Icon Mahkota) */}
            {kepalaSekolah && (
              <div className="w-full max-w-xs">
                <ConceptNode 
                  teacher={kepalaSekolah} 
                  level="kepala" 
                  customBadge="Kepala Sekolah"
                  isDimmed={searchTerm.trim() !== '' && !matchesSearch(kepalaSekolah)}
                  isAdmin={isAdmin}
                  onClick={() => onNavigate && onNavigate('public-profile', kepalaSekolah.nama, kepalaSekolah.id)}
                  onEdit={(e) => openEdit(kepalaSekolah, e)}
                  onDelete={(e) => handleDelete(kepalaSekolah.id, e)}
                />
              </div>
            )}

            {/* Cabang Garis Lengkung Organik Seperti Struktur Kelas IPS 1 & 2 */}
            <div className="w-full max-w-5xl flex flex-col items-center">
              {/* Hub Tengah di Bawah Kepala Sekolah */}
              <div className="relative flex items-center justify-center -mb-1 z-10">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shadow-xs" />
              </div>

              {/* Desktop Curved SVG Branches */}
              <div className="w-full h-16 hidden md:block relative">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 64">
                  <defs>
                    <linearGradient id="tree-grad-left" x1="50%" y1="0%" x2="16%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                    <linearGradient id="tree-grad-right" x1="50%" y1="0%" x2="66%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>

                  {/* Aura Glow Paths */}
                  <path d="M 500 0 C 500 36, 166 30, 166 64" fill="none" stroke="#10b981" strokeWidth="6" opacity="0.15" />
                  <path d="M 500 0 C 500 36, 666 30, 666 64" fill="none" stroke="#0284c7" strokeWidth="6" opacity="0.15" />

                  {/* Main Curved Threads */}
                  <path d="M 500 0 C 500 36, 166 30, 166 64" fill="none" stroke="url(#tree-grad-left)" strokeWidth="2.4" strokeLinecap="round" />
                  <path d="M 500 0 C 500 36, 666 30, 666 64" fill="none" stroke="url(#tree-grad-right)" strokeWidth="2.4" strokeLinecap="round" />

                  {/* End Junction Hubs */}
                  <circle cx="166" cy="62" r="4.5" fill="#0d9488" stroke="#5eead4" strokeWidth="1.8" />
                  <circle cx="666" cy="62" r="4.5" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.8" />
                </svg>
              </div>

              {/* Mobile Fallback Clean Vertical Connector */}
              <div className="block md:hidden h-8 w-px bg-gradient-to-b from-emerald-500 to-teal-500 my-1" />
            </div>

            {/* DUA CABANG STRUKTUR UTAMA */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl mt-px">
              
              {/* CABANG KIRI: MANAJEMEN & KURIKULUM (4 Kolom) */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="w-full bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-teal-200/60 dark:border-teal-900/40 space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <Briefcase className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-teal-800 dark:text-teal-300">
                      Manajemen &amp; Administrasi
                    </span>
                  </div>

                  <div className="space-y-2">
                    {pimpinanStaf.map(staf => (
                      <div key={staf.id}>
                        <ConceptNode 
                          teacher={staf} 
                          level="pimpinan"
                          isDimmed={searchTerm.trim() !== '' && !matchesSearch(staf)}
                          isAdmin={isAdmin}
                          onClick={() => onNavigate && onNavigate('public-profile', staf.nama, staf.id)}
                          onEdit={(e) => openEdit(staf, e)}
                          onDelete={(e) => handleDelete(staf.id, e)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CABANG KANAN: DEWAN GURU MATA PELAJARAN (8 Kolom) */}
              <div className="md:col-span-8 flex flex-col items-center">
                <div className="w-full bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Dewan Guru Mata Pelajaran
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dewanGuru.length} Pengajar
                    </span>
                  </div>

                  {/* Node Grid Kecil-Kecil Berkelompok */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {dewanGuru.map(guru => (
                      <div key={guru.id}>
                        <ConceptNode 
                          teacher={guru} 
                          level="guru"
                          isDimmed={searchTerm.trim() !== '' && !matchesSearch(guru)}
                          isAdmin={isAdmin}
                          onClick={() => onNavigate && onNavigate('public-profile', guru.nama, guru.id)}
                          onEdit={(e) => openEdit(guru, e)}
                          onDelete={(e) => handleDelete(guru.id, e)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* ================= TAMPILAN GRID KOTAK KECIL ================= */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {filteredTeachers.map(teacher => {
            const initials = getTeacherInitials(teacher.nama);
            const bgGrad = getTeacherAvatarColor(teacher.nama);

            return (
              <div
                key={teacher.id}
                onClick={() => onNavigate && onNavigate('public-profile', teacher.nama, teacher.id)}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 hover:border-teal-500/70 dark:hover:border-teal-400/60 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className={`aspect-square w-full rounded-lg bg-gradient-to-br ${bgGrad} overflow-hidden mb-2 relative flex items-center justify-center shadow-inner`}>
                  <span className="font-bold text-white text-base sm:text-lg font-mono tracking-wider select-none">
                    {initials}
                  </span>
                  {teacher.url_gambar && teacher.url_gambar.trim() !== '' && (
                    <img 
                      src={teacher.url_gambar} 
                      alt={teacher.nama} 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                      className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                    {teacher.nama}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono line-clamp-1 mt-0.5">
                    {teacher.jabatan || teacher.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Tambah / Edit untuk Admin */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-800 dark:text-white">
                {editingId ? 'Edit Node Pengajar' : 'Tambah Node Pengajar'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-0.5">Nama &amp; Gelar</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nama || ''} 
                  onChange={e => setFormData({...formData, nama: e.target.value})} 
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-0.5">Title (Kepala Sekolah / Guru / Operator)</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title || ''} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-0.5">Jabatan (Opsional)</label>
                <input 
                  type="text" 
                  value={formData.jabatan || ''} 
                  onChange={e => setFormData({...formData, jabatan: e.target.value})} 
                  placeholder="Misal: Waka Kurikulum"
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-0.5">URL Foto</label>
                <input 
                  required 
                  type="text" inputMode="url" 
                  value={formData.url_gambar || ''} 
                  onChange={e => setFormData({...formData, url_gambar: e.target.value})} 
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer">
                  Batal
                </button>
                <button type="submit" className="px-3 py-1 text-xs text-white bg-emerald-600 rounded-lg cursor-pointer">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
