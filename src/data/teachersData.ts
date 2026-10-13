import TEACHER_CREDENTIALS from './teacherDirectory.json';

export interface Teacher {
  id: string;
  nama: string;
  title: string;
  jabatan: string | null;
  mapel?: string | null;
  url_gambar: string;
  nip?: string;
  username?: string;
  motto?: string;
  quote?: string;
  role?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  name?: string;
}

export const getTeacherInitials = (name?: string): string => {
  if (!name || typeof name !== 'string') return 'G';
  // Remove academic titles and honorifics
  const cleaned = name
    .replace(/(S\.Ag\.|S\.Pd\.|S\.Hum\.|S\.HI\.|Drs\.|H\.|M\.Pd\.|Lc\.)/gi, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const getTeacherAvatarColor = (name?: string): string => {
  const colors = [
    'from-emerald-600 to-teal-800',
    'from-teal-600 to-cyan-800',
    'from-blue-600 to-indigo-800',
    'from-indigo-600 to-slate-800',
    'from-emerald-700 to-green-900',
    'from-amber-600 to-orange-800'
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const OFFICIAL_TEACHERS_RAW: Teacher[] = [
  {
    id: "guru-1",
    nama: "ABDUL HOLIK S.Ag.",
    title: "Kepala Sekolah",
    mapel: null,
    jabatan: "Kepala Madrasah",
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500225/Card%20guru/lktnh3wgbd9ioin4tdli.jpg"
  },
  {
    id: "guru-2",
    nama: "ANIS KOMARIYAH S.Pd.",
    title: "Operator Sekolah",
    mapel: null,
    jabatan: "Bendahara BOS",
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500223/Card%20guru/n3ploc0ktxv4848bkyjw.jpg"
  },
  {
    id: "guru-3",
    nama: "BAYU HERU SUSANTO",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500227/Card%20guru/hp2wzauwypkujoq0lljm.jpg"
  },
  {
    id: "guru-4",
    nama: "DIAH SAVITRI KUSUMANINGRUM",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500224/Card%20guru/yx55jhosibtlwdybkvpd.png"
  },
  {
    id: "guru-5",
    nama: "ELY RUFIANA",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500224/Card%20guru/y1iqqpudqs7e1c7e1t2s.jpg"
  },
  {
    id: "guru-6",
    nama: "FAUZAN HASANI S.Pd.",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500223/Card%20guru/tz9i22rfbhl93jdjpfdy.jpg"
  },
  {
    id: "guru-7",
    nama: "FIRZHA NURITA RIZKIANDINI",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500224/Card%20guru/oropfkzcco5hp62pgfjy.jpg"
  },
  {
    id: "guru-8",
    nama: "IBNU RUSLAN NURUS ZAMAN S.Hum.",
    title: "Guru",
    mapel: null,
    jabatan: "Waka Bidang Kurikulum",
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500227/Card%20guru/sa9rdtmjryhnnrprercf.jpg"
  },
  {
    id: "guru-9",
    nama: "IMROATUL HASANAH",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500224/Card%20guru/csyyky6itoh8t0obfvn4.jpg"
  },
  {
    id: "guru-10",
    nama: "ITQINANA SU`UDIYAH",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500227/Card%20guru/vbnm90jhlqcjpdsw57ae.png"
  },
  {
    id: "guru-11",
    nama: "LIA AFIFA AL MAGHFIROH",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500226/Card%20guru/cqthcc2gz4zjqhjawqxe.jpg"
  },
  {
    id: "guru-12",
    nama: "LINDA ARNILYA S.Pd.",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500225/Card%20guru/dre9oa3i0p4gipvhwtmp.jpg"
  },
  {
    id: "guru-13",
    nama: "MISTINANINGSIH S.Pd.",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500223/Card%20guru/l18xpuhth1rjqtifvqak.jpg"
  },
  {
    id: "guru-14",
    nama: "MOH. HUSNAN S.HI.",
    title: "Guru",
    mapel: null,
    jabatan: "Waka Bidang Kesiswaan",
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500226/Card%20guru/cuulyduvcssvgspvkzre.jpg"
  },
  {
    id: "guru-15",
    nama: "MUFTI HAFIYANA S.Pd..",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500226/Card%20guru/zvuwjthvmbidhaqziwjg.png"
  },
  {
    id: "guru-16",
    nama: "NURUL LAILATUL QODRIYAH",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500224/Card%20guru/hz65n1e2hb9qpiui8hrp.png"
  },
  {
    id: "guru-17",
    nama: "NURUL QOMARIYAH S.Pd.",
    title: "Guru Mata Pelajaran",
    mapel: "Ekonomi",
    jabatan: "Wakil Kepala Sekolah Bidang Kurikulum",
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500222/Card%20guru/r0n6v7rokshoz7wiit3u.jpg"
  },
  {
    id: "guru-18",
    nama: "SARAH ATIKA DEWI",
    title: "Guru",
    mapel: null,
    jabatan: null,
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500222/Card%20guru/bqt2pchwnio6jusxmqrj.png"
  },
  {
    id: "guru-19",
    nama: "ZAKIYATUL MASRURAH S.Pd.",
    title: "Guru",
    mapel: null,
    jabatan: "Wali Kelas XII IPS 1",
    url_gambar: "https://res.cloudinary.com/dhxfke7kq/image/upload/v1790500223/Card%20guru/tdwgmiqidtiuenaw06rj.jpg"
  }
];

export const INITIAL_TEACHERS: Teacher[] = OFFICIAL_TEACHERS_RAW.map(t => {
  const cred = (TEACHER_CREDENTIALS as any[]).find(c => c.id === t.id);
  const isKepsek = t.id === 'guru-1' || t.nama.toLowerCase().includes('abdul holik');
  return {
    ...t,
    url_gambar: t.url_gambar || '',
    nip: cred?.nip || (isKepsek ? '190001' : t.id),
    username: cred?.username || (isKepsek ? '@abdul_holik' : `@${t.id}`),
    role: cred?.role || (isKepsek ? 'Kepala Madrasah' : t.jabatan || t.title || 'Dewan Pendidik'),
    title: cred?.title || t.title || (isKepsek ? 'Kepala Madrasah' : 'Guru'),
    jabatan: cred?.jabatan || t.jabatan || (isKepsek ? 'Kepala Madrasah' : null),
    motto: isKepsek 
      ? 'Memimpin dengan keteladanan, mengantarkan madrasah menuju generasi unggul berakhlak mulia.'
      : 'Mendidik dengan ketulusan hati, menginspirasi generasi madrasah.'
  };
});
