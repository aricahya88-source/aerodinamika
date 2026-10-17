# Panduan Model GLB Airbus A380 — AEROLAB 2.1

## Pilihan sumber dalam aplikasi

1. **GLB amvlab komunitas (awal/default)**: versi A380 tanpa logo, lisensi CC BY 4.0. Aplikasi mencoba file `assets/models/A380_nologo.glb` jika ada, lalu CDN publik, kemudian GLB lokal cadangan jika jaringan gagal.
2. **GLB bawaan AEROLAB**: model A380 3D ilustratif buatan paket ini, sudah tersimpan sebagai `assets/models/a380-aerolab.glb` (~375 KB). Bentuknya bukan model Airbus resmi dan bukan file Brout.
3. **Model prosedural AEROLAB**: cadangan kode Javascript yang ditampilkan segera sebelum GLB selesai dimuat.
4. **Upload file GLB**: di panel Simulator atau Papercraft Studio, klik Upload GLB dan pilih file `.glb` yang berizin dipakai (maks 35 MB). Ini berguna bila telah mengunduh karya Brout melalui akun Sketchfab secara sah.

## Mendapatkan model amvlab agar tersedia lokal

Dari Mac jalankan `bash DOWNLOAD_A380_GLB_MAC.command`. Skrip mengambil GLB dari GitHub, memeriksa header `glTF` dan panjang file, lalu menyimpan `assets/models/A380_nologo.glb` (tidak menimpa file aslinya). Bila skrip tidak berhasil karena jaringan, aplikasi masih dapat menggunakan GLB bawaan.

- Sumber amvlab: https://github.com/amvlab/aircraft-models
- Lisensi: https://creativecommons.org/licenses/by/4.0/
- Nama aset: `A380_nologo.glb`
- Kredit: A380 model © amvlab contributors, CC BY 4.0. Model diubah pada runtime untuk penskalaan/penempatan dan tambahan livery.

## Dukungan Brout

Model Brout tersedia di https://sketchfab.com/3d-models/airbus-a380-98d21f9c8104445f814cef47ef992889 dengan lisensi CC BY. Unduhan memerlukan login Sketchfab. ZIP **tidak** memuat model Brout karena file binernya belum disediakan oleh pengguna. Jika download menghasilkan ZIP berisi glTF, konversikan ke GLB melalui Blender, lalu gunakan Upload GLB.

## Teknis dan batasan

- Format utama `.glb` (glTF 2.0); objek dinormalisasi otomatis terhadap rentang bentang sayap A380 sekitar 79,8 meter. Arah depan GLB pihak ketiga tidak dapat dipastikan tanpa memeriksa aset aktual. Penyesuaian manual model tertentu mungkin diperlukan.
- Saat visual GLB aktif, gerak fisika (posisi, pitch/roll/yaw, cuaca) dipertahankan tetapi animasi detail flap, aileron dan roda model pihak ketiga mungkin tidak ada karena tidak semua GLB menyediakan bagian rigged.
- Badge livery umum (nama, warna, logo) memakai koordinat ilustratif badan A380. Ini belum menjadi UV skin tiga dimensi dari setiap panel kertas papercraft. Garis papercraft sumber PDF tetap tersimpan dan dikunci dalam hasil dasar.
- Satu file GLB besar dapat membebani browser; pilih GLB AEROLAB yang ringan saat perangkat lambat.
