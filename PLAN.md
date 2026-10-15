# AngkatanKU — V2, Tahap 1–5

Diperbarui 15 Oktober 2026. Branch `codex/angkatanku-security-v2`, draft PR #1. Master PRD dan instruksi owner mengizinkan Tahap 2–5 serta pembaruan UI; game/tools baru ditunda sesuai Master PRD. Produksi belum dimigrasikan.

## Implementasi dan verifikasi selesai

- [x] Source asli dan Master PRD dipelajari; Firebase tetap, tanpa Supabase/database baru.
- [x] Tahap 1: autentikasi username/QR server, scrypt, sesi HttpOnly, RBAC, reauth, brute-force limit transaksional, audit, deny-all Firestore Rules.
- [x] Tahap 2: Feed dengan composer/media/audience/identitas resmi, likes/bookmark/reply/report; Story 24 jam; album berurutan; dua chat global dan DM peserta saja, block/mute/read receipt/retry/pagination/pin/moderasi.
- [x] Tahap 3: Nusa AI dengan respons/sumber/cancel/retry, Memory consent dan review/version/correction; retrieval mengikuti audience. Alat/game lama dipertahankan.
- [x] Tahap 4: Home/direktori/profil/navigasi akademik dan UI komunitas diperbarui, foto/kartu/scanner/landing sinematik dipertahankan, route lazy loading, reduced motion, mobile 320–1440 px.
- [x] Tahap 5 lokal: TypeScript/build, 48 unit/API, 4 emulator (216 penolakan request langsung), 20 browser, 1 runtime HTTPS lokal lulus. Provider dummy, bukan bukti produksi.
- [x] Regresi pagination subkoleksi chat, respons AI, greeting/logout dan reauth moderasi Story diperbaiki dan diuji ulang.
- [x] Runtime Vercel same-origin serta signed direct upload Cloudinary dengan pemeriksaan server disiapkan; native handler gagal tertutup 503 ketika env belum tersedia.
- [x] Akses proyek Vercel berhasil diverifikasi.
- [x] Sampel performa lokal sebelum/sesudah; audit dependency 0 advisory.
- [x] Kompatibilitas model Nusa diperbaiki berdasarkan generation nyata; default memakai model yang berhasil menjawab. TypeScript, build, 48 unit/API dan runtime HTTPS lokal diuji ulang.

## Penyelesaian operasional

- [x] Checkpoint GitHub tersimpan; preview Vercel READY, halaman 200/API fail-closed 503 dan source tidak bocor. Login produksi belum dikonfigurasi.
- [ ] Lengkapi konfigurasi privat melalui handoff pemilik dan verifikasi provider.
- [ ] Tes provider nyata pada data dummy terisolasi: Cloudinary upload/stream/delete dan Gemini.
- [ ] Backup produksi/rules aktif; terapkan migrasi dengan UID yang sama dan kredensial baru, backend/frontend/rules bersama pada database bernama yang benar.
- [ ] Verifikasi inventaris kartu/media dan siklus rotasi kredensial/preset; batasi Maps key.
- [ ] Pasang retensi, GC terjadwal, budget/rate perimeter, verifikasi recovery dan uji beban/soak hosting.

Lihat [laporan V2](docs/V2_REPORT_ID.md), [pengujian](docs/TEST_REPORT.md), [deployment](docs/DEPLOYMENT_STATUS.md), [runbook Vercel](docs/DEPLOYMENT_VERCEL.md), dan [rollback](docs/MIGRATION_ROLLBACK.md). Status lokal selesai tidak berarti layanan live sudah aman.
