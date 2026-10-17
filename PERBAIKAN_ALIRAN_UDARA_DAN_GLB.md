# AEROLAB A380 — Perbaikan Aliran Udara & GLB Pengguna

## Yang diperbaiki

- `airbus_a380.glb` yang dikirim pengguna kini ada secara fisik di `assets/models/airbus_a380.glb` (~4,4 MB). **Model ini menjadi pilihan pertama (default)**, tanpa permintaan unduh Sketchfab / amvlab saat runtime. Model prosedural tetap tersedia sebagai fallback.
- Metadata asli GLB menyatakan pencipta **Brout**, karya *Airbus A380*, lisensi **CC BY 4.0**, sumber: https://sketchfab.com/3d-models/airbus-a380-98d21f9c8104445f814cef47ef992889 . Pertahankan kredit jika website dipublikasikan. Aplikasi tidak mengklaim aset sebagai CAD resmi Airbus.
- Orientasi aset pengguna diperbaiki: hidung pesawat pada model asal mengarah ke **-Z**, sedangkan arah maju simulasi **+Z**. Rotasi 180° diterapkan pada aset lokal ini.
- Penyebab aliran sulit terlihat: versi sebelumnya hanya membuat 112 bola diameter 0,12 m untuk model pesawat dengan bentang ~80 m, dan fitur itu hanya dibuat di laboratorium. Pada jarak kamera normal, bola sangat kecil.
- Sistem pengganti `src/airflow.js` menggunakan **176 tracer 3D bercahaya**, dengan panjang sekitar 4,7–9,4 m dan diameter 0,40–0,55 m. Ada aliran di **Simulator dan Laboratorium**, dinyalakan secara default; arah aliran relatif dari hidung pesawat ke ekor dalam kerangka pesawat.
- Tombol `≈ ALIRAN ON/OFF` tersedia di kedua halaman dan tombol **L** di simulator. Efek diikat ke badan pesawat sehingga tetap terlihat ketika bergerak dan mengubah orientasi.
- Jejak aliran merupakan **visualisasi konseptual**, bukan pemecahan aliran CFD atau prediksi vortex A380 yang presisi. Kecepatannya dihubungkan dengan airspeed model edukatif.
- Papercraft PDF dan manual tetap utuh dari versi sebelumnya. Tidak ada klaim bahwa UV texture GLB sudah identik dengan halaman papercraft; livery 3D masih menggunakan overlay sederhana.

## Menjalankan

Di Mac, ekstrak ZIP lalu pada folder proyek jalankan `npm start`; kunjungi `http://localhost:5173`.

- Simulator: buka `/simulator` → tunggu indikator **Airbus A380 Brout GLB aktif** → tombol **≈ ALIRAN ON**.
- Laboratorium: buka `/laboratorium/gaya-angkat` → tombol **≈ ALIRAN: ON** → coba ubah kecepatan udara 50–120 m/s.
- Uji otomatis: `npm test` dan `npm run check`.
- Deploy Netlify: tidak perlu build khusus. Publikasikan folder root yang berisi `index.html`.
- Koneksi internet masih diperlukan untuk library Babylon.js dan loader GLB CDN, tetapi model pesawat sudah ada secara lokal. Jika GLB gagal dimuat, model prosedural digunakan.

## Catatan validasi
Pengujian statis dan tes Node tidak dapat menggantikan validasi visual WebGL dalam browser serta pencetakan/perakitan fisik A3+. Periksa arah hadap pesawat dan material GLB setelah menjalankan di Mac.
