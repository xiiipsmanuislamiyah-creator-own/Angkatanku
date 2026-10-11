import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs } from '../lib/data';
import { db } from '../lib/firebase';
import { IDCardCanvas } from '../components/IDCardCanvas';
import { EditCardModal } from '../components/EditCardModal';
import { useAuth } from '../contexts/AuthContext';
import { 
  Network,
  Crown, 
  Shield, 
  BookOpen, 
  Coins, 
  Users, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  GraduationCap, 
  Edit3, 
  Info, 
  Compass, 
  UserCheck,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Share2,
  Instagram,
  Eye,
  Code2,
  School,
  Award
} from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { INITIAL_TEACHERS, Teacher } from '../data/teachersData';

interface StudentData {
  id: string;
  name: string;
  classRoom: string;
  role: string;
  induk?: string;
  nickname?: string;
  tags?: string[];
  quote?: string;
  avatarUrl?: string;
  socials?: any;
  email?: string;
  isTeacher?: boolean;
}

interface AnimatedBranchProps {
  key?: React.Key;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  show: boolean;
  delay?: number;
  isCurve?: boolean;
  curveType?: 'horizontal' | 'vertical';
  strokeWidth?: number;
  enableAura?: boolean;
  auraColor?: string;
}

// SVG Animated Branch Component (Clean, glowing curved thread matching kelas IPS 1 & 2)
const AnimatedBranch: React.FC<AnimatedBranchProps> = ({ 
  startX, 
  startY, 
  endX, 
  endY, 
  color, 
  show, 
  delay = 0, 
  isCurve = true,
  curveType = 'horizontal',
  strokeWidth = 1.75,
  enableAura = true,
  auraColor
}) => {
  let d = "";
  let midX = (startX + endX) / 2;
  let midY = (startY + endY) / 2;

  if (startX === endX || startY === endY) {
    d = `M ${startX} ${startY} L ${endX} ${endY}`;
  } else if (isCurve) {
    if (curveType === 'vertical') {
      const dy = endY - startY;
      const c1x = startX;
      const c1y = startY + dy * 0.5;
      const c2x = endX;
      const c2y = startY + dy * 0.5;
      d = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
      midX = (startX + endX) / 2;
      midY = startY + dy * 0.5;
    } else {
      const dx = endX - startX;
      const c1x = startX + dx * 0.5;
      const c1y = startY;
      const c2x = startX + dx * 0.5;
      const c2y = endY;
      d = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
      midX = startX + dx * 0.5;
      midY = (startY + endY) / 2;
    }
  } else {
    const bendY = startY + (endY - startY) * 0.4;
    d = `M ${startX} ${startY} L ${startX} ${bendY} L ${endX} ${bendY} L ${endX} ${endY}`;
    midX = (startX + endX) / 2;
    midY = bendY;
  }

  // Aura/glow stroke color: custom auraColor or fallback
  const glowColor = auraColor || (color.startsWith('#') ? color : '#34d399');

  return (
    <g className="pointer-events-none">
      {/* 1. Soft static glow halo behind the thread */}
      {show && enableAura && (
        <motion.path
          d={d}
          fill="none"
          stroke={glowColor}
          strokeWidth={strokeWidth + 2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={show ? { pathLength: 1, opacity: 0.28 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.4, delay, ease: "easeOut" }}
        />
      )}

      {/* 2. Slim, vibrant core thread (Smooth, clean, elegant) */}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={show ? { pathLength: 1, opacity: 0.95 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.4, delay, ease: "easeOut" }}
      />
    </g>
  );
};

interface AnimatedNodeProps {
  key?: React.Key;
  show: boolean;
  delay?: number;
  x: number;
  y: number;
  children: React.ReactNode;
  id?: string;
  onClick?: () => void;
}

// Node wrapper with spring animations
const AnimatedNode: React.FC<AnimatedNodeProps> = ({ 
  show, 
  delay = 0, 
  x, 
  y, 
  children, 
  id, 
  onClick 
}) => (
  <AnimatePresence>
    {show && (
      <motion.div
        id={id}
        initial={{ scale: 0.4, opacity: 0, y: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260, delay }}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
        style={{ left: x, top: y }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// Floating HUD controls that interact with Zoom/Pan
const MapFloatingControls = ({ 
  onResetCenter, 
  onToggleAll, 
  isAllExpanded
}: { 
  onResetCenter: () => void; 
  onToggleAll: () => void; 
  isAllExpanded: boolean;
}) => {
  const { zoomIn, zoomOut, setTransform, instance } = useControls();

  const handlePanUp = () => {
    // Pan camera upwards to view top content smoothly
    const currentX = instance?.state?.positionX ?? 0;
    const currentY = instance?.state?.positionY ?? 0;
    const currentScale = instance?.state?.scale ?? 1;
    setTransform(currentX, currentY + 280, currentScale, 250, "easeOut");
  };

  return (
    <div className="absolute bottom-5 right-5 z-40 flex flex-col gap-1 pointer-events-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg shadow-md border border-slate-200/80 dark:border-slate-800 p-0.5 flex flex-col gap-0.5">
        <button
          onClick={handlePanUp}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Geser ke Atas (Dewan Guru)"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
        <button
          onClick={() => zoomIn(0.3, 300)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom Masuk (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => zoomOut(0.3, 300)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Zoom Keluar (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
        <button
          onClick={onResetCenter}
          className="w-7 h-7 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
          title="Pusatkan Peta"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onToggleAll}
          className="w-7 h-7 rounded-md flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
          title={isAllExpanded ? "Tutup Semua Cabang" : "Buka Semua Cabang"}
        >
          {isAllExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

// Helper to calculate member grid positions
// When the last row has fewer than 4 items (e.g. 2 items), take the 2 middle columns (col 1 & 2) instead of starting from the side
const getMemberGridPosition = (
  idx: number,
  total: number,
  baseX: number,
  baseY: number,
  colSpacing = 220,
  rowSpacing = 150
) => {
  const row = Math.floor(idx / 4);
  const totalRows = Math.ceil(total / 4);
  const isLastRow = row === totalRows - 1;
  const remainder = total % 4; // 0 (full 4), 1, 2, or 3

  let col = idx % 4;

  if (isLastRow && remainder > 0) {
    if (remainder === 2) {
      // Shift from col 0, 1 -> col 1, 2 (the 2 center columns out of 0, 1, 2, 3)
      col = col + 1;
    } else if (remainder === 1) {
      col = 1.5;
    } else if (remainder === 3) {
      col = col + 0.5;
    }
  }

  const targetX = baseX + col * colSpacing;
  const targetY = baseY + row * rowSpacing;

  return { col, row, targetX, targetY };
};

export default function Mading({ onNavigate }: { onNavigate?: (tab: string, name?: string, data?: any) => void }) {
  const { user, isAdmin, currentStudent } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [teachersCustom, setTeachersCustom] = useState<Record<string, Partial<Teacher>>>({});
  const [loading, setLoading] = useState(true);
  
  // Inspection Drawer & Modals state
  const [inspectedStudent, setInspectedStudent] = useState<StudentData | null>(null);
  const [selectedForCardModal, setSelectedForCardModal] = useState<StudentData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ips1' | 'ips2'>('all');
  
  // Branch expansion states - Initially start with just the glowing center node
  const [expanded, setExpanded] = useState({
    classes: false,
    ips1Board: false,
    ips2Board: false,
    ips1Members: false,
    ips2Members: false,
    developer: false,
    guru: false
  });

  // Energy aura running through branches (vibrant, ultra-lightweight GPU composited)
  const [enableAura, setEnableAura] = useState(true);

  const transformRef = useRef<any>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const initialCenterScale = isMobile ? 0.95 : 1.15;

  // Calculates optimal zoom out scale so both XII IPS 1 and XII IPS 2 structures fit nicely in view
  const calculateFitScale = () => {
    if (typeof window === 'undefined') return 0.62;
    const vw = window.innerWidth;
    const vh = window.innerHeight - 80;
    // Bounding box for both class structures: width ~ 2000px, height ~ 1250px
    const scaleX = (vw * 0.90) / 2000;
    const scaleY = (vh * 0.85) / 1250;
    const fit = Math.min(scaleX, scaleY);
    return Math.max(0.38, Math.min(0.68, Number(fit.toFixed(2))));
  };

  const fetchStudents = async () => {
    try {
      const snap = await getDocs(collection(db, 'students'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentData));
      setStudents(data);

      try {
        const tSnap = await getDocs(collection(db, 'teachers'));
        const tMap: Record<string, any> = {};
        tSnap.docs.forEach(d => {
          tMap[d.id] = { id: d.id, ...d.data() };
        });
        setTeachersCustom(tMap);
      } catch (err) {
        console.warn("Error fetching teachers custom:", err);
      }
    } catch (err: any) {
      console.warn("Notice: Error fetching students for mading, using defaults:", err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    fetchStudents();
  }, []);

  // Ensure camera is perfectly centered on the ANGKATANKU core when loading completes
  useEffect(() => {
    if (!loading && transformRef.current) {
      const timer = setTimeout(() => {
        transformRef.current?.centerView(initialCenterScale, 0);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [loading, isMobile, initialCenterScale]);

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    fetchStudents();
  };

  const getByNameOrRole = (list: StudentData[], name: string, roleKey: string) => {
    return list.find(s => s.name?.toLowerCase().includes(name.toLowerCase())) || 
           list.find(s => s.role?.toLowerCase().includes(roleKey.toLowerCase()));
  };

  const developer = students.find(s => 
    s.role?.toLowerCase().includes('developer') || 
    s.name?.toLowerCase().includes('rohmatulloh') ||
    s.email?.toLowerCase().includes('xii.ips.manu.islamiyah@gmail.com')
  );

  const devData: StudentData = useMemo(() => {
    if (developer) {
      return {
        ...developer,
        role: developer.role || 'Web Developer & Architect',
        classRoom: developer.classRoom || 'Alumni / Pengembang'
      };
    }
    return {
      id: 'developer-rohmatulloh',
      name: 'Rohmatulloh',
      classRoom: 'Alumni / Pengembang',
      role: 'Web Developer & Architect',
      nickname: 'Rohmat',
      quote: 'AI Enthusiast, Web Developer & Technology Explorer. Membangun Legacy Digital XII IPS.',
      tags: ['Developer', 'System Architect', 'AI Explorer'],
      email: 'xii.ips.manu.islamiyah@gmail.com'
    };
  }, [developer]);

  // Merge default INITIAL_TEACHERS with custom overrides from teachers / students collections
  const mergedTeachers = useMemo(() => {
    return INITIAL_TEACHERS.map(t => {
      const custom = teachersCustom[t.id] || {};
      const studentCustom = students.find(s => s.id === t.id || s.induk === t.nip || (s as any).nip === t.nip);
      const finalCustom = { ...custom, ...(studentCustom || {}) };
      return {
        ...t,
        ...finalCustom,
        url_gambar: finalCustom.url_gambar || (finalCustom as any).avatarUrl || t.url_gambar,
        quote: (finalCustom as any).quote || (finalCustom as any).motto || t.quote,
        nama: finalCustom.nama || (finalCustom as any).name || t.nama
      };
    });
  }, [teachersCustom, students]);

  // Categorize Teachers into Organizational Tiers with custom overrides
  const kepalaTeacher = useMemo(() => {
    return mergedTeachers.find(t => t.id === 'guru-1' || t.nama.toLowerCase().includes('abdul holik')) || mergedTeachers[0];
  }, [mergedTeachers]);

  const pimpinanTeachers = useMemo(() => {
    return [
      mergedTeachers.find(t => t.id === 'guru-8') || { id: 'guru-8', nama: 'IBNU RUSLAN NURUS ZAMAN S.Hum.', title: 'Wakil Kepala Madrasah', jabatan: 'Waka Bidang Kurikulum', url_gambar: '' },
      mergedTeachers.find(t => t.id === 'guru-14') || { id: 'guru-14', nama: 'MOH. HUSNAN S.HI.', title: 'Wakil Kepala Madrasah', jabatan: 'Waka Bidang Kesiswaan', url_gambar: '' },
      mergedTeachers.find(t => t.id === 'guru-20') || { id: 'guru-20', nama: 'Drs. H. ALWI', title: '', jabatan: null, url_gambar: '' },
      mergedTeachers.find(t => t.id === 'guru-2') || { id: 'guru-2', nama: 'ANIS KOMARIYAH S.Pd.', title: 'Operator Sekolah', jabatan: 'Bendahara BOS', url_gambar: '' },
    ];
  }, [mergedTeachers]);

  const dewanGuruTeachers = useMemo(() => {
    const pimpinanIds = new Set(['guru-1', 'guru-8', 'guru-14', 'guru-20', 'guru-2']);
    return mergedTeachers.filter(t => !pimpinanIds.has(t.id));
  }, [mergedTeachers]);

  const guruRow1 = useMemo(() => dewanGuruTeachers.slice(0, 8), [dewanGuruTeachers]);
  const guruRow2 = useMemo(() => dewanGuruTeachers.slice(8), [dewanGuruTeachers]);

  const ips1 = useMemo(() => students.filter(s => s.classRoom === 'IPS 1' && s.id !== developer?.id), [students, developer]);
  const ips2 = useMemo(() => students.filter(s => s.classRoom === 'IPS 2' && s.id !== developer?.id), [students, developer]);

  const ketua1 = getByNameOrRole(ips1, 'chantika', 'ketua') || getByNameOrRole(ips1, 'cantika', 'ketua');
  const wakil1 = getByNameOrRole(ips1, 'elfa', 'wakil');
  const sek1 = getByNameOrRole(ips1, 'lifa', 'sekretaris');
  const ben1 = getByNameOrRole(ips1, 'aulia', 'bendahara');
  const anggota1 = useMemo(() => ips1.filter(s => s !== ketua1 && s !== wakil1 && s !== sek1 && s !== ben1), [ips1, ketua1, wakil1, sek1, ben1]);

  const ketua2 = getByNameOrRole(ips2, 'alfina', 'ketua');
  const wakil2 = getByNameOrRole(ips2, 'abil', 'wakil');
  const ben2 = getByNameOrRole(ips2, 'alif', 'bendahara');
  const sek2 = getByNameOrRole(ips2, 'tegar', 'sekretaris') || getByNameOrRole(ips2, 'shinta', 'sekretaris'); 
  const anggota2 = useMemo(() => ips2.filter(s => s !== ketua2 && s !== wakil2 && s !== ben2 && s !== sek2), [ips2, ketua2, wakil2, ben2, sek2]);

  // Progressive 3-step reveal state:
  // 0: Closed
  // 1: Kanan & Kiri (IPS 1 & IPS 2)
  // 2: + Dewan Guru (Kepala Madrasah, Waka, Dewan Guru)
  // 3: + Developer (Struktur Lengkap)
  const [expansionStage, setExpansionStage] = useState<number>(0);
  const [smokePuffs, setSmokePuffs] = useState<{ id: number; key: number }[]>([]);

  const triggerSmokeEffect = () => {
    const newPuff = { id: Date.now(), key: Math.random() };
    setSmokePuffs(prev => [...prev.slice(-2), newPuff]);
    setTimeout(() => {
      setSmokePuffs(prev => prev.filter(p => p.id !== newPuff.id));
    }, 950);
  };

  // Toggle helpers: Progressive 3-Step Sequence
  const handleToggleClasses = () => {
    triggerSmokeEffect();

    if (expansionStage === 0) {
      // Step 1: Kedua sisi kanan dan kiri muncul terlebih dahulu
      setExpansionStage(1);
      setExpanded({
        classes: true,
        ips1Board: true,
        ips2Board: true,
        ips1Members: false,
        ips2Members: false,
        developer: false,
        guru: false
      });
      const targetScale = calculateFitScale();
      setTimeout(() => {
        transformRef.current?.centerView(targetScale, 800, "easeOut");
      }, 60);
    } else if (expansionStage === 1) {
      // Step 2: Baru bagian guru muncul
      setExpansionStage(2);
      setExpanded(prev => ({
        ...prev,
        classes: true,
        ips1Board: true,
        ips2Board: true,
        guru: true,
        developer: false
      }));
      const targetScale = calculateFitScale() * 0.94;
      setTimeout(() => {
        transformRef.current?.centerView(targetScale, 800, "easeOut");
      }, 60);
    } else if (expansionStage === 2) {
      // Step 3: Bagian Developer muncul
      setExpansionStage(3);
      setExpanded(prev => ({
        ...prev,
        classes: true,
        developer: true
      }));
      const targetScale = calculateFitScale() * 0.88;
      setTimeout(() => {
        transformRef.current?.centerView(targetScale, 800, "easeOut");
      }, 60);
    } else {
      // Step 4 / Reset: Tutup kembali ke pusat
      setExpansionStage(0);
      setExpanded({
        classes: false,
        ips1Board: false,
        ips2Board: false,
        ips1Members: false,
        ips2Members: false,
        developer: false,
        guru: false
      });
      setTimeout(() => {
        transformRef.current?.centerView(initialCenterScale, 700, "easeOut");
      }, 60);
    }
  };

  const toggleIps1Board = () => setExpanded(p => ({ ...p, ips1Board: !p.ips1Board }));
  const toggleIps2Board = () => setExpanded(p => ({ ...p, ips2Board: !p.ips2Board }));
  const toggleIps1Members = () => setExpanded(p => ({ ...p, ips1Members: !p.ips1Members }));
  const toggleIps2Members = () => setExpanded(p => ({ ...p, ips2Members: !p.ips2Members }));
  const toggleDeveloper = () => {
    triggerSmokeEffect();
    setExpanded(p => {
      const next = !p.developer;
      if (next) setExpansionStage(3);
      return { ...p, developer: next };
    });
  };
  const toggleGuru = () => {
    triggerSmokeEffect();
    setExpanded(p => {
      const next = !p.guru;
      if (next) setExpansionStage(prev => (prev < 2 ? 2 : prev));
      return { ...p, guru: next };
    });
  };

  const isAllExpanded = expanded.classes && expanded.ips1Board && expanded.ips2Board && expanded.ips1Members && expanded.ips2Members && expanded.developer && expanded.guru;

  const handleToggleAll = () => {
    triggerSmokeEffect();
    if (isAllExpanded) {
      setExpansionStage(0);
      setExpanded({
        classes: false,
        ips1Board: false,
        ips2Board: false,
        ips1Members: false,
        ips2Members: false,
        developer: false,
        guru: false
      });
      setTimeout(() => {
        transformRef.current?.centerView(initialCenterScale, 700, "easeOut");
      }, 60);
    } else {
      setExpansionStage(3);
      setExpanded({
        classes: true,
        ips1Board: true,
        ips2Board: true,
        ips1Members: true,
        ips2Members: true,
        developer: true,
        guru: true
      });
      setTimeout(() => {
        transformRef.current?.centerView(isMobile ? 0.28 : 0.44, 850, "easeOut");
      }, 60);
    }
  };

  const handleResetCenter = () => {
    if (transformRef.current) {
      if (!expanded.classes) {
        transformRef.current.centerView(initialCenterScale, 400, "easeOut");
      } else {
        const targetScale = calculateFitScale();
        transformRef.current.centerView(targetScale, 400, "easeOut");
      }
    }
  };

  // Search filtered results
  const allSearchable = useMemo(() => {
    const list = [...students];
    if (!students.some(s => s.id === devData.id)) {
      list.push(devData);
    }
    INITIAL_TEACHERS.forEach(t => {
      list.push({
        id: t.id,
        name: t.nama,
        role: t.jabatan || t.title || 'Tenaga Pendidik',
        classRoom: t.id === 'guru-1' ? 'Kepala Madrasah' : (t.title === 'Wakil Kepala Madrasah' ? 'Pimpinan' : 'Dewan Guru'),
        avatarUrl: t.url_gambar || '',
        quote: (t.title || t.jabatan) ? (t.jabatan ? `${t.title || ''} • ${t.jabatan}` : t.title) : '',
        induk: t.id,
        isTeacher: true
      } as any);
    });
    return list;
  }, [students, devData]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allSearchable.filter(s => 
      s.name?.toLowerCase().includes(q) || 
      s.nickname?.toLowerCase().includes(q) ||
      s.role?.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, allSearchable]);

  const handleSelectSearchResult = (student: StudentData) => {
    setInspectedStudent(student);
    setSearchQuery('');
    // Auto expand the branch the student belongs to
    if (student.classRoom === 'IPS 1') {
      setExpanded(p => ({ ...p, classes: true, ips1Board: true, ips1Members: true }));
    } else if (student.classRoom === 'IPS 2') {
      setExpanded(p => ({ ...p, classes: true, ips2Board: true, ips2Members: true }));
    } else if (student.id === devData.id || student.role?.toLowerCase().includes('developer')) {
      setExpanded(p => ({ ...p, classes: true, developer: true }));
    } else if ((student as any).isTeacher || student.classRoom?.includes('Guru') || student.classRoom?.includes('Kepala') || student.classRoom?.includes('Pimpinan')) {
      setExpanded(p => ({ ...p, classes: true, guru: true }));
    }
  };

  // Clean, high-contrast MiniCard component
  const StudentNodeCard = ({ 
    student, 
    isDummy = false, 
    title, 
    roleLabel, 
    icon: IconComp, 
    theme = 'ips1',
    onClick,
    isMemberHub = false
  }: {
    student?: StudentData | null;
    isDummy?: boolean;
    title?: string;
    roleLabel?: string;
    icon?: any;
    theme?: 'ips1' | 'ips2' | 'wali1' | 'wali2' | 'hub' | 'developer' | 'guru' | 'kepala' | 'pimpinan';
    onClick?: () => void;
    isMemberHub?: boolean;
  }) => {
    const isRegistered = Boolean(student?.avatarUrl || student?.quote);
    const isSelected = inspectedStudent?.id && student?.id === inspectedStudent.id;

    // Distinct theme styling
    let cardClasses = "";
    let badgeClasses = "";
    let avatarRing = "";

    if (theme === 'wali1') {
      cardClasses = "bg-sky-950/90 border-sky-400/60 text-white shadow-sky-900/40";
      badgeClasses = "bg-sky-500/30 text-sky-200 border-sky-400/40";
      avatarRing = "ring-2 ring-sky-400";
    } else if (theme === 'wali2') {
      cardClasses = "bg-amber-950/90 border-amber-400/60 text-white shadow-amber-900/40";
      badgeClasses = "bg-amber-500/30 text-amber-200 border-amber-400/40";
      avatarRing = "ring-2 ring-amber-400";
    } else if (theme === 'ips1') {
      cardClasses = "bg-slate-900/90 border-sky-500/40 text-white hover:border-sky-400 shadow-slate-950/50";
      badgeClasses = "bg-sky-950 text-sky-300 border-sky-500/30";
      avatarRing = "ring-1 ring-sky-400/50";
    } else if (theme === 'ips2') {
      cardClasses = "bg-slate-900/90 border-amber-500/40 text-white hover:border-amber-400 shadow-slate-950/50";
      badgeClasses = "bg-amber-950 text-amber-300 border-amber-500/30";
      avatarRing = "ring-1 ring-amber-400/50";
    } else if (theme === 'hub') {
      cardClasses = "bg-emerald-950/90 border-emerald-400 text-white hover:bg-emerald-900 shadow-emerald-950/50";
      badgeClasses = "bg-emerald-800 text-emerald-100 border-emerald-400/40";
      avatarRing = "ring-2 ring-emerald-400";
    } else if (theme === 'developer') {
      cardClasses = "bg-slate-900/95 border-violet-500/70 text-white hover:border-violet-400 shadow-[0_0_35px_-5px_rgba(139,92,246,0.5)]";
      badgeClasses = "bg-violet-950 text-violet-300 border-violet-500/40";
      avatarRing = "ring-2 ring-violet-400";
    } else if (theme === 'kepala') {
      cardClasses = "bg-gradient-to-b from-amber-950/95 via-slate-900/95 to-slate-950/95 border-2 border-amber-400 text-white hover:border-amber-300 shadow-[0_0_38px_-4px_rgba(245,158,11,0.65)]";
      badgeClasses = "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black border-amber-300 shadow-sm uppercase tracking-wider";
      avatarRing = "ring-2 ring-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.7)]";
    } else if (theme === 'pimpinan') {
      cardClasses = "bg-slate-900/95 border-teal-400/80 text-white hover:border-teal-300 shadow-[0_0_28px_-5px_rgba(20,184,166,0.4)]";
      badgeClasses = "bg-teal-950 text-teal-300 border-teal-400/50 font-semibold";
      avatarRing = "ring-2 ring-teal-400/80";
    } else if (theme === 'guru') {
      cardClasses = "bg-slate-900/95 border-emerald-500/60 text-white hover:border-emerald-400 shadow-[0_0_24px_-5px_rgba(16,185,129,0.3)]";
      badgeClasses = "bg-emerald-950/90 text-emerald-300 border-emerald-500/40";
      avatarRing = "ring-2 ring-emerald-400/80";
    }

    if (isMemberHub) {
      return (
        <button
          onClick={onClick}
          className={`w-38 p-2.5 rounded-xl border-2 backdrop-blur-md shadow-xl transition-all duration-200 flex flex-col items-center group cursor-pointer hover:scale-105 active:scale-95 ${cardClasses}`}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1.5 border border-emerald-400/50 group-hover:bg-emerald-500/30 transition-colors">
            <Users className="w-5 h-5 text-emerald-300" />
          </div>
          <span className="text-xs font-black tracking-wide uppercase text-white mb-0.5">{title || 'Anggota'}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {roleLabel || 'Semua Siswa'}
          </span>
          <span className="text-[9px] text-emerald-300/80 mt-1 font-medium flex items-center gap-1">
            Klik untuk ekspansi
          </span>
        </button>
      );
    }

    if (isDummy || !student) {
      return (
        <div 
          onClick={onClick}
          className={`w-38 p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-200 flex flex-col items-center cursor-pointer hover:scale-102 ${cardClasses} opacity-95`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-1.5 border border-slate-700">
            {IconComp ? <IconComp className="w-4 h-4 text-slate-300" /> : <GraduationCap className="w-4 h-4 text-slate-300" />}
          </div>
          <span className="text-xs font-bold text-slate-100 text-center line-clamp-1 mb-0.5">{title || 'Belum Terisi'}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {roleLabel || 'Struktur'}
          </span>
        </div>
      );
    }

    return (
      <div
        onClick={() => {
          if (onClick) onClick();
          else setInspectedStudent(student);
        }}
        className={`w-38 p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-200 flex flex-col items-center cursor-pointer group hover:scale-105 hover:shadow-2xl ${cardClasses} ${
          isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-105' : ''
        }`}
      >
        <div className="relative mb-1.5">
          <div className={`w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center ${avatarRing}`}>
            {student.avatarUrl && student.avatarUrl.trim() !== '' ? (
              <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-sm">{(student.name || '?').charAt(0)}</span>
            )}
          </div>
          {theme === 'kepala' ? (
            <div className="absolute -top-1.5 -right-1.5 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 rounded-full p-1 shadow-md" title="Kepala Madrasah">
              <Award className="w-3 h-3 stroke-[2.5]" />
            </div>
          ) : isRegistered ? (
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm" title="Profil Aktif">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          ) : null}
        </div>

        <p className={`text-xs font-bold text-center line-clamp-1 mb-0.5 transition-colors ${
          theme === 'kepala' ? 'text-amber-200 group-hover:text-amber-100 font-extrabold' : 'text-slate-100 group-hover:text-emerald-300'
        }`}>
          {student.name}
        </p>

        <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border truncate max-w-full ${badgeClasses}`}>
          {roleLabel || student.role || 'Anggota'}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 text-slate-200">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Menyiapkan Mading Angkatan...</p>
      </div>
    );
  }

  // Exact canvas coordinates:
  // Center: (1600, 1100)
  // IPS 1: (1150, 1100) -> Pengurus at x=750 -> Anggota at x=420, 640, 860, 1080
  // IPS 2: (2050, 1100) -> Pengurus at x=2450 -> Anggota at x=2120, 2340, 2560, 2780
  const CANVAS_WIDTH = 3200;
  const CANVAS_HEIGHT = 2200;
  const CENTER_X = 1600;
  const CENTER_Y = 1100;

  return (
    <div className="h-full w-full bg-slate-950 relative overflow-hidden font-sans select-none flex flex-col">
      
      {/* Sleek architectural dot background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Top Floating Control Bar */}
      <header className="absolute top-4 left-4 right-4 z-40 pointer-events-none flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Title & Badge (Click to return to Beranda /home) */}
        <div 
          onClick={() => onNavigate && onNavigate('home', 'Beranda Angkatan')}
          className="bg-slate-900/90 hover:bg-slate-850 backdrop-blur-md border border-slate-800 hover:border-emerald-500/40 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto cursor-pointer transition-all group"
          title="Klik untuk kembali ke Beranda (/home)"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-md p-1 overflow-hidden group-hover:scale-105 transition-transform">
            <img src="/gambar/favicon.png" alt="Logo AngkatanKU" className="w-full h-full object-contain drop-shadow" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-1.5">
              Mading Angkatan <span className="text-emerald-400 text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30">XII IPS</span>
            </h1>
            <p className="text-[11px] text-slate-400 group-hover:text-slate-300 font-medium transition-colors">Bagan Struktur &bull; Ke Beranda &rarr;</p>
          </div>
        </div>

        {/* Quick Search & Filters */}
        <div className="flex items-center gap-2 pointer-events-auto relative">
          <div className="relative">
            <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-1.5 shadow-xl text-slate-300 focus-within:border-emerald-500 transition-colors">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input 
                type="text"
                placeholder="Cari siswa atau pengurus..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-36 sm:w-52"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/60">
                {searchResults.map(st => (
                  <button
                    key={st.id}
                    onClick={() => handleSelectSearchResult(st)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                      {st.avatarUrl && st.avatarUrl.trim() !== '' ? <img src={st.avatarUrl} alt="" className="w-full h-full object-cover" /> : st.name?.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-100 truncate">{st.name}</p>
                      <p className="text-[10px] text-emerald-400">{st.classRoom} • {st.role || 'Anggota'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleResetCenter}
            className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 p-2.5 rounded-2xl border border-slate-800 shadow-xl transition-all"
            title="Pusatkan Peta"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </header>

      {/* Main Interactive Zoom/Pan Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <TransformWrapper
          ref={transformRef}
          initialScale={initialCenterScale}
          minScale={0.25}
          maxScale={2.2}
          centerOnInit={true}
          limitToBounds={false}
          panning={{ velocityDisabled: false }}
        >
          <MapFloatingControls 
            onResetCenter={handleResetCenter} 
            onToggleAll={handleToggleAll} 
            isAllExpanded={isAllExpanded} 
          />

          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
          >
            <div 
              className="relative pointer-events-auto"
              style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
            >
              
              {/* SVG Connecting Branches */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                  <linearGradient id="grad-center-ips1" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                  <linearGradient id="grad-center-ips2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="grad-center-dev" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="grad-center-guru" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="grad-guru-kepala" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="grad-kepala-waka" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>

                {/* ==================== MASTER CENTER JUNCTION POINT ==================== */}
                {expanded.classes && (
                  <g className="pointer-events-none">
                    <circle cx={CENTER_X} cy={CENTER_Y} r={14} fill="#10b981" opacity={0.25} />
                    <circle cx={CENTER_X} cy={CENTER_Y} r={6} fill="#10b981" stroke="#34d399" strokeWidth={2.5} />
                  </g>
                )}

                {/* Center upwards to Dewan Guru Base Capsule */}
                <AnimatedBranch 
                  startX={CENTER_X} startY={CENTER_Y} 
                  endX={CENTER_X} endY={860} 
                  color="url(#grad-center-guru)" 
                  auraColor="#34d399"
                  enableAura={enableAura}
                  show={expanded.classes && expanded.guru} 
                  strokeWidth={2.6} 
                  curveType="vertical"
                />

                {/* ==================== DEWAN GURU MASTER JUNCTION POINT ==================== */}
                {expanded.classes && expanded.guru && (
                  <g className="pointer-events-none">
                    <circle cx={CENTER_X} cy={860} r={enableAura ? 12 : 7} fill="#10b981" opacity={0.25} />
                    <circle cx={CENTER_X} cy={860} r={6} fill="#10b981" stroke="#34d399" strokeWidth={2} />
                  </g>
                )}

                {/* 1. Dewan Guru Capsule upwards to Kepala Madrasah (Center Golden Node) */}
                <AnimatedBranch 
                  startX={CENTER_X} startY={860} 
                  endX={CENTER_X} endY={700} 
                  color="url(#grad-guru-kepala)" 
                  auraColor="#fbbf24"
                  enableAura={enableAura}
                  show={expanded.classes && expanded.guru} 
                  strokeWidth={2.8} 
                  curveType="vertical"
                />

                {/* 2. Dewan Guru Capsule radiates directly to each Pimpinan & Waka */}
                {pimpinanTeachers.map((_, idx) => {
                  const wakaSpacing = 220;
                  const wakaTotalWidth = (pimpinanTeachers.length - 1) * wakaSpacing;
                  const wakaStartOffset = CENTER_X - (wakaTotalWidth / 2);
                  const wakaX = wakaStartOffset + (idx * wakaSpacing);
                  return (
                    <AnimatedBranch
                      key={`line-pimpinan-${idx}`}
                      startX={CENTER_X} startY={860}
                      endX={wakaX} endY={540}
                      color="#0d9488"
                      auraColor="#2dd4bf"
                      enableAura={enableAura}
                      show={expanded.classes && expanded.guru}
                      delay={0.04 + (idx * 0.015)}
                      strokeWidth={1.8}
                      isCurve={true}
                      curveType="vertical"
                    />
                  );
                })}

                {/* 3. Dewan Guru Capsule radiates directly to each Dewan Guru in Row 1 */}
                {guruRow1.map((_, idx) => {
                  const spacing = 180;
                  const totalWidth = (guruRow1.length - 1) * spacing;
                  const startOffset = CENTER_X - (totalWidth / 2);
                  const teacherX = startOffset + (idx * spacing);
                  return (
                    <AnimatedBranch
                      key={`line-guru-row1-${idx}`}
                      startX={CENTER_X} startY={860}
                      endX={teacherX} endY={380}
                      color="#059669"
                      auraColor="#34d399"
                      enableAura={enableAura}
                      show={expanded.classes && expanded.guru}
                      delay={0.06 + (idx * 0.012)}
                      strokeWidth={1.5}
                      isCurve={true}
                      curveType="vertical"
                    />
                  );
                })}

                {/* 4. Dewan Guru Capsule radiates directly to each Dewan Guru in Row 2 */}
                {guruRow2.map((_, idx) => {
                  const spacing = 180;
                  const totalWidth = (guruRow2.length - 1) * spacing;
                  const startOffset = CENTER_X - (totalWidth / 2);
                  const teacherX = startOffset + (idx * spacing);
                  return (
                    <AnimatedBranch
                      key={`line-guru-row2-${idx}`}
                      startX={CENTER_X} startY={860}
                      endX={teacherX} endY={220}
                      color="#059669"
                      auraColor="#34d399"
                      enableAura={enableAura}
                      show={expanded.classes && expanded.guru}
                      delay={0.08 + (idx * 0.012)}
                      strokeWidth={1.5}
                      isCurve={true}
                      curveType="vertical"
                    />
                  );
                })}

                {/* Center to Classes */}
                <AnimatedBranch 
                  startX={CENTER_X} startY={CENTER_Y} 
                  endX={1150} endY={CENTER_Y} 
                  color="url(#grad-center-ips1)" 
                  auraColor="#38bdf8"
                  enableAura={enableAura}
                  show={expanded.classes} 
                  strokeWidth={2.4}
                />
                <AnimatedBranch 
                  startX={CENTER_X} startY={CENTER_Y} 
                  endX={2050} endY={CENTER_Y} 
                  color="url(#grad-center-ips2)" 
                  auraColor="#fbbf24"
                  enableAura={enableAura}
                  show={expanded.classes} 
                  strokeWidth={2.4}
                />

                {/* Center downwards to Developer */}
                <AnimatedBranch 
                  startX={CENTER_X} startY={CENTER_Y} 
                  endX={CENTER_X} endY={1380} 
                  color="url(#grad-center-dev)" 
                  auraColor="#c084fc"
                  enableAura={enableAura}
                  show={expanded.classes && expanded.developer} 
                  strokeWidth={2.2} 
                  curveType="vertical"
                />

                {/* Developer Capsule downwards to Developer Profile Card */}
                <AnimatedBranch 
                  startX={CENTER_X} startY={1380} 
                  endX={CENTER_X} endY={1580} 
                  color="#8b5cf6" 
                  auraColor="#c084fc"
                  enableAura={enableAura}
                  show={expanded.classes && expanded.developer} 
                  delay={0.05}
                  strokeWidth={1.75} 
                  curveType="vertical"
                />

                {/* Left: IPS 1 Branches from Base (1150, 1100) to Pengurus (750, y) */}
                <AnimatedBranch startX={1150} startY={CENTER_Y} endX={750} endY={680} color="#0284c7" auraColor="#38bdf8" enableAura={enableAura} show={expanded.ips1Board} delay={0.05} strokeWidth={1.75} />
                <AnimatedBranch startX={1150} startY={CENTER_Y} endX={750} endY={850} color="#0284c7" auraColor="#38bdf8" enableAura={enableAura} show={expanded.ips1Board} delay={0.1} strokeWidth={1.75} />
                <AnimatedBranch startX={1150} startY={CENTER_Y} endX={750} endY={1020} color="#0284c7" auraColor="#38bdf8" enableAura={enableAura} show={expanded.ips1Board} delay={0.15} strokeWidth={1.75} />
                <AnimatedBranch startX={1150} startY={CENTER_Y} endX={750} endY={1190} color="#0284c7" auraColor="#38bdf8" enableAura={enableAura} show={expanded.ips1Board} delay={0.2} strokeWidth={1.75} />
                <AnimatedBranch startX={1150} startY={CENTER_Y} endX={750} endY={1360} color="#0284c7" auraColor="#38bdf8" enableAura={enableAura} show={expanded.ips1Board} delay={0.25} strokeWidth={1.75} />
                <AnimatedBranch startX={1150} startY={CENTER_Y} endX={750} endY={1550} color="#10b981" auraColor="#34d399" enableAura={enableAura} show={expanded.ips1Board} delay={0.3} strokeWidth={2} />

                {/* Left: IPS 1 Member Roots from Hub (750, 1550) - Slim & clean lines */}
                {anggota1.map((s, idx) => {
                  const { col, row, targetX, targetY } = getMemberGridPosition(idx, anggota1.length, 420, 1760);
                  return (
                    <AnimatedBranch
                      key={`line1-${s.id}`}
                      startX={750} startY={1550}
                      endX={targetX} endY={targetY}
                      color="#0284c7"
                      enableAura={false}
                      show={expanded.ips1Members}
                      delay={0.08 + (row * 0.04) + (col * 0.015)}
                      isCurve={true}
                      curveType="vertical"
                      strokeWidth={1.2}
                    />
                  );
                })}

                {/* Right: IPS 2 Branches from Base (2050, 1100) to Pengurus (2450, y) */}
                <AnimatedBranch startX={2050} startY={CENTER_Y} endX={2450} endY={680} color="#d97706" auraColor="#fbbf24" enableAura={enableAura} show={expanded.ips2Board} delay={0.05} strokeWidth={1.75} />
                <AnimatedBranch startX={2050} startY={CENTER_Y} endX={2450} endY={850} color="#d97706" auraColor="#fbbf24" enableAura={enableAura} show={expanded.ips2Board} delay={0.1} strokeWidth={1.75} />
                <AnimatedBranch startX={2050} startY={CENTER_Y} endX={2450} endY={1020} color="#d97706" auraColor="#fbbf24" enableAura={enableAura} show={expanded.ips2Board} delay={0.15} strokeWidth={1.75} />
                <AnimatedBranch startX={2050} startY={CENTER_Y} endX={2450} endY={1190} color="#d97706" auraColor="#fbbf24" enableAura={enableAura} show={expanded.ips2Board} delay={0.2} strokeWidth={1.75} />
                <AnimatedBranch startX={2050} startY={CENTER_Y} endX={2450} endY={1360} color="#d97706" auraColor="#fbbf24" enableAura={enableAura} show={expanded.ips2Board} delay={0.25} strokeWidth={1.75} />
                <AnimatedBranch startX={2050} startY={CENTER_Y} endX={2450} endY={1550} color="#10b981" auraColor="#34d399" enableAura={enableAura} show={expanded.ips2Board} delay={0.3} strokeWidth={2} />

                {/* Right: IPS 2 Member Roots from Hub (2450, 1550) - Slim & clean lines */}
                {anggota2.map((s, idx) => {
                  const { col, row, targetX, targetY } = getMemberGridPosition(idx, anggota2.length, 2120, 1760);
                  return (
                    <AnimatedBranch
                      key={`line2-${s.id}`}
                      startX={2450} startY={1550}
                      endX={targetX} endY={targetY}
                      color="#d97706"
                      enableAura={false}
                      show={expanded.ips2Members}
                      delay={0.08 + (row * 0.04) + (col * 0.015)}
                      isCurve={true}
                      curveType="vertical"
                      strokeWidth={1.2}
                    />
                  );
                })}
              </svg>

              {/* ==================== CENTER NODE (ANGKATANKU) ==================== */}
              <div 
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center"
                style={{ left: CENTER_X, top: CENTER_Y }}
              >
                {/* Lightweight, GPU-friendly soft smoke/mist puff effect on press */}
                {smokePuffs.map(puff => (
                  <div key={puff.id} className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10 overflow-visible">
                    {/* Outer ethereal wisp */}
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0.72, rotate: 0 }}
                      animate={{ scale: 2.35, opacity: 0, rotate: 16 }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute w-72 h-72 rounded-full pointer-events-none"
                      style={{
                        background: expansionStage === 1
                          ? "radial-gradient(circle, rgba(20, 184, 166, 0.36) 0%, rgba(13, 148, 136, 0.14) 42%, transparent 70%)"
                          : expansionStage === 2
                          ? "radial-gradient(circle, rgba(16, 185, 129, 0.42) 0%, rgba(5, 150, 105, 0.18) 46%, transparent 72%)"
                          : "radial-gradient(circle, rgba(139, 92, 246, 0.38) 0%, rgba(16, 185, 129, 0.16) 44%, transparent 70%)",
                        willChange: "transform, opacity",
                        transform: "translateZ(0)"
                      }}
                    />
                    {/* Inner dense core mist */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0.65, rotate: -8 }}
                      animate={{ scale: 1.8, opacity: 0, rotate: -18 }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
                      className="absolute w-52 h-52 rounded-full pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, rgba(167, 243, 208, 0.35) 0%, rgba(52, 211, 153, 0.12) 40%, transparent 66%)",
                        willChange: "transform, opacity",
                        transform: "translateZ(0)"
                      }}
                    />
                  </div>
                ))}

                {/* Progressive Lighting Accents */}
                {/* Stage 1: Aksen cahaya sedikit */}
                {expansionStage === 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: [0.35, 0.58, 0.35], scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                    className="absolute -inset-3 rounded-3xl bg-emerald-500/22 blur-md pointer-events-none -z-10"
                    style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
                  />
                )}

                {/* Stage 2: Semakin terang */}
                {expansionStage === 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: [0.55, 0.85, 0.55], scale: [1.02, 1.08, 1.02] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    className="absolute -inset-4.5 rounded-3xl bg-gradient-to-tr from-emerald-500/35 via-teal-400/30 to-emerald-400/35 blur-lg pointer-events-none -z-10"
                    style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
                  />
                )}

                {/* Stage 3: Begitu pula ke 3 (Paling terang) */}
                {expansionStage === 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: [0.75, 1, 0.75], scale: [1.04, 1.12, 1.04] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-emerald-400/45 via-teal-300/40 to-violet-500/40 blur-xl pointer-events-none -z-10"
                    style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
                  />
                )}

                {/* Idle pulse when closed (Stage 0) */}
                {expansionStage === 0 && (
                  <motion.div
                    animate={{ scale: [1, 1.06, 1], opacity: [0.25, 0.5, 0.25] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                    className="absolute -inset-2 rounded-3xl border border-emerald-500/25 pointer-events-none -z-10"
                  />
                )}

                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleToggleClasses}
                  className={`w-64 p-5 rounded-3xl bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer text-center group transition-all duration-300 relative select-none ${
                    expansionStage === 0 
                      ? 'border border-slate-700/80 hover:border-emerald-500/50 shadow-2xl shadow-black/60'
                      : expansionStage === 1
                      ? 'border border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.35)] shadow-black/60 ring-1 ring-emerald-500/30'
                      : expansionStage === 2
                      ? 'border border-teal-400/80 shadow-[0_0_50px_rgba(20,184,166,0.55),0_0_20px_rgba(16,185,129,0.3)] shadow-black/70 ring-2 ring-teal-400/40'
                      : 'border border-emerald-300 shadow-[0_0_70px_rgba(16,185,129,0.75),0_0_35px_rgba(139,92,246,0.5)] shadow-black/80 ring-2 ring-emerald-300/60'
                  }`}
                >
                  {/* Emblem Logo */}
                  <div className="relative mb-2.5">
                    <div className="w-13 h-13 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shadow-inner group-hover:border-emerald-500/40 transition-colors p-2.5 overflow-hidden">
                      <img src="/gambar/favicon.png" alt="Logo AngkatanKU" className="w-full h-full object-contain" />
                    </div>
                    {expansionStage === 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
                      </span>
                    )}
                  </div>

                  {/* Title & Identity */}
                  <h2 className="text-base font-bold text-slate-100 tracking-wider font-display">ANGKATANKU</h2>
                  <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-0.5">
                    {expansionStage === 0 && 'XII IPS • MA NU Islamiyah'}
                    {expansionStage === 1 && 'Tahap 1: Kelas IPS 1 & 2'}
                    {expansionStage === 2 && 'Tahap 2: Dewan Guru Aktif'}
                    {expansionStage === 3 && 'Tahap 3: Struktur Lengkap'}
                  </p>

                  {/* Tactile Action Button */}
                  <div className={`mt-3.5 w-full flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    expansionStage === 0
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500/25'
                      : expansionStage === 1
                      ? 'bg-teal-500/20 text-teal-200 border border-teal-400/40 group-hover:bg-teal-500/30'
                      : expansionStage === 2
                      ? 'bg-violet-500/20 text-violet-200 border border-violet-400/40 group-hover:bg-violet-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 group-hover:bg-slate-750'
                  }`}>
                    <span>
                      {expansionStage === 0 && 'Buka Kelas (1/3)'}
                      {expansionStage === 1 && 'Buka Guru (2/3)'}
                      {expansionStage === 2 && 'Buka Dev (3/3)'}
                      {expansionStage === 3 && 'Tutup Bagan'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-current transition-transform duration-300 ${expansionStage === 3 ? 'rotate-180' : ''}`} />
                  </div>
                </motion.div>
              </div>

              {/* ==================== LEFT WING: XII IPS 1 ==================== */}
              {/* IPS 1 BASE CAPSULE */}
              <AnimatedNode show={expanded.classes} x={1150} y={CENTER_Y} onClick={toggleIps1Board}>
                <div className="px-7 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-[0_0_35px_-5px_rgba(2,132,199,0.4)] border-2 border-sky-400/80 font-black text-xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <BookOpen className="w-5 h-5 text-sky-200" />
                  <span>XII IPS 1</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-sky-900/60 rounded-full text-sky-200 border border-sky-400/30">
                    {ips1.length} Siswa
                  </span>
                </div>
              </AnimatedNode>

              {/* IPS 1 PENGURUS CARDS */}
              <AnimatedNode show={expanded.ips1Board} delay={0.05} x={750} y={680}>
                <StudentNodeCard 
                  isDummy 
                  title="Zakiyatul Masrurah, S.Pd" 
                  roleLabel="Wali Kelas" 
                  theme="wali1" 
                  icon={GraduationCap}
                />
              </AnimatedNode>

              <AnimatedNode show={expanded.ips1Board} delay={0.1} x={750} y={850}>
                <StudentNodeCard 
                  student={ketua1} 
                  isDummy={!ketua1} 
                  title="Belum Ada Ketua" 
                  roleLabel="Ketua Kelas" 
                  theme="ips1" 
                  icon={Crown} 
                />
              </AnimatedNode>

              <AnimatedNode show={expanded.ips1Board} delay={0.15} x={750} y={1020}>
                <StudentNodeCard 
                  student={wakil1} 
                  isDummy={!wakil1} 
                  title="Belum Ada Wakil" 
                  roleLabel="Wakil Ketua" 
                  theme="ips1" 
                  icon={Shield} 
                />
              </AnimatedNode>

              <AnimatedNode show={expanded.ips1Board} delay={0.2} x={750} y={1190}>
                <StudentNodeCard 
                  student={sek1} 
                  isDummy={!sek1} 
                  title="Belum Ada Sek" 
                  roleLabel="Sekretaris" 
                  theme="ips1" 
                  icon={BookOpen} 
                />
              </AnimatedNode>

              <AnimatedNode show={expanded.ips1Board} delay={0.25} x={750} y={1360}>
                <StudentNodeCard 
                  student={ben1} 
                  isDummy={!ben1} 
                  title="Belum Ada Ben" 
                  roleLabel="Bendahara" 
                  theme="ips1" 
                  icon={Coins} 
                />
              </AnimatedNode>

              {/* IPS 1 MEMBERS HUB */}
              <AnimatedNode show={expanded.ips1Board} delay={0.3} x={750} y={1550}>
                <StudentNodeCard
                  isMemberHub
                  title="Anggota Kelas"
                  roleLabel={`${anggota1.length} Siswa`}
                  theme="hub"
                  onClick={toggleIps1Members}
                />
              </AnimatedNode>

              {/* IPS 1 MEMBER ROOTS */}
              {anggota1.map((s, idx) => {
                const { col, row, targetX, targetY } = getMemberGridPosition(idx, anggota1.length, 420, 1760);
                return (
                  <AnimatedNode
                    key={s.id}
                    show={expanded.ips1Members}
                    delay={0.05 + (row * 0.04) + (col * 0.01)}
                    x={targetX}
                    y={targetY}
                  >
                    <StudentNodeCard student={s} theme="ips1" />
                  </AnimatedNode>
                );
              })}

              {/* ==================== RIGHT WING: XII IPS 2 ==================== */}
              {/* IPS 2 BASE CAPSULE */}
              <AnimatedNode show={expanded.classes} x={2050} y={CENTER_Y} onClick={toggleIps2Board}>
                <div className="px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-[0_0_35px_-5px_rgba(217,119,6,0.4)] border-2 border-amber-400/80 font-black text-xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <BookOpen className="w-5 h-5 text-amber-200" />
                  <span>XII IPS 2</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-900/60 rounded-full text-amber-200 border border-amber-400/30">
                    {ips2.length} Siswa
                  </span>
                </div>
              </AnimatedNode>

              {/* IPS 2 PENGURUS CARDS */}
              <AnimatedNode show={expanded.ips2Board} delay={0.05} x={2450} y={680}>
                <StudentNodeCard 
                  isDummy 
                  title="Nurul Qomariyah, S.Pd" 
                  roleLabel="Wali Kelas" 
                  theme="wali2" 
                  icon={GraduationCap} 
                />
              </AnimatedNode>

              <AnimatedNode show={expanded.ips2Board} delay={0.1} x={2450} y={850}>
                <StudentNodeCard 
                  student={ketua2} 
                  isDummy={!ketua2} 
                  title="Belum Ada Ketua" 
                  roleLabel="Ketua Kelas" 
                  theme="ips2" 
                  icon={Crown} 
                />
              </AnimatedNode>

              <AnimatedNode show={expanded.ips2Board} delay={0.15} x={2450} y={1020}>
                <StudentNodeCard 
                  student={wakil2} 
                  isDummy={!wakil2} 
                  title="Belum Ada Wakil" 
                  roleLabel="Wakil Ketua" 
                  theme="ips2" 
                  icon={Shield} 
                />
              </AnimatedNode>

              <AnimatedNode show={expanded.ips2Board} delay={0.2} x={2450} y={1190}>
                <StudentNodeCard 
                  student={sek2} 
                  isDummy={!sek2} 
                  title="Belum Ada Sek" 
                  roleLabel="Sekretaris" 
                  theme="ips2" 
                  icon={BookOpen} 
                />
              </AnimatedNode>

              <AnimatedNode show={expanded.ips2Board} delay={0.25} x={2450} y={1360}>
                <StudentNodeCard 
                  student={ben2} 
                  isDummy={!ben2} 
                  title="Belum Ada Ben" 
                  roleLabel="Bendahara" 
                  theme="ips2" 
                  icon={Coins} 
                />
              </AnimatedNode>

              {/* IPS 2 MEMBERS HUB */}
              <AnimatedNode show={expanded.ips2Board} delay={0.3} x={2450} y={1550}>
                <StudentNodeCard
                  isMemberHub
                  title="Anggota Kelas"
                  roleLabel={`${anggota2.length} Siswa`}
                  theme="hub"
                  onClick={toggleIps2Members}
                />
              </AnimatedNode>

              {/* IPS 2 MEMBER ROOTS */}
              {anggota2.map((s, idx) => {
                const { col, row, targetX, targetY } = getMemberGridPosition(idx, anggota2.length, 2120, 1760);
                return (
                  <AnimatedNode
                    key={s.id}
                    show={expanded.ips2Members}
                    delay={0.05 + (row * 0.04) + (col * 0.01)}
                    x={targetX}
                    y={targetY}
                  >
                    <StudentNodeCard student={s} theme="ips2" />
                  </AnimatedNode>
                );
              })}

              {/* ==================== TOP WING: DEWAN GURU ==================== */}
              {/* DEWAN GURU BASE CAPSULE */}
              <AnimatedNode show={expanded.classes && expanded.guru} x={CENTER_X} y={860} onClick={toggleGuru}>
                <div className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-[0_0_35px_-5px_rgba(16,185,129,0.5)] border-2 border-emerald-400/80 font-black text-xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <School className="w-5 h-5 text-emerald-200" />
                  <span>DEWAN GURU</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-950/70 rounded-full text-emerald-200 border border-emerald-400/40">
                    Tenaga Pendidik
                  </span>
                </div>
              </AnimatedNode>

              {/* 1. KEPALA MADRASAH (Center Golden Node) */}
              <AnimatedNode
                key={`node-kepala-${kepalaTeacher.id}`}
                show={expanded.classes && expanded.guru}
                delay={0.03}
                x={CENTER_X}
                y={700}
              >
                <StudentNodeCard
                  student={{
                    id: kepalaTeacher.id,
                    name: kepalaTeacher.nama,
                    role: 'Kepala Madrasah',
                    classRoom: 'Kepala Madrasah',
                    avatarUrl: kepalaTeacher.url_gambar,
                    quote: 'Kepala Madrasah MA NU Islamiyah Asembagus',
                    induk: kepalaTeacher.id,
                    isTeacher: true
                  }}
                  title={kepalaTeacher.nama}
                  roleLabel="Kepala Madrasah"
                  theme="kepala"
                  icon={Award}
                />
              </AnimatedNode>

              {/* 2. WAKIL KEPALA MADRASAH & PIMPINAN (4 nodes at y=540) */}
              {pimpinanTeachers.map((teacher, idx) => {
                const wakaSpacing = 220;
                const wakaTotalWidth = (pimpinanTeachers.length - 1) * wakaSpacing;
                const wakaStartOffset = CENTER_X - (wakaTotalWidth / 2);
                const teacherX = wakaStartOffset + (idx * wakaSpacing);

                return (
                  <AnimatedNode
                    key={`node-pimpinan-${teacher.id}`}
                    show={expanded.classes && expanded.guru}
                    delay={0.05 + (idx * 0.02)}
                    x={teacherX}
                    y={540}
                  >
                    <StudentNodeCard
                      student={{
                        id: teacher.id,
                        name: teacher.nama,
                        role: teacher.jabatan || teacher.title || 'Tenaga Pendidik',
                        classRoom: 'Pimpinan & Staf',
                        avatarUrl: teacher.url_gambar || '',
                        quote: (teacher.title || teacher.jabatan) ? `${teacher.title || ''}${teacher.jabatan ? ` • ${teacher.jabatan}` : ''}` : '',
                        induk: teacher.id,
                        isTeacher: true
                      }}
                      title={teacher.nama}
                      roleLabel={teacher.jabatan || teacher.title || 'Tenaga Pendidik'}
                      theme="pimpinan"
                      icon={School}
                    />
                  </AnimatedNode>
                );
              })}

              {/* 3. DEWAN GURU - BARIS 1 (8 nodes at y=380) */}
              {guruRow1.map((teacher, idx) => {
                const spacing = 180;
                const totalWidth = (guruRow1.length - 1) * spacing;
                const startOffset = CENTER_X - (totalWidth / 2);
                const teacherX = startOffset + (idx * spacing);

                return (
                  <AnimatedNode
                    key={`node-guru-row1-${teacher.id}`}
                    show={expanded.classes && expanded.guru}
                    delay={0.08 + (idx * 0.015)}
                    x={teacherX}
                    y={380}
                  >
                    <StudentNodeCard
                      student={{
                        id: teacher.id,
                        name: teacher.nama,
                        role: teacher.jabatan || teacher.title || 'Guru',
                        classRoom: 'Dewan Guru',
                        avatarUrl: teacher.url_gambar,
                        quote: teacher.jabatan ? `${teacher.title} • ${teacher.jabatan}` : teacher.title,
                        induk: teacher.id,
                        isTeacher: true
                      }}
                      title={teacher.nama}
                      roleLabel={teacher.jabatan || teacher.title}
                      theme="guru"
                      icon={School}
                    />
                  </AnimatedNode>
                );
              })}

              {/* 4. DEWAN GURU - BARIS 2 (7 nodes at y=220) */}
              {guruRow2.map((teacher, idx) => {
                const spacing = 180;
                const totalWidth = (guruRow2.length - 1) * spacing;
                const startOffset = CENTER_X - (totalWidth / 2);
                const teacherX = startOffset + (idx * spacing);

                return (
                  <AnimatedNode
                    key={`node-guru-row2-${teacher.id}`}
                    show={expanded.classes && expanded.guru}
                    delay={0.12 + (idx * 0.015)}
                    x={teacherX}
                    y={220}
                  >
                    <StudentNodeCard
                      student={{
                        id: teacher.id,
                        name: teacher.nama,
                        role: teacher.jabatan || teacher.title || 'Guru',
                        classRoom: 'Dewan Guru',
                        avatarUrl: teacher.url_gambar,
                        quote: teacher.jabatan ? `${teacher.title} • ${teacher.jabatan}` : teacher.title,
                        induk: teacher.id,
                        isTeacher: true
                      }}
                      title={teacher.nama}
                      roleLabel={teacher.jabatan || teacher.title}
                      theme="guru"
                      icon={School}
                    />
                  </AnimatedNode>
                );
              })}

              {/* ==================== BOTTOM WING: DEVELOPER ==================== */}
              {/* DEVELOPER BASE CAPSULE */}
              <AnimatedNode show={expanded.classes && expanded.developer} x={CENTER_X} y={1380} onClick={toggleDeveloper}>
                <div className="px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white shadow-[0_0_35px_-5px_rgba(139,92,246,0.5)] border-2 border-violet-400/80 font-black text-xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <Code2 className="w-5 h-5 text-violet-200" />
                  <span>DEVELOPER</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-violet-950/70 rounded-full text-violet-200 border border-violet-400/40">
                    Sistem Web
                  </span>
                </div>
              </AnimatedNode>

              {/* DEVELOPER PROFILE CARD */}
              <AnimatedNode show={expanded.classes && expanded.developer} delay={0.08} x={CENTER_X} y={1580}>
                <StudentNodeCard 
                  student={devData} 
                  title="Rohmatulloh" 
                  roleLabel="Web Developer" 
                  theme="developer" 
                  icon={Code2} 
                />
              </AnimatedNode>

            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* ==================== SLEEK IN-PAGE STUDENT INSPECTOR DRAWER ==================== */}
      <AnimatePresence>
        {inspectedStudent && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] p-5 text-white"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-400/80 shadow-md">
                  {inspectedStudent.avatarUrl && inspectedStudent.avatarUrl.trim() !== '' ? (
                    <img src={inspectedStudent.avatarUrl} alt={inspectedStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-xl text-emerald-400">
                      {(inspectedStudent.name || '?').charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white leading-tight line-clamp-1">{inspectedStudent.name}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    {inspectedStudent.isTeacher ? (inspectedStudent.role || 'Tenaga Pendidik') : `${inspectedStudent.classRoom || 'XII IPS'} • ${inspectedStudent.role || 'Anggota'}`}
                  </p>
                  {inspectedStudent.nickname && (
                    <p className="text-[11px] text-slate-400">Panggilan: "{inspectedStudent.nickname}"</p>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => setInspectedStudent(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quote / Motto */}
            {inspectedStudent.quote ? (
              <div className="bg-slate-800/60 rounded-2xl p-3 mb-4 border border-slate-700/50">
                <p className="text-xs italic text-slate-300 line-clamp-2">"{inspectedStudent.quote}"</p>
              </div>
            ) : (
              <div className="bg-slate-800/40 rounded-2xl p-2.5 mb-4 border border-dashed border-slate-700/50 text-center">
                <p className="text-[11px] text-slate-400">Belum ada kutipan atau bio.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {onNavigate && (
                <button
                  onClick={() => {
                    const id = inspectedStudent.id;
                    const name = inspectedStudent.name;
                    setInspectedStudent(null);
                    onNavigate('public-profile', name || (inspectedStudent.isTeacher ? 'Profil Guru' : 'Profil Siswa'), id);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
                >
                  <Eye className="w-4 h-4" /> Buka Profil Lengkap
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedForCardModal(inspectedStudent);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" /> {inspectedStudent.isTeacher ? 'Kartu Guru' : 'Kartu Pelajar'}
                </button>

                {(isAdmin || (user && (user.uid === inspectedStudent.id || currentStudent?.id === inspectedStudent.id || (currentStudent?.nip && currentStudent.nip === inspectedStudent.induk)))) && (
                  <button
                    onClick={() => {
                      setIsEditModalOpen(true);
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Edit
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== OPTIONAL FULL ID CARD MODAL ==================== */}
      <AnimatePresence>
        {selectedForCardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-[800px] flex flex-col items-center"
            >
              <button 
                onClick={() => setSelectedForCardModal(null)}
                className="absolute -top-14 right-0 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full p-2.5 transition-colors backdrop-blur-md z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {(() => {
                const isCardActive = Boolean(
                  selectedForCardModal.cardCreated === true ||
                  (selectedForCardModal.avatarUrl && String(selectedForCardModal.avatarUrl).trim().length > 0) ||
                  selectedForCardModal.email ||
                  selectedForCardModal.hasLoggedIn === true ||
                  (user && (selectedForCardModal.id === user.uid || (currentStudent?.induk && selectedForCardModal.induk === currentStudent.induk)))
                );
                return (
                  <>
                    <div className={!isCardActive ? 'filter blur-sm grayscale opacity-70 pointer-events-none' : ''}>
                      <IDCardCanvas student={selectedForCardModal} />
                    </div>
                    
                    {!isCardActive && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="bg-slate-900/95 backdrop-blur-xl px-6 py-5 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center">
                          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-2 text-slate-400">
                            <X className="w-6 h-6" />
                          </div>
                          <h3 className="text-base font-bold text-white mb-1">Kartu Belum Aktif</h3>
                          <p className="text-slate-400 text-center text-xs max-w-[240px]">Siswa ini belum pernah login atau mengklaim profilnya di sistem.</p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Edit Card Modal */}
      {isEditModalOpen && inspectedStudent && (
        <EditCardModal 
          student={inspectedStudent} 
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={handleEditSuccess} 
        />
      )}
    </div>
  );
}
