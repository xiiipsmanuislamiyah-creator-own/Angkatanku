# Status deployment AngkatanKU V2

13 Oktober 2026. Branch codex/angkatanku-security-v2, draft PR #1. Kode V2 dan tes lokal tersedia. Preview baru sedang dipasang; hasil final ditambahkan setelah build Vercel selesai.

| Pemeriksaan | Hasil |
|---|---|
| Token Vercel baru → project | HTTP 200, identitas project AngkatanKU cocok |
| Git integration | Repo Angkatanku tersambung; productionBranch main |
| Runtime / env project | Node 24.x; env kosong saat diperiksa |
| Firebase project/database/rules release | HTTP 200; database bernama, bukan default |
| Izin rotasi service-account key Firebase | HTTP 403; membuat/menghapus/list key tidak tersedia |

Hambatan Vercel 403 dengan token lama sudah tidak berlaku. Cloud Run bukan prasyarat target hosting sekarang. Key Firebase/Cloudinary/Gemini yang lama pernah terekspos; source bersih tidak mencabut salinan yang beredar. Akses Vercel tidak memberikan hak rotasi pada provider lain.

**Tindakan pemilik yang diperlukan:** sediakan satu paket kredensial pengganti Firebase service account, Cloudinary dan Gemini melalui secret environment privat untuk proyek AngkatanKU. Jangan tempel ulang di chat atau link publik. Agent dapat memasang konfigurasi lainnya, tes dummy provider, backup/migrasi dan cutover; pemilik tidak diminta tes manual. Nama variabel pada DEPLOYMENT_VERCEL.md.

Belum ada migrasi akun/rules, penghapusan kartu legacy, atau cutover domain produksi. Preview tanpa secret menampilkan frontend sementara API sengaja memberi JSON 503; itu belum aplikasi produksi yang siap login.
