# Status preview Vercel

13 Oktober 2026. Source V2 tersimpan pada branch codex/angkatanku-security-v2 dan draft PR #1. Preview berhasil dibangun; ini belum pernyataan kesiapan produksi fungsional. Rincian konfigurasi serta diagnosis akses diberikan kepada pemilik secara privat.

## Preview yang diverifikasi

- Commit source: `c42f4a6fdc5591ce6d8e0f47522a1a839d4d9bf9`.
- Deployment: `dpl_JCPDH7iSbFyWZxqvE1EAvLJVsCFo` — READY, target preview.
- [Buka preview V2](https://angkatanku-k2tc0j7b2-xiiipsmanuislamiyah-creator-owns-projects.vercel.app/home). Membutuhkan login Vercel pemilik; proteksi tidak dinonaktifkan.

Pengujian memakai token OIDC proyek yang berumur pendek melalui mekanisme resmi Vercel, hanya dikirim ke origin preview; tidak membuat automation secret permanen atau menaruh token di URL/laporan.

| Request HTTPS | Hasil |
|---|---|
| /home | 200, HTML aplikasi |
| /api/auth/session | 503 JSON SERVICE_UNCONFIGURED, Cache-Control no-store; tidak crash |
| /server.ts, /dist/server/server.mjs, /.env | HTML SPA, bukan source/secret |
| Header respons | CSP, HSTS dan nosniff tersedia |

Preview awal build READY tetapi API 500 akibat import native ESM tanpa ekstensi. Perbaikan `.js` dan tes kompilasi Node asli sudah dipush, deployment ulang tidak lagi menghasilkan error tersebut.

Browser menuju preview terhalang trust CA proxy lingkungan; percobaan dengan pengecualian sertifikat khusus konteks tes kemudian timeout. Jadi tidak ada klaim browser end-to-end pada hosting nyata. Pemeriksaan HTTPS di atas berhasil dengan verifikasi sertifikat aktif pada klien HTTP. 20 tes browser lokal tetap lulus; login/provider nyata belum diuji pada preview tanpa env.
