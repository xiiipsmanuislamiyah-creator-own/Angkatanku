# Status penutupan Tahap 1 — deployment

Diperbarui 12 Oktober 2026. Source sudah di draft PR #1. Tahap 2 belum dimulai. Tidak ada perubahan pada database, rules, akun, API aktif, IAM atau layanan produksi.

## Diagnosis akses terbaru

Target Firebase/Google Cloud: gen-lang-client-0067546861 (nomor project 240078460225).

| Pemeriksaan read-only | Hasil |
|---|---|
| Resource Manager projects.get | HTTP 200, identitas project cocok dengan kredensial |
| Cloud Run services.list | HTTP 403, alasan SERVICE_DISABLED: Cloud Run Admin API belum aktif pada project ini |
| projects.testIamPermissions | HTTP 200; dari delapan izin yang diminta hanya resourcemanager.projects.get dikembalikan |
| Vercel target project + team scope | Pemeriksaan sebelumnya HTTP 403 forbidden |

Izin deployment yang diuji namun tidak dikembalikan: serviceusage.services.get, serviceusage.services.enable, run.services.list, run.services.get, run.services.create, run.services.update, iam.serviceAccounts.actAs. Ini bukan daftar seluruh hak Firebase yang dimiliki kredensial; audit Auth/Firestore read-only sebelumnya berhasil.

Diagnosis ini memperjelas laporan awal: respons Cloud Run 403 sendiri disebabkan API nonaktif. Pemeriksaan IAM terpisah kemudian mengonfirmasi bahwa identitas yang tersedia juga tidak memiliki izin aktivasi/deployment yang diuji. Tidak mencoba menaikkan privilege atau menulis IAM.

## Tindakan yang diperlukan dari pemilik

Sediakan akses deployment melalui identitas baru yang berizin pada project AngkatanKU, lewat integrasi atau secret environment privat. Jangan menambah hak pada key service account lama yang sudah terekspos. Identitas deployment harus dapat mengaktifkan layanan yang diperlukan, memasang layanan Cloud Run dan menggunakan runtime service account yang dituju. Izin build/artifact disesuaikan dengan metode deployment yang dipilih; jangan memakai Project Owner sebagai default runtime.

Setelah akses tersedia, agent melanjutkan konfigurasi runtime, pengujian provider dengan dummy, rotasi secret, backup, migrasi dan cutover yang terkoordinasi. Tidak meminta pemilik menjalankan tes manual. Aktivasi API saja tidak cukup selama izin deployment masih tidak tersedia.

## Verifikasi yang dapat dilakukan tanpa akses produksi

Tes runtime tambahan lulus 1/1, menjalankan hasil build server sebenarnya melalui HTTPS lokal, Firestore emulator dengan deny-all rules dan akun dummy. Browser menggunakan sertifikat uji lokal; ini membuktikan perilaku aplikasi dan cookie, bukan konfigurasi TLS/IAM/CDN hosting nyata. Detail hasil ada pada TEST_REPORT.md.

Rujukan API: [services.enable](https://docs.cloud.google.com/service-usage/docs/reference/rest/v1/services/enable), [testIamPermissions](https://docs.cloud.google.com/iam/docs/testing-permissions).
