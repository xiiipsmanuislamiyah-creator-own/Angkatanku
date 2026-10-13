# Runtime Vercel dan cutover

Vite di dist/client, Express melalui api/index.ts dan server/runtime.ts, API/SPA same-origin. Node 24, vercel.json mengatur rewrites/header. Tidak perlu Supabase atau Cloud Run.

## Environment privat server

| Variabel | Isi |
|---|---|
| FIREBASE_PROJECT_ID | gen-lang-client-0067546861 |
| FIREBASE_DATABASE_ID | ai-studio-vibrantpalettecr-286aa42c-694a-4352-9575-ef8e830e7d87 |
| FIREBASE_SERVICE_ACCOUNT_JSON | JSON key pengganti, project cocok, izin runtime minimum |
| APP_ORIGINS | Origin HTTPS final, dipisah koma; tanpa path/trailing slash |
| CLOUDINARY_CLOUD_NAME | Cloud project yang digunakan |
| CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET | Pasangan pengganti privat |
| GEMINI_API_KEY | Key pengganti untuk proyek ini |
| GEMINI_MODEL | Model tersedia; default gemini-2.5-flash |
| VITE_GOOGLE_MAPS_API_KEY | Opsional; key publik dengan restriction domain/API |

Jangan set FIRESTORE_EMULATOR_HOST atau fixture pada deployment nyata. Rahasia tidak memakai awalan VITE_. VERCEL_URL/VERCEL_BRANCH_URL milik platform otomatis masuk allowlist preview; VERCEL=1 mengaktifkan REST dan direct upload. Preview fungsional memakai data terisolasi; jangan memberikan secret produksi ke seluruh PR/branch tak dipercaya.

## Media

Browser meminta signature dengan sesi/CSRF/kuota, upload langsung ke Cloudinary, lalu completion. Server menetapkan ID acak, authenticated, overwrite=false dan format terbatas. Metadata provider dan file diperiksa di server sebelum media boleh dipublikasikan. Signature upload bukan izin read/delete.

Completion menolak ukuran/isi invalid, tetapi signature bukan batas byte sebelum provider menerima file; budget/account limits/perimeter tetap diperlukan. Pending asset tidak disajikan. GC menunggu signature kedaluwarsa, hanya prefix aplikasi yang tak direferensikan; orphan eligible setelah 24 jam. npm run media:gc tersedia, penjadwalan hosting belum dipasang. Proxy delivery memeriksa audience; signed delivery URL tidak diberikan ke browser. Streaming file besar, timeout dan egress Vercel nyata belum diuji.

## Cutover dan rollback

1. Isi env pengganti pada staging terisolasi; tes HTTPS/cookie/provider dengan dummy. Jangan mempromosikan preview dengan API 503.
2. Bekukan write lama, ekspor snapshot akun/data/rules; simpan backup terenkripsi di luar repo. Pastikan operator recovery tersedia.
3. Dry-run lalu apply manifest yang menjaga UID/profil. Password terekspos tidak diaktifkan; kartu baru diterbitkan privat setelah reset. Inventaris dan pencabutan CDN lama dilakukan terkontrol.
4. Aktifkan backend/frontend/rules bersama pada database yang tepat. Jangan pasang deny-all rules sendirian pada UI lama. Cabut secret/preset lama setelah pengganti tervalidasi.
5. Smoke otomatis deployment dengan dummy terbatas, pasang budget/retensi/GC/monitoring. Promosikan hanya setelah gate lulus.

Rollback Vercel mengembalikan kode, bukan database. Simpan deployment ID dan rules sebelumnya; ikuti MIGRATION_ROLLBACK.md untuk backup AES-GCM dan pemeriksaan konflik. Jangan menghidupkan password terekspos/rules terbuka untuk mengatasi downtime; gunakan maintenance dan recovery terkontrol.

Rujukan resmi: [batas function](https://vercel.com/docs/functions/limitations), [direct upload](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions), [Cloudinary presets](https://cloudinary.com/documentation/upload_presets), [headers](https://vercel.com/docs/headers/request-headers). Hasil yang benar-benar dijalankan ada di DEPLOYMENT_STATUS.md.
