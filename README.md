# AngkatanKU

Portal React/TypeScript yang dipertahankan dari source asli. V2 mempertahankan fondasi Tahap 1: autentikasi username/password dan QR berbasis server, kontrol akses, audit serta perlindungan data pada Express + Firestore. Supabase tidak diperlukan.

**Status:** fitur V2 dan 73 tes lokal tersedia di branch codex/angkatanku-security-v2; cutover produksi belum dilakukan. Lihat docs/DEPLOYMENT_STATUS.md untuk hasil preview terbaru. Jangan memasang firestore.rules sendirian ke aplikasi lama.

## Pengembangan dan pengujian

Diverifikasi dengan Node 24, npm 11, Java 21 untuk emulator, dan Chromium untuk Playwright.

```sh
npm ci
npm run lint
npm test
npm run build
```

npm run test:rules menjalankan emulator terisolasi demo-angkatanku. Sediakan JAVA_BIN dan FIRESTORE_EMULATOR_JAR dari emulator resmi Firebase. npm run test:e2e menjalankan fixture server di port 4173; gunakan npx playwright install chromium atau set PLAYWRIGHT_CHROMIUM_EXECUTABLE ke Chromium kompatibel. Semua akun dummy dan provider Cloudinary/Gemini tiruan; tidak ada tes tulis produksi.

npm run test:deployment membangun aplikasi lalu menjalankan entrypoint produksi melalui HTTPS lokal dan emulator dengan rules aktual. Memerlukan Java/emulator, Chromium, dan OpenSSL; tidak memerlukan key provider produksi.

Untuk lokal, salin .env.example ke .env, sesuaikan origin/emulator, lalu npm run dev. Akun berasal dari seed/migrasi server; tidak ada password development universal atau signup publik. npm run preview hanya menyajikan build statis, bukan server aplikasi lengkap.

## Runtime

npm run build membersihkan seluruh dist dan menghasilkan frontend di dist/client serta server di dist/server. npm start menyajikan keduanya pada origin yang sama. Jangan menyajikan dist/server sebagai aset statis.

Set FIREBASE_PROJECT_ID, FIREBASE_DATABASE_ID, APP_ORIGINS dan ADC runtime. Hapus FIRESTORE_EMULATOR_HOST di produksi. Cloudinary/Gemini hanya memakai variabel server tanpa VITE_; browser hanya boleh menerima Maps key publik yang dibatasi domain/API. .env.example berisi nama variabel tanpa rahasia.

Vercel adalah target hosting: api/index.ts menjalankan Express, dist/client menyajikan SPA, dan vercel.json mengatur rewrite/header. Signed direct upload Cloudinary menghindari batas request body function; hasil tetap diverifikasi server. Cloud Run tidak wajib. Gunakan kredensial pengganti dalam environment privat; lihat docs/DEPLOYMENT_VERCEL.md.

V2 menambahkan Feed/Story/album, dua chat global dan DM berizin, Nusa Memory dengan consent/review serta UI yang lebih rapi. Game/tools baru ditunda sesuai Master PRD; kartu, scanner, foto asli dan landing sinematik tetap dipertahankan.

## Dokumentasi

- [Laporan V2 dan status setiap tahap](docs/V2_REPORT_ID.md)
- [Runtime Vercel dan cutover](docs/DEPLOYMENT_VERCEL.md)
- [Pengukuran performa lokal](docs/PERFORMANCE.md)

- [Laporan keamanan Indonesia](docs/SECURITY_REPORT_ID.md)
- [Hasil dan batas pengujian](docs/TEST_REPORT.md)
- [Migrasi, cutover, rollback](docs/MIGRATION_ROLLBACK.md)
- [Daftar perubahan source](docs/CHANGED_FILES.md)
- [Spesifikasi aktual](security_spec.md)
- [Rencana dan gate produksi](PLAN.md)
- [Diagnosis akses deployment terbaru](docs/DEPLOYMENT_STATUS.md)

Kredensial, QR login nyata, manifest akun dan backup tidak masuk Git. Rotasi secret terekspos tetap diperlukan meskipun telah dihapus dari kode terbaru.
