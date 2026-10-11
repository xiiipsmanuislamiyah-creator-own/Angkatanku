import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, Loader2, ArrowRight, User as UserIcon, AlertTriangle, BookOpen, Shuffle, Quote as QuoteIcon, Check } from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from '../lib/data';
import { db } from '../lib/firebase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../contexts/AuthContext';
import { IDCardCanvas } from '../components/IDCardCanvas';
import { validateMediaFile, compressImageIfNeeded } from '../lib/mediaValidator';
import { UnlockingAnimationModal } from '../components/UnlockingAnimationModal';

const QUOTE_TEMPLATES = [
  { label: 'Masa Depan', text: 'Masa depan adalah milik mereka yang percaya pada keindahan impiannya.' },
  { label: 'Konsistensi', text: 'Langkah kecil yang konsisten setiap hari menghasilkan lompatan besar.' },
  { label: 'Kemanfaatan', text: 'Sebaik-baik manusia adalah yang paling bermanfaat bagi sesama.' },
  { label: 'Pendidikan', text: 'Belajar bukan sekadar mengejar nilai, melainkan bekal menjalani kehidupan.' },
  { label: 'Religius', text: 'Berani bermimpi besar, gigih berproses, dan tawakal dalam setiap ikhtiar.' },
  { label: 'Solidaritas', text: 'Hargai setiap proses dan ciptakan kenangan terbaik bersama angkatan.' },
  { label: 'Ketekunan', text: 'Bukan tentang siapa yang tercepat, melainkan siapa yang pantang menyerah.' },
  { label: 'Adab', text: 'Ilmu tanpa adab ibarat pohon rindang tanpa buah.' },
  { label: 'Ketangguhan', text: 'Jadikan setiap tantangan sebagai batu pijakan menuju kedewasaan.' },
  { label: 'Persaudaraan', text: 'Solidaritas, integritas, dan doa adalah kunci keberhasilan bersama.' },
];

export default function CardSetup({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user, isAdmin, currentStudent, refreshStudent } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [student, setStudent] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
  const [nickname, setNickname] = useState('');
  const [quote, setQuote] = useState('');
  const [tags, setTags] = useState('');
  
  const [socials, setSocials] = useState({
    ig: '', github: '', wa: '', tiktok: '', facebook: '', telegram: ''
  });
  const [colors, setColors] = useState({
    bg: '#f8fafc', primary: '#00b837', secondary: '#0284c7', text: '#0f172a'
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchStudent = async () => {
      try {
        let data: any = null;
        let id = user.uid;

        const d = await getDoc(doc(db, 'students', user.uid));
        if (d.exists()) {
          data = { id: d.id, ...d.data() };
        } else if (currentStudent) {
          data = { ...currentStudent, id: currentStudent.id || user.uid };
        } else {
          // Check by email prefix or username
          const emailPrefix = (user.email || '').split('@')[0].replace(/^@/, '');
          const qUname = query(collection(db, 'students'), where('username', '==', `@${emailPrefix}`));
          const snapU = await getDocs(qUname);
          if (!snapU.empty) {
            data = { id: snapU.docs[0].id, ...snapU.docs[0].data() };
          }
        }

        if (data) {
          setStudent(data);
          setNickname(data.nickname || data.name?.split(' ')[0] || '');
          setQuote(data.quote || data.motto || '');
          setTags(data.tags?.join(', ') || '');
          setSocials({
            ig: data.socials?.ig || '',
            github: data.socials?.github || '',
            wa: data.socials?.wa || '',
            tiktok: data.socials?.tiktok || '',
            facebook: data.socials?.facebook || '',
            telegram: data.socials?.telegram || '',
          });
          setColors({
            bg: data.colors?.bg || '#f8fafc',
            primary: data.colors?.primary || '#00b837',
            secondary: data.colors?.secondary || '#0284c7',
            text: data.colors?.text || '#0f172a',
          });
          setPreviewUrl(data.avatarUrl || '');
        }
      } catch (err: any) {
        console.warn("Notice fetching student in CardSetup:", err?.message || err);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchStudent();
  }, [user, currentStudent]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setError('');
      setWarning('');

      const validation = validateMediaFile(file);
      if (!validation.allowed) {
        setError(validation.error || 'File ditolak karena ukuran melebihi batas 8 MB.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (validation.shouldCompress) {
        setWarning(validation.warning || 'Foto beresolusi tinggi terdeteksi, dikompresi otomatis.');
      }

      try {
        const processedFile = await compressImageIfNeeded(file);
        setAvatarFile(processedFile);
        setPreviewUrl(URL.createObjectURL(processedFile));
      } catch {
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleSave = async () => {
    if (!user || !student) return;
    setError('');

    // Strict validation per user requirements:
    if (!nickname.trim()) {
      setError('Nama panggilan wajib diisi untuk kartu pelajar Anda.');
      return;
    }

    const hasPhoto = Boolean(previewUrl || avatarFile || student.avatarUrl);
    if (!hasPhoto) {
      setError('Foto profil wajib diunggah untuk mengaktifkan kartu pelajar.');
      return;
    }

    if (!quote.trim()) {
      setError('Motto atau kutipan hidup wajib diisi. Silakan pilih dari template yang tersedia.');
      return;
    }

    setLoading(true);
    
    try {
      let finalAvatarUrl = student.avatarUrl;
      if (avatarFile) {
        finalAvatarUrl = await uploadToCloudinary(avatarFile);
      }
      
      const tagsArray = (tags || '').split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);
      
      const targetId = student?.id || user.uid;
      const updateData: any = {
        name: student?.name || user.displayName || 'Siswa',
        nickname: (nickname || '').trim(),
        quote: (quote || '').trim(),
        motto: (quote || '').trim(),
        tags: tagsArray || [],
        socials: socials || {},
        avatarUrl: finalAvatarUrl || '',
        cardCreated: true,
        updatedAt: Date.now()
      };
      
      if (isAdmin && colors) {
        updateData.colors = colors;
      }

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Always save directly to current user document
      await setDoc(doc(db, 'students', user.uid), updateData, { merge: true });

      // Persist across sessions so user is never asked to mint again
      const emailPrefix = (user.email || '').split('@')[0].replace(/^@/, '');
      const normalizedPrefix = emailPrefix.replace(/[._\-\d]+$/, '');
      localStorage.setItem(`student_card_minted_${user.uid}`, 'true');
      if (emailPrefix) {
        localStorage.setItem(`student_card_minted_${emailPrefix}`, 'true');
      }
      if (normalizedPrefix) {
        localStorage.setItem(`student_card_minted_${normalizedPrefix}`, 'true');
      }

      if (refreshStudent) {
        await refreshStudent();
      }

      setLoading(false);
      setShowUnlockModal(true);
    } catch (err: any) {
      console.warn('CardSetup error:', err?.message || err);
      setError(err.message || 'Gagal menyimpan');
      setLoading(false);
    }
  };

  if (loadingData) return <div className="min-h-screen flex items-center justify-center font-medium">Memuat data kartu...</div>;
  if (!student) return <div className="min-h-screen flex items-center justify-center font-medium">Data siswa tidak ditemukan.</div>;

  const previewStudentData = {
    ...student,
    nickname,
    quote,
    tags: (tags || '').split(',').map(t => t.trim()).filter(t => t.length > 0).slice(0, 3),
    socials,
    avatarUrl: previewUrl,
    colors
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 pt-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Setup Kartu Pelajar Digital</h1>
        <p className="text-slate-500">Personalisasi kartu identitas Anda sebelum masuk ke Galeri Mading Angkatan.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Form Column */}
        <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          
          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                Foto Profil Siswa <span className="text-rose-500 font-bold">* (Wajib)</span>
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                previewUrl 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {previewUrl ? 'Foto Terpasang' : 'Profil Kosong'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-20 h-20 rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer border-2 ${
                  previewUrl 
                    ? 'border-emerald-400 dark:border-emerald-600 bg-slate-100 dark:bg-slate-800' 
                    : 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                } group relative shadow-xs`}
              >
                {previewUrl && previewUrl.trim() !== '' ? (
                  <>
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview Foto" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-1">
                    <UserIcon className="w-7 h-7 text-slate-400 mb-0.5" />
                    <span className="text-[9px] text-rose-500 font-bold">Wajib</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} className="hidden" />
              <div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()} 
                  className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> {previewUrl ? 'Ganti Foto Profil' : 'Pilih Foto Profil'}
                </button>
                <p className="text-[11px] text-slate-400 mt-1">Rasio 1:1 persegi atau foto portrait formal siswa.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Nama Panggilan <span className="text-rose-500 font-bold">* (Wajib)</span>
              </label>
              <input 
                type="text" 
                value={nickname} 
                onChange={e => {
                  setNickname(e.target.value);
                  if (error && e.target.value.trim()) setError('');
                }} 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-700 text-sm focus:border-emerald-500" 
                placeholder="Cth: Budi" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Tag Minat <span className="text-slate-400 font-normal text-[10px]">(Bebas / Opsional, max 3)</span>
              </label>
              <input 
                type="text" 
                value={tags} 
                onChange={e => setTags(e.target.value)} 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-700 text-sm focus:border-emerald-500" 
                placeholder="Cth: Gamer, Ambis, Santuy" 
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold">
                  Motto / Kutipan Hidup <span className="text-rose-500 font-bold">* (Wajib)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const randomIndex = Math.floor(Math.random() * QUOTE_TEMPLATES.length);
                      setQuote(QUOTE_TEMPLATES[randomIndex].text);
                      if (error) setError('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                    title="Pilih quote acak"
                  >
                    <Shuffle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Quote Acak</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <BookOpen className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    <span>{showTemplates ? 'Tutup Koleksi' : 'Pilih Koleksi'}</span>
                  </button>
                </div>
              </div>
              <textarea 
                value={quote} 
                onChange={e => {
                  setQuote(e.target.value);
                  if (error && e.target.value.trim()) setError('');
                }} 
                rows={2} 
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none border border-slate-200 dark:border-slate-700 resize-none text-sm focus:border-emerald-500" 
                placeholder="Tuliskan motto inspiratif atau pilih salah satu dari template di bawah..." 
              />

              {showTemplates && (
                <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <QuoteIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Koleksi Pilihan Motto &amp; Kutipan:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                    {QUOTE_TEMPLATES.map((item, idx) => {
                      const isSelected = quote === item.text;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQuote(item.text);
                            if (error) setError('');
                          }}
                          className={`text-left p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-medium'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              {item.label}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                          </div>
                          <span className="text-[11px] leading-tight line-clamp-2">
                            "{item.text}"
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-sm mb-3">
              Sosial Media <span className="text-slate-400 font-normal text-xs">(Bebas / Opsional)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Instagram</label>
                <input type="text" value={socials.ig} onChange={e => setSocials({...socials, ig: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none text-sm" placeholder="@username" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">WhatsApp</label>
                <input type="text" value={socials.wa} onChange={e => setSocials({...socials, wa: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none text-sm" placeholder="628..." />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tiktok</label>
                <input type="text" value={socials.tiktok} onChange={e => setSocials({...socials, tiktok: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none text-sm" placeholder="@username" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Github</label>
                <input type="text" value={socials.github} onChange={e => setSocials({...socials, github: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg outline-none text-sm" placeholder="username" />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-emerald-600 mb-3 flex items-center gap-2">Admin Color Override</h4>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Background</label>
                   <div className="flex gap-2">
                     <input type="color" value={colors.bg} onChange={e => setColors({...colors, bg: e.target.value})} className="w-8 h-8 rounded" />
                     <input type="text" value={colors.bg} onChange={e => setColors({...colors, bg: e.target.value})} className="w-full px-2 text-xs bg-slate-50 rounded" />
                   </div>
                 </div>
                 <div>
                   <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Primary</label>
                   <div className="flex gap-2">
                     <input type="color" value={colors.primary} onChange={e => setColors({...colors, primary: e.target.value})} className="w-8 h-8 rounded" />
                     <input type="text" value={colors.primary} onChange={e => setColors({...colors, primary: e.target.value})} className="w-full px-2 text-xs bg-slate-50 rounded" />
                   </div>
                 </div>
              </div>
            </div>
          )}

          {error && <p className="text-rose-500 text-sm font-semibold">{error}</p>}
          
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Simpan & Lanjutkan</>}
          </button>
          
          <button 
            onClick={() => onNavigate('home')}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2 text-slate-600 dark:text-slate-300"
          >
            Nanti Saja <ArrowRight className="w-4 h-4" />
          </button>

        </div>

        {/* Live Preview Column */}
        <div className="sticky top-20 h-max flex items-center justify-center bg-slate-900 rounded-3xl p-4 sm:p-8 overflow-hidden border-4 border-slate-800">
           <div className="w-full max-w-lg origin-center" style={{ transform: 'scale(0.8)' }}>
             <IDCardCanvas student={previewStudentData} />
           </div>
        </div>
        
      </div>

      {/* Cinematic Unlocking Sequence Modal */}
      <UnlockingAnimationModal
        isOpen={showUnlockModal}
        studentName={nickname || student.name || 'Siswa'}
        onComplete={() => {
          setShowUnlockModal(false);
          onNavigate('profile');
        }}
      />
    </div>
  );
}
