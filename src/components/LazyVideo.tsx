import React, { useEffect, useRef, useState } from 'react';

interface LazyVideoProps {
  src: string;
  className?: string;
  poster?: string;
}

export default function LazyVideo({ src, className = '', poster }: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          // Play video when visible
          videoElement.play().catch((err) => {
            // Auto-play might be blocked by browser policies if not muted,
            // but we default to muted.
            console.log('Autoplay play prevented:', err.message);
          });
        } else {
          // Pause video when out of viewport
          videoElement.pause();
        }
      },
      {
        threshold: 0.3, // Trigger when 30% of the video is visible
      }
    );

    observer.observe(videoElement);

    return () => {
      if (videoElement) {
        observer.unobserve(videoElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={isInViewport ? src : undefined}
        poster={poster}
        className={`w-full h-full object-contain ${className}`}
        muted={isMuted}
        loop
        playsInline
        preload="none"
        controls
      />
      
      {/* Small custom indicator for mute state */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
          }
        }}
        className="absolute bottom-3 right-12 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[10px] font-mono font-bold tracking-wider"
      >
        {isMuted ? 'UNMUTE' : 'MUTE'}
      </button>
    </div>
  );
}
