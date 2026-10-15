# Pengujian aktual AngkatanKU V2

13 Oktober 2026. Semua tes perubahan data menggunakan akun dummy dan lingkungan lokal/emulator. Tidak ada eksploitasi destruktif atau tes tulis database produksi.

| Pemeriksaan | Hasil | Bukti/cakupan |
|---|---|---|
| `npm run lint` | PASS | TypeScript noEmit, exit 0 |
| `npm test` | PASS 48/48 | API Express nyata, store transaksional fixture, provider dummy; termasuk native handler Vercel tanpa env |
| `npm run test:rules` | PASS 4/4 | Emulator resmi Java 21, project demo-angkatanku |
| `npm run build` | PASS | Vite 6.4.3, 2.196 modul; frontend dan server terpisah |
| `npm run test:e2e` | PASS 20/20 | Chromium, Playwright 1.56.1, build aktual; 0 skipped/flaky, sekitar 70 detik pada pengulangan penuh |
| Runtime produksi HTTPS lokal | PASS 1/1 | Build server asli, cookie Secure, emulator/rules aktual, Chromium |
| `npm audit --json` | PASS, 0 advisory | Seluruh dependency/dev pada lockfile saat pemeriksaan |

Total **73 tes**, bukan 73 tes provider produksi. 216 percobaan akses Firestore termasuk dalam empat tes emulator, bukan tambahan jumlah suite. Pemeriksaan visual responsif diulang untuk menunggu animasi selesai sebelum screenshot.

## Autentikasi, ACL, data dan keamanan

Login benar/salah dan QR memakai server yang sama; cookie, session expiry/idle/logout/revoke, password wajib diganti, reauth, CSRF/Origin, brute force paralel dan forged X-Forwarded-For diperiksa. Member ditolak pada API owner, admin tidak dapat menaikkan role/mengambil alih owner, profil orang lain dan identitas resmi dilindungi. Role localStorage/request tidak dipercaya. Audit/laporan dipaginasi.

Audience public/member/restricted, hidden/comment lock, expiry Story, kepemilikan media, prototype-key/URL injection, teks markup literal, file MIME/signature/ukuran/resolusi, upload/delete/AI tanpa login dan kuota AI diuji. Scoped permissions, profil guru/siswa, payload jadwal/kartu/prestasi lama, migrasi UID, backup AES-GCM, tampering dan konflik rollback juga diuji. Ini bukan fuzzing universal atau audit independen.

## Cakupan baru V2

- Dua chat global: siswa saja versus komunitas; slow mode, rate limit, pin/moderasi, reauth, retry paralel idempotent, newest-first pagination subkoleksi nyata. Revision poll tidak membaca 50 pesan lagi ketika isi belum berubah.
- DM hanya peserta, termasuk penolakan owner nonpeserta; block diterapkan ke jalur lama dan baru, lintas ruang/reply ditolak, laporan hanya cuplikan pilihan, withdrawal/tombstone.
- Guest like hanya konten publik, cookie+CSRF+kuota; unlike/retry tidak menambah hitungan ganda. Bookmark milik sendiri.
- Identitas resmi memerlukan izin dan lingkup; penulis/timestamp ditetapkan server. Komentar satu tingkat, duplicate limit, soft delete dan moderator freshness.
- Nusa Memory consent, pending/approved/rejected, version conflict, scoped review, visibility retrieval dan penolakan self-grant. Respons AI fixture benar-benar muncul di UI, bukan sekadar indikator sukses.
- Signed direct upload tetap pending/private sampai inspeksi server; ownership, ukuran yang diverifikasi, revoke dan lifetime signature/GC diuji memakai provider fixture.
- Jadwal menolak range terbalik/overlap/hari duplikat, sambil menerima format legacy yang hanya mempunyai jam mulai.

## Emulator Firestore

216 operasi get/list/set/delete pada koleksi baru dan lama ditolak untuk pengunjung, member dan klaim owner palsu. Transaksi login paralel/revoke, apply migrasi dan rollback terenkripsi, serta chat pagination/retry/block menggunakan emulator Firestore nyata.

Query descending document ID subkoleksi sempat menghasilkan 500 pada emulator. ID pesan sekarang memakai timestamp terbalik dengan pengurutan ascending; tes yang sama dan keseluruhan suite kembali PASS. Tidak bergantung pada perilaku MemoryStore saja.

## Browser dan runtime

20 tes meliputi manual login/reload/forged role/logout, QR gambar dummy dan animasi scanner, QR SVG ditolak, owner suspend lewat reauth dengan audit, sepuluh halaman legacy, kartu PNG diunduh dan QR didekode kembali, perubahan password mencabut sesi.

Fitur V2 diuji melalui UI: posting literal XSS, bookmark, komentar/hapus/edit; Story teks/preset dan moderator reauth; album 12 file menjaga urutan/sampul; global chat/DM/block; jawaban Nusa dan kontribusi Memory. Delapan route baru diperiksa pada 320/360/390/480/768/1024/1440 px, termasuk posisi kolom agar overflow:hidden tidak menyamarkan pemotongan. Sampel screenshot Home, Feed, Nusa dan Mading mobile/desktop diperiksa.

Satu run gagal karena pemeriksaan opsional dialog sambutan mendahului render dialog lalu menghalangi klik logout. Flag sambutan kini dikonsumsi sekali saat tampil, timer tertunda dihapus, dan tes menunggu serta menutup dialog secara eksplisit sebelum reload. Suite penuh diulang dan 20/20 lulus.

Runtime HTTPS lokal membuktikan cookie __Host-angkatan_session Secure/HttpOnly/SameSite=Strict, login/reload/write/logout, penolakan API owner/Origin asing, dan source/.env tidak disajikan. Native Node handler Vercel diuji terpisah untuk JSON 503 saat konfigurasi tidak ada. Sertifikat lokal tidak membuktikan TLS/IAM deployment.

## Performa dan batas verifikasi

`node --import tsx scripts/measure-ui.ts` mengambil sampel build lokal, guest, cache baru, reduced motion, Chromium 390/1280 px, jaringan eksternal diblokir. Lihat [PERFORMANCE.md](PERFORMANCE.md). Ini sampel lab tunggal, bukan Core Web Vitals lapangan atau uji beban.

Belum diverifikasi: Cloudinary upload/delivery/delete nyata dan file besar di Vercel; Gemini generation nyata; key rotation; migrasi/rules produksi; kamera fisik; Safari/Firefox/perangkat nyata; login embedded AI Studio; aksesibilitas menyeluruh; beban/soak; budget/retensi/recovery produksi. Data/browser/provider dummy tidak membuktikan bagian tersebut. Status preview nyata dicatat terpisah dalam DEPLOYMENT_STATUS.md.

Scan terakhir terhadap 61 nilai rahasia dikenal pada 192 file source/docs/build: 0 file cocok. Ini tidak mencakup seluruh Git history atau seluruh pola secret yang tidak dikenal. Visual QA juga menemukan scroll awal Nusa menggeser seluruh halaman; autoscroll kini hanya di dalam viewport percakapan, dengan regresi posisi scroll awal.

Preview Vercel pertama berhasil build namun runtime 500 dengan ERR_MODULE_NOT_FOUND pada import server/runtime. Semua import relatif backend/API diberi ekstensi .js; tes tambahan mengompilasi transitive imports memakai NodeNext dan memuatnya lewat proses Node asli tanpa tsx. 48/48 unit/API dan TypeScript/build lulus setelah perbaikan. Total menjadi 73 tes; verifikasi preview ulang dicatat di DEPLOYMENT_STATUS.md.

Verifikasi HTTPS preview Vercel sesudah perbaikan native ESM: /home 200; /api/auth/session 503 JSON SERVICE_UNCONFIGURED/no-store; tiga path source/secret hanya HTML SPA, CSP/HSTS/nosniff aktif. Browser hosting tidak dapat diselesaikan karena CA proxy dan timeout; tidak dihitung sebagai PASS E2E produksi.

## Pemeriksaan lanjutan 15 Oktober 2026

Kompatibilitas model Nusa diverifikasi lewat generation nyata, termasuk SDK yang digunakan aplikasi. Default diperbarui ke gemini-3.5-flash-lite setelah model default lama tidak lagi menerima permintaan pada pengujian ini. TypeScript/build, 48 unit/API dan satu runtime HTTPS lokal kembali lulus. Empat tes emulator dan 20 browser pada tabel utama adalah run sebelumnya; tidak diklaim semuanya diulang pada pemeriksaan ini.

Runtime HTTPS sempat gagal sebelum browser berjalan karena executable Chromium tersisa dalam bentuk terpotong. Binary resmi dipulihkan dan diverifikasi, lalu tes yang sama lulus. Tidak ada perubahan aplikasi untuk menutupi kegagalan lingkungan. Diagnosis akun/provider dan penyiapan konfigurasi disimpan pada laporan privat pemilik. Tidak ada migrasi/rules produksi yang dijalankan dalam pemeriksaan lanjutan.
