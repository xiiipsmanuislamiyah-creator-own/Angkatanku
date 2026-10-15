# User Preference & Guidelines

## Discussion Mode (/nocode)
- Jika pengguna menyertakan perintah `/nocode` di awal atau di akhir pesan, **jangan melakukan perubahan kode (editing/creating files)**.
- Perlakukan instruksi tersebut murni sebagai diskusi, konfirmasi, konsultasi, atau perencanaan tanpa melakukan pengeditan atau pembuatan kode di proyek.

## Batas pekerjaan

- Instruksi owner 12 Oktober 2026 mengizinkan seluruh Tahap 1–5 dan deployment Vercel sesuai Master PRD. Kembangkan source yang ada, pertahankan landing sinematik, foto asli, kartu dan scanner. Perbarui UI/UX halaman aplikasi sesuai PRD; game/tools baru ditunda oleh PRD, fitur lama dipertahankan.
- Pertahankan username/password, QR eksplisit, desain kartu dan animasi scanner. Siswa/guru adalah jenis profil; role keamanan adalah owner/admin/member, dengan pengunjung tanpa sesi.
- Firebase/Firestore adalah penyimpanan aktif. Jangan menambahkan Supabase atau database baru tanpa kebutuhan yang disepakati.
- Gunakan PLAN.md, security_spec.md dan docs/SECURITY_REPORT_ID.md sebagai status aktual. Dokumen lama dalam ZIP bukan bukti hasil tes.

## Invarian keamanan

- Semua akses data melalui API. Jangan mengembalikan password frontend, role localStorage, signup publik, SDK Firestore klien, atau upload/delete tanpa autentikasi.
- Firestore Rules menolak akses klien. Admin SDK melewati rules; validasi API dan IAM runtime tetap wajib. Deploy rules harus bersama backend dan migrasi pada database bernama yang benar.
- Owner hanya dibootstrap melalui migrasi server terlindungi. API tidak boleh memberikan role owner atau membuka seluruh DM. Laporan hanya membawa pesan yang dipilih pelapor.
- Gunakan mutation() untuk penulisan pengguna agar status akun, versi sesi, read-only dan audit diperiksa dalam transaksi. Rate limit tidak boleh hanya di memori proses/frontend.
- Audit mencatat aktor/aksi/target/waktu, bukan password, cookie, body request, isi DM, atau error provider mentah.
- Kredensial nyata, kartu login, manifest akun, snapshot dan backup tidak masuk Git, bundle, laporan publik atau sesi percakapan lain. Semua fixture dummy.
- Media baru menggunakan authenticated delivery lewat proxy API. Jangan memberikan signed delivery URL kepada browser. Signature upload yang hanya menulis aset authenticated dengan ID acak server dan overwrite=false diperbolehkan; validasi server wajib sebelum publikasi. Jangan menghapus aset legacy berdasarkan URL saja.

## Verifikasi dan operasional

- Jalankan npm run lint, npm test, npm run build. Perubahan auth/policy/rules/migrasi memerlukan tes emulator; perubahan login/kartu/kontrol owner memerlukan Playwright yang relevan.
- Untuk perubahan entrypoint/build/cookie produksi, npm run test:deployment menguji build asli melalui HTTPS lokal dan Firestore emulator; tambahkan OpenSSL pada dependensi lingkungan tes.
- npm run test:rules memerlukan Java 21 dan FIRESTORE_EMULATOR_JAR; launcher hanya memakai demo-angkatanku. npm run test:e2e memakai akun dummy dan provider tiruan.
- Jangan menjalankan eksploitasi atau tes tulis pada data produksi. Perbaiki kegagalan dan laporkan hasil nyata, bukan estimasi.
- Migrasi default dry-run: target eksplisit, backup terenkripsi sebelum apply, rollback menolak perubahan bersamaan. Jangan bypass pemeriksaan konflik.
- Simpan checkpoint kode di branch GitHub. Bedakan pekerjaan selesai, tes belum dilakukan, dan hambatan akses; tes lokal tidak membuktikan produksi aman.
- Vercel adalah target hosting. Backend dan database tetap Firebase. Gunakan preview terisolasi sebelum cutover; jangan menghubungkan tes dummy ke database aktif.
- Chat menggunakan ID pesan berurutan waktu terbalik untuk query newest-first pada subkoleksi Firestore; pertahankan tes emulator pagination/idempotency/block. Poll dengan revision tidak perlu membaca seluruh history yang belum berubah.
- Nusa Memory hanya masuk retrieval setelah consent dan persetujuan, mengikuti audience/kelas. Jangan memberi AI akses DM atau kemampuan administrasi.
- API Vercel harus menerima IncomingMessage/ServerResponse native; konfigurasi yang belum lengkap mengembalikan JSON 503, tanpa fallback akun dummy atau secret.

- Import relatif backend/API menggunakan ekstensi .js yang dituju setelah kompilasi TypeScript. Tes native Node ESM pada tests/vercel.test.ts wajib dipertahankan; tsx/esbuild lokal dapat menyembunyikan ERR_MODULE_NOT_FOUND di Vercel.

- Ping Cloudinary dan daftar model Gemini bukan bukti hak CRUD atau generation. Verifikasi operasi yang benar-benar diperlukan memakai dummy terisolasi; bedakan scope provider, koneksi jaringan pengujian, serta kesalahan aplikasi. Jangan meminta ulang seluruh kredensial sebelum memeriksa akses yang sudah tersedia.
