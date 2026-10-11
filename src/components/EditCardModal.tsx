import React, { useState, useRef } from 'react';
import { X, Upload, Save, Loader2, Palette, AlertTriangle, AlertCircle, CheckCircle2, User, Quote as QuoteIcon, Shuffle, Check, IdCard, ShieldCheck, BookOpen } from 'lucide-react';
import { doc, setDoc } from '../lib/data';
import { db } from '../lib/firebase';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useAuth } from '../contexts/AuthContext';
import { IDCardCanvas } from './IDCardCanvas';
import { validateMediaFile, compressImageIfNeeded } from '../lib/mediaValidator';
import { UnlockingAnimationModal } from './UnlockingAnimationModal';

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

interface EditCardModalProps {
  student: any;
  onClose: () => void;
  onSuccess: () => void;
  reason?: string | null;
  isNewCard?: boolean;
}

export const EditCardModal: React.FC<EditCardModalProps> = ({ 
  student, 
  onClose, 
  onSuccess,
  reason,
  isNewCard = false
}) => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
  const [nickname, setNickname] = useState(student.nickname || '');
  const [quote, setQuote] = useState(student.quote || '');
  const [tags, setTags] = useState<string>(student.tags?.join(', ') || '');
  
  const [socials, setSocials] = useState({
    ig: student.socials?.ig || '',
    github: student.socials?.github || '',
    wa: student.socials?.wa || '',
    tiktok: student.socials?.tiktok || '',
    facebook: student.socials?.facebook || '',
    telegram: student.socials?.telegram || '',
  });

  const [colors, setColors] = useState({
    bg: student.colors?.bg || '#f8fafc',
    primary: student.colors?.primary || '#00b837',
    secondary: student.colors?.secondary || '#0284c7',
    text: student.colors?.text || '#0f172a',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(student.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!user) return;
    setError('');

    // Strict validation per user requirements:
    // 1. Nama Panggilan Wajib
    if (!nickname.trim()) {
      setError('Nama panggilan wajib diisi untuk kartu pelajar Anda.');
      return;
    }

    // 2. Foto Profil Wajib
    const hasPhoto = Boolean(previewUrl || avatarFile || student.avatarUrl);
    if (!hasPhoto) {
      setError('Foto profil wajib diunggah untuk mengaktifkan kartu pelajar digital.');
      return;
    }

    // 3. Motto / Quote Wajib
    if (!quote.trim()) {
      setError('Motto atau kutipan hidup wajib diisi. Anda dapat memilih dari template yang disediakan.');
      return;
    }

    setLoading(true);
    
    try {
      let finalAvatarUrl = student.avatarUrl || '';
      if (avatarFile) {
        finalAvatarUrl = await uploadToCloudinary(avatarFile);
      }

      const tagsArray = (tags || '').split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0).slice(0, 3);

      const targetId = student?.id || user.uid;
      const updateData: any = {
        name: student.name || user.displayName || 'Siswa',
        nickname: nickname.trim(),
        quote: quote.trim(),
        motto: quote.trim(),
        tags: tagsArray,
        socials,
        avatarUrl: finalAvatarUrl,
        cardCreated: true,
        updatedAt: Date.now()
      };

      if (isAdmin && colors) {
        updateData.colors = colors;
      }

      if (student?.isTeacher || student?.id?.startsWith('guru-') || targetId.startsWith('guru-')) {
        updateData.isTeacher = true;
        updateData.url_gambar = finalAvatarUrl;
        if (student?.nip) updateData.nip = student.nip;
      }

      if (user?.uid) {
        await setDoc(doc(db, 'students', user.uid), updateData, { merge: true });
      }

      // Persist across sessions so student is never asked to mint again
      if (user?.uid) {
        localStorage.setItem(`student_card_minted_${user.uid}`, 'true');
        const emailPrefix = (user.email || '').split('@')[0].replace(/^@/, '');
        const normalizedPrefix = emailPrefix.replace(/[._\-\d]+$/, '');
        if (emailPrefix) {
          localStorage.setItem(`student_card_minted_${emailPrefix}`, 'true');
        }
        if (normalizedPrefix) {
          localStorage.setItem(`student_card_minted_${normalizedPrefix}`, 'true');
        }
      }
      
      setLoading(false);
      if (actualIsNew) {
        setShowUnlockModal(true);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      console.warn('Gagal menyimpan data kartu:', err?.message || err);
      setError(err.message || 'Gagal menyimpan data kartu');
      setLoading(false);
    }
  };

  const previewStudentData = {
    ...student,
    nickname: nickname || student.name?.split(' ')[0] || 'Nama',
    quote,
    tags: (tags || '').split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0).slice(0, 3),
    socials,
    avatarUrl: previewUrl,
    colors
  };

  const actualIsNew = isNewCard || !student?.cardCreated;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden font-sans flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {actualIsNew ? 'Buat Kartu Pelajar Digital' : 'Edit Kartu Siswa'}
              </h3>
              {actualIsNew && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Wajib Aktivasi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {actualIsNew 
                ? 'Lengkapi profil kartu identitas Anda untuk mengaktifkan seluruh fitur angkatan.' 
                : 'Sesuaikan profil dan tampilan kartu publik Anda.'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason Alert Banner (if opened due to feature lock) */}
        {reason && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              {reason}
            </p>
          </div>
        )}

        {/* Media Warning Banner */}
        {warning && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              {warning}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Left: Live Preview */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Preview Kartu Pelajar
            </h4>
            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-inner">
              <div className="w-full transform scale-100 origin-top">
                <IDCardCanvas student={previewStudentData} />
              </div>
            </div>
            
            <div className="mt-4 flex flex-col items-center p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl">
              <div className="w-full flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  Foto Profil Kartu <span className="text-rose-500 font-bold text-[11px]">* (Wajib)</span>
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  previewUrl 
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {previewUrl ? 'Foto Terpasang' : 'Profil Kosong'}
                </span>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 ${
                  previewUrl 
                    ? 'border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800' 
                    : 'border-rose-300 dark:border-rose-800/80 bg-rose-50/30 dark:bg-rose-950/10'
                } flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all relative overflow-hidden group shadow-sm`}
              >
                {previewUrl && previewUrl.trim() !== '' ? (
                  <>
                    <img src={previewUrl} alt="Preview Foto Profil" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <Upload className="w-5 h-5 text-white" />
                      <span className="text-[10px] text-white font-bold">Ganti Foto</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-1.5">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" /> Pilih Foto
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Wajib Diunggah</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                Wajib foto asli siswa. Format JPG/PNG/WebP maks 5MB.
              </p>
            </div>
          </div>

          {/* Right: Form Fields */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Panggilan <span className="text-rose-500 font-bold">* (Wajib)</span>
              </label>
              <input 
                type="text" 
                value={nickname}
                onChange={e => {
                  setNickname(e.target.value);
                  if (error && e.target.value.trim()) setError('');
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-sm text-slate-900 dark:text-white"
                placeholder="Misal: Ahmad"
              />
              <p className="text-[10px] text-slate-400 mt-1">Nama panggilan akrab yang akan tercetak di bagian depan kartu identitas.</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kutipan / Motto Hidup <span className="text-rose-500 font-bold">* (Wajib)</span>
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-sm text-slate-900 dark:text-white resize-none"
                placeholder="Tuliskan motto inspiratif atau pilih dari template di bawah..."
              ></textarea>

              {/* Quote Templates */}
              {showTemplates && (
                <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <QuoteIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Koleksi Pilihan Motto &amp; Kutipan:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
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
                          className={`text-left p-1.5 rounded-lg border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-medium'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              {item.label}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tags / Minat / Keahlian <span className="text-slate-400 font-normal text-[11px]">(Bebas / Opsional, maks 3)</span>
              </label>
              <input 
                type="text" 
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-sm text-slate-900 dark:text-white"
                placeholder="Misal: Web Dev, Futsal, Musik"
              />
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Sosial Media <span className="text-slate-400 font-normal text-[11px]">(Bebas / Opsional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 overflow-hidden focus-within:border-emerald-500">
                  <span className="text-slate-400 text-xs">@</span>
                  <input 
                    type="text" 
                    value={socials.ig}
                    onChange={e => setSocials({...socials, ig: e.target.value})}
                    className="w-full px-2 py-2 bg-transparent focus:outline-none text-xs text-slate-900 dark:text-white"
                    placeholder="Instagram"
                  />
                </div>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 overflow-hidden focus-within:border-emerald-500">
                  <span className="text-slate-400 text-xs">@</span>
                  <input 
                    type="text" 
                    value={socials.github}
                    onChange={e => setSocials({...socials, github: e.target.value})}
                    className="w-full px-2 py-2 bg-transparent focus:outline-none text-xs text-slate-900 dark:text-white"
                    placeholder="GitHub"
                  />
                </div>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 overflow-hidden focus-within:border-emerald-500">
                  <span className="text-slate-400 text-xs">@</span>
                  <input 
                    type="text" 
                    value={socials.tiktok}
                    onChange={e => setSocials({...socials, tiktok: e.target.value})}
                    className="w-full px-2 py-2 bg-transparent focus:outline-none text-xs text-slate-900 dark:text-white"
                    placeholder="TikTok"
                  />
                </div>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 overflow-hidden focus-within:border-emerald-500">
                  <span className="text-slate-400 text-xs">+</span>
                  <input 
                    type="text" 
                    value={socials.wa}
                    onChange={e => setSocials({...socials, wa: e.target.value})}
                    className="w-full px-2 py-2 bg-transparent focus:outline-none text-xs text-slate-900 dark:text-white"
                    placeholder="WhatsApp (62...)"
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-500" />
                  Pengaturan Warna Kartu (Admin)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Background</label>
                    <input type="color" value={colors.bg} onChange={e => setColors({...colors, bg: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Primary Wave</label>
                    <input type="color" value={colors.primary} onChange={e => setColors({...colors, primary: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Secondary Wave</label>
                    <input type="color" value={colors.secondary} onChange={e => setColors({...colors, secondary: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Text Color</label>
                    <input type="color" value={colors.text} onChange={e => setColors({...colors, text: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {actualIsNew ? 'Kartu akan langsung terdaftar di sistem angkatan.' : 'Perubahan akan otomatis tersinkron.'}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : actualIsNew ? (
                <IdCard className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {actualIsNew ? 'Terbitkan & Aktifkan Kartu' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>

      {/* Cinematic Unlocking Sequence Modal */}
      <UnlockingAnimationModal
        isOpen={showUnlockModal}
        studentName={nickname || student.name || 'Siswa'}
        onComplete={() => {
          setShowUnlockModal(false);
          onSuccess();
        }}
      />
    </div>
  );
};

