# AngkatanKU — Tahap 1

Diperbarui 12 Oktober 2026. Implementasi dan verifikasi lokal selesai; cutover produksi belum dijalankan. Branch `codex/angkatanku-security-v2`.

## Selesai

- [x] Pulihkan source ZIP dan audit React/TypeScript, auth, rules, API, Cloudinary, Gemini, profil, admin, serta Feed.
- [x] Server authentication, scrypt, sesi HttpOnly, CSRF, rate limit transaksional, logout/reset/pencabutan sesi.
- [x] Pertahankan login manual, QR, scanner, desain kartu; tambahkan penerbitan kartu login privat setelah reauth.
- [x] Owner/admin/member/pengunjung, permission dan lingkup kelas, kepemilikan, audience, perlindungan owner.
- [x] Pusat kontrol pada admin panel: akun, izin, suspend/ban, konfigurasi, moderasi, laporan terpilih dan audit dengan pagination.
- [x] Hapus ketergantungan runtime Supabase, password frontend dan fallback tulis palsu.
- [x] Tutup akses Firestore langsung; amankan media/upload/delete dan AI.
- [x] Migrasi mempertahankan UID/ID profil, backup AES-GCM, rollback dengan pemeriksaan konflik, GC media dengan tombstone.
- [x] Pemetaan read-only 56 akun source; 18 akun Auth lain tidak diubah. Periksa dua contoh kartu CDN, bukan seluruh inventaris.
- [x] TypeScript/build, 33 tes unit/API, 3 emulator, 10 browser, audit dependency dan pemeriksaan bundle.
- [x] Dokumentasi hasil, keterbatasan dan runbook cutover. Tidak ada operasi tulis produksi.

## Gate produksi belum selesai

- [ ] Akses deployment Node/Cloud Run proyek. Vercel menolak target project (403), termasuk query team; service account Firebase menolak inventaris Cloud Run (403).
- [ ] Rotasi secret terekspos, pembatasan key publik, pencabutan akses lama setelah cutover berhasil.
- [ ] Verifikasi provider Cloudinary upload/authenticated delivery/delete serta Gemini nyata dengan dummy pada lingkungan terisolasi.
- [ ] Backup produksi/rules aktif; migrasi dan penerbitan ulang kredensial/kartu privat. Password terekspos tidak diaktifkan kembali.
- [ ] Pasang backend, frontend dan rules pada database bernama yang tepat; tes otomatis deployment HTTPS.
- [ ] Verifikasi IAM, ingress/proxy, retensi, budget dan recovery operasional di hosting nyata.

## Batas tahap berikutnya

Tahap 2 untuk pengembangan Feed/Story/Global Chat lebih lanjut sesudah gate keamanan ditutup. Tahap 3 untuk AI/game/tools, Tahap 4 penataan UI/UX dan organisasi proyek, Tahap 5 pengujian menyeluruh. Permission dan konfigurasi Global Chat sudah disiapkan; layanan chat penuh dan slow mode runtime belum dibuat.

Lihat [laporan](docs/SECURITY_REPORT_ID.md), [pengujian](docs/TEST_REPORT.md), dan [migrasi/rollback](docs/MIGRATION_ROLLBACK.md). Rencana ini menggantikan dokumen lama yang menganggap password development/frontend aman.
