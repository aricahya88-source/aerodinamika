# Validasi build AEROLAB A380

Tanggal: 17 Oktober 2026.

## Yang telah dijalankan di lingkungan pengembangan

- `npm run check`: lulus pemeriksaan sintaks untuk file inti.
- `npm test`: 16/16 tes Node.js lulus (model fisika, estimasi takeoff, livery validation, quaternion, atmosfer, reset).
- Server Python SPA telah dites dengan HTTP GET untuk `/`, `/simulator`, `/laboratorium`, `/papercraft`, dan file master A3+; semua mengembalikan status 200.
- Sumber `paper_a380_green.pdf`: tiga halaman A4.
- PDF `A380_Master_A3Plus.pdf`: tiga halaman 329 x 483 mm. Skala seragam 151,9047619%; posisi konten di tengah halaman dengan margin samping 5 mm.
- Perbandingan render sumber A4 yang diskalakan dan PDF A3+ tanpa overlay menunjukkan selisih piksel rata-rata sekitar 1–2 (dari 255), terutama dari antialiasing. PDF A3+ dibuat dengan `show_pdf_page` sehingga konten vektornya tetap ada.
- PDF sumber dan manual bawaan tidak diubah.

## Belum diverifikasi

- Pengujian browser WebGL secara langsung: browser headless pada lingkungan pengembangan memblokir akses ke HTTP oleh kebijakan administrator.
- Ekspor PDF kustom melalui pdf-lib CDN di browser nyata: membutuhkan uji klik dan pencetakan.
- Hasil rakitan fisik setelah diperbesar ke A3+, termasuk toleransi printer serta sambungan sayap, fuselage, dan mesin.
- Parameter dinamik tingkat sertifikasi A380, karena polar aerodinamis lengkap dan data kontrol tidak tersedia dari sumber publik.
- Pembuatan master pemisahan motif Flying Honu sepenuhnya dari geometri konstruksi; editor sekarang menggunakan overlay tinta transparan.

## Checklist uji pengguna

1. Buka `npm start` dan akses http://localhost:5173/papercraft.
2. Ubah warna utama dan nama maskapai. Pastikan pratinjau 3D berubah, lalu buka `/simulator` dan periksa warna/nama sama.
3. Unggah PNG transparan ukuran kecil; cek muncul di halaman 3 dan pada pesawat 3D.
4. Klik Ekspor PDF A3+. Jika CDN tidak tersedia, gunakan PDF master A3+ yang sudah disertakan.
5. Buka PDF, cek Properties 329 x 483 mm dan jumlah halaman 3; cetak satu percobaan pada 100%.
6. Periksa semua tab, garis potong, lipatan, dan uji rakit sebelum menyatakan siap produksi.
7. Jalankan semua 8 eksperimen dan uji apakah data, grafik, simpan, dan CSV tersedia.
8. Jalankan 100% throttle, tarik pitch secara bertahap di kisaran 270–310 km/jam; ini simulasi model contoh, bukan prosedur takeoff Airbus nyata.


GLB eksternal amvlab memerlukan internet dan tidak disertakan biner di ZIP. GLB bawaan AEROLAB yang ada di ZIP merupakan visualisasi orisinal ilustratif dan berbeda dari model amvlab atau Brout. Sinkronisasi livery GLB dilakukan dengan decal/badge tampilan, bukan UV mapping satu-ke-satu dengan template papercraft.
