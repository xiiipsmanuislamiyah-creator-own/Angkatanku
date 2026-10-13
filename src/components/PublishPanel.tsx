import React, { useState, useEffect } from 'react';
import { FileCode, AlertCircle, CheckCircle, Send, Key } from 'lucide-react';
import { databaseService } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface PublishPanelProps {
  onPublishSuccess: () => void;
}

interface NormalizedMedia {
  type: 'image' | 'video';
  url: string;
  width?: number;
  height?: number;
  size?: number;
}

export default function PublishPanel({ onPublishSuccess }: PublishPanelProps) {
  const { isAdmin } = useAuth();
  const [jsonText, setJsonText] = useState('');
  const [caption, setCaption] = useState('');
  const [publicConsent, setPublicConsent] = useState(false);
  
  // Validation states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedMedia, setParsedMedia] = useState<NormalizedMedia[]>([]);
  const [summary, setSummary] = useState<{
    imageCount: number;
    videoCount: number;
    totalSize: number;
    isValid: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-validate metadata when JSON text changes
  useEffect(() => {
    if (!jsonText.trim()) {
      setValidationError(null);
      setParsedMedia([]);
      setSummary(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      let items: any[] = [];

      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        items = [parsed];
      } else {
        throw new Error('Format Metadata harus berupa JSON Object atau JSON Array');
      }

      const normalized: NormalizedMedia[] = [];

      for (const item of items) {
        if (!item || typeof item !== 'object') {
          throw new Error('Setiap item metadata harus berbentuk JSON object');
        }

        const url = item.url || item.imageUrl || item.videoUrl || item.mediaUrl;
        if (!url || typeof url !== 'string') {
          throw new Error('Setiap media wajib memiliki property "url" yang valid');
        }

        // Infer type
        let type: 'image' | 'video' = 'image';
        const rawType = (item.type || '').toLowerCase();
        if (rawType === 'video' || rawType === 'mp4' || rawType === 'mov' || rawType === 'webm') {
          type = 'video';
        } else if (rawType === 'image' || rawType === 'jpg' || rawType === 'png' || rawType === 'jpeg' || rawType === 'webp') {
          type = 'image';
        } else {
          // Sniff extension
          const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
          if (['mp4', 'webm', 'mov', 'm4v', 'ogv', 'ogg'].includes(ext)) {
            type = 'video';
          }
        }

        normalized.push({
          type,
          url,
          width: typeof item.width === 'number' ? item.width : undefined,
          height: typeof item.height === 'number' ? item.height : undefined,
          size: typeof item.size === 'number' ? item.size : undefined,
        });
      }

      if (normalized.length === 0) {
        throw new Error('Metadata kosong atau tidak berisi media valid');
      }

      setValidationError(null);
      setParsedMedia(normalized);

      // Generate Summary
      const imageCount = normalized.filter(m => m.type === 'image').length;
      const videoCount = normalized.filter(m => m.type === 'video').length;
      const totalSize = normalized.reduce((sum, m) => sum + (m.size || 0), 0);

      setSummary({
        imageCount,
        videoCount,
        totalSize,
        isValid: true
      });

    } catch (err: any) {
      setValidationError(err.message || 'Gagal memparsing JSON');
      setParsedMedia([]);
      setSummary({
        imageCount: 0,
        videoCount: 0,
        totalSize: 0,
        isValid: false
      });
    }
  }, [jsonText]);

  // Helper to format payload size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!summary || !summary.isValid) {
      setMessage({ type: 'error', text: 'Selesaikan validasi Metadata JSON terlebih dahulu' });
      return;
    }

    if (!caption.trim()) {
      setMessage({ type: 'error', text: 'Caption postingan wajib diisi' });
      return;
    }

    if(!isAdmin || !publicConsent){setMessage({type:'error',text:'Izin moderator dan persetujuan publik diperlukan.'});return;}

    setIsLoading(true);

    try {
      await databaseService.addPost(caption, parsedMedia, 'public');
      
      setMessage({ type: 'success', text: 'Postingan berhasil diterbitkan ke Feed Angkatan!' });
      
      // Reset form on success
      setJsonText('');
      setCaption('');
      setPublicConsent(false);
      setSummary(null);
      setParsedMedia([]);

      // Trigger reload in parent
      setTimeout(() => {
        onPublishSuccess();
        setMessage(null);
      }, 1500);

    } catch (err: any) {
      console.warn('Publish panel error handled gracefully:', err);
      setMessage({ type: 'error', text: err.message || 'Gagal mempublikasikan postingan ke database.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
          <FileCode className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm font-display uppercase tracking-wider text-slate-200">
            Penerbitan Postingan Baru
          </h3>
          <p className="text-[10px] text-slate-400 font-mono">DEVELOPER_PUBLISH_ENGINE</p>
        </div>
      </div>

      <form onSubmit={handlePublish} className="space-y-4 text-xs">
        
        {/* Step 1: Metadata JSON Textarea */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-400 font-mono text-[10px] block uppercase tracking-wider">
            1. Paste Metadata JSON :
          </label>
          <textarea
            rows={5}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`Contoh:\n[\n  { "type": "image", "url": "https://example.com/foto.jpg", "size": 1048576 },\n  { "type": "video", "url": "https://example.com/video.mp4", "size": 5242880 }\n]`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 focus:outline-none focus:border-indigo-500 text-xs font-mono leading-relaxed transition-all resize-none text-teal-400"
            required
          />
        </div>

        {/* Live Validation Feedback Widget */}
        {jsonText.trim() && (
          <div className={`p-4 rounded-xl border ${validationError ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'}`}>
            <div className="flex items-center gap-2 mb-2 font-bold text-[11px] font-mono">
              {validationError ? (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>METADATA TIDAK VALID</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>METADATA VALID & NORMALIZED</span>
                </>
              )}
            </div>
            
            {validationError ? (
              <p className="text-[10px] text-rose-300 leading-relaxed font-mono font-medium pl-6">
                Error: {validationError}
              </p>
            ) : (
              summary && (
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[10px] font-mono pl-6 text-slate-300">
                  <div>• Jumlah Gambar: <span className="text-white font-bold">{summary.imageCount}</span></div>
                  <div>• Jumlah Video: <span className="text-white font-bold">{summary.videoCount}</span></div>
                  <div>• Ukuran Total: <span className="text-white font-bold">{summary.totalSize > 0 ? formatBytes(summary.totalSize) : 'N/A'}</span></div>
                  <div>• Status: <span className="text-emerald-400 font-bold uppercase">READY</span></div>
                </div>
              )
            )}
          </div>
        )}

        {/* Step 2: Input Caption Textarea */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-400 font-mono text-[10px] block uppercase tracking-wider">
            2. Tulis Caption Postingan :
          </label>
          <textarea
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Tulis untaian kenangan, ucapan, atau rincian dokumentasi di sini..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 focus:outline-none focus:border-indigo-500 text-xs text-slate-200 leading-relaxed transition-all resize-none"
            required
          />
        </div>

        <label className="flex gap-2 text-xs"><input type="checkbox" checked={publicConsent} onChange={e=>setPublicConsent(e.target.checked)}/>Saya memahami media dari URL CDN ini tersedia untuk publik.</label>

        {/* Status Message */}
        {message && (
          <div className={`p-3.5 rounded-xl border text-[11px] font-medium leading-relaxed ${message.type === 'success' ? 'bg-emerald-900/30 border-emerald-800/50 text-emerald-200' : 'bg-rose-900/30 border-rose-800/50 text-rose-200'}`}>
            {message.text}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !summary?.isValid}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:pointer-events-none text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Sedang Mempublikasikan...' : 'Terbitkan Sekarang'}</span>
        </button>

      </form>
    </div>
  );
}
