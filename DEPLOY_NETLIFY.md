# Panduan ringkas — GitHub → Netlify

1. Buat repositori GitHub baru, mis. `AerodynamicsFlightLab3D`.
2. Upload isi folder proyek ke root repo (`index.html` harus di root).
3. Di Netlify: **Add new project → Import an existing project → GitHub**.
4. Pilih repo dan deploy. Pengaturan dari `netlify.toml`:
   - Build command: `echo 'Static Babylon.js website: no build necessary'`
   - Publish directory: `.`
   - Node.js: 22 (build hanya perintah echo)
5. Buka URL `.netlify.app` yang diberikan dan uji:
   - `/`
   - `/simulator`
   - `/laboratorium`
   - `/laboratorium/gaya-angkat`
   - `/materi`
   - `/panduan`
   - `/hasil`

**Jika halaman 404:** pastikan `netlify.toml` ada di root. File `_redirects` juga menyediakan fallback rute SPA.

**Jika canvas menampilkan peringatan tidak dapat memuat Babylon.js:** pastikan perangkat pengunjung tersambung internet dan CDN tidak diblokir. Jika WebGL tidak tersedia, gunakan browser/perangkat yang mendukung WebGL.

**Tidak ada database, akun, API key, maupun environment variables.**
