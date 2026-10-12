# Hasil pengujian Tahap 1

Tanggal: 12 Oktober 2026. Hasil diulang pada source yang dipulihkan dan diperbaiki. Tidak ada pengujian tulis pada data produksi.

## Hasil yang benar-benar dijalankan

| Pemeriksaan | Hasil | Lingkungan/cakupan |
|---|---|---|
| npm run lint | Lulus, exit 0 | TypeScript noEmit |
| npm test | 36/36 lulus | API Express nyata di localhost; MemoryStore transaksional; provider dummy |
| npm run test:rules | 3/3 lulus | Emulator Firestore resmi 1.22.0, Java 21, project demo-angkatanku |
| npm run build | Lulus, exit 0 | Vite 6.4.3 + esbuild, 2.188 modul |
| npm run test:e2e | 10/10 lulus; 0 flaky/skipped | Chromium headless, Playwright 1.56.1, build aktual |
| npm run test:deployment | 1/1 lulus | Entrypoint produksi asli, HTTPS lokal, Chromium, Firestore emulator + deny-all rules |
| npm audit --json | 0 advisory | Critical/high/moderate/low/info semuanya 0 pada lockfile saat pemeriksaan |
| Scan nilai rahasia dikenal | 0 kecocokan | 60 nilai dikenal terhadap 131 file source/dokumen/build saat scan; bukan seluruh sejarah Git |

Run browser terakhir mulai 2026-10-12T03:41:13.380Z, durasi sekitar 95 detik. Detail mentah browser/screenshot disimpan lokal di test-results dan tidak dimasukkan ke Git. Rangkaian akhir dijalankan berurutan lint → unit/API → build → browser, dengan emulator pada port terpisah.

## Cakupan API/unit

- Login benar/salah, cookie nyata, tidak memantulkan password, role palsu dalam request diabaikan.
- Brute force paralel: 12 percobaan pada satu username menghasilkan 5 penolakan kredensial dan 7 rate-limit; pemalsuan X-Forwarded-For tidak melewati kuota IP.
- CSRF/Origin ditolak, session expired/idle/logout/revoke, perubahan password mencabut semua sesi, revoke sesi pengguna lain ditolak.
- Member ke endpoint owner, admin menaikkan role sendiri, takeover profil owner, perubahan profil orang lain, perubahan identitas resmi dan permission di luar lingkup ditolak.
- Jenis profil target tetap siswa ketika diedit admin guru; moderasi tidak mengambil alih kepemilikan konten legacy yang belum terpetakan; penulis tidak dapat membatalkan hidden/comment lock dari moderator.
- Owner membuat akun member saja, password sementara membatasi penulisan, perubahan izin mencabut sesi, pagination audit/laporan tanpa record berulang.
- Audience publik/anggota/restricted, legacy tanpa owner, private data projection, timestamp, nested secret removal, expiry Story dan agregat view.
- Owner tidak dapat membaca DM orang lain; peserta dapat melaporkan snapshot pesan tertentu secara transparan.
- Upload/delete/AI tanpa sesi tidak memanggil provider. SVG, MIME tidak cocok, HTML tersamar, PNG rusak, ukuran dan resolusi berlebih ditolak.
- Media proxy mengikuti audience parent; penautan media milik orang lain ditolak; GC menolak media masih terpakai/legacy; kegagalan provider mempertahankan tombstone yang bisa dicoba ulang.
- AI input/history/quota/feature gate dan konteks tanpa DM; komentar/like, guest write dan read-only.
- Injection berupa prototype key dan URL berbahaya ditolak. Teks markup disimpan sebagai teks; source diperiksa tanpa sink dangerouslySetInnerHTML/eval. Ini bukan fuzzing XSS universal.
- Payload lama jadwal/prestasi/kartu/profil guru, ownership legacy berbasis UID pasti, format QR JSON/label/pipa.
- Migrasi menjaga UID/ID profil, menonaktifkan password anggota yang terekspos, backup terenkripsi, deteksi key salah/tampering dan konflik sebelum apply/rollback.

## Emulator

Tes pertama menjalankan **108 operasi langsung**: 3 konteks (tanpa login/member/klaim owner palsu) × 9 koleksi × get/list/set/delete. Seluruhnya ditolak Rules. Tes kedua menjalankan rate limit paralel dan revoke sesi melalui transaksi Firestore nyata. Tes ketiga menjalankan apply migrasi dan rollback terenkripsi dengan ID dokumen serta timestamp yang sama dengan nilai sebelum migrasi.

Satu ekspektasi timestamp awal salah karena membandingkan presisi input dengan nilai yang sudah disimpan Firestore. Tes diperbaiki agar membandingkan nilai persisted sebelum/sesudah rollback, lalu ketiga tes diulang dan lulus. Kesalahan implementasi ownership yang sempat menyebabkan 500 juga diperbaiki dan kasusnya lulus ulang.

Tiga kasus tambahan di atas mula-mula direproduksi dengan tes yang gagal pada implementasi, kemudian diperbaiki dan tes yang sama lulus. Seluruh suite unit/API dan emulator juga diulang sesudah perbaikan tersebut.

## Browser

1. Login manual salah/benar, reload, pemalsuan localStorage role, penolakan admin dan logout.
2. Upload gambar QR dummy, animasi verifikasi terlihat, login melalui backend.
3. QR SVG ditolak dan pengunjung tidak dapat membuka panel owner.
4. Owner men-suspend akun dummy melalui dialog reauth; audit tercatat dan login target ditolak.
5. Sepuluh layar lama terbuka tanpa JavaScript exception: home, profil, anggota, guru, jadwal, prestasi, galeri, feed, inbox, Nusa AI.
6–9. Layar login pada lebar 320, 390, 768, 1280 px tanpa overflow dokumen; screenshot diperiksa untuk mobile/desktop.
10. Kartu login privat diunduh, QR pada PNG hasil canvas didekode dan cocok dengan fixture; pratinjau hilang, password berubah, sesi lama hilang, login password baru berhasil.

Browser memblokir jaringan eksternal dan menggunakan database/provider fixture. Tes render layar bukan pembuktian seluruh fungsi bisnis setiap layar. Kamera fisik, Safari/Firefox, perangkat nyata, embedding AI Studio dengan cookie pihak ketiga, aksesibilitas menyeluruh, load/soak dan performa produksi belum diuji.

## Tambahan verifikasi entrypoint produksi

Pada kelanjutan 12 Oktober 2026, npm run test:deployment membangun aplikasi dan menjalankan scripts/start-production.mjs melalui proxy HTTPS lokal dengan sertifikat dummy. Firestore emulator memakai rules repo dan akun dummy. Test lulus; setelah rules dipasang eksplisit, tes runtime dan ketiga tes emulator diulang serta lulus. TypeScript juga lulus. Tidak ada perubahan kode aplikasi sejak 49 tes sebelumnya; tambahan ini menjadikan total **50 tes**.

Browser memverifikasi login lewat UI build asli, cookie __Host-angkatan_session Secure/HttpOnly/SameSite=Strict yang tidak terbaca oleh document.cookie, sesi tetap ada setelah reload, write profil ke Firestore melalui API, member ditolak pada API owner, Origin asing ditolak, logout menghapus sesi/cookie. Request ke /.env, /dist/server/server.mjs dan /server.ts hanya menerima halaman SPA, bukan isi file server/secret. Launcher emulator kini menganggap proses tes yang berakhir karena sinyal sebagai gagal, bukan lulus.

Sertifikat/port/database tes lokal tidak membuktikan konfigurasi TLS, ingress, IAM atau provider deployment nyata. Pengujian provider eksternal tetap terpisah.

## Read-only eksternal dan yang belum diverifikasi

Firebase Auth dan Firestore REST berhasil dibaca untuk pemetaan agregat; dua kartu CDN berhasil diambil/didekode. Tidak melakukan login akun nyata atau perubahan data. Firebase Admin gRPC ke produksi tidak menyelesaikan pembacaan di lingkungan ini; audit menggunakan REST. CLI migrasi produksi tidak diklaim sudah berjalan.

Vercel project lookup, termasuk team slug, mendapat HTTP 403; Cloud Run services list mendapat 403 dengan alasan SERVICE_DISABLED. Resource Manager projects.get dan testIamPermissions berikutnya berhasil (200), tetapi dari delapan izin yang diminta hanya resourcemanager.projects.get dikembalikan; izin aktivasi API/deployment tidak tersedia. Lihat DEPLOYMENT_STATUS.md. Backend HTTPS pada hosting nyata, IAM deployment, Cloudinary upload/private delivery/delete nyata, Gemini generation nyata, rotasi key, backup produksi dan cutover belum terverifikasi. Provider dummy tidak membuktikan konfigurasi provider produksi.

Peringatan build yang tersisa hanya import data.ts yang sekaligus statis/dinamis (tidak menghasilkan chunk terpisah). Tidak ada error TypeScript atau build. Hasil dependency audit bersifat pada saat dijalankan, bukan jaminan tidak ada kerentanan baru.
