export interface OfficialStudent {
  urut: number;
  induk: string;
  name: string;
  gender: 'L' | 'P';
  role?: string;
  motto: string;
  hobbies: string[];
  favoriteSubject: string;
  socialTag: string;
  username?: string;
  classRoom?: string;
}

export const OFFICIAL_STUDENTS: OfficialStudent[] = [
  {
    "urut": 1,
    "induk": "240008",
    "name": "Ananda Ikhsan Wijaya",
    "username": "@ananda",
    "gender": "L",
    "role": "Anggota Aktif",
    "motto": "Membangun kebersamaan dan persatuan untuk mencapai impian bersama.",
    "hobbies": [
      "Organisasi",
      "Futsal",
      "Fotografi"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@ananda_ikhsan",
    "classRoom": "IPS 1"
  },
  {
    "urut": 2,
    "induk": "250035",
    "name": "Aulia Putri Anggraini",
    "username": "@aulia",
    "gender": "P",
    "role": "Bendahara",
    "motto": "Setiap langkah kecil dengan ketelitian akan membuahkan hasil luar biasa.",
    "hobbies": [
      "Menulis",
      "Membaca",
      "Seni Dekorasi"
    ],
    "favoriteSubject": "Bahasa Indonesia",
    "socialTag": "@aulia_putri",
    "classRoom": "IPS 1"
  },
  {
    "urut": 3,
    "induk": "240011",
    "name": "Chantika Durrotun Nafisyah",
    "username": "@chantika",
    "gender": "P",
    "role": "Ketua Kelas",
    "motto": "Kedisiplinan dan kejujuran adalah kunci ketenangan hati.",
    "hobbies": [
      "Matematika Sosial",
      "Memasak",
      "Desain Graphic"
    ],
    "favoriteSubject": "Ekonomi",
    "socialTag": "@chantika_durrotun",
    "classRoom": "IPS 1"
  },
  {
    "urut": 4,
    "induk": "240012",
    "name": "Elfati Qurrotu Ainina",
    "username": "@elfati",
    "gender": "P",
    "role": "Wakil Ketua",
    "motto": "Tersenyum dan istiqomah dalam menuntut ilmu madrasah.",
    "hobbies": [
      "Qiraat",
      "Membaca Kitab",
      "Kaligrafi"
    ],
    "favoriteSubject": "Fikih / SKI",
    "socialTag": "@elfati_qurrotu",
    "classRoom": "IPS 1"
  },
  {
    "urut": 5,
    "induk": "240013",
    "name": "Erika Made Reni",
    "username": "@erika",
    "gender": "P",
    "role": "Anggota Aktif",
    "motto": "Belajar memahami perbedaan untuk menciptakan kedamaian.",
    "hobbies": [
      "Seni Tari",
      "Traveling",
      "Public Speaking"
    ],
    "favoriteSubject": "Geografi",
    "socialTag": "@erika_made",
    "classRoom": "IPS 1"
  },
  {
    "urut": 6,
    "induk": "240016",
    "name": "Holifatul Amina",
    "username": "@holifatul",
    "gender": "P",
    "role": "Sekretaris 1",
    "motto": "Kebersihan lingkungan mencerminkan kebersihan jiwa dan pikiran.",
    "hobbies": [
      "Kerajinan Tangan",
      "Berkebun",
      "Kulinari"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@holifatul_amina",
    "classRoom": "IPS 1"
  },
  {
    "urut": 7,
    "induk": "250031",
    "name": "Kamelia Agustin",
    "username": "@kamelia",
    "gender": "P",
    "role": "Anggota Aktif",
    "motto": "Jadikan setiap hari sebagai kesempatan belajar hal baru.",
    "hobbies": [
      "Musik",
      "Badminton",
      "Vlog"
    ],
    "favoriteSubject": "Bahasa Inggris",
    "socialTag": "@kamelia_agustin",
    "classRoom": "IPS 1"
  },
  {
    "urut": 8,
    "induk": "240022",
    "name": "Masyaratus Zahra",
    "username": "@masyaratus",
    "gender": "P",
    "role": "Anggota Aktif",
    "motto": "Teliti dalam setiap keputusan dan selalu bersyukur.",
    "hobbies": [
      "Akuntansi",
      "Membaca Novel",
      "Menjahit"
    ],
    "favoriteSubject": "Ekonomi",
    "socialTag": "@masyaratus_zahra",
    "classRoom": "IPS 1"
  },
  {
    "urut": 9,
    "induk": "240023",
    "name": "Moch. Kafka Izqi Caesar",
    "username": "@kafka",
    "gender": "L",
    "role": "Anggota Aktif",
    "motto": "Pemimpin sejati adalah yang mengayomi dan memberi teladan.",
    "hobbies": [
      "Gaming E-Sports",
      "Sepakbola",
      "Catur"
    ],
    "favoriteSubject": "Sejarah Indonesia",
    "socialTag": "@kafka_caesar",
    "classRoom": "IPS 1"
  },
  {
    "urut": 10,
    "induk": "250032",
    "name": "Mohammad Wildan Ulin Nuha",
    "username": "@wildan",
    "gender": "L",
    "role": "Anggota Aktif",
    "motto": "Di dalam tubuh yang sehat terdapat semangat juang yang tinggi.",
    "hobbies": [
      "Voli",
      "Lari Marathon",
      "Bisa Koding"
    ],
    "favoriteSubject": "PJOK",
    "socialTag": "@wildan_ulin",
    "classRoom": "IPS 1"
  },
  {
    "urut": 11,
    "induk": "240027",
    "name": "Muhammad Hafid",
    "username": "@hafid",
    "gender": "L",
    "role": "Anggota Aktif",
    "motto": "Menjaga ketertiban dan kedamaian kelas adalah kewajiban.",
    "hobbies": [
      "Pencak Silat",
      "Otomotif",
      "Musik Akustik"
    ],
    "favoriteSubject": "Sejarah Dunia",
    "socialTag": "@muhammad_hafid",
    "classRoom": "IPS 1"
  },
  {
    "urut": 12,
    "induk": "240028",
    "name": "Nadiyatul Khoiriyah",
    "username": "@nadiyatul",
    "gender": "P",
    "role": "Anggota Aktif",
    "motto": "Berbuat baik tanpa membandingkan, melangkah dengan optimisme.",
    "hobbies": [
      "Seni Rupa",
      "Membaca Komik",
      "Menulis Puisi"
    ],
    "favoriteSubject": "Seni Budaya",
    "socialTag": "@nadiyatul_khoir",
    "classRoom": "IPS 1"
  },
  {
    "urut": 13,
    "induk": "240032",
    "name": "Nur Dina Karmilila Fitri",
    "username": "@nurdina",
    "gender": "P",
    "role": "Sekretaris 2",
    "motto": "Mengabadikan setiap momen berharga kelas XII IPS 1.",
    "hobbies": [
      "Videografi",
      "Fotografi",
      "Jurnalistik"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@dina_karmilila",
    "classRoom": "IPS 1"
  },
  {
    "urut": 14,
    "induk": "240033",
    "name": "Nur Jazila Febrianti",
    "username": "@nurjazila",
    "gender": "P",
    "role": "Anggota Aktif",
    "motto": "Masa depan milik mereka yang percaya pada keindahan mimpinya.",
    "hobbies": [
      "Membaca",
      "Renang",
      "Seni Musik"
    ],
    "favoriteSubject": "Bahasa Indonesia",
    "socialTag": "@nur_jazila",
    "classRoom": "IPS 1"
  },
  {
    "urut": 15,
    "induk": "250036",
    "name": "Rezky Abdillah",
    "username": "@rezky",
    "gender": "L",
    "role": "Anggota Aktif",
    "motto": "Inovasi dan teknologi untuk mendukung kemajuan bersama.",
    "hobbies": [
      "Koding",
      "Robotika",
      "Bermain Gitar"
    ],
    "favoriteSubject": "TIK / Informatika",
    "socialTag": "@rezky_abdillah",
    "classRoom": "IPS 1"
  },
  {
    "urut": 16,
    "induk": "240035",
    "name": "Riski Maulidatul Hasanah",
    "username": "@riski",
    "gender": "P",
    "role": "Anggota Aktif",
    "motto": "Keramahan dan kesabaran melunakkan kerasnya cobaan.",
    "hobbies": [
      "Membaca Qur'an",
      "Menulis Cerpen",
      "Memasak"
    ],
    "favoriteSubject": "Akidah Akhlak",
    "socialTag": "@riski_maulidatul",
    "classRoom": "IPS 1"
  },
  {
    "urut": 17,
    "induk": "240036",
    "name": "Rohmatulloh",
    "username": "@rohmatulloh",
    "gender": "L",
    "role": "Developer",
    "motto": "Tetap rendah hati, terus berjuang sampai cita-cita tergapai.",
    "hobbies": [
      "Sepakbola",
      "Pencak Silat",
      "Petualang"
    ],
    "favoriteSubject": "Geografi",
    "socialTag": "@rohmatulloh",
    "classRoom": "IPS 1"
  },
  {
    "urut": 18,
    "induk": "240037",
    "name": "Rumi Karnilatus Zahra",
    "username": "@rumi",
    "gender": "P",
    "role": "Anggota Aktif",
    "motto": "Sebaik-baik manusia adalah yang paling bermanfaat bagi sesamanya.",
    "hobbies": [
      "Kewirausahaan",
      "Public Relation",
      "Membaca"
    ],
    "favoriteSubject": "Prakarya / PKWU",
    "socialTag": "@rumi_karnilatus",
    "classRoom": "IPS 1"
  },
  {
    "urut": 19,
    "induk": "260001",
    "name": "Agys Adia Meica",
    "username": "@agys",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@agys",
    "classRoom": "IPS 2"
  },
  {
    "urut": 20,
    "induk": "260002",
    "name": "Ahmad Abil Raihan",
    "username": "@ahmadaqil",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@ahmadaqil",
    "classRoom": "IPS 2"
  },
  {
    "urut": 21,
    "induk": "260003",
    "name": "Alfina Nur Yaziroh",
    "username": "@alfina",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@alfina",
    "classRoom": "IPS 2"
  },
  {
    "urut": 22,
    "induk": "260004",
    "name": "Alif Alfian Alamsyah",
    "username": "@alif",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@alif",
    "classRoom": "IPS 2"
  },
  {
    "urut": 23,
    "induk": "260005",
    "name": "Amrullah Azzaky",
    "username": "@amrullah",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@amrullah",
    "classRoom": "IPS 2"
  },
  {
    "urut": 24,
    "induk": "260006",
    "name": "Ananda Viona Safitri",
    "username": "@anandaviona",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@anandaviona",
    "classRoom": "IPS 2"
  },
  {
    "urut": 25,
    "induk": "260007",
    "name": "Belawati Putri",
    "username": "@belawati",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@belawati",
    "classRoom": "IPS 2"
  },
  {
    "urut": 26,
    "induk": "260008",
    "name": "Isy Karima Ardilla Annasih Sholihah",
    "username": "@isykarima",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@isykarima",
    "classRoom": "IPS 2"
  },
  {
    "urut": 27,
    "induk": "260009",
    "name": "Julia Diva Virnanda",
    "username": "@julia",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@julia",
    "classRoom": "IPS 2"
  },
  {
    "urut": 28,
    "induk": "260010",
    "name": "M. Amrul Maulidi",
    "username": "@amrul",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@amrul",
    "classRoom": "IPS 2"
  },
  {
    "urut": 29,
    "induk": "260011",
    "name": "M. David Ibrahim",
    "username": "@david",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@david",
    "classRoom": "IPS 2"
  },
  {
    "urut": 30,
    "induk": "260012",
    "name": "Moch. Ramdhani",
    "username": "@ramdhani",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@ramdhani",
    "classRoom": "IPS 2"
  },
  {
    "urut": 31,
    "induk": "260013",
    "name": "Moh. Irsyad Mahdi Haerullah",
    "username": "@irsyad",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@irsyad",
    "classRoom": "IPS 2"
  },
  {
    "urut": 32,
    "induk": "260014",
    "name": "Natiza Tri Hapsari",
    "username": "@natiza",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@natiza",
    "classRoom": "IPS 2"
  },
  {
    "urut": 33,
    "induk": "260015",
    "name": "Nofiyana Anisatul Kamiliya",
    "username": "@nofiyana",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@nofiyana",
    "classRoom": "IPS 2"
  },
  {
    "urut": 34,
    "induk": "260016",
    "name": "Sinta Nur Aida Sari",
    "username": "@sinta",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@sinta",
    "classRoom": "IPS 2"
  },
  {
    "urut": 35,
    "induk": "260017",
    "name": "Sofi Agustina",
    "username": "@sofi",
    "gender": "P",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@sofi",
    "classRoom": "IPS 2"
  },
  {
    "urut": 36,
    "induk": "260018",
    "name": "Tegar Fatria Fajrin",
    "username": "@tegar",
    "gender": "L",
    "role": "Siswa XII IPS 2",
    "motto": "Solidaritas dan kebersamaan.",
    "hobbies": [
      "Membaca",
      "Olahraga"
    ],
    "favoriteSubject": "Sosiologi",
    "socialTag": "@tegar",
    "classRoom": "IPS 2"
  }
];
