import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

interface FullscreenPreviewProps {
  media: MediaItem;
  onClose: () => void;
}

export default function FullscreenPreview({ media, onClose }: FullscreenPreviewProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((prev) => Math.max(prev - 0.25, 1));
    if (scale <= 1.25) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    // Simple bound constraint for drag
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.current.x;
      const newY = touch.clientY - dragStart.current.y;
      setPosition({ x: newX, y: newY });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 select-none"
      onClick={onClose}
    >
      {/* Header controls */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-6 z-10">
        <div className="text-white font-mono text-xs font-bold tracking-wider">
          {media.type.toUpperCase()} PREVIEW
        </div>
        
        <div className="flex items-center gap-3">
          {media.type === 'image' && (
            <div className="flex items-center bg-zinc-900/80 rounded-full px-2 py-1 border border-zinc-800 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-zinc-300 px-1.5 min-w-[36px] text-center font-bold">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 4}
                className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {scale > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-all border border-zinc-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main viewport */}
      <div 
        className="w-full h-full flex items-center justify-center p-4 overflow-hidden"
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {media.type === 'image' ? (
          <div
            className="relative flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            onClick={(e) => e.stopPropagation()}
          >
            {media.url && media.url.trim() !== '' ? (
              <img
                ref={imageRef}
                src={media.url}
                alt="Fullscreen preview"
                className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl pointer-events-none"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>
        ) : (
          <div 
            className="w-full max-w-4xl max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {media.url && media.url.trim() !== '' ? (
              <video
                src={media.url}
                className="w-full h-full object-contain max-h-[80vh] rounded-md shadow-2xl"
                controls
                autoPlay
                playsInline
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Touch footer helper */}
      {media.type === 'image' && scale > 1 && (
        <div className="absolute bottom-6 px-4 py-2 bg-black/70 border border-zinc-800 rounded-full text-[10px] font-mono text-zinc-400 pointer-events-none uppercase tracking-wide">
          Gunakan seret / sentuh untuk menggeser gambar
        </div>
      )}
    </div>
  );
}
