import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary } from '../lib/cloudinary';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from '../lib/data';
import { useAuth } from '../contexts/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any | null; 
  onSuccess: () => void;
}

export default function EditProfileModal({ isOpen, onClose, student, onSuccess }: EditProfileModalProps) {
  const { user } = useAuth();
  
  const [motto, setMotto] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [favoriteSubject, setFavoriteSubject] = useState('');
  const [socialTag, setSocialTag] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user && student) {
       const fetchData = async () => {
         try {
           const docRef = doc(db, 'students', user.uid);
           const docSnap = await getDoc(docRef);
           if (docSnap.exists()) {
             const data = docSnap.data();
             setMotto(data.motto || student?.motto || '');
             const h = data.hobbies || student?.hobbies || [];
             setHobbies(Array.isArray(h) ? h.join(', ') : h);
             setFavoriteSubject(data.favoriteSubject || student?.favoriteSubject || '');
             setSocialTag(data.socialTag || student?.socialTag || '');
             setBannerUrl(data.bannerUrl || student?.bannerUrl || '');
             setAvatarUrl(data.avatarUrl || student?.avatarUrl || '');
           } else {
             setMotto(student?.motto || '');
             setHobbies(student?.hobbies?.join(', ') || '');
             setFavoriteSubject(student?.favoriteSubject || '');
             setSocialTag(student?.socialTag || '');
             setBannerUrl(student?.bannerUrl || '');
             setAvatarUrl(student?.avatarUrl || '');
           }
         } catch(e: any) {
           setError(e.message);
         }
       };
       fetchData();
    }
  }, [isOpen, user, student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');

    try {
      const hobbiesArray = (hobbies || '').split(',').map(h => h.trim()).filter(h => h);
      
      const docRef = doc(db, 'students', user.uid);
      const updateData: Record<string, any> = {
        motto: motto || '',
        quote: motto || '',
        hobbies: hobbiesArray,
        favoriteSubject: favoriteSubject || '',
        socialTag: socialTag || '',
        bannerUrl: bannerFile ? await uploadToCloudinary(bannerFile) : bannerUrl || '',
        avatarUrl: avatarFile ? await uploadToCloudinary(avatarFile) : avatarUrl || '',
        updatedAt: Date.now()
      };

      // Strip undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(docRef, updateData);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white">Edit Profil</h2>
              <p className="text-xs text-slate-500 mt-1">Perbarui informasi profil Anda.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

                        <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                UPLOAD FOTO PROFIL
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 dark:file:bg-emerald-900/30 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-200 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                UPLOAD FOTO BANNER
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 dark:file:bg-emerald-900/30 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-200 cursor-pointer"
              />
            </div>
<div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                MOTTO HIDUP
              </label>
              <textarea
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white resize-none h-20"
                placeholder="Tuliskan motto hidup Anda..."
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                MATA PELAJARAN FAVORIT
              </label>
              <input
                type="text"
                value={favoriteSubject}
                onChange={(e) => setFavoriteSubject(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white"
                placeholder="Contoh: Sosiologi, Geografi"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                HOBI & MINAT (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white"
                placeholder="Contoh: Membaca, Olahraga, Koding"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                MEDIA SOSIAL / TAG
              </label>
              <input
                type="text"
                value={socialTag}
                onChange={(e) => setSocialTag(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white"
                placeholder="Contoh: @username_ig"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
