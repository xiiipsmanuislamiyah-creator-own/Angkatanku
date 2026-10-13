# Runbook migrasi, cutover dan rollback

**Belum dieksekusi pada produksi.** Panduan untuk agent/operator deployment, bukan permintaan agar pemilik menjalankan tes manual. Jangan memasang rules atau membatalkan akses provider lama sebelum backend pengganti siap.

## Target dan prasyarat

Gunakan project dan database target yang diberikan melalui handoff privat. Jangan mengasumsikan database (default); periksa apakah project memakai database bernama. `.env.example` memakai demo agar tidak menulis produksi tanpa konfigurasi eksplisit.

Runtime Vercel tersedia melalui api/index.ts. Backend dan API satu origin; signed direct upload menghindari batas request body function, sementara completion dan delivery tetap memeriksa file/audience di server. Lihat DEPLOYMENT_VERCEL.md untuk konfigurasi umum dan DEPLOYMENT_STATUS.md untuk hasil preview. Secret provider hanya di environment server, tanpa awalan VITE_ atau argumen command.

ADC/workload identity diutamakan bila didukung hosting. Untuk skrip migrasi yang perlu REST, gunakan FIRESTORE_PREFER_REST=true. Identitas runtime harus dibatasi ke database target; akses operator migrasi dan backup dikelola terpisah.

## Prinsip pemetaan

- Pertahankan UID Auth serta collection/ID profil existing; jangan mencocokkan identitas dengan tebakan nama.
- Siswa/guru dibedakan lewat profileKind, bukan role keamanan. Profil guru legacy dapat tetap berada di collection existing.
- Tetapkan tepat satu owner dari identitas yang telah diverifikasi melalui jalur privat; password bootstrap harus baru.
- Akun di luar manifest tidak dihapus atau diubah.
- Manifest, snapshot, password/kunci/QR dan rincian akun berada di luar Git. Validasi ulang terhadap snapshot terkini sebelum apply.

## Persiapan aman

1. Siapkan deployment staging terisolasi dengan data dummy. Uji cookie HTTPS, Origin/CSRF, Firebase Admin akses target staging, provider upload/download/delete authenticated, AI, QR dan tes otomatis. Jangan mengandalkan iframe pihak ketiga untuk satu-satunya jalur login.
2. Ambil backup database produksi serta rules aktif sebelum cutover; simpan terenkripsi, dengan kunci terpisah, akses terbatas. Backup skrip di bawah hanya mencakup dokumen migrasi, bukan backup seluruh database/media.
3. Siapkan manifest `{projectId,databaseId,accounts,issues:[]}`. Setiap account memiliki uid, username, displayName, profileKind, profileCollection, profileId, role owner/member, classRooms, dan opsional profile. Maksimal 100 akun per rencana, tepat satu owner, tanpa UID/username/ID profil duplikat. Tidak ada pencocokan samar.
4. Buat file password owner baru dan file kunci acak 32 byte di lokasi privat, mode 600. Jangan gunakan password dari source/kartu publik, memasukkannya ke argumen CLI, atau membagikan backup bersama kuncinya.
5. Set environment target/ADC dan MIGRATION_CHANGE_ID. Hapus emulator host untuk produksi, periksa origin HTTPS serta proxy yang dipercaya. Aplikasi menolak project yang saling bertentangan.

## Perintah migrasi

Contoh memakai variabel path yang telah disiapkan secara privat. Skrip berhenti jika target CLI/environment/manifest tidak sama. Ini contoh runbook, bukan bukti perintah produksi sudah dijalankan.

```sh
npm run migrate:security -- --project="$FIREBASE_PROJECT_ID" --database="$FIREBASE_DATABASE_ID" --manifest="$ANGKATANKU_MANIFEST"
```

Dry-run CLI menghitung akun yang akan diproses dan existing security_accounts; validasi rinci dan pemeriksaan konflik juga dilakukan saat prepare/apply. Hasil preflight read-only saat audit diperoleh lewat REST karena koneksi gRPC produksi tidak selesai di lingkungan ini.

```sh
npm run migrate:security -- --project="$FIREBASE_PROJECT_ID" --database="$FIREBASE_DATABASE_ID" --manifest="$ANGKATANKU_MANIFEST" --owner-password-file="$ANGKATANKU_OWNER_PASSWORD_FILE" --key="$ANGKATANKU_BACKUP_KEY" --backup="$ANGKATANKU_BACKUP_FILE" --apply
```

Backup AES-256-GCM dibuat dengan mode 600 dan flag wx (tidak menimpa backup lama) sebelum transaksi penulisan. Transaksi menolak jika sumber berubah. Profil dipertahankan, field rahasia dibuang, kepemilikan dipasang. Owner aktif dengan hash baru; anggota menjadi pending_reset tanpa hash password lama. Tidak ada kartu publik lama yang menjadi jalan belakang.

Owner mereset password sementara akun, mengaktifkan akses melalui pusat kontrol, lalu pengguna wajib mengganti password dan menerbitkan kartu privat. Siswa/guru tidak perlu mendaftar atau memberikan email/telepon. Siapkan distribusi privat sebelum cutover agar akun tidak tertinggal terkunci. Tidak ada reset massal yang mengirim password melalui API/log.

## Rules dan pergantian layanan

`firebase.json` dalam repo adalah konfigurasi default untuk emulator. Untuk produksi, siapkan konfigurasi tersendiri dengan satu entry database target:

```json
{
  "firestore": [
    {
      "database": "DATABASE_ID_TARGET",
      "rules": "firestore.rules"
    }
  ]
}
```

Deploy dengan project eksplisit dan `--config` yang menunjuk konfigurasi ini; selector rules adalah `--only firestore:rules`. Rules dipasang per database, bukan otomatis semua database project. Simpan revisi rules sebelumnya. Jalankan periode maintenance terkontrol agar tidak ada jendela tulis ke sistem lama selama migrasi dan pergantian frontend/backend/rules. Jangan meluncurkan frontend lama melawan deny-all rules.

Setelah akses baru lolos tes HTTPS, cabut sesi Firebase Auth legacy yang relevan, batasi provider sign-in yang tidak dipakai, nonaktifkan unsigned upload preset lama, dan rotasi secret terekspos. Jangan menghapus akun/profil/aset legacy tanpa pemetaan serta backup. Public CDN cards/media perlu dicabut/diganti secara terencana; mengganti audience Firestore saja tidak menutup URL yang sudah beredar.

## Rollback

```sh
npm run migrate:security -- --project="$FIREBASE_PROJECT_ID" --database="$FIREBASE_DATABASE_ID" --rollback="$ANGKATANKU_BACKUP_FILE" --key="$ANGKATANKU_BACKUP_KEY"
npm run migrate:security -- --project="$FIREBASE_PROJECT_ID" --database="$FIREBASE_DATABASE_ID" --rollback="$ANGKATANKU_BACKUP_FILE" --key="$ANGKATANKU_BACKUP_KEY" --apply
```

MIGRATION_CHANGE_ID tetap wajib. Backup harus sesuai project/database. Dry-run rollback memeriksa dekripsi dan target; konflik data diperiksa oleh apply transaksi. Rollback menolak bila dokumen telah berubah setelah migrasi, agar update pengguna tidak hilang. Jangan memaksa overwrite: lakukan rekonsiliasi dari backup privat.

Rollback teknis mengembalikan snapshot, yang bisa memuat field password lama. Jangan membuka kembali rules tidak aman atau kredensial terekspos untuk publik. Pilihan aman saat cutover gagal adalah maintenance/read-only, revisi backend yang kompatibel dan perbaikan terarah; bukan sekadar mengaktifkan seluruh sistem rentan lama. Revokasi key eksternal tidak dapat dibatalkan oleh rollback database.

## Media dan retensi

GC default dry-run, target eksplisit. Apply hanya sesudah review referensi dan change ID:

```sh
npm run media:gc -- --project="$FIREBASE_PROJECT_ID" --database="$FIREBASE_DATABASE_ID"
npm run media:gc -- --project="$FIREBASE_PROJECT_ID" --database="$FIREBASE_DATABASE_ID" --apply
```

Hanya aset prefix baru tanpa parent dan ditandai delete atau orphan >24 jam yang memenuhi syarat. Tombstone menjaga retry aman. Penghapusan Cloudinary nyata belum diuji, sehingga jangan menjalankan apply produksi sebelum tes dummy provider berhasil. Skrip GC belum dijadwalkan otomatis.

Tetapkan retensi sesi expired, rate-limit, audit, laporan dan backup pada operasional deployment. expiresAt pada record rate-limit belum menjadi konfigurasi TTL otomatis. Hindari pengumpulan IP mentah tambahan; rate key disimpan sebagai hash. Batasi akses backup, uji pemulihan berkala, dan pisahkan kunci dari data.

Rujukan: [Firebase CLI multiple databases](https://firebase.google.com/docs/cli), [deployment rules](https://firebase.google.com/docs/rules/manage-deploy), [ADC server](https://firebase.google.com/docs/admin/setup), [batas Vercel Functions](https://vercel.com/docs/functions/limitations).
