import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Shuffle, 
  UserCheck, 
  Grid, 
  List, 
  CheckCircle2, 
  Quote, 
  BadgeCheck, 
  BookOpen, 
  Heart, 
  Hash, 
  GraduationCap, 
  Award, 
  X, 
  ArrowRight, 
  Download, 
  Printer, 
  Smile, 
  Share2,
  CalendarCheck,
  Edit3,
  Image as ImageIcon,
  User
} from 'lucide-react';
import { OFFICIAL_STUDENTS, OfficialStudent } from '../data/officialStudents';
import LoginModal from '../components/LoginModal';
import EditProfileModal from '../components/EditProfileModal';
import UploadGalleryModal from '../components/UploadGalleryModal';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { IDCardCanvas } from '../components/IDCardCanvas';
import { collection, getDocs } from '../lib/data';

export default function Anggota({ onNavigate }: { onNavigate?: (tab: string, name?: string, data?: any) => void }) {
  const { user, isAdmin, currentStudent } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [classFilter, setClassFilter] = useState<'ALL' | 'IPS 1' | 'IPS 2'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'urut' | 'nama'>('urut');
  const [selectedStudent, setSelectedStudent] = useState<OfficialStudent | null>(null);
  
  // Firestore Users
  const [firestoreStudents, setFirestoreStudents] = useState<any[]>([]);

  const fetchStudents = async () => {
    try {
      const snap = await getDocs(collection(db, 'students'));
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirestoreStudents(docs);
    } catch(e: any) {
      console.warn("Notice: Failed to fetch students from firestore, using static dataset:", e?.message || e);
    }
  };

  React.useEffect(() => {
    fetchStudents();
  }, []);

  // Random Student Picker State
  const [isPickingRandom, setIsPickingRandom] = useState(false);
  const [randomStudentResult, setRandomStudentResult] = useState<OfficialStudent | null>(null);
  const [greetingSent, setGreetingSent] = useState<string | null>(null);

  // Modals State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadGalleryModalOpen, setIsUploadGalleryModalOpen] = useState(false);
  const [prefilledUsername, setPrefilledUsername] = useState('');

  const handleEditProfileClick = (username: string) => {
    if (user) {
       const emailPrefix = user.email?.split('@')[0];
       if (emailPrefix === username || user.email === 'rohmatulloh@angkatanku.local') {
          setIsEditModalOpen(true);
       } else {
          alert('Anda hanya dapat mengedit profil Anda sendiri.');
       }
    } else {
      setPrefilledUsername(username);
      setIsLoginModalOpen(true);
    }
  };

  const handleUploadGalleryClick = (username: string) => {
    if (user) {
       const emailPrefix = user.email?.split('@')[0];
       if (emailPrefix === username || user.email === 'rohmatulloh@angkatanku.local') {
          setIsUploadGalleryModalOpen(true);
       } else {
          alert('Anda hanya dapat mengupload ke galeri Anda sendiri.');
       }
    } else {
      setPrefilledUsername(username);
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    // If they logged in, they can try clicking again. For simplicity, just close login modal.
    setIsLoginModalOpen(false);
  };

  // Merge static data with Firestore data
  const mergedStudents = React.useMemo(() => {
    return OFFICIAL_STUDENTS.map(os => {
      const fs = firestoreStudents.find(s => s.induk === os.induk || (s.username && s.username.toLowerCase() === os.username?.toLowerCase()));
      if (fs) {
        const isCurrent = Boolean(user && (fs.id === user.uid || (currentStudent?.induk && fs.induk === currentStudent.induk)));
        const rawGender = fs.gender || os.gender || 'L';
        const normalizedGender: 'L' | 'P' = (rawGender.toUpperCase().startsWith('P') || rawGender.toUpperCase().includes('WANITA') || rawGender.toUpperCase().includes('PEREMPUAN')) ? 'P' : 'L';
        
        return {
          ...os,
          ...fs,
          gender: normalizedGender,
          id: fs.id || os.induk,
          email: fs.email || (isCurrent ? user?.email : ''),
          nickname: fs.nickname || (os as any).nickname || (os.name ? os.name.split(' ')[0] : 'Siswa'),
          quote: fs.quote || fs.motto || os.motto,
          motto: fs.motto || fs.quote || os.motto,
          avatarUrl: fs.avatarUrl || '',
          bannerUrl: fs.bannerUrl || '',
          cardCreated: Boolean(fs.cardCreated || (fs.avatarUrl && (fs.nickname || fs.quote)) || fs.hasLoggedIn || isCurrent),
          colors: fs.colors,
          tags: fs.tags,
          socials: fs.socials,
          hobbies: (fs.hobbies && fs.hobbies.length > 0) ? fs.hobbies : os.hobbies,
          favoriteSubject: fs.favoriteSubject || os.favoriteSubject,
          socialTag: fs.socialTag || os.socialTag,
          role: fs.role || os.role,
          classRoom: fs.classRoom || os.classRoom,
        };
      }
      return {
        ...os,
        id: os.induk,
        nickname: (os as any).nickname || (os.name ? os.name.split(' ')[0] : 'Siswa'),
        quote: os.motto,
        cardCreated: false
      };
    });
  }, [firestoreStudents, user, currentStudent]);

  // Filter and sort students
  const filteredStudents = mergedStudents.filter(student => {
    const sName = student.name || (student as any).nama || '';
    const sInduk = student.induk || '';
    const sRole = student.role || '';
    const matchesSearch = sName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sInduk.includes(searchTerm) ||
                          sRole.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'ALL' || student.gender === genderFilter;
    const matchesClass = classFilter === 'ALL' || (student.classRoom || '').includes(classFilter === 'IPS 1' ? '1' : '2');
    return matchesSearch && matchesGender && matchesClass;
  }).sort((a, b) => {
    if (sortBy === 'nama') {
      return a.name.localeCompare(b.name);
    }
    return a.urut - b.urut;
  });

  const totalCount = mergedStudents.length;
  const ips1Count = mergedStudents.filter(s => (s.classRoom || '').includes('1')).length;
  const ips2Count = mergedStudents.filter(s => (s.classRoom || '').includes('2')).length;
  const maleCount = mergedStudents.filter(s => s.gender === 'L').length;
  const femaleCount = mergedStudents.filter(s => s.gender === 'P').length;

  const handlePickRandomStudent = () => {
    setIsPickingRandom(true);
    setRandomStudentResult(null);

    let count = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * mergedStudents.length);
      setRandomStudentResult(mergedStudents[randomIndex]);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setIsPickingRandom(false);
      }
    }, 100);
  };

  const handleSendGreeting = (studentName: string) => {
    setGreetingSent(studentName);
    setTimeout(() => {
      setGreetingSent(null);
    }, 3000);
  };

  return (
    <div className="space-y-8 py-2">
      
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-10 border border-sky-500/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold tracking-wider">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>DAFTAR RESMI ANGGOTA KELAS</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                TAHUN PELAJARAN 2026/2027
              </span>
            </div>
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
              Siswa XII <span className="text-emerald-400">IPS 1 & 2</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              Presensi dan biodata resmi seluruh siswa angkatan XII IPS 1 & 2 & 2 MA NU Islamiyah Asembagus. Wadah persaudaraan, sinergi, dan rekam jejak digital kebersamaan kita.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                {totalCount}
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Angkatan</p>
                <p className="text-sm font-bold text-white">{totalCount} Siswa</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                {ips1Count}
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Kelas XII IPS 1</p>
                <p className="text-sm font-bold text-white">{ips1Count} Siswa</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                {ips2Count}
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Kelas XII IPS 2</p>
                <p className="text-sm font-bold text-white">{ips2Count} Siswa</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-3.5 border border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Komposisi</p>
                <p className="text-sm font-bold text-emerald-400">{maleCount} L / {femaleCount} P</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS BAR & ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, username, atau jabatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
            <button
              onClick={() => { setClassFilter('ALL'); setGenderFilter('ALL'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                classFilter === 'ALL' && genderFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => { setClassFilter('IPS 1'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                classFilter === 'IPS 1'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              XII IPS 1 ({ips1Count})
            </button>
            <button
              onClick={() => { setClassFilter('IPS 2'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                classFilter === 'IPS 2'
                  ? 'bg-teal-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-teal-600'
              }`}
            >
              XII IPS 2 ({ips2Count})
            </button>
            <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5 hidden sm:inline-block" />
            <button
              onClick={() => setGenderFilter(prev => prev === 'L' ? 'ALL' : 'L')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                genderFilter === 'L'
                  ? 'bg-sky-500 text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-sky-500'
              }`}
            >
              Laki-Laki ({maleCount})
            </button>
            <button
              onClick={() => setGenderFilter(prev => prev === 'P' ? 'ALL' : 'P')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                genderFilter === 'P'
                  ? 'bg-pink-500 text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-pink-500'
              }`}
            >
              Perempuan ({femaleCount})
            </button>
          </div>

          {/* Random Student Picker Trigger Button */}
          <button
            onClick={handlePickRandomStudent}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
            title="Pilih siswa acak untuk tugas/presentasi"
          >
            <Shuffle className="w-3.5 h-3.5 animate-bounce" />
            <span>Siswa Acak</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
              title="Tampilan Kartu Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
              title="Tampilan Tabel Presensi Resmi"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

            {/* Greeting Toast Notification */}
      <AnimatePresence>
        {isPickingRandom && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4"
          >
            <Shuffle className="w-6 h-6 text-emerald-400 animate-spin" />
            <div>
              <p className="font-bold">Memilih siswa acak...</p>
              <p className="text-xs text-slate-400">Harap tunggu sebentar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {randomStudentResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setRandomStudentResult(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-emerald-500/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 text-white font-bold text-4xl">
                {randomStudentResult.avatarUrl && randomStudentResult.avatarUrl.trim() !== '' ? (
                  <img src={randomStudentResult.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  randomStudentResult.name.charAt(0)
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{randomStudentResult.name}</h2>
              <p className="text-emerald-600 dark:text-emerald-400 font-mono text-sm mb-6">
                {randomStudentResult.username ? (randomStudentResult.username.startsWith('@') ? randomStudentResult.username : `@${randomStudentResult.username}`) : randomStudentResult.classRoom}
              </p>
              
              <button
                onClick={() => setRandomStudentResult(null)}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div className="ak-directory grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <motion.div
                key={student.id||student.induk}
                role="link" tabIndex={0} aria-label={'Profil '+student.name}
                onKeyDown={e=>{if(e.key==='Enter'&&onNavigate&&student.id)onNavigate('public-profile',student.name,student.id);}}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => { if (onNavigate && student.id) { onNavigate('public-profile', student.name || 'Profil Siswa', student.id); } else { setSelectedStudent(student); } }}
                className={`group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4 `}
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl text-white shadow-md border-4 border-white dark:border-slate-800  ${
                  student.gender === 'L' 
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                    : 'bg-gradient-to-br from-pink-400 to-pink-600'
                }`}>
                  {student.avatarUrl && student.avatarUrl.trim() !== '' ? (
                    <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover rounded-full" onError={(e) => { (e.target as HTMLElement).style.display='none' }} />
                  ) : (
                    <User className="w-12 h-12 text-white/80" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">{student.name}</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                    {student.username ? (student.username.startsWith('@') ? student.username : `@${student.username}`) : student.classRoom}
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    student.classRoom === 'XII IPS 1' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' :
                    student.classRoom === 'XII IPS 2' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}>
                    {student.classRoom}
                  </span>
                  {student.role && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      {student.role}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500">
              Tidak ada siswa yang cocok dengan filter tersebut.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-6 py-4">No</th>
                  <th scope="col" className="px-6 py-4">Username</th>
                  <th scope="col" className="px-6 py-4">Nama Lengkap</th>
                  <th scope="col" className="px-6 py-4">L/P</th>
                  <th scope="col" className="px-6 py-4">Kelas</th>
                  <th scope="col" className="px-6 py-4">Peran</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, i) => (
                  <tr 
                    key={student.id||student.induk}
                    onClick={() => { if (onNavigate && student.id) { onNavigate('public-profile', student.name || 'Profil Siswa', student.id); } else { setSelectedStudent(student); } }}
                    className={`bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer `}
                  >
                    <td className="px-6 py-4">{student.urut}</td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                      {student.username ? (student.username.startsWith('@') ? student.username : `@${student.username}`) : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                        student.gender === 'L' ? 'bg-blue-500' : 'bg-pink-500'
                      }`}>
                        {student.avatarUrl && student.avatarUrl.trim() !== '' ? (
                          <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover rounded-full" onError={(e) => { (e.target as HTMLElement).style.display='none' }} />
                        ) : <User className="w-4 h-4 text-white/80" />}
                      </div>
                      {student.name}
                    </td>
                    <td className="px-6 py-4">{student.gender}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        student.classRoom === 'XII IPS 1' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' :
                        student.classRoom === 'XII IPS 2' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {student.classRoom}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.role ? (
                        <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          {student.role}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Intermediate Popup */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[800px] flex flex-col items-center"
            >
              <button 
                onClick={() => setSelectedStudent(null)}
                className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors backdrop-blur-md z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {(() => {
                const isCardActive = Boolean(
                  selectedStudent.cardCreated === true ||
                  (selectedStudent.avatarUrl && String(selectedStudent.avatarUrl).trim().length > 0) ||
                  selectedStudent.email ||
                  selectedStudent.hasLoggedIn === true ||
                  (user && (selectedStudent.id === user.uid || (currentStudent?.induk && selectedStudent.induk === currentStudent.induk)))
                );
                return (
                  <>
                    <div className={!isCardActive ? 'filter blur-sm grayscale opacity-70 pointer-events-none' : ''}>
                      <IDCardCanvas student={selectedStudent} />
                    </div>
                    {!isCardActive && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center">
                          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400">
                            <X className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1">Kartu Belum Aktif</h3>
                          <p className="text-slate-300 text-center text-sm max-w-[250px]">Siswa ini belum pernah login atau mengklaim akunnya di sistem.</p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center w-full justify-center">
                {onNavigate && selectedStudent.id && (
                  <button 
                    onClick={() => {
                      const id = selectedStudent.id;
                      const name = selectedStudent.name;
                      setSelectedStudent(null);
                      onNavigate('public-profile', name || 'Profil Siswa', id);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
                  >
                    Lanjut untuk melihat profil penuh
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
                
                {isAdmin && (
                  <button 
                    onClick={() => {
                       // Assuming isEditModalOpen exists
                       if(typeof setIsEditModalOpen === 'function') setIsEditModalOpen(true);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Kartu
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={handleLoginSuccess}
        prefilledUsername={prefilledUsername}
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={selectedStudent}
        onSuccess={() => {
           fetchStudents();
        }}
      />

      <UploadGalleryModal
        isOpen={isUploadGalleryModalOpen}
        onClose={() => setIsUploadGalleryModalOpen(false)}
        onSuccess={() => {
           alert("Foto berhasil diunggah ke Galeri!");
        }}
      />
    </div>
  );
}
