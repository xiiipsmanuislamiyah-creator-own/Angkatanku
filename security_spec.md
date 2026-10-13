# Spesifikasi keamanan aktual — V2, Tahap 1–5

## Batas kepercayaan

React menggunakan API Express pada origin yang sama. Server menggunakan Firebase Admin SDK melalui Application Default Credentials (ADC) atau FIREBASE_SERVICE_ACCOUNT_JSON server-only di Vercel dan database Firestore yang dipilih eksplisit. Browser tidak mengakses Firestore langsung. Rules menolak semua read/write klien, termasuk token dengan klaim owner palsu.

Admin SDK melewati Rules; validasi API dan IAM runtime tetap wajib. Identitas Firebase Auth lama menjadi referensi UID migrasi. Sesi baru diverifikasi server, bukan Firebase ID token atau localStorage.

## Role dan izin

| Kemampuan | Owner | Admin | Member | Pengunjung |
|---|---|---|---|---|
| Konten publik | Ya | Ya | Ya | Baca; like terbatas cookie/CSRF/kuota |
| Konten anggota | Ya | Ya | Ya | Tidak |
| Profil/konten sendiri | Ya | Ya | Ya | Tidak |
| Moderasi komunitas | Ya | Sesuai izin/lingkup | Tidak | Tidak |
| Role, akun, suspend/ban/reset | Ya, kecuali target owner | Tidak | Tidak | Tidak |
| Konfigurasi fitur | Ya | config.manage, lingkup sekolah | Tidak | Tidak |
| Maintenance/read-only | Ya | Tidak | Tidak | Tidak |
| Audit | Ya | audit.read, lingkup sekolah | Tidak | Tidak |
| DM | Hanya peserta | Hanya peserta | Hanya peserta | Tidak |
| DM dilaporkan | Cuplikan terpilih | reports.review sesuai lingkup | Dapat melapor | Tidak |

Permission: profiles.manage, feed.moderate, story.moderate, globalChat.moderate, reports.review, academic.manage, announcements.manage, config.manage, audit.read, memory.review, identity.publish. Admin memiliki lingkup sekolah atau daftar kelas. Siswa/guru adalah profileKind, bukan privilege.

Owner hanya dibuat oleh migrasi server dengan tepat satu identitas terpetakan. Tidak ada API pemberian role owner. Perubahan role/izin/status/password menaikkan versi akun dan mencabut sesi lama. Field role dalam profil adalah atribut tampilan legacy, bukan otorisasi.

## Kredensial dan sesi

- Username dinormalisasi; tidak ada email/telepon/OTP atau signup publik yang diwajibkan.
- Password baru minimal 12 karakter, maksimal 128 byte; scrypt N=32768/r=8/p=1, salt acak 16 byte, hash 64 byte. API tidak mengembalikan password/hash.
- Cookie produksi __Host-angkatan_session: Secure, HttpOnly, SameSite=Strict, Path=/, tanpa Domain. Token acak 32 byte, hanya hash disimpan. Batas absolut 7 hari dan idle 12 jam.
- API non-GET/HEAD memerlukan Origin allowlist; penulisan terautentikasi juga memerlukan CSRF. Renewal tidak dapat menghidupkan sesi expired.
- Status akun/versi sesi diperiksa setiap request dan kembali saat transaksi tulis. Aksi owner serta ganti password memerlukan autentikasi ulang dalam 5 menit.
- Akun baru/reset memakai password sementara yang wajib diganti sebelum publikasi/upload/AI. Password sementara disampaikan melalui jalur pribadi, bukan respons API.
- QR legacy didukung sebagai format JSON, label username/password atau pemisah pipa. Password terekspos tidak dipertahankan sebagai jalan belakang; QR profil tidak ditebak menjadi password.
- Kartu login baru dibuat setelah reauth dari password yang dimasukkan pengguna, hanya dalam memori, dihapus sesudah unduhan atau 60 detik. Tidak diunggah ke Cloudinary. Kartu tetap merupakan rahasia autentikasi yang dapat digunakan pemegangnya.

## Pembatasan yang diterapkan

| Operasi | Batas |
|---|---|
| Login | 5/username/10 menit; 30/IP/10 menit |
| Reauth | 5/akun/10 menit |
| Query data | 240/akun atau IP/menit; 100 dokumen per halaman |
| Post / Story / Album | 5 / 10 / 3 per jam per akun |
| Pesan | 10/menit per akun |
| Penulisan lain | 60/menit per akun |
| Interaksi / komentar | 30 / 6 per menit per akun |
| Laporan | 5/jam per akun |
| Upload | 20/jam/akun; 4 upload bersamaan per instance |
| AI | 10/akun/10 menit; 500/global/24 jam; satu request aktif per akun |

Rate limit menggunakan transaksi Firestore. TRUSTED_PROXY_CIDRS hanya diisi ingress terverifikasi, bukan semua proxy. Proteksi volumetrik dan budget alert infrastruktur belum diverifikasi.

## Data, privasi, media

Collection/field dibatasi allowlist, tipe/batas input, kepemilikan, identitas resmi yang immutable, dan projection respons. Timestamp/identitas pengirim ditentukan server. Audience public/members/restricted; legacy tanpa audience menjadi members. Hidden hanya terlihat oleh pemilik/moderator. Penulis tidak dapat membatalkan hidden/comment lock yang dipasang moderator. Edit moderator tidak mengambil alih konten legacy tanpa kepemilikan terpetakan, dan jenis profil target tidak diwarisi dari pelaku edit. Identitas penonton menjadi agregat.

DM lama diquery menurut sender/receiver; DM baru memakai ACL peserta ruang, tanpa owner override. Block diperiksa lagi di transaksi kirim, termasuk jalur legacy. Laporan menyimpan snapshot pesan pilihan pelapor. Konteks AI terbatas pada jadwal/guru/prestasi yang terlihat serta Nusa Memory ber-consent, approved dan sesuai audience/kelas; maksimal 12 sumber, tanpa DM/kredensial atau alat perubahan akun. Usulan Memory tidak langsung masuk retrieval. Review memerlukan izin/lingkup, reauth dan version check; perubahan status dicatat. Koreksi dikirim sebagai laporan transparan.

Upload memerlukan sesi/CSRF/rate limit, signature dan MIME sesuai: JPEG/PNG/WebP <=8 MB dan 24 megapiksel, MP4/WebM <=20 MB. SVG/HTML tersamar/gambar rusak ditolak. Ini bukan pemindaian antivirus menyeluruh. Cloudinary baru bertipe authenticated, diambil server lalu diproxy setelah pemeriksaan audience/parent; signed URL tidak diberikan kepada browser.

Delete memerlukan kepemilikan, pelepasan referensi dan GC server. GC hanya prefix angkatanku-v2/, memakai tombstone deleting agar tidak ditautkan kembali, dan bisa diulang setelah kegagalan provider. Aset legacy tidak dihapus otomatis. URL CDN lama yang publik tetap dapat dibuka di luar aplikasi; audience database tidak dapat mencabutnya. Import CDN baru hanya moderator dengan audience public.

## Konfigurasi dan operasional

feedEnabled/storiesEnabled mengendalikan publikasi dan interaksi, bukan menghapus arsip. aiEnabled, uploadLock, readOnly, maintenance dan filter kata diperiksa server. globalChatEnabled/globalChat.moderate/slowMode sekarang mengendalikan dua ruang global. Ruang siswa menolak guru; ruang komunitas menerima anggota aktif. DM peserta tidak memperoleh owner override. Moderasi pin/delete/mute global memerlukan izin/lingkup dan reauth. History 50 per halaman; jendela UI 200 pesan, dengan pagination dan kembali ke pesan terbaru.

Audit hanya aktor/aksi/target/waktu. Backup migrasi AES-256-GCM dengan kunci 32 byte terpisah; rollback membandingkan kondisi terkini agar tidak menimpa perubahan pengguna. Produksi belum memakai kontrol baru ini.

Rujukan: [Firestore server dan IAM](https://firebase.google.com/docs/firestore/client/libraries), [rules per database](https://firebase.google.com/docs/rules/manage-deploy), [Cloudinary access control](https://cloudinary.com/documentation/control_access_to_media).

## Penambahan Vercel/V2

Vercel memakai origin platform yang tetap dari env, bukan Host request, dan IP platform x-vercel-forwarded-for hanya ketika VERCEL=1. Native handler mengembalikan 503 tanpa konfigurasi, tidak mengaktifkan akun dummy. Browser/API same-origin.

Untuk upload di Vercel, server membuat reservation dan signature Cloudinary dengan ID acak, overwrite=false, authenticated dan format terbatas. Browser mengirim file langsung ke provider; completion membaca metadata provider dan isi file di server untuk validasi, sebelum media boleh ditautkan/dibaca. Signature berlaku satu jam; GC menunggu signature kedaluwarsa. Pending/orphan tidak ditampilkan dan eligible GC setelah 24 jam. Ini membatasi publikasi, tetapi bukan jaminan batas ukuran transfer sebelum provider menerima file; perlu budget/perimeter Cloudinary. Signature/kuota terikat akun yang meminta; endpoint completion tetap memeriksa status sesi dalam transaksi.

Kuota tambahan: signed upload 20/akun/jam dan 200/global/hari; global chat 8/20 detik, DM 10/menit; Memory 5/jam. Guest like 60/IP/menit dan 30/visitor/menit dengan maksimum 8 cookie baru/IP/hari. CSP membatasi sink script; CSS Story hanya preset allowlist.

Composer mengirim requestId untuk retry idempotent dan expectedUpdatedAt untuk konflik edit. Query UI legacy dibatasi 500 dokumen; retrieval Memory memeriksa subset terbatas, bukan pencarian semantik seluruh arsip. Retensi, GC terjadwal, notifikasi push dan operasi massal belum dipasang.
