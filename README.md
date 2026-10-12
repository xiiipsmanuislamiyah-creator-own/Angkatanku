# AngkatanKU

Portal React/TypeScript yang dipertahankan dari source asli. Tahap 1 menambahkan autentikasi username/password dan QR berbasis server, kontrol akses, audit serta perlindungan data pada Express + Firestore. Supabase tidak diperlukan.

**Status:** implementasi dan tes lokal tersedia di branch codex/angkatanku-security-v2; produksi belum dimigrasikan/dideploy. Jangan memasang firestore.rules sendirian ke aplikasi lama.

## Pengembangan dan pengujian

Diverifikasi dengan Node 24, npm 11, Java 21 untuk emulator, dan Chromium untuk Playwright.

```sh
npm ci
npm run lint
npm test
npm run build
```

npm run test:rules menjalankan emulator terisolasi demo-angkatanku. Sediakan JAVA_BIN dan FIRESTORE_EMULATOR_JAR dari emulator resmi Firebase. npm run test:e2e menjalankan fixture server di port 4173; gunakan npx playwright install chromium atau set PLAYWRIGHT_CHROMIUM_EXECUTABLE ke Chromium kompatibel. Semua akun dummy dan provider Cloudinary/Gemini tiruan; tidak ada tes tulis produksi.

Untuk lokal, salin .env.example ke .env, sesuaikan origin/emulator, lalu npm run dev. Akun berasal dari seed/migrasi server; tidak ada password development universal atau signup publik. npm run preview hanya menyajikan build statis, bukan server aplikasi lengkap.

## Runtime

npm run build membersihkan seluruh dist dan menghasilkan frontend di dist/client serta server di dist/server. npm start menyajikan keduanya pada origin yang sama. Jangan menyajikan dist/server sebagai aset statis.

Set FIREBASE_PROJECT_ID, FIREBASE_DATABASE_ID, APP_ORIGINS dan ADC runtime. Hapus FIRESTORE_EMULATOR_HOST di produksi. Cloudinary/Gemini hanya memakai variabel server tanpa VITE_; browser hanya boleh menerima Maps key publik yang dibatasi domain/API. .env.example berisi nama variabel tanpa rahasia.

Produksi memerlukan layanan Node HTTPS dengan kapasitas upload/proxy yang sesuai. Pemilihan/pengujian hosting menunggu akses deployment. Konfigurasi proyek Vercel belum dapat dibaca; tidak ada deploy otomatis dari branch ini.

## Dokumentasi

- [Laporan keamanan Indonesia](docs/SECURITY_REPORT_ID.md)
- [Hasil dan batas pengujian](docs/TEST_REPORT.md)
- [Migrasi, cutover, rollback](docs/MIGRATION_ROLLBACK.md)
- [Daftar perubahan source](docs/CHANGED_FILES.md)
- [Spesifikasi aktual](security_spec.md)
- [Rencana dan gate produksi](PLAN.md)

Kredensial, QR login nyata, manifest akun dan backup tidak masuk Git. Rotasi secret terekspos tetap diperlukan meskipun telah dihapus dari kode terbaru.
