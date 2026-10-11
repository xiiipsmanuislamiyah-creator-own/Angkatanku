export interface ClassActivity {
  id: string;
  title: string;
  category: 'P5' | 'Class Meeting' | 'Lomba' | 'Study Tour' | 'Kegiatan Sekolah';
  date: string;
  description: string;
  imageUrl: string;
  status: 'Selesai' | 'Berjalan' | 'Direncanakan';
}

export interface Achievement {
  id: string;
  title: string;
  category: 'Akademik' | 'Non Akademik' | 'Organisasi';
  winner: string;
  rank: string;
  date: string;
  description: string;
  badge: string;
}

export interface GalleryPhoto {
  id: string;
  album: 'Semua' | 'P5' | 'Class Meeting' | 'Study Tour' | 'Kelas & Sekolah' | 'Graduation Prep';
  title: string;
  imageUrl: string;
  date: string;
  uploaderId?: string;
}
