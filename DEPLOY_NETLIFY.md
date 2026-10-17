# Deploy AEROLAB A380

1. Ekstrak ZIP ini.
2. File `index.html` sudah berada pada ROOT ZIP. Jika melalui GitHub, ekstrak ZIP lalu unggah isi folder hasil ekstrak ke repositori, bukan ZIP itu sendiri.
3. Bila uploader GitHub browser error, buka Terminal pada folder ini lalu jalankan `bash UPLOAD_GITHUB_MAC.command`; isi URL repo kosong. Jika repo sudah berisi commit, clone terlebih dahulu dan salin isi proyek ke clone agar tidak terjadi konflik.
4. Di Netlify pilih **Import existing project** → GitHub → repo.
5. Build command biarkan sesuai `netlify.toml` (hanya echo); publish directory `.`.
6. Setelah deploy periksa `/`, `/simulator`, `/laboratorium`, `/papercraft`.
7. Butuh internet untuk Babylon.js dan ekspor PDF kustom (pdf-lib) dari CDN. PDF A3+ master tersedia lokal tanpa CDN.

8. Panel Model A380 akan memuat GLB amvlab CC BY 4.0 via CDN; pilih GLB AEROLAB lokal jika tidak berhasil. Unduh opsional ke folder lokal dengan `bash DOWNLOAD_A380_GLB_MAC.command` (di Mac yang terkoneksi internet).
9. Selalu cantumkan atribusi amvlab dalam publikasi model komunitas: https://github.com/amvlab/aircraft-models dan lisensi https://creativecommons.org/licenses/by/4.0/ .
