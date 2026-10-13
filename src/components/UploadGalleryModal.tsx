import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Loader2, Image as ImageIcon, Upload, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from '../lib/data';
import { useAuth } from '../contexts/AuthContext';
import { uploadToCloudinary } from '../lib/cloudinary';

interface UploadGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadGalleryModal({ isOpen, onClose, onSuccess }: UploadGalleryModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState('Kelas & Sekolah');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingCloud, setIsUploadingCloud] = useState(false);

  const albumsList = ['P5', 'Class Meeting', 'Study Tour', 'Kelas & Sekolah', 'Graduation Prep'];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCloud(true);
    try {
      const url = await uploadToCloudinary(file, 'image');
      setImageUrl(url);
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      alert('Gagal mengunggah foto ke Cloudinary: ' + (err.message || 'Error'));
    } finally {
      setIsUploadingCloud(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!imageUrl.trim()) {
      alert('Harap pilih foto untuk diunggah ke Cloudinary atau masukkan URL gambar.');
      return;
    }
    
    setIsLoading(true);

    try {
      await addDoc(collection(db, 'gallery'), {
        imageUrl: imageUrl.trim(),
        title: title.trim(),
        album,
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        uploaderId: user.uid,
        uploaderEmail: user.email,
        createdAt: Date.now()
      });
      
      setImageUrl('');
      setTitle('');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto');
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
              <h2 className="text-xl font-bold font-display text-slate-800 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                Upload ke Galeri (Cloudinary)
              </h2>
              <p className="text-xs text-slate-500 mt-1">Tambahkan momen spesial ke galeri angkatan.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                JUDUL FOTO
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white"
                placeholder="Contoh: Keseruan Class Meeting"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                PILIH ALBUM
              </label>
              <select
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-800 dark:text-white"
              >
                {albumsList.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">
                  UNGGAH MEDIA (CLOUDINARY)
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingCloud}
                  className="text-xs text-emerald-600 hover:text-emerald-500 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingCloud ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File</span>
                    </>
                  )}
                </button>
              </div>

              <input 
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="relative">
                {imageUrl ? (
                   <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 break-all flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>
                     File berhasil dipilih/diunggah. Klik 'Unggah Ke Galeri' untuk menyimpan.
                   </p>
                ) : (
                   <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                     Silakan pilih file foto dari perangkat Anda.
                   </p>
                )}
              </div>

              {isUploadingCloud && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Sedang memproses & mengunggah ke Cloudinary CDN...</span>
                </div>
              )}

              {imageUrl && !isUploadingCloud && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-32 bg-slate-900">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <CheckCircle2 className="w-3 h-3" /> Cloudinary Ready
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || isUploadingCloud || !imageUrl.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan ke Galeri
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

