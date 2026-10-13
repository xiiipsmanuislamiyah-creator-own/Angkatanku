import React, { useState,useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import LazyVideo from './LazyVideo';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  width?: number;
  height?: number;
  size?: number;
}

interface MediaCarouselProps {
  media: MediaItem[];
  onMediaClick: (item: MediaItem) => void;
  aspect?: string;
  fit?: string;
}

export default function MediaCarousel({ media, onMediaClick,aspect='portrait',fit='contain' }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touch=useRef(0);

  if (!media || media.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = media[currentIndex];

  return (
    <div className="relative w-full bg-slate-950/90 overflow-hidden group border border-slate-800/20" style={{aspectRatio:aspect==='square'?'1':aspect==='landscape'?'16/9':aspect==='original'&&media[0].width&&media[0].height?`${media[0].width}/${media[0].height}`:'4/5'}} onTouchStart={e=>{touch.current=e.touches[0].clientX;}} onTouchEnd={e=>{const delta=e.changedTouches[0].clientX-touch.current;if(Math.abs(delta)>50)setCurrentIndex(i=>Math.max(0,Math.min(media.length-1,i+(delta<0?1:-1))));}}>
      
      {/* Current Slide Content */}
      <div 
        onClick={() => onMediaClick(currentMedia)}
        className="w-full h-full flex items-center justify-center cursor-pointer select-none"
      >
        {currentMedia.type === 'image' ? (
          currentMedia.url && currentMedia.url.trim() !== '' ? (
            <img
              src={currentMedia.url}
              alt={`Slide ${currentIndex + 1}`}
              className="w-full h-full object-contain"
              style={{objectFit:fit==='cover'?'cover':'contain'}}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null
        ) : (
          <div className="relative w-full h-full">
            {currentMedia.url && currentMedia.url.trim() !== '' ? (
              <LazyVideo
                src={currentMedia.url}
                className="w-full h-full"
              />
            ) : null}
            {/* Play overlay suggestion */}
            <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono flex items-center gap-1 uppercase tracking-wider">
              <Play className="w-2.5 h-2.5 fill-current text-white" /> VIDEO
            </div>
          </div>
        )}
      </div>

      {/* Slide Navigation Arrows */}
      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Media sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer shadow-md z-10"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            aria-label="Media berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer shadow-md z-10"
          >
            <ChevronRight className="w-4 h-4 md:w-5 h-5" />
          </button>
        </>
      )}

      {/* Progress indicators */}
      {media.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 flex items-center gap-1.5 z-10">
          {media.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              aria-label={'Lihat media '+(idx+1)}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}

      {/* Page / media fraction index counter */}
      {media.length > 1 && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono font-bold tracking-wider z-10">
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
}
