import LoginModal from '../components/LoginModal';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scan, 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ArrowLeft,
  QrCode,
  FileImage,
  Lock,
  Check,
  Info,
  MessageCircle,
  X
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from '../lib/data';
import { checkLoginLockout, resetLoginAttempts } from '../lib/security';
import { authenticateUser, extractCredentialsFromQR } from '../lib/auth-helpers';
import jsQR from 'jsqr';

type ScanStep = 
  | 'idle'
  | 'step1_prepare'   // 1. Menyiapkan Scan: "Siapkan pemindaian QR..." (0%)
  | 'step2_detect'    // 2. Mendeteksi QR: "QR Code terdeteksi..." (20%)
  | 'step3_read'      // 3. Membaca Kredensial: "Membaca kredensial..." (45%)
  | 'step4_verify'    // 4. Memverifikasi Akses: "Memverifikasi akses..." (78%)
  | 'step5_success'   // 5. Berhasil: "Kredensial valid!" (100%)
  | 'step6_redirect'; // 6. Lanjut ke Sistem: "Menyiapkan akses..." (100%)

interface QRBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export default function Login({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [error, setError] = useState('');
  const [manual, setManual] = useState(false);
  const [lockoutSec, setLockoutSec] = useState(0);
  const [scanStep, setScanStep] = useState<ScanStep>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('Siapkan pemindaian QR...');
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedIdentity, setDetectedIdentity] = useState<string | null>(null);
  const [qrBox, setQrBox] = useState<QRBox>({ left: 7.5, top: 24, width: 31, height: 52 });
  const [showInfoModal, setShowInfoModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllScanTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  };

  const resetScanState = () => {
    clearAllScanTimers();
    setScanStep('idle');
    setPreviewImage(null);
    setScanProgress(0);
    setScanStatusText('Siapkan pemindaian QR...');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      clearAllScanTimers();
    };
  }, []);

  // Lockout check interval
  useEffect(() => {
    const check = () => {
      const { locked, remainingSec } = checkLoginLockout();
      if (locked) {
        setLockoutSec(remainingSec);
      } else {
        setLockoutSec(0);
      }
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  // Perform actual login with credentials
  const performLogin = async (usr: string, pass: string) => {
    const { locked, remainingSec } = checkLoginLockout();
    if (locked) {
      setError(`Sistem terkunci demi keamanan. Harap tunggu ${remainingSec} detik.`);
      setScanStep('idle');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cred = await authenticateUser(usr, pass);

      resetLoginAttempts();
      
      const emailPrefix = (cred.user.email || '').split('@')[0].replace(/^@/, '');
      const localMinted = 
        localStorage.getItem(`student_card_minted_${cred.user.uid}`) === 'true' ||
        localStorage.getItem(`student_card_minted_${emailPrefix}`) === 'true';

      const d = await getDoc(doc(db, 'students', cred.user.uid));
      const hasCard = Boolean(
        localMinted || 
        (d.exists() && (d.data()?.cardCreated || d.data()?.avatarUrl || d.data()?.isTeacher))
      );

      if (hasCard) {
        localStorage.setItem(`student_card_minted_${cred.user.uid}`, 'true');
        if (emailPrefix) localStorage.setItem(`student_card_minted_${emailPrefix}`, 'true');
      }

      // Activate welcome greeting on portal home
      sessionStorage.setItem('just_logged_in_greeting', 'true');
      localStorage.setItem('pending_welcome_greeting', 'true');
      window.dispatchEvent(new CustomEvent('app_user_logged_in', { detail: { timestamp: Date.now() } }));

      // Redirect to home
      setTimeout(() => {
        onNavigate('home');
      }, 900);

    } catch (err: any) {
      console.warn('Login note:', err?.message || err);
      setScanStep('idle');
      setLoading(false);
      setPreviewImage('');
      setScanProgress(0);
      setError(err?.message || 'Gagal memverifikasi identitas. Periksa kembali kredensial atau foto kartu.');
    }
  };

  // Helper to compute percentage bounding box from jsQR location
  const computeBoxFromLocation = (
    loc: { topLeftCorner: any; topRightCorner: any; bottomRightCorner: any; bottomLeftCorner: any },
    totalW: number,
    totalH: number,
    offsetY = 0,
    scale = 1
  ): QRBox => {
    const minX = Math.min(loc.topLeftCorner.x, loc.bottomLeftCorner.x) / scale;
    const maxX = Math.max(loc.topRightCorner.x, loc.bottomRightCorner.x) / scale;
    const minY = (Math.min(loc.topLeftCorner.y, loc.topRightCorner.y) + offsetY) / scale;
    const maxY = (Math.max(loc.bottomLeftCorner.y, loc.bottomRightCorner.y) + offsetY) / scale;

    const padX = (maxX - minX) * 0.12;
    const padY = (maxY - minY) * 0.12;

    const left = Math.max(1, Math.min(80, ((minX - padX) / totalW) * 100));
    const top = Math.max(1, Math.min(80, ((minY - padY) / totalH) * 100));
    const width = Math.max(15, Math.min(98 - left, (((maxX - minX) + padX * 2) / totalW) * 100));
    const height = Math.max(15, Math.min(98 - top, (((maxY - minY) + padY * 2) / totalH) * 100));

    return { left, top, width, height };
  };

  // Helper to scan canvas with jsQR and multiple passes
  const decodeImageWithFallback = (canvas: HTMLCanvasElement): { text: string; box: QRBox } | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const w = canvas.width;
    const h = canvas.height;

    // Default card QR layout as fallback
    const fallbackBox: QRBox = { left: 7.5, top: 24, width: 31, height: 52 };

    // Attempt 1: Full original image
    const fullImgData = ctx.getImageData(0, 0, w, h);
    let code = jsQR(fullImgData.data, fullImgData.width, fullImgData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (code && code.data) {
      const box = code.location ? computeBoxFromLocation(code.location, w, h, 0, 1) : fallbackBox;
      return { text: code.data, box };
    }

    // Attempt 2: Bottom half / Right quadrant
    try {
      const bottomCanvas = document.createElement('canvas');
      bottomCanvas.width = w;
      bottomCanvas.height = Math.floor(h * 0.65);
      const bCtx = bottomCanvas.getContext('2d');
      if (bCtx) {
        const offsetY = Math.floor(h * 0.35);
        bCtx.drawImage(canvas, 0, offsetY, w, bottomCanvas.height, 0, 0, w, bottomCanvas.height);
        const bData = bCtx.getImageData(0, 0, bottomCanvas.width, bottomCanvas.height);
        code = jsQR(bData.data, bData.width, bData.height, { inversionAttempts: "attemptBoth" });
        if (code && code.data) {
          const box = code.location ? computeBoxFromLocation(code.location, w, h, offsetY, 1) : fallbackBox;
          return { text: code.data, box };
        }
      }
    } catch {}

    // Attempt 3: Scaled version
    if (w > 1200 || h > 1200) {
      try {
        const scale = 1000 / Math.max(w, h);
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = Math.floor(w * scale);
        scaledCanvas.height = Math.floor(h * scale);
        const sCtx = scaledCanvas.getContext('2d');
        if (sCtx) {
          sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
          const sData = sCtx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
          code = jsQR(sData.data, sData.width, sData.height, { inversionAttempts: "attemptBoth" });
          if (code && code.data) {
            const box = code.location ? computeBoxFromLocation(code.location, w, h, 0, scale) : fallbackBox;
            return { text: code.data, box };
          }
        }
      } catch {}
    }

    return null;
  };

  // Launch the exact 6-step scan animation sequence matching user diagram
  const startScanAnimationSequence = (
    creds: { username: string; password?: string },
    box: QRBox
  ) => {
    clearAllScanTimers();
    setQrBox(box);

    // Step 1: Menyiapkan Scan (0%)
    // Kartu siap dipindai, area belum aktif
    setScanStep('step1_prepare');
    setScanProgress(0);
    setScanStatusText('Siapkan pemindaian QR...');

    // Step 2: Mendeteksi QR (20%)
    // Sistem mendeteksi QR dan mengunci posisi (reticle menyala hijau terang)
    const t1 = setTimeout(() => {
      setScanStep('step2_detect');
      setScanProgress(20);
      setScanStatusText('QR Code terdeteksi...');
    }, 450);

    // Step 3: Membaca Kredensial (45%)
    // Garis scan bergerak dari atas ke bawah
    const t2 = setTimeout(() => {
      setScanStep('step3_read');
      setScanProgress(45);
      setScanStatusText('Membaca kredensial...');
    }, 950);

    // Step 4: Memverifikasi Akses (78%)
    // Data hasil scan sedang diverifikasi ke sistem
    const t3 = setTimeout(async () => {
      setScanStep('step4_verify');
      setScanProgress(78);
      setScanStatusText('Memverifikasi akses...');

      try {
        const cred = await authenticateUser(creds.username, creds.password || '');
        resetLoginAttempts();

        const emailPrefix = (cred.user.email || '').split('@')[0].replace(/^@/, '');
        const localMinted = 
          localStorage.getItem(`student_card_minted_${cred.user.uid}`) === 'true' ||
          localStorage.getItem(`student_card_minted_${emailPrefix}`) === 'true';

        const d = await getDoc(doc(db, 'students', cred.user.uid));
        const hasCard = Boolean(
          localMinted || 
          (d.exists() && (d.data()?.cardCreated || d.data()?.avatarUrl || d.data()?.isTeacher))
        );

        if (hasCard) {
          localStorage.setItem(`student_card_minted_${cred.user.uid}`, 'true');
          if (emailPrefix) localStorage.setItem(`student_card_minted_${emailPrefix}`, 'true');
        }

        sessionStorage.setItem('cardScanLoginTriggered', 'true');
        localStorage.setItem('lastLoginMethod', 'card');
        sessionStorage.setItem('just_logged_in_greeting', 'true');
        localStorage.setItem('pending_welcome_greeting', 'true');
        window.dispatchEvent(new CustomEvent('app_user_logged_in', { detail: { timestamp: Date.now() } }));

        // Step 5: Berhasil (100%)
        // Kredensial valid dan siap digunakan (Ikon centang hijau di dalam QR box)
        const t4 = setTimeout(() => {
          setScanStep('step5_success');
          setScanProgress(100);
          setScanStatusText('Kredensial valid!');

          // Step 6: Lanjut ke Sistem (100%)
          // Otomatis melanjutkan ke halaman berikutnya (Dialog modal Autentikasi Berhasil)
          const t5 = setTimeout(() => {
            setScanStep('step6_redirect');
            setScanProgress(100);
            setScanStatusText('Menyiapkan akses...');

            const t6 = setTimeout(() => {
              onNavigate('home');
            }, 900);
            timersRef.current.push(t6);
          }, 650);
          timersRef.current.push(t5);
        }, 700);
        timersRef.current.push(t4);

      } catch (err: any) {
        console.warn('Login verification note:', err?.message || err);
        resetScanState();
        setError(err?.message || 'Gagal memverifikasi identitas kartu. Pastikan foto kartu resmi dan tidak buram.');
      }
    }, 1850);

    timersRef.current.push(t1, t2, t3);
  };

  // Handle Card Photo Selection from Device Gallery
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){setError('Gunakan foto JPEG, PNG, atau WebP maksimal 8 MB.');return;}

    setError('');
    setDetectedIdentity(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target?.result as string;
      setPreviewImage(imgDataUrl);

      const img = new Image();
      img.onload = () => {
        if(img.width*img.height>24000000){resetScanState();setError('Resolusi kartu terlalu besar.');return;}
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const result = decodeImageWithFallback(canvas);

          if (result) {
            const creds = extractCredentialsFromQR(result.text);
            if (!creds || !creds.username) {
              resetScanState();
              setError('Format barcode kartu tidak dikenali. Pastikan Anda mengunggah foto Kartu Pelajar atau Kartu Guru resmi MA NU Islamiyah yang jelas.');
              return;
            }

            // Start the 6-step animation
            startScanAnimationSequence(creds, result.box);
          } else {
            resetScanState();
            setError('QR Code pada kartu tidak terdeteksi. Pastikan foto kartu terang, fokus, dan tidak terpotong.');
          }
        }
      };
      img.onerror = () => {
        resetScanState();
        setError('Gagal membaca gambar. Silakan coba unggah foto kartu yang berbeda.');
      };
      img.src = imgDataUrl;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] py-4 sm:py-8 px-2 sm:px-4 font-sans select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden"
      >
        <LoginModal isOpen={manual} onClose={()=>setManual(false)} onSuccess={()=>onNavigate('home')}/>
        <button onClick={()=>setManual(true)} className="w-full p-3 text-sm font-semibold text-emerald-600">Masuk dengan username &amp; password</button>
        {/* Top Header Card */}
        <div className="p-4 sm:p-7 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700/60 shadow-sm shrink-0">
                <Scan className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Autentikasi Akses Angkatan
                </h1>
                <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  MA NU ISLAMIYAH • KELAS XII
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="w-8 h-8 rounded-full bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Informasi Akses & Bantuan"
                aria-label="Informasi Akses"
              >
                <AlertCircle className="w-4 h-4" />
              </button>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Aman</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-7 space-y-4 sm:space-y-5">
          {/* Error Alert */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-col gap-2 text-rose-700 dark:text-rose-300 text-xs"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Verifikasi Gagal</p>
                  <p className="text-rose-600 dark:text-rose-400 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="pt-1.5 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-600 dark:text-slate-400">Butuh bantuan kartu?</span>
                <a
                  href="https://wa.me/6285187434573?text=Halo%20Dev%2C%20saya%20mengalami%20kendala%20saat%20scan%20kartu%20login%20di%20web%20AngkatanKU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Hubungi Developer</span>
                </a>
              </div>
            </motion.div>
          )}

          {/* Lockout Warning */}
          {lockoutSec > 0 && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Sistem dibatasi sementara. Silakan tunggu <strong>{lockoutSec} detik</strong>.</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <div>
            {!previewImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/70 dark:bg-slate-950/40 p-8 sm:p-10 transition-all text-center flex flex-col items-center justify-center gap-4 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10"
              >
                {/* Viewfinder Reticle */}
                <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:border-emerald-500/50 transition-colors">
                  {/* Reticle Corner Marks */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-500 rounded-br-sm" />
                  
                  <FileImage className="w-9 h-9 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                    Pilih Foto Kartu Identitas Digital
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Unggah berkas foto Kartu Pelajar atau Kartu Guru resmi untuk memindai kode QR digital Anda
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Buka Berkas / Galeri</span>
                </button>

                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  Mendukung format JPG, PNG, WEBP resolusi jernih
                </p>
              </div>
            ) : (
              /* Scanning Progress Card */
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-2xl">
                <div className="relative aspect-[16/10] w-full flex items-center justify-center bg-slate-950 overflow-hidden select-none">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Kartu" 
                      className="w-full h-full object-cover"
                    />
                  ) : null}

                  {/* QR Bounding Area and Reticle according to 6 steps */}
                  {scanStep !== 'idle' && (
                    <div
                      className="absolute transition-all duration-300 pointer-events-none"
                      style={{
                        left: `${qrBox.left}%`,
                        top: `${qrBox.top}%`,
                        width: `${qrBox.width}%`,
                        height: `${qrBox.height}%`,
                      }}
                    >
                      {/* 1. Menyiapkan Scan & 2-5 Reticle Corner Brackets */}
                      {/* Top Left */}
                      <div className={`absolute -top-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 border-t-[2.5px] border-l-[2.5px] rounded-tl-sm transition-all duration-300 ${
                        scanStep === 'step1_prepare'
                          ? 'border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]'
                      }`} />

                      {/* Top Right */}
                      <div className={`absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 border-t-[2.5px] border-r-[2.5px] rounded-tr-sm transition-all duration-300 ${
                        scanStep === 'step1_prepare'
                          ? 'border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]'
                      }`} />

                      {/* Bottom Left */}
                      <div className={`absolute -bottom-1 -left-1 w-4 h-4 sm:w-5 sm:h-5 border-b-[2.5px] border-l-[2.5px] rounded-bl-sm transition-all duration-300 ${
                        scanStep === 'step1_prepare'
                          ? 'border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]'
                      }`} />

                      {/* Bottom Right */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 border-b-[2.5px] border-r-[2.5px] rounded-br-sm transition-all duration-300 ${
                        scanStep === 'step1_prepare'
                          ? 'border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]'
                      }`} />

                      {/* Step 3: Membaca Kredensial - Garis scan bergerak dari atas ke bawah */}
                      {scanStep === 'step3_read' && (
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-cyan-300 shadow-[0_0_14px_#22d3ee,0_0_24px_#06b6d4]"
                          initial={{ top: '2%' }}
                          animate={{ top: ['2%', '96%'] }}
                          transition={{ duration: 0.85, ease: "easeInOut" }}
                        />
                      )}

                      {/* Step 4: Memverifikasi Akses - Glowing pulse highlight */}
                      {scanStep === 'step4_verify' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.3, 0.7, 0.4] }}
                          transition={{ duration: 0.7, repeat: Infinity }}
                          className="absolute inset-0 bg-cyan-400/20 border border-cyan-400/50 rounded-sm shadow-[inset_0_0_15px_rgba(34,211,238,0.4)]"
                        />
                      )}

                      {/* Step 5: Berhasil - Circular Green Checkmark Badge inside QR box */}
                      {scanStep === 'step5_success' && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-sm"
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.85)]">
                            <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Step 6: Lanjut ke Sistem - Dimmed background + centered popup modal */}
                  {scanStep === 'step6_redirect' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-20"
                    >
                      <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 sm:p-7 shadow-2xl max-w-xs w-full text-center text-white"
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center mx-auto mb-3.5 shadow-[0_0_30px_rgba(52,211,153,0.85)]">
                          <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white font-display mb-1 tracking-tight">
                          Autentikasi Berhasil
                        </h3>
                        <p className="text-xs text-slate-300 mb-4">
                          Mengarahkan ke sistem...
                        </p>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_12px_#34d399]"
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                          />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* Status Bar */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      {scanStep === 'step5_success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      )}
                      <span className="font-medium text-slate-200">{scanStatusText}</span>
                    </span>
                    <span className="font-mono text-cyan-400 text-xs font-bold">{scanProgress}%</span>
                  </div>

                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(45,212,191,0.5)]" 
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>

                  <div className="text-right pt-1">
                    <button
                      type="button"
                      onClick={resetScanState}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Pilih foto lain</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Back Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
            <span className="text-[10px] font-mono text-slate-400">
              Versi 2.0 • Angkatan 2026
            </span>
          </div>
        </div>
      </motion.div>

      {/* Aesthetic Information Modal Popup when clicking exclamation mark */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                      Informasi Akses
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Autentikasi Kartu Digital
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Tutup Informasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informative description */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <p>
                  Halaman ini khusus bagi <strong>Dewan Guru</strong> dan <strong>Siswa</strong> pemilik kartu identitas resmi yang terdaftar.
                </p>
                <p>
                  Jika kamu adalah siswa dan belum memiliki kartu identitas atau mengalami kendala saat masuk, silakan hubungi Developer secara langsung.
                </p>
              </div>

              {/* Action Button without displaying the phone number */}
              <a
                href="https://wa.me/6285187434573?text=Halo%20Dev%2C%20saya%20siswa%20XII%20IPS%20MA%20NU%20Islamiyah%20ingin%20meminta%20akses%20Kartu%20Identitas%20Digital"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowInfoModal(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-semibold text-xs shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Hubungi Developer</span>
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
