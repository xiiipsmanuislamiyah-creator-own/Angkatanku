import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, Shield, Loader2, Info } from 'lucide-react';
import jsQR from 'jsqr';
import { authenticateUser, extractCredentialsFromQR } from '../lib/auth-helpers';

interface WelcomeModalProps {
  onSuccess: () => void;
}

export default function WelcomeModal({ onSuccess }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Show only once per session
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      // Delay slightly for smooth entrance after navigating
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenWelcome', 'true');
  };

  const performLogin = async (usr: string, pass: string) => {
    setLoading(true);
    setError('');
    
    try {
      await authenticateUser(usr, pass);
      sessionStorage.setItem('just_logged_in_greeting', 'true');
      window.dispatchEvent(new CustomEvent('app_user_logged_in', { detail: { timestamp: Date.now() } }));
      handleClose();
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.message?.includes('invalid-credential')) {
        console.warn('WelcomeModal: invalid credentials');
        setError('Kredensial dari kartu tidak cocok.');
      } else if (err.code === 'auth/operation-not-allowed') { 
        setError('Fitur Email/Password Auth belum diaktifkan di Firebase Console.'); 
      } else {
        console.warn('WelcomeModal auth note:', err?.message || err);
        setError('Kredensial dari kartu tidak valid.'); 
      }
    } finally {
      setLoading(false);
    }
  };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target?.result as string;
      setPreviewImage(imgDataUrl);
      setIsScanning(true);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
             const creds = extractCredentialsFromQR(code.data);
             
             if (creds && creds.username) {
                sessionStorage.setItem('cardScanLoginTriggered', 'true');
                localStorage.setItem('lastLoginMethod', 'card');
                setTimeout(() => {
                  setIsScanning(false);
                  setPreviewImage('');
                  performLogin(creds.username, creds.password || '');
                }, 1800);
             } else {
                setTimeout(() => {
                  setError('Format QR Code tidak valid.');
                  setIsScanning(false);
                  setPreviewImage('');
                }, 800);
             }
          } else {
             setTimeout(() => {
                setError('QR Code tidak terdeteksi.');
                setIsScanning(false);
                setPreviewImage('');
             }, 800);
          }
        }
      };
      img.src = imgDataUrl;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500 absolute top-0 left-0" />
            
            <div className="p-6 pt-8 text-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Shield className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-bold font-display text-slate-800 dark:text-white mb-2">
                Selamat Datang!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Untuk akses penuh, silakan login menggunakan ID Card kelas Anda.
              </p>

              
              <AnimatePresence>
                {isScanning && previewImage && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 relative shadow-inner"
                  >
                    <div className="relative aspect-video w-full bg-slate-950">
                      <img src={previewImage} alt="Scanning" className="w-full h-full object-contain opacity-70" />
                      
                      {/* Subtle Scanning line */}
                      <motion.div
                        className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent z-10"
                        animate={{ top: ['8%', '92%', '8%'] }}
                        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
                      />
                      
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-center z-20">
                        <div className="bg-slate-900/90 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow-md border border-slate-700">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          Memverifikasi Kartu...
                        </div>
                      </div>
                      
                      {/* Subtle frame corners */}
                      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                  <Info className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <input 
                type="file" 
                accept="image/*" 
                 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 relative overflow-hidden group mb-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
                Scan ID Card
              </button>
              
              <button
                onClick={handleClose}
                className="w-full py-3 text-slate-500 dark:text-slate-400 font-semibold text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Lanjutkan sebagai Pengunjung
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
