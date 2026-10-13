# Implementasi keamanan AngkatanKU V2

13 Oktober 2026. Dokumen publik ini menjelaskan kontrol pada source dan pengujian. Rincian akun, akses infrastruktur serta audit operasional disampaikan secara privat kepada pemilik. Ini bukan pernyataan bahwa produksi telah lolos seluruh gate.

## Kontrol yang diterapkan

| Area | Implementasi |
|---|---|
| Autentikasi | Username/QR diverifikasi server, password scrypt, tanpa kewajiban email/OTP/signup publik |
| Session | Cookie HttpOnly/Secure/Strict, CSRF/Origin, idle/absolute expiry, logout/revoke |
| RBAC | Owner/admin/member, permission/lingkup, reauth untuk aksi berisiko; siswa/guru atribut profil |
| Database | Client Firestore deny-all; Admin SDK selalu melalui policy API dan transaksi |
| Kepemilikan | Profil/konten/media sendiri, immutable identity dan audience; localStorage bukan otorisasi |
| DM | Peserta saja, tanpa owner override; laporan cuplikan pilihan, block pada jalur lama/baru |
| Media | Signed authenticated upload, validasi server, audience proxy, GC dengan tombstone |
| Nusa | Kuota, input terbatas, Memory consent/review dan retrieval berizin, tanpa DM/alat admin |
| Operasional | Audit tanpa secret/body DM, migrasi UID, backup AES-GCM dan rollback dengan konflik |

Source existing diadaptasi secara modular. Kartu/scanner/foto/landing tetap dipertahankan; Supabase tidak diperlukan. Identitas resmi diperiksa backend, dan UI hanya mencerminkan hak yang diberikan server. API tidak pernah mengembalikan password/hash atau membuat akun dummy pada deployment nyata.

## Verifikasi

TypeScript/build lulus, 48 unit/API + 4 emulator + 20 browser + 1 runtime HTTPS lokal = 73 tes lulus. Termasuk 216 percobaan akses Firestore yang ditolak. Dependency audit 0 advisory pada lockfile yang diperiksa. Native ESM import diuji lewat kompilasi NodeNext dan Node tanpa tsx.

Lihat TEST_REPORT.md untuk cakupan sebenarnya, CHANGED_FILES.md untuk file, security_spec.md untuk kontrak API, dan MIGRATION_ROLLBACK.md untuk urutan cutover. Provider fixture bukan bukti layanan produksi. Kamera fisik, cross-browser, beban/soak dan provider nyata belum diklaim lulus. Tidak ada klaim aman 100%.

## Gate rilis

Preview mendukung pemeriksaan hasil build; rilis fungsional membutuhkan konfigurasi privat, tes provider, backup/migrasi terkoordinasi dan verifikasi deployment. Jangan memasang rules baru sendirian pada frontend lama. Temuan serta status operasional rinci diserahkan kepada pemilik melalui laporan privat.
