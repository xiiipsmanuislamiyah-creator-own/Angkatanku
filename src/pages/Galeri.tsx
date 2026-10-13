import React, { useState } from 'react';
import { 
  ImageIcon, 
  Filter, 
  Calendar, 
  Tag, 
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Upload,
  X,
  Loader2,
  FileJson,
  Sparkles
} from 'lucide-react';
import { GalleryPhoto } from '../data/dummyData';
import { db } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from '../lib/data';
import { useAuth } from '../contexts/AuthContext';
import { deleteFromCloudinary, uploadToCloudinary } from '../lib/cloudinary';
import { parseMetadataInput } from '../lib/metadataParser';

export default function Galeri() {
  const { user, isAdmin } = useAuth();
  const [activeAlbum, setActiveAlbum] = useState<string>('Semua');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [firestorePhotos, setFirestorePhotos] = useState<GalleryPhoto[]>([]);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'json'>('file');
  const [metadataRawText, setMetadataRawText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; url?: string; title?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    album: 'Kelas & Sekolah',
    date: new Date().toISOString().split('T')[0],
    file: null as File | null
  });

  const [metadataPublic,setMetadataPublic]=useState(false);
  const parsedMetadataItems = React.useMemo(() => {
    return parseMetadataInput(metadataRawText);
  }, [metadataRawText]);

  const handleUploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return alert("Hanya admin yang dapat mengunggah ke galeri angkatan");

    if (uploadMode === 'json') {
      if(!metadataPublic){alert('Konfirmasikan visibilitas publik media CDN.');return;}
      if (parsedMetadataItems.length === 0) {
        alert("Tidak ada item metadata valid yang terdeteksi.");
        return;
      }

      setIsUploading(true);
      let successCount = 0;
      try {
        for (const item of parsedMetadataItems) {
          await addDoc(collection(db, 'gallery'), {
            title: item.name,
            album: uploadData.album,
            date: item.date,
            imageUrl: item.url,
            audience:'public',
            uploaderId: user?.uid || 'admin',
            createdAt: serverTimestamp()
          });
          successCount++;
        }
        setShowUploadModal(false);
        setMetadataRawText('');
        fetchPhotos();
        alert(`Berhasil mengimpor ${successCount} foto ke Galeri!`);
      } catch (err: any) {
        console.warn('Gagal mengimpor metadata:', err?.message || err);
        alert("Gagal mengimpor metadata: " + err.message);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // File upload mode
    if (!uploadData.file) return alert("Pilih foto terlebih dahulu");
    if (!uploadData.title) return alert("Judul foto tidak boleh kosong");

    setIsUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(uploadData.file, 'image');
      await addDoc(collection(db, 'gallery'), {
        title: uploadData.title,
        album: uploadData.album,
        date: uploadData.date,
        imageUrl,
        uploaderId: user?.uid || 'admin',
        createdAt: serverTimestamp()
      });
      setShowUploadModal(false);
      setUploadData({ title: '', album: 'Kelas & Sekolah', date: new Date().toISOString().split('T')[0], file: null });
      fetchPhotos();
    } catch (err: any) {
      console.warn('Gagal mengunggah foto:', err?.message || err);
      alert("Gagal mengunggah foto: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const snap = await getDocs(collection(db, 'gallery'));
      const docs = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          album: data.album,
          title: data.title,
          imageUrl: data.imageUrl,
          date: data.date,
          uploaderId: data.uploaderId
        } as GalleryPhoto;
      });
      setFirestorePhotos(docs);
    } catch (err: any) {
      console.warn("Notice: Failed to fetch gallery from Firestore:", err?.message || err);
    }
  };

  React.useEffect(() => {
    fetchPhotos();
  }, []);

  const albumsList = ['Semua', 'P5', 'Class Meeting', 'Study Tour', 'Kelas & Sekolah', 'Graduation Prep'];

  const allPhotos = React.useMemo(() => {
    return [...firestorePhotos];
  }, [firestorePhotos]);
  
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

  const filteredPhotos = activeAlbum === 'Semua' ? allPhotos : allPhotos.filter(p => p.album === activeAlbum);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };

  const handleDeletePhoto = (e: React.MouseEvent, id: string, imageUrl?: string, title?: string) => {
    e.stopPropagation();
    setPhotoToDelete({ id, url: imageUrl, title });
  };

  const confirmDeletePhotoAction = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);
    try {
      if (photoToDelete.url) {
        deleteFromCloudinary(photoToDelete.url).catch(e => console.warn(e));
      }
      await deleteDoc(doc(db, 'gallery', photoToDelete.id));
      setPhotoToDelete(null);
      fetchPhotos();
      setLightboxIndex(null);
    } catch (err: any) {
      console.warn('Failed to delete photo:', err?.message || err);
      alert('Gagal menghapus foto: ' + (err.message || 'Error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-mono font-medium font-semibold">
          VISUAL MEMORY STORAGE
        </div>
        <h2 className="text-3xl font-bold text-slate-800 font-display">Galeri Memori Angkatan</h2>
        <p className="text-slate-500 text-sm">
          Menampilkan barisan potret kebahagiaan dan sisa sejarah siswa XII IPS yang terabadikan. Dipisahkan rapi berdasarkan kategori album petualangan.
        </p>
      </div>

      <div className="space-y-8 max-w-6xl mx-auto">
        
        {/* Album Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex justify-start md:justify-center items-center pb-2 overflow-x-auto hide-scrollbar gap-1.5 px-1 w-full md:w-auto">
            <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 font-mono font-medium mr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>ALBUM:</span>
            </div>
            {albumsList.map((alb) => {
              const isSelected = alb === activeAlbum;
              return (
                <button
                  key={alb}
                  onClick={() => {
                    setActiveAlbum(alb);
                    setLightboxIndex(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all ${
                    isSelected 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/80'
                  }`}
                >
                  {alb}
                </button>
              );
            })}
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
            >
              <Upload className="w-4 h-4" /> Upload Foto
            </button>
          )}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filteredPhotos.map((photo, idx) => {
            return (
              <div 
                key={photo.id}
                onClick={() => setLightboxIndex(idx)}
                className="group relative rounded-2xl overflow-hidden aspect-square border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {/* Photo image */}
                <img 
                  src={photo.imageUrl || undefined} 
                  alt={photo.title} 
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" 
                />

                {/* Ambient Dark Overlay on hovered cards */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {(isAdmin || (user && photo.uploaderId === user.uid)) && (
                    <button
                      onClick={(e) => handleDeletePhoto(e, photo.id, photo.imageUrl, photo.title)}
                      className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors z-10 cursor-pointer"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="text-[8px] font-mono font-bold text-archive-teal uppercase tracking-widest flex items-center gap-1 mb-1.5">
                    <Tag className="w-2.5 h-2.5" />
                    <span>{photo.album}</span>
                  </div>
                  
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2 mb-1">
                    {photo.title}
                  </h4>
                  
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-300">
                    <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> {formatDate(photo.date)}</span>
                    <Maximize2 className="w-3 h-3 text-archive-tint" />
                  </div>
                </div>

                {/* Top album small icon wrapper for visibility on non-hovered mobile */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[7px] font-mono uppercase px-2 py-0.5 rounded-sm tracking-widest font-bold group-hover:opacity-0 transition-opacity">
                  {photo.album}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPhotos.length === 0 && (
          <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-400 font-mono">BELUM_ADA_DOKUMENTASI_TAYANG</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Galeri memori saat ini masih kosong. Silakan unggah foto dokumentasi kegiatan kelas baru.</p>
          </div>
        )}

      </div>

      {/* Lightbox Modal Carousel */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div 
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          {/* Close trigger button */}
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg select-none cursor-pointer"
          >
            &times;
          </button>

          {/* Nav Controls */}
          <button 
            onClick={handlePrev}
            className="absolute left-4 md:left-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full hover:bg-white/20 select-none cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-4 md:right-8 text-white/50 hover:text-white bg-white/10 p-3 rounded-full hover:bg-white/20 select-none cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Delete Button (if owned/admin) */}
          {(isAdmin || (user && filteredPhotos[lightboxIndex].uploaderId === user.uid)) && (
            <button
              onClick={(e) => handleDeletePhoto(e, filteredPhotos[lightboxIndex].id, filteredPhotos[lightboxIndex].imageUrl, filteredPhotos[lightboxIndex].title)}
              className="absolute bottom-6 right-6 text-white bg-red-600/90 hover:bg-red-600 px-4 py-2 rounded-full flex items-center justify-center font-bold text-sm gap-2 select-none cursor-pointer z-50 transition-colors shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Foto</span>
            </button>
          )}

          {/* Active Image Board */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full flex flex-col justify-center items-center space-y-4 px-2"
          >
            <div className="max-h-[70vh] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <img 
                src={filteredPhotos[lightboxIndex].imageUrl || undefined} 
                alt={filteredPhotos[lightboxIndex].title} 
                className="max-h-[70vh] object-contain mx-auto"
              />
            </div>

            <div className="text-center text-white space-y-1.5 max-w-xl">
              <span className="text-[10px] font-mono tracking-widest text-archive-teal uppercase font-bold bg-teal-500/10 border border-teal-500/15 px-3 py-0.5 rounded-full">
                {filteredPhotos[lightboxIndex].album}
              </span>
              <h3 className="text-base sm:text-lg font-bold font-display">{filteredPhotos[lightboxIndex].title}</h3>
              <p className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> DOKUMENTASI_DATE: {formatDate(filteredPhotos[lightboxIndex].date)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold font-display text-slate-800">Upload Foto Galeri</h3>
                <p className="text-xs text-slate-500 mt-0.5">Unggah memori angkatan ke album dokumentasi</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="p-4 pb-0">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    uploadMode === 'file'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pilih File Gambar
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('json')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    uploadMode === 'json'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" /> JSON Metadata
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUploadGallery} className="p-6 space-y-4">
              {uploadMode === 'file' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">File Foto</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul / Keterangan</label>
                    <input 
                      type="text" 
                      value={uploadData.title}
                      onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Contoh: Keseruan class meeting..."
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tempel Metadata JSON</label>
                    {parsedMetadataItems.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ {parsedMetadataItems.length} Foto Siap
                      </span>
                    )}
                  </div>
                  <label className="flex gap-2 text-xs mb-2"><input type="checkbox" checked={metadataPublic} onChange={e=>setMetadataPublic(e.target.checked)}/>Media CDN yang diimpor ditetapkan publik.</label>
                    <textarea
                    value={metadataRawText}
                    onChange={(e) => setMetadataRawText(e.target.value)}
                    placeholder={`Tempel JSON metadata (objek atau array) dari Cloudinary atau tools pribadi:\n{\n  "name": "ClassMeeting-01.jpg",\n  "url": "https://res.cloudinary.com/..."\n}`}
                    className="w-full h-32 p-3 font-mono text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  {parsedMetadataItems.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {parsedMetadataItems.slice(0, 5).map((item, i) => (
                        <div key={i} className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative bg-slate-100">
                          <img src={item.thumbnailUrl || item.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {parsedMetadataItems.length > 5 && (
                        <div className="w-14 h-14 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center bg-slate-100 text-xs font-bold text-slate-500">
                          +{parsedMetadataItems.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori Album</label>
                <select
                  value={uploadData.album}
                  onChange={(e) => setUploadData({...uploadData, album: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {albumsList.filter(a => a !== 'Semua').map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {uploadMode === 'file' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Kegiatan</label>
                  <input 
                    type="date" 
                    value={uploadData.date}
                    onChange={(e) => setUploadData({...uploadData, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isUploading || (uploadMode === 'json' && parsedMetadataItems.length === 0)}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  {isUploading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {uploadMode === 'json' ? 'Mengimpor...' : 'Mengunggah...'}</>
                  ) : (
                    uploadMode === 'json' ? `Impor ${parsedMetadataItems.length} Foto` : 'Upload Foto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Photo Delete Confirmation Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hapus Foto Galeri?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Foto "{photoToDelete.title || 'ini'}" akan dihapus permanen dari memori galeri dan server media.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPhotoToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeletePhotoAction}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghapus...
                  </>
                ) : (
                  'Hapus Permanen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
