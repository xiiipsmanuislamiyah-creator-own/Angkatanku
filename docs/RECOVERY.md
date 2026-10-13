# Pemulihan Tahap 1

Source asli dipulihkan dari ZIP sesudah salinan kerja sementara terhapus. Checkpoint branch codex/angkatanku-security-v2: 48c557d untuk fondasi sesi, 37b58a7 untuk integrasi kontrol akses. Commit berikutnya memuat perbaikan dan laporan akhir.

Pengujian telah diulang pada source yang dipulihkan; gunakan TEST_REPORT.md. Hasil sebelum pemulihan tidak menjadi bukti untuk revisi ini. Preview V2 sudah dibangun dan diperiksa melalui HTTPS; rilis fungsional dan migrasi produksi menunggu konfigurasi privat serta gate provider. Status terbaru ada pada DEPLOYMENT_STATUS.md.

Kredensial nyata, QR login, manifest akun, snapshot dan backup tidak masuk Git. Deploy deny-all rules harus bersama backend dan migrasi tervalidasi; lihat MIGRATION_ROLLBACK.md.
