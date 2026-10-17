# Deploy AEROLAB A380

1. Ekstrak ZIP ini.
2. Masukkan seluruh isi folder `AEROLAB_A380` ke repo GitHub (file `index.html` harus berada di root repository).
3. Bila uploader GitHub browser error, buka Terminal pada folder ini lalu jalankan `bash UPLOAD_GITHUB_MAC.command`; isi URL repo kosong. Jika repo sudah berisi commit, clone terlebih dahulu dan salin isi proyek ke clone agar tidak terjadi konflik.
4. Di Netlify pilih **Import existing project** → GitHub → repo.
5. Build command biarkan sesuai `netlify.toml` (hanya echo); publish directory `.`.
6. Setelah deploy periksa `/`, `/simulator`, `/laboratorium`, `/papercraft`.
7. Butuh internet untuk Babylon.js dan ekspor PDF kustom (pdf-lib) dari CDN. PDF A3+ master tersedia lokal tanpa CDN.
