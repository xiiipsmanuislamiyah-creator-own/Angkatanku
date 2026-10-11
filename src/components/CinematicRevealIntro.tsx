import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const LOGO_ARTWORK_URL = 'https://res.cloudinary.com/dhxfke7kq/image/upload/v1788992142/Assest/mgdqwfulzzr3drhqbqll.png';
const BANNER_HERO_URL = 'https://res.cloudinary.com/dhxfke7kq/image/upload/v1791122575/Assest/jfct1twjurj7t3innpzt.jpg';

type SplashPhase = 'reveal' | 'gather' | 'shimmer' | 'dissolve';

export default function CinematicRevealIntro() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<SplashPhase>('reveal');
  const [isIdleLiving, setIsIdleLiving] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MIN_DURATION = prefersReduced ? 1200 : 6000;
    const startTime = performance.now();

    let assetsReady = false;
    let animationFrameId: number;
    let isCancelled = false;

    // 1. Critical assets preloading
    const criticalAssets = [
      LOGO_ARTWORK_URL,
      BANNER_HERO_URL,
      '/gambar/banner.jpeg'
    ];

    let loadedCount = 0;
    const totalAssets = criticalAssets.length + 1; // +1 for document.fonts

    const markLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalAssets) {
        assetsReady = true;
      }
    };

    criticalAssets.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = markLoaded;
      img.onerror = markLoaded; // Proceed gracefully on network hiccup
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(markLoaded).catch(markLoaded);
    } else {
      markLoaded();
    }

    // 2. Real-time animation loop
    const tick = (now: number) => {
      if (isCancelled) return;
      const elapsed = now - startTime;

      if (elapsed < MIN_DURATION) {
        // Smoothly advance progress during sequence up to ~0.94
        const timeRatio = elapsed / MIN_DURATION;
        const assetRatio = Math.min(1, loadedCount / totalAssets);
        const targetProgress = Math.min(0.94, (timeRatio * 0.72) + (assetRatio * 0.22));
        
        setProgress((prev) => Math.max(prev, targetProgress));
        animationFrameId = requestAnimationFrame(tick);
      } else {
        // Minimum duration (6s) reached
        if (assetsReady || elapsed >= 8000) {
          setProgress(1.0);
          triggerCompletion();
        } else {
          // Critical assets still downloading: enter idle living state
          // Maintain fully revealed logo, gentle star breathing & line shimmer without resetting
          setIsIdleLiving(true);
          setProgress(0.94);
          animationFrameId = requestAnimationFrame(tick);
        }
      }
    };

    const triggerCompletion = () => {
      setIsIdleLiving(false);
      setPhase('gather');

      // 1. Light gathers back into center diamond & central star (±350ms)
      setTimeout(() => {
        if (isCancelled) return;
        setPhase('shimmer');

        // 2. Final soft ivory/gold shimmer washes over logo (±400ms)
        setTimeout(() => {
          if (isCancelled) return;
          setPhase('dissolve');

          // 3. Splash fade/dissolve (±700ms - 800ms) revealing homepage seamless behind
          setTimeout(() => {
            if (isCancelled) return;
            setIsVisible(false);
          }, 750);
        }, 400);
      }, 350);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'dissolve' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-4 sm:p-8 bg-black pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Logo Reveal Artwork Stage */}
          <div
            className="cinematic-stage"
            aria-label="Cinematic Logo Reveal Angkatan 2026 XII IPS"
          >
            {/* 1. Base dimmed artwork (0.00s) */}
            <img
              className="cinematic-layer cinematic-base"
              src={LOGO_ARTWORK_URL}
              alt="ANGKATAN 2026 XII IPS SATU KELUARGA"
            />

            {/* 2. Ambient gold radial halo */}
            <div className="cinematic-ambient" />

            {/* 3. Top-reveal highlight across 'ANGKATAN 2026' */}
            <img
              className="cinematic-layer cinematic-masked cinematic-top-reveal"
              src={LOGO_ARTWORK_URL}
              alt=""
              aria-hidden="true"
            />

            {/* 4. Central star ignite & horizontal laser beams traveling left-right */}
            <div className="cinematic-ignite" />
            <div className="cinematic-crossflare" />
            <div className="cinematic-beamL" />
            <div className="cinematic-beamR" />

            {/* 5. Soft ivory/gold sweep across 'XII IPS' */}
            <div className="cinematic-gold-sweep" />
            <img
              className="cinematic-layer cinematic-masked cinematic-sweep-art"
              src={LOGO_ARTWORK_URL}
              alt=""
              aria-hidden="true"
            />
            <div className="cinematic-ivory-sweep" />

            {/* 6. Lower bloom at 'SATU KELUARGA' & bottom ornaments (NO orbs under X and S) */}
            <div className="cinematic-lower-bloom" />

            {/* 7. Final full gold bloom */}
            <img
              className="cinematic-layer cinematic-full"
              src={LOGO_ARTWORK_URL}
              alt=""
              aria-hidden="true"
            />

            {/* 8. Central star breathing glow in idle living state */}
            {isIdleLiving && <div className="cinematic-star-idle" />}

            {/* 9. Light gathers back to center upon loading completion */}
            {phase === 'gather' && <div className="cinematic-gather-center" />}

            {/* 10. Final soft ivory/gold shimmer prior to dissolve */}
            {phase === 'shimmer' && <div className="cinematic-final-shimmer" />}

            {/* 11. Subtle cinematic vignette */}
            <div className="cinematic-vignette" />
          </div>

          {/* Symmetrical Ornamental Loading Line (No generic progress bar, no %, no text) */}
          <div className="cinematic-ornament-track-container mt-6 sm:mt-8">
            {/* Background subtle golden baseline track */}
            <div className="cinematic-ornament-track" />

            {/* Outer delicate diamond accents */}
            <div className="cinematic-ornament-tip-left" />
            <div className="cinematic-ornament-tip-right" />

            {/* Symmetrical Progress Wings (Left & Right expanding from center diamond) */}
            <div
              className="cinematic-ornament-wing-left"
              style={{ width: `${(progress * 50).toFixed(2)}%` }}
            />
            <div
              className="cinematic-ornament-wing-right"
              style={{ width: `${(progress * 50).toFixed(2)}%` }}
            />

            {/* Warm-gold travelling light beads at leading tips */}
            {progress > 0.01 && (
              <>
                <div
                  className="cinematic-ornament-bead-left"
                  style={{ left: `calc(50% - ${(progress * 50).toFixed(2)}%)` }}
                />
                <div
                  className="cinematic-ornament-bead-right"
                  style={{ left: `calc(50% + ${(progress * 50).toFixed(2)}%)` }}
                />
              </>
            )}

            {/* Central Golden Diamond */}
            <div
              className={`cinematic-ornament-diamond ${phase === 'gather' ? 'gather' : ''}`}
            />

            {/* Idle living state: occasional subtle travelling light shimmer along line */}
            {isIdleLiving && <div className="cinematic-line-idle-pulse" />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
