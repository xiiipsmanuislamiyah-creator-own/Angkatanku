# Laporan akhir implementasi Tahap 1 — AngkatanKU

12 Oktober 2026 · Branch codex/angkatanku-security-v2.

**Implementasi dan pengujian lokal selesai. Produksi belum diubah. Kriteria keamanan menyeluruh belum terpenuhi karena cutover, rotasi kredensial dan verifikasi provider/hosting masih terbuka.** Tidak ada klaim aman 100%.

## 1. Kerentanan yang ditemukan

Temuan berikut berasal dari source ZIP, bukan eksploitasi destruktif produksi. Tingkat keparahan adalah penilaian audit, bukan skor CVSS formal.

| Temuan | Dampak | Perbaikan di branch | Status produksi |
|---|---|---|---|
| Password 56 akun siswa/guru di frontend | Kritis: pengambilalihan akun dari bundle/source/kartu | Hapus dari runtime; hash server, reset wajib | Password lama belum dirotasi |
| Role/admin bergantung frontend/email dan rules yang memungkinkan self-admin | Kritis: eskalasi privilege | RBAC server, owner bootstrap terlindungi, rules deny-all | Rules baru belum dipasang |
| Akses baca/tulis profil/config/akademik terlalu luas | Tinggi: perubahan data lintas pengguna | Ownership, allowlist, scope, transaksi | Menunggu cutover |
| Admin dapat membaca semua DM melalui rules lama | Tinggi: privasi percakapan | Peserta saja; laporan snapshot terpilih | Menunggu rules/backend baru |
| Upload unsigned dan endpoint delete tanpa autentikasi | Tinggi: penyalahgunaan media/penghapusan | API terautentikasi, validasi file, authenticated delivery dan GC | Provider/preset lama belum dimigrasi |
| Endpoint AI tanpa kontrol memadai | Tinggi: penyalahgunaan biaya/data | Auth, CSRF, kuota, input/context terbatas | Menunggu deployment |
| Session/role palsu dan fallback tulis localStorage | Tinggi: UI mengklaim akses/berhasil tanpa backend | Sesi cookie server; write harus mendapat hasil API | Menunggu deployment |
| Rahasia provider/service account dibagikan melalui media publik/chat | Tinggi: akses di luar aplikasi | Dikeluarkan dari repo/bundle; rencana rotasi | Rotasi belum dilakukan |
| Dependency image processing lama dengan advisory tinggi | Tinggi pada dependency saat audit | Update sharp/firebase-admin/dependency terkait | npm audit saat ini 0 |
| Error/input/URL tidak dibatasi serta host interpolation | Risiko kebocoran/injection | Respons generik, schema, header, origin, CSP; hapus interpolasi host | Menunggu deployment |

Supabase adalah rancangan lama. Integrasi aktif dipindahkan ke API Firebase sesuai arahan; contoh RLS terbuka, konfigurasi Supabase frontend dan fallback data palsu tidak dipertahankan. Tidak ada klaim audit RLS database Supabase live karena database tersebut tidak digunakan/diperiksa.

## 2. File yang diubah

Daftar lengkap per file dan perbandingan terhadap ZIP ada pada [CHANGED_FILES.md](CHANGED_FILES.md). Kelompok utama:

- Backend: server.ts; server/auth.ts, security.ts, store.ts, policy.ts, app.ts, media.ts, media-gc.ts, migration.ts.
- Rules/config/build: firestore.rules, firebase.json, vite.config.ts, package.json/lockfile, .env.example, .gitignore.
- Autentikasi/data: AuthContext.tsx, auth-helpers.ts, api.ts, data.ts, firebase.ts, qr.ts, cloudinary.ts, supabaseClient.ts, main.tsx.
- UI existing/adaptasi: AdminPanel, SecurityControlCenter, AccountSecurity, Login, WelcomeModal, IDCardCanvas, profil/kartu, Inbox, Feed dan layar lain yang semula mengakses Firestore langsung.
- Operasional/tes: scripts/migrate-security.ts, media-gc.ts, test-emulator.ts, scripts build/start, tests API/emulator/browser.
- Dokumen: AGENTS.md, PLAN.md, security_spec.md, README dan docs/.

Source asli dipertahankan sebagai dasar; tidak membangun ulang UI. Penggantian adapter data diperlukan karena seluruh akses Firestore klien ditutup. Kredensial source tidak disertakan pada repo hasil.

## 3. Perbaikan yang berhasil

Login manual dan QR memakai verifikasi server yang sama. Password dihash scrypt; cookie HttpOnly/Secure/Strict, CSRF, rate limit transaksional, idle/absolute expiry, logout dan pencabutan sesi diterapkan. Role dari localStorage/request tidak dipercaya. Owner hanya ditetapkan oleh proses server terlindungi; admin tidak dapat menaikkan role sendiri atau mengambil alih owner.

Review implementasi juga menemukan dan memperbaiki perubahan jenis profil target oleh admin guru, pengambilalihan ownership kosong saat moderasi, dan kemampuan penulis membatalkan hidden/comment lock. Tiga tes regresi membuktikan kegagalan sebelum perbaikan dan lulus setelahnya.

Pusat kontrol ditambahkan pada panel existing untuk akun/permission/lingkup, suspend/ban, reset, konfigurasi, audience/hidden/delete, laporan dan audit. Tindakan berisiko memerlukan konfirmasi password dan dicatat. Siswa/guru tetap jenis profil, tanpa kewajiban email/OTP/nomor telepon. Tidak ada signup publik atau backdoor DM.

Upload/delete dilindungi, media baru memakai authenticated delivery lewat server, dan AI mendapat batas input/kuota/konteks tanpa DM. Konfigurasi Global Chat/Story/Feed hanya disiapkan sesuai fondasi Tahap 1; fitur sosial penuh belum dibangun.

Migrasi mempertahankan UID dan ID profil. Pemetaan read-only menemukan 74 akun Auth: 56 sesuai source (36 siswa/20 guru), 39 profil sudah ada, 17 profil direncanakan dibuat; 18 akun Auth lainnya tidak diubah. Dua QR CDN berhasil dibaca. Username kartu owner cocok unik, tetapi password berbeda dari ZIP; contoh kartu guru cocok. Password QR/source yang terekspos tidak akan diaktifkan sebagai kredensial baru. Desain dan parser kartu tetap, sementara kartu privat diterbitkan ulang setelah reset.

Backup terenkripsi dan rollback dengan pemeriksaan konflik telah diuji pada emulator. Tidak ada migrasi, penghapusan akun, perubahan rules, upload/delete provider atau penulisan database produksi selama pekerjaan ini.

## 4. Pengujian yang dijalankan

| Gate | Hasil |
|---|---|
| TypeScript | Lulus |
| Unit/API/kompatibilitas/migrasi/media | 36/36 lulus |
| Firestore emulator | 3/3 lulus, termasuk 108 penolakan request langsung |
| Build frontend/server | Lulus |
| Browser Chromium | 10/10 lulus, 0 flaky/skipped |
| Dependency audit | 0 advisory pada lockfile yang diperiksa |
| Scan 60 nilai rahasia dikenal | 0 kecocokan dalam source/build yang diperiksa |

Tes mencakup login salah/benar, QR/manual, session/logout/revoke, brute force, role escalation, akses lintas profil, guest private access, direct Firestore/API, forged localStorage, file validation, ownership/audience, DM reports, AI quotas, migrasi/rollback dan regresi layar existing. Kartu PNG unduhan didekode kembali secara otomatis. Mobile/desktop diuji pada lebar 320/390/768/1280 px.

Lihat [TEST_REPORT.md](TEST_REPORT.md) untuk cakupan, kegagalan yang diperbaiki dan batas bukti. Tidak meminta pemilik menjalankan tes manual.

## 5. Risiko tersisa dan hambatan

**Produksi masih berisiko:** kontrol baru belum terpasang dan secret/kartu publik lama belum dicabut. Menghapus nilai dari kode terbaru tidak menghapus Git history, link publik, cache atau salinan yang sudah beredar. Public Maps key yang ditemukan pada checkpoint sebelumnya sudah dihapus dari source terbaru, tetapi tetap perlu restriction/rotasi. Pemindaian nilai dikenal bukan pemindaian seluruh jenis secret atau seluruh history.

Akses Vercel menolak pembacaan target project dengan 403, termasuk team scope. Service account Firebase dapat membaca data untuk audit, tetapi tidak dapat melakukan inventaris Cloud Run (403). Hak deployment aktual belum tersedia. Tidak menjalankan deploy/rules terpisah yang dapat memutus aplikasi lama.

Cloudinary upload/private delivery/delete nyata dan Gemini generation nyata belum diuji. Provider pada tes bersifat dummy. URL CDN lama tetap publik meskipun audience metadata berubah. Inventaris seluruh kartu/media belum diverifikasi; hanya dua contoh diperiksa. Migrasi produksi belum berjalan. Kamera fisik, Safari/Firefox, perangkat nyata, beban besar, aksesibilitas menyeluruh, ingress/IAM/budget/retensi dan login embedded AI Studio belum diverifikasi.

Audit log/backup terlindungi terhadap API klien, tetapi admin infrastruktur yang mempunyai IAM tetap berada dalam batas kepercayaan. Penghapusan/retensi terjadwal, disaster recovery produksi dan batas volumetrik perlu dipasang pada lingkungan deployment. Tidak ada jaminan bahwa seluruh kerentanan tinggi sudah hilang dari layanan live.

## 6. Kesiapan Tahap 2

Fondasi kode Tahap 1 siap ditinjau dan diuji di staging; **belum siap dinyatakan selesai di produksi atau melanjutkan peluncuran Tahap 2**. Gate berikutnya: akses deployment proyek yang benar → konfigurasi/rotasi secret → tes provider staging → backup dan migrasi terkontrol → cutover backend/frontend/rules → tes otomatis HTTPS.

Satu tindakan pemilik yang saat ini diperlukan adalah menyediakan akses deployment yang benar ke layanan AngkatanKU (AI Studio/Cloud Run atau hosting yang dipilih) melalui integrasi atau secret environment privat. Token Vercel yang ada belum mempunyai akses ke project target. Tidak perlu token Supabase, data sensitif tambahan, atau pengujian manual dari pemilik. Runbook teknis sudah disiapkan agar pelaksanaannya dapat dilanjutkan oleh agent setelah akses tersebut tersedia.
