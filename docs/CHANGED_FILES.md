# Daftar perubahan terhadap source ZIP

Daftar ini membandingkan file runtime, konfigurasi, tes dan dokumentasi yang disimpan di branch dengan ZIP asli. Bukan perbandingan terhadap main GitHub yang semula hanya README. Asset/UI yang tidak berubah tetap dipertahankan.

| File | Status |
|---|---|
| `.env.example` | Diubah |
| `.gitignore` | Diubah |
| `AGENTS.md` | Diubah |
| `PLAN.md` | Diubah |
| `README.md` | Diubah |
| `docs/CHANGED_FILES.md` | Baru |
| `docs/DEPLOYMENT_STATUS.md` | Baru |
| `docs/MIGRATION_ROLLBACK.md` | Baru |
| `docs/RECOVERY.md` | Baru |
| `docs/SECURITY_REPORT_ID.md` | Baru |
| `docs/TEST_REPORT.md` | Baru |
| `firebase.json` | Baru |
| `firestore.rules` | Diubah |
| `package-lock.json` | Diubah |
| `package.json` | Diubah |
| `playwright.config.ts` | Baru |
| `scripts/clean-build.mjs` | Baru |
| `scripts/media-gc.ts` | Baru |
| `scripts/migrate-security.ts` | Baru |
| `scripts/start-production.mjs` | Baru |
| `scripts/test-emulator.ts` | Baru |
| `security_spec.md` | Diubah |
| `server.ts` | Diubah |
| `server/app.ts` | Baru |
| `server/auth.ts` | Baru |
| `server/media-gc.ts` | Baru |
| `server/media.ts` | Baru |
| `server/migration.ts` | Baru |
| `server/policy.ts` | Baru |
| `server/security.ts` | Baru |
| `server/store.ts` | Baru |
| `src/App.tsx` | Diubah |
| `src/SystemNotification.tsx` | Diubah |
| `src/components/AccountSecurity.tsx` | Baru |
| `src/components/AdminModerationTab.tsx` | Diubah |
| `src/components/CinematicRevealIntro.tsx` | Diubah |
| `src/components/EditCardModal.tsx` | Diubah |
| `src/components/EditProfileModal.tsx` | Diubah |
| `src/components/IDCardCanvas.tsx` | Diubah |
| `src/components/LoginModal.tsx` | Diubah |
| `src/components/PublishPanel.tsx` | Diubah |
| `src/components/SchoolLocationMap.tsx` | Diubah |
| `src/components/SecurityControlCenter.tsx` | Baru |
| `src/components/StoryRings.tsx` | Diubah |
| `src/components/UploadGalleryModal.tsx` | Diubah |
| `src/components/WelcomeModal.tsx` | Diubah |
| `src/contexts/AuthContext.tsx` | Diubah |
| `src/data/teacherDirectory.json` | Baru |
| `src/data/teachersData.ts` | Diubah |
| `src/lib/api.ts` | Baru |
| `src/lib/auth-helpers.ts` | Diubah |
| `src/lib/cloudinary.ts` | Diubah |
| `src/lib/data.ts` | Baru |
| `src/lib/error-handler.ts` | Diubah |
| `src/lib/firebase.ts` | Diubah |
| `src/lib/qr.ts` | Baru |
| `src/lib/security.ts` | Diubah |
| `src/lib/supabaseClient.ts` | Diubah |
| `src/main.tsx` | Diubah |
| `src/pages/AdminPanel.tsx` | Diubah |
| `src/pages/Anggota.tsx` | Diubah |
| `src/pages/CardSetup.tsx` | Diubah |
| `src/pages/FeedAngkatan.tsx` | Diubah |
| `src/pages/Galeri.tsx` | Diubah |
| `src/pages/Guru.tsx` | Diubah |
| `src/pages/Inbox.tsx` | Diubah |
| `src/pages/JadwalPelajaran.tsx` | Diubah |
| `src/pages/Login.tsx` | Diubah |
| `src/pages/Mading.tsx` | Diubah |
| `src/pages/NusaAI.tsx` | Diubah |
| `src/pages/Prestasi.tsx` | Diubah |
| `src/pages/Profile.tsx` | Diubah |
| `src/pages/PublicProfile.tsx` | Diubah |
| `src/pages/Rating.tsx` | Diubah |
| `src/pages/TentangWeb.tsx` | Diubah |
| `src/vite-env.d.ts` | Diubah |
| `tests/compatibility.test.ts` | Baru |
| `tests/deployment/runtime.test.ts` | Baru |
| `tests/e2e-server.ts` | Baru |
| `tests/e2e/security.spec.ts` | Baru |
| `tests/emulator/firestore.test.ts` | Baru |
| `tests/helpers.ts` | Baru |
| `tests/media.test.ts` | Baru |
| `tests/migration.test.ts` | Baru |
| `tests/security.test.ts` | Baru |
| `vite.config.ts` | Diubah |
| `src/data/teacherCredentials.json` | Dihapus dari runtime/repo hasil |
| `src/data/studentCredentials.json` | Dihapus dari runtime/repo hasil |

File kredensial siswa/guru dikeluarkan dari runtime dan diganti direktori profil tanpa password. Skrip patch ad-hoc, arsip HTML/ZIP, snapshot, dan bahan audit privat dari ZIP tidak diikutsertakan sebagai runtime/deploy; source aslinya tetap menjadi bahan audit. Tidak ada penghapusan data produksi.

Penjelasan kelompok perubahan dan risiko tersedia dalam SECURITY_REPORT_ID.md. Manifest akun, secret, QR login nyata, backup, node_modules, dist dan hasil browser tidak dicommit.
