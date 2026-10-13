import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Activity, 
  Image as ImageIcon, 
  Award, 
  Wrench, 
  MessageSquare, 
  Bot,
  Network
} from 'lucide-react';

interface NetworkEcosystemProps {
  onNodeClick: (tabId: string, pageName: string) => void;
  activeTab: string;
}

interface NodeItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  colorHex: string;
  angle: number; // in degrees
  bgStart: string;
  bgEnd: string;
  borderHex: string;
}

export default function NetworkEcosystem({ onNodeClick, activeTab }: NetworkEcosystemProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // Dark mode detector for cohesive theme styling
  const [isDark, setIsDark] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  
  // State for press-and-hold trigger
  const [pressingNode, setPressingNode] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 1500; // 1.5 seconds hold duration - perfectly intuitive

  // 8 outer nodes in a clean sosiologi cyber-ring
  const nodes: NodeItem[] = [
    { 
      id: 'struktur', 
      name: 'Struktur Kelas', 
      icon: Users, 
      color: 'text-teal-600', 
      colorHex: '#14b8a6', 
      angle: -90,
      bgStart: '#f0fdfa',
      bgEnd: '#ccfbf1',
      borderHex: '#99f6e4'
    },
    { 
      id: 'jadwal', 
      name: 'Jadwal Pelajaran', 
      icon: Calendar, 
      color: 'text-sky-600', 
      colorHex: '#0ea5e9', 
      angle: -45,
      bgStart: '#f0f9ff',
      bgEnd: '#e0f2fe',
      borderHex: '#bae6fd'
    },
    { 
      id: 'kegiatan', 
      name: 'Kegiatan Kelas', 
      icon: Activity, 
      color: 'text-emerald-600', 
      colorHex: '#10b981', 
      angle: 0,
      bgStart: '#ecfdf5',
      bgEnd: '#d1fae5',
      borderHex: '#a7f3d0'
    },
    { 
      id: 'galeri', 
      name: 'Galeri Memori', 
      icon: ImageIcon, 
      color: 'text-green-600', 
      colorHex: '#22c55e', 
      angle: 45,
      bgStart: '#f0fdf4',
      bgEnd: '#dcfce7',
      borderHex: '#bbf7d0'
    },
    { 
      id: 'prestasi', 
      name: 'Papan Prestasi', 
      icon: Award, 
      color: 'text-orange-600', 
      colorHex: '#f97316', 
      angle: 90,
      bgStart: '#fff7ed',
      bgEnd: '#ffedd5',
      borderHex: '#fed7aa'
    },
    { 
      id: 'alat-game', 
      name: 'Alat & Game', 
      icon: Wrench, 
      color: 'text-indigo-600', 
      colorHex: '#4f46e5', 
      angle: 135,
      bgStart: '#f5f3ff',
      bgEnd: '#e0e7ff',
      borderHex: '#c7d2fe'
    },
    { 
      id: 'feed', 
      name: 'Feed Angkatan', 
      icon: MessageSquare, 
      color: 'text-amber-600', 
      colorHex: '#ea580c', 
      angle: 180,
      bgStart: '#fffbeb',
      bgEnd: '#fef3c7',
      borderHex: '#fde68a'
    },
    { 
      id: 'nusa-ai', 
      name: 'Nusa AI', 
      icon: Bot, 
      color: 'text-violet-600', 
      colorHex: '#8b5cf6', 
      angle: 225,
      bgStart: '#f5f3ff',
      bgEnd: '#ede9fe',
      borderHex: '#ddd6fe'
    }
  ];

  const centerX = 270;
  const centerY = 270;
  const radius = 175;

  // Press handlers optimized for Zero Re-renders (100% CSS animation)
  const handlePressStart = (nodeId: string, nodeName: string) => {
    if (isTransitioning) return;
    
    // Clear any leftover timers
    if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    
    setPressingNode(nodeId);

    pressTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(true);
      setPressingNode(null);
      
      // Snappy and cinematic navigation trigger
      setTimeout(() => {
        onNodeClick(nodeId, nodeName);
      }, 500);
    }, HOLD_DURATION);
  };

  const handlePressCancel = () => {
    if (isTransitioning) return;
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
    setPressingNode(null);
  };

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    };
  }, []);

  // Constants for progress rings
  const centerRingRadius = 58;
  const centerRingCircumference = 2 * Math.PI * centerRingRadius; // ~364.42

  const outerRingRadius = 38;
  const outerRingCircumference = 2 * Math.PI * outerRingRadius; // ~238.76

  return (
    <div className="w-full max-w-[560px] mx-auto flex flex-col items-center select-none">
      
      {/* Inline Stylesheet for hardware-accelerated animations */}
      <style>{`
        @keyframes center-rumble {
          0% { transform: translate(0, 0); }
          20% { transform: translate(-1px, 0.5px); }
          40% { transform: translate(1px, -1px); }
          60% { transform: translate(-0.8px, -0.8px); }
          80% { transform: translate(0.8px, 0.8px); }
          100% { transform: translate(0, 0); }
        }
        .animate-rumble {
          animation: center-rumble 0.12s linear infinite;
          will-change: transform;
        }
        @keyframes tech-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes tech-spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-tech-spin {
          animation: tech-spin 14s linear infinite;
          transform-origin: 0px 0px;
        }
        .animate-tech-spin-reverse {
          animation: tech-spin-reverse 18s linear infinite;
          transform-origin: 0px 0px;
        }
        .animate-core-spin {
          animation: tech-spin 24s linear infinite;
          transform-origin: 0px 0px;
        }
        .animate-core-spin-reverse {
          animation: tech-spin-reverse 40s linear infinite;
          transform-origin: 0px 0px;
        }
      `}</style>

      {/* Main SVG Container */}
      <div className="aspect-square w-full">
        <svg viewBox="0 0 540 540" className="w-full h-full drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-core-center" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDark ? "#080c16" : "#090d16"} />
              <stop offset="100%" stopColor={isDark ? "#141e33" : "#1e293b"} />
            </linearGradient>
            <filter id="shadow-svg" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity={isDark ? "0.35" : "0.05"} />
            </filter>
            
            {/* Custom Theme Gradients for outer ring nodes */}
            {nodes.map((node) => (
              <linearGradient key={`grad-${node.id}`} id={`grad-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                {isDark ? (
                  <>
                    <stop offset="0%" stopColor="#0b1329" />
                    <stop offset="100%" stopColor="#16233d" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor={node.bgStart} />
                    <stop offset="100%" stopColor={node.bgEnd} />
                  </>
                )}
              </linearGradient>
            ))}
          </defs>

          {/* Connected Web Grid (Subtle geometric background lines) */}
          <g 
            stroke={isDark ? "#334155" : "#cbd5e1"} 
            strokeWidth="0.75" 
            strokeDasharray="4 4" 
            strokeOpacity={isDark ? "0.2" : "0.4"}
            fill="none"
            style={{ transition: 'opacity 350ms ease-out', opacity: isTransitioning ? 0 : 1 }}
          >
            {nodes.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const x = centerX + radius * Math.cos(rad);
              const y = centerY + radius * Math.sin(rad);
              return (
                <line 
                  key={`line-link-${node.id}`}
                  x1={centerX} 
                  y1={centerY} 
                  x2={x} 
                  y2={y} 
                  stroke={node.colorHex}
                  strokeOpacity={isDark ? "0.35" : "0.3"}
                  strokeWidth="1.25"
                />
              );
            })}
          </g>

          {/* Central Cosmic Core Node */}
          <g 
            transform={`translate(${centerX}, ${centerY}) scale(${isTransitioning ? 1.45 : (pressingNode === 'portal' ? 1.15 : 1.0)})`} 
            style={{ 
              transition: isTransitioning 
                ? 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)' 
                : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform',
            }}
            className="cursor-pointer group relative"
            onPointerDown={(e) => {
              e.preventDefault();
              handlePressStart('portal', 'Portal Semua Halaman');
            }}
            onPointerUp={handlePressCancel}
            onPointerCancel={handlePressCancel}
            onMouseLeave={handlePressCancel}
          >
            {/* Subtle rumble on press */}
            <g className={pressingNode === 'portal' ? 'animate-rumble' : ''}>
              {/* Center Outer glow circle */}
              <circle cx="0" cy="0" r="54" fill="#000" opacity="0.02" />
              <circle cx="0" cy="0" r="52" fill="url(#grad-core-center)" filter="url(#shadow-svg)" className="stroke-slate-800 stroke-[3px] group-hover:stroke-slate-700 transition-colors duration-200" />
              
              {/* Outer rotating decorative elements */}
              <circle cx="0" cy="0" r="62" fill="none" stroke="#14b8a6" strokeWidth="1.25" strokeOpacity={isTransitioning ? 0 : 0.3} strokeDasharray="4 4" className="animate-core-spin" />
              <circle cx="0" cy="0" r="70" fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity={isTransitioning ? 0 : 0.15} className="animate-core-spin-reverse" />
              
              {/* Pure CSS GPU progress ring */}
              <circle
                cx="0"
                cy="0"
                r={centerRingRadius}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3.5"
                strokeDasharray={centerRingCircumference}
                strokeDashoffset={pressingNode === 'portal' ? 0 : centerRingCircumference}
                transform="rotate(-90)"
                strokeLinecap="round"
                style={{
                  transition: pressingNode === 'portal' 
                    ? `stroke-dashoffset ${HOLD_DURATION}ms linear` 
                    : 'stroke-dashoffset 200ms ease-out',
                  willChange: 'stroke-dashoffset',
                }}
              />

              {/* Core Label content (Fades out when portal is expanding) */}
              <g style={{ transition: 'opacity 200ms ease-out', opacity: isTransitioning ? 0 : 1 }}>
                <foreignObject x="-14" y="-24" width="28" height="28">
                  <Network className="w-7 h-7 text-archive-mint animate-pulse" />
                </foreignObject>
                <text x="0" y="16" fontFamily="Space Grotesk" fontSize="10.5" fontWeight="700" fill="#ffffff" textAnchor="middle" letterSpacing="1">XII IPS</text>
                <text x="0" y="28" fontFamily="JetBrains Mono" fontSize="7.5" fontWeight="500" fill="#6ee7b7" textAnchor="middle" letterSpacing="0.5">MA NU I</text>
              </g>
            </g>
          </g>

          {/* Sibling Nodes around the ring */}
          {nodes.map((node, index) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = centerX + radius * Math.cos(rad);
            const y = centerY + radius * Math.sin(rad);
            
            const isHovered = hoveredNode === node.id;
            const isActive = activeTab === node.id;
            const isPressingThis = pressingNode === node.id;
            
            // Staggered dissolve delay calculations for sibling nodes on transition
            const staggerDelay = index * 40;

            return (
              <g 
                key={`node-terminal-${node.id}`}
                transform={isTransitioning ? `translate(${x}, ${y}) scale(0)` : `translate(${x}, ${y}) scale(${isPressingThis ? 1.15 : (isHovered ? 1.05 : 1.0)})`}
                style={{ 
                  transition: isTransitioning 
                    ? `all 450ms cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}ms` 
                    : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1) 0ms',
                  opacity: isTransitioning ? 0 : 1,
                  willChange: 'transform, opacity',
                }}
                className="cursor-pointer group select-none"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => {
                  setHoveredNode(null);
                  handlePressCancel();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handlePressStart(node.id, node.name);
                }}
                onPointerUp={handlePressCancel}
                onPointerCancel={handlePressCancel}
              >
                {/* Tech Concentric Orbit Rings (Rotating slowly around every outer node) */}
                <g style={{ transformOrigin: '0px 0px' }}>
                  <circle 
                    cx="0" 
                    cy="0" 
                    r="41" 
                    fill="none" 
                    stroke={node.colorHex} 
                    strokeWidth="0.8" 
                    strokeOpacity={isHovered || isPressingThis ? "0.45" : "0.22"} 
                    strokeDasharray="6 3" 
                    className="animate-tech-spin" 
                    style={{ transition: 'stroke-opacity 200ms' }}
                  />
                  <circle 
                    cx="0" 
                    cy="0" 
                    r="45" 
                    fill="none" 
                    stroke="#0ea5e9" 
                    strokeWidth="0.6" 
                    strokeOpacity={isHovered || isPressingThis ? "0.3" : "0.1"} 
                    strokeDasharray="3 3" 
                    className="animate-tech-spin-reverse" 
                    style={{ transition: 'stroke-opacity 200ms' }}
                  />
                </g>

                {/* Node Ring wrapper */}
                <circle 
                  cx="0" 
                  cy="0" 
                  r="34" 
                  fill={`url(#grad-${node.id})`}
                  stroke={isHovered || isActive ? node.colorHex : (isDark ? `${node.colorHex}55` : node.borderHex)} 
                  strokeWidth={isHovered || isActive ? 2.5 : (isDark ? 1.5 : 1.25)} 
                  filter="url(#shadow-svg)"
                  className="transition-all duration-300"
                />
                
                {/* Active highlight inside */}
                <circle 
                  cx="0" 
                  cy="0" 
                  r="26" 
                  fill={isDark ? `${node.colorHex}18` : (isHovered || isActive ? `${node.colorHex}12` : `${node.bgStart}a0`)}
                  className="transition-colors duration-300" 
                />

                {/* React Icon Insertion (Vibrant & aligned) */}
                <g className="transition-transform duration-300 transform group-hover:scale-105">
                  <foreignObject x="-11" y="-11" width="22" height="22">
                    <node.icon className={`w-[22px] h-[22px] ${isHovered || isActive ? node.color : (isDark ? 'text-slate-200' : `${node.color} opacity-80`)}`} />
                  </foreignObject>
                </g>

                {/* Pure CSS GPU progress loader ring for sibling nodes */}
                <circle
                  cx="0"
                  cy="0"
                  r={outerRingRadius}
                  fill="none"
                  stroke={node.colorHex}
                  strokeWidth="3.25"
                  strokeDasharray={outerRingCircumference}
                  strokeDashoffset={isPressingThis ? 0 : outerRingCircumference}
                  transform="rotate(-90)"
                  strokeLinecap="round"
                  style={{
                    transition: isPressingThis 
                      ? `stroke-dashoffset ${HOLD_DURATION}ms linear` 
                      : 'stroke-dashoffset 200ms ease-out',
                    willChange: 'stroke-dashoffset',
                  }}
                />

                {/* Sleek, Upgraded Borderless Glassmorphism Text Label Bubble */}
                <g 
                  transform={`translate(0, ${y > centerY ? 52 : -52})`}
                  style={{ transition: 'opacity 250ms ease-out', opacity: isTransitioning ? 0 : 1 }}
                >
                  <rect 
                    x="-58" 
                    y="-9" 
                    width="116" 
                    height="18" 
                    rx="9" 
                    fill={isDark ? (isHovered || isActive ? '#0f172a' : '#080d1a') : (isHovered || isActive ? '#0f172a' : '#ffffff')} 
                    stroke={isDark ? (isHovered || isActive ? node.colorHex : '#334155') : (isHovered || isActive ? node.colorHex : '#cbd5e1')} 
                    strokeWidth="1"
                    strokeOpacity={isDark ? (isHovered || isActive ? 0.95 : 0.6) : (isHovered || isActive ? 0.95 : 0.3)}
                    filter="url(#shadow-svg)"
                    className="transition-all duration-300 shadow-xs"
                  />
                  {/* Status Indicator Dot on the Left */}
                  <circle 
                    cx="-45" 
                    cy="0" 
                    r="2.2" 
                    fill={isHovered || isActive ? '#14b8a6' : node.colorHex} 
                    className="transition-colors duration-300" 
                  />
                  <text 
                    x="5" 
                    y="2.8" 
                    fontFamily="Space Grotesk" 
                    fontSize="8.2" 
                    fontWeight="700" 
                    fill={isDark ? '#e2e8f0' : (isHovered || isActive ? '#ffffff' : '#334155')} 
                    textAnchor="middle"
                    letterSpacing="0.4"
                    className="transition-colors duration-300"
                  >
                    {node.name.toUpperCase()}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
