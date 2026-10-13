# Performa UI — sampel lokal V2

13 Oktober 2026. Build produksi lokal, Chromium guest, context/cache baru, reduced motion, aset eksternal diblokir, viewport 390/1280 × 900. Database/provider dummy. Satu sampel per kondisi, bukan benchmark statistik atau Core Web Vitals lapangan.

| Halaman | Lebar | JS sebelum (byte decoded) | JS sesudah | Perubahan | LCP sebelum/sesudah (ms) | DOM sebelum/sesudah |
|---|---:|---:|---:|---:|---:|---:|
| home | 390 | 1,289,728 | 514,160 | -60.1% | 952 / 380 | 889 / 279 |
| feed | 390 | 1,289,728 | 528,575 | -59.0% | 412 / 192 | 324 / 241 |
| guru | 390 | 1,289,728 | 514,808 | -60.1% | 104 / 220 | 569 / 324 |
| nusa-ai | 390 | 1,289,728 | 503,676 | -60.9% | 416 / 128 | 383 / 216 |
| home | 1280 | 1,289,728 | 514,160 | -60.1% | 928 / 324 | 889 / 279 |
| feed | 1280 | 1,289,728 | 528,575 | -59.0% | 412 / 188 | 324 / 241 |
| guru | 1280 | 1,289,728 | 514,808 | -60.1% | 92 / 144 | 569 / 324 |
| nusa-ai | 1280 | 1,289,728 | 503,676 | -60.9% | 432 / 244 | 383 / 216 |

Semua sampel tanpa overflow dokumen. Lazy loading menurunkan JS awal sekitar 59–61%; bundle peta/admin/scanner hanya dimuat sesuai halaman. LCP guru meningkat pada sampel ini: tidak semua halaman diklaim lebih cepat. Aset/provider nyata, jaringan seluler, CPU ponsel dan konten panjang belum diukur.

Reproduksi: npm run build, lalu node --import tsx scripts/measure-ui.ts; set PLAYWRIGHT_CHROMIUM_EXECUTABLE bila diperlukan. Skrip memakai fixture lokal. Chat revision polling menghindari pembacaan ulang history yang belum berubah; Mading mobile memakai daftar ringan dengan peta tetap tersedia.
